"""Evaluate a place's facts against a user profile.

Rules:
- Missing data is never a match (status "unknown").
- For each parameter we keep the newest fact per source. If current values
  disagree, the parameter is "conflicting" and every version is returned.
- Facts older than OUTDATED_AFTER_DAYS are flagged "outdated".
- The value used for matching is the one from the most reliable source; on a
  conflict, a barrier from any source wins (we'd rather warn than mislead).
"""
from datetime import date, timedelta

from .catalog import (
    GROUPS, OUTDATED_AFTER_DAYS, PARAMETERS, PARAMETERS_BY_KEY, PROFILE_FIELDS, RELIABILITY_RANK,
)


def parse_profile(query_params):
    """Read profile fields from request query params. Absent fields = no constraint."""
    profile = {}
    for field in PROFILE_FIELDS:
        raw = query_params.get(field["key"])
        if raw in (None, ""):
            continue
        if field["type"] == "bool":
            profile[field["key"]] = raw.lower() in ("1", "true", "yes", "tak")
        else:
            try:
                profile[field["key"]] = float(raw)
            except ValueError:
                pass
    return profile


def _rule(key, value, profile):
    """Return "match" / "barrier" / "info" for a known value."""
    p = profile
    if key == "entrance_steps" and "max_steps" in p:
        return "match" if value <= p["max_steps"] else "barrier"
    if key == "threshold_cm" and "max_threshold_cm" in p:
        return "match" if value <= p["max_threshold_cm"] else "barrier"
    if key in ("door_width_cm", "corridor_width_cm") and "min_door_width_cm" in p:
        return "match" if value >= p["min_door_width_cm"] else "barrier"
    if key == "step_free_entrance" and p.get("max_steps") == 0:
        return "match" if value else "barrier"
    if key == "elevator" and p.get("needs_elevator"):
        return "match" if value else "barrier"
    if key == "accessible_toilet" and p.get("needs_accessible_toilet"):
        return "match" if value else "barrier"
    if key == "changing_table" and p.get("needs_changing_table"):
        return "match" if value else "barrier"
    if key == "seating" and p.get("needs_seating"):
        return "match" if value else "barrier"
    if key == "approach_surface" and p.get("avoid_cobblestone"):
        return "barrier" if value in ("sett", "cobblestone", "gravel") else "match"
    return "info"


# profile field (and the value that activates it, None = any value) per parameter
_RELEVANCE = {
    "entrance_steps": ("max_steps", None),
    "step_free_entrance": ("max_steps", 0),
    "threshold_cm": ("max_threshold_cm", None),
    "door_width_cm": ("min_door_width_cm", None),
    "corridor_width_cm": ("min_door_width_cm", None),
    "elevator": ("needs_elevator", True),
    "accessible_toilet": ("needs_accessible_toilet", True),
    "changing_table": ("needs_changing_table", True),
    "seating": ("needs_seating", True),
    "approach_surface": ("avoid_cobblestone", True),
}


def is_relevant(key, profile):
    """Does the user's profile constrain this parameter?"""
    if key not in _RELEVANCE:
        return False
    field, active = _RELEVANCE[key]
    if field not in profile:
        return False
    return active is None or profile[field] == active


def _requirement(key, profile):
    """Human-readable requirement, e.g. "Twoje minimum: 80 cm"."""
    p = profile
    if key == "entrance_steps" and "max_steps" in p:
        return f"Twoje maksimum: {p['max_steps']:g} szt."
    if key == "threshold_cm" and "max_threshold_cm" in p:
        return f"Twoje maksimum: {p['max_threshold_cm']:g} cm"
    if key in ("door_width_cm", "corridor_width_cm") and "min_door_width_cm" in p:
        return f"Twoje minimum: {p['min_door_width_cm']:g} cm"
    return ""


def format_value(param, value):
    if value is None:
        return None
    if param["type"] == "bool":
        return "tak" if value else "nie"
    if param["type"] == "enum":
        return param["choices"].get(value, str(value))
    unit = param.get("unit")
    num = f"{value:g}" if isinstance(value, (int, float)) else str(value)
    return f"{num} {unit}" if unit else num


def _fact_dict(fact, param, today):
    outdated = (today - fact.observed_at) > timedelta(days=OUTDATED_AFTER_DAYS)
    return {
        "value": fact.value,
        "value_display": format_value(param, fact.value),
        "source": {"key": fact.source.key, "name": fact.source.name},
        "reliability": fact.reliability,
        "observed_at": fact.observed_at.isoformat(),
        "outdated": outdated,
        "is_sample": fact.is_sample,
        "note": fact.note,
    }


def evaluate_parameter(param, facts, profile, today=None):
    """facts: Fact objects for this place+parameter, any order."""
    today = today or date.today()
    # newest fact per source
    current = {}
    for f in sorted(facts, key=lambda f: (f.observed_at, f.created_at), reverse=True):
        current.setdefault(f.source_id, f)
    current = sorted(
        current.values(),
        key=lambda f: (RELIABILITY_RANK[f.reliability], f.observed_at),
        reverse=True,
    )

    result = {
        "key": param["key"],
        "label": param["label"],
        "unit": param.get("unit"),
        "requirement": _requirement(param["key"], profile),
        "sources": [_fact_dict(f, param, today) for f in current],
    }
    if not current:
        # Missing data only counts as "unknown" if the profile cares about it
        match = "unknown" if is_relevant(param["key"], profile) else "info"
        result.update(value=None, value_display=None, status="missing", match=match)
        return result

    primary = current[0]
    conflicting = len({str(f.value) for f in current}) > 1
    matches = [_rule(param["key"], f.value, profile) for f in current]
    if conflicting and "barrier" in matches:
        match = "barrier"
    else:
        match = matches[0]

    if conflicting:
        status = "conflicting"
    elif result["sources"][0]["outdated"]:
        status = "outdated"
    else:
        status = primary.reliability

    result.update(
        value=primary.value,
        value_display=format_value(param, primary.value),
        status=status,
        match=match,
    )
    return result


def evaluate_place(place, profile, facts=None):
    """Return (groups, summary). `facts` lets callers pass prefetched facts."""
    facts = list(place.facts.all()) if facts is None else facts
    by_param = {}
    for f in facts:
        by_param.setdefault(f.parameter, []).append(f)

    groups = []
    summary = {"match": 0, "barrier": 0, "unknown": 0, "confirmed": 0}
    for group in GROUPS:
        params = []
        for param in PARAMETERS:
            if param["group"] != group["key"]:
                continue
            r = evaluate_parameter(param, by_param.get(param["key"], []), profile)
            params.append(r)
            if r["match"] in ("match", "barrier", "unknown"):
                summary[r["match"]] += 1
            if r["status"] == "confirmed":
                summary["confirmed"] += 1
        groups.append({**group, "parameters": params})
    return groups, summary


def top_fact(groups):
    """The single most decision-relevant fact for result cards: first barrier,
    else first confirmed match."""
    params = [p for g in groups for p in g["parameters"] if p["value"] is not None]
    for p in params:
        if p["match"] == "barrier":
            return p
    for p in params:
        if p["match"] == "match" and p["status"] == "confirmed":
            return p
    return params[0] if params else None


__all__ = ["parse_profile", "evaluate_place", "evaluate_parameter", "top_fact", "PARAMETERS_BY_KEY"]

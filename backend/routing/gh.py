# OWNER: Agent A2 (routing). GraphHopper client + translation to docs/API.md#route.
# Stdlib only (urllib) so no new pip dependency is needed.
import json
import os
import urllib.error
import urllib.request
from datetime import date

GH_BASE = os.environ.get("GRAPHHOPPER_URL", "http://graphhopper:8989")
OSM_SOURCE = {"key": "osm", "name": "OpenStreetMap"}

SERVICE_DOWN = "Usługa wyznaczania tras jest chwilowo niedostępna."
NO_ROUTE = "Nie znaleźliśmy trasy bez barier między tymi punktami."

# GraphHopper `surface` encoded values that are hard for wheelchairs/strollers.
DIFFICULT_SURFACES = {
    "COBBLESTONE", "GRAVEL", "FINE_GRAVEL",
    "GROUND", "DIRT", "GRASS", "SAND",
}
BAD_SMOOTHNESS = {"BAD", "VERY_BAD", "HORRIBLE", "VERY_HORRIBLE", "IMPASSABLE"}

SURFACE_DISPLAY = {
    "ASPHALT": "asfalt",
    "CONCRETE": "beton",
    "PAVED": "utwardzona",
    "PAVING_STONES": "płyty chodnikowe",
    "COBBLESTONE": "kostka brukowa",
    "GRAVEL": "żwir",
    "FINE_GRAVEL": "drobny żwir",
    "GROUND": "grunt",
    "DIRT": "grunt",
    "GRASS": "trawa",
    "SAND": "piasek",
    "WOOD": "drewno",
    "UNPAVED": "nieutwardzona",
    "COMPACTED": "utwardzony grunt",
    "OTHER": "inna nawierzchnia",
}


class GHUnavailable(Exception):
    pass


class GHNoRoute(Exception):
    pass


def build_custom_model(profile, avoid):
    """Translate profile + avoid set into a per-request custom model.

    Steps are always excluded server-side (wheelchair.json); here we only add
    penalties. `avoid` items that GraphHopper cannot route on (high_kerbs,
    no_data) and incline without elevation data are handled as step issues
    in translate_path(), not here.
    """
    priority = []
    cobble = avoid_cobblestone(profile, avoid)
    if cobble:
        priority.append({
            "if": "surface == COBBLESTONE || surface == GRAVEL || "
                  "surface == FINE_GRAVEL",
            "multiply_by": "0.2",
        })
    model = {}
    if priority:
        model["priority"] = priority
    return model


def avoid_cobblestone(profile, avoid):
    return "cobblestone" in avoid or str(profile.get("avoid_cobblestone")) == "1"


def post_gh(payload, timeout=25):
    req = urllib.request.Request(
        GH_BASE + "/route",
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json",
                 "User-Agent": "BezProgu/1.0 (hackathon demo)"},
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as res:
            return json.load(res)
    except urllib.error.HTTPError as e:
        if e.code == 404:
            raise GHNoRoute()
        if e.code == 400:
            try:
                raise GHNoRoute(json.load(e).get("message", ""))
            except GHNoRoute:
                raise
            except Exception:
                raise GHNoRoute()
        raise GHUnavailable()
    except Exception:
        raise GHUnavailable()


def fetch_paths(from_latlon, to_latlon, custom_model):
    (flat, flon), (tlat, tlon) = from_latlon, to_latlon
    payload = {
        "profile": "wheelchair",
        "points": [[flon, flat], [tlon, tlat]],
        "locale": "pl",
        "instructions": True,
        "points_encoded": False,
        "details": ["surface", "smoothness", "road_class", "street_name"],
        "custom_model": custom_model or {},
        "algorithm": "alternative_route",
        "alternative_route": {"max_paths": 2},
    }
    try:
        data = post_gh(payload)
    except GHNoRoute:
        # Older GH may reject the alternative_route block; retry plain.
        payload.pop("algorithm", None)
        payload.pop("alternative_route", None)
        data = post_gh(payload)
    return data.get("paths", [])


def detail_at(details, name, a, b):
    """Value of path detail `name` with the biggest overlap over [a, b]."""
    best, best_overlap = None, 0
    for s, e, v in details.get(name, []) or []:
        overlap = max(0, min(e, b) - max(s, a))
        if overlap > best_overlap:
            best, best_overlap = v, overlap
    return best


def surface_display(value):
    if not value:
        return "nieznana nawierzchnia"
    return SURFACE_DISPLAY.get(value, str(value).lower().replace("_", " "))


def kerb_height_cm(tags):
    raw = tags.get("kerb:height")
    if raw is None:
        return None
    try:
        h = float(str(raw).split(";")[0].strip().replace(",", "."))
    except (ValueError, AttributeError):
        return None
    # OSM kerb:height is in metres; tolerate values already in cm.
    return h * 100 if h < 1 else h


def kerb_issues(obstacles, max_threshold_cm):
    """Turn nearby OSM kerb/crossing obstacles into contract issues."""
    issues = []
    for ob in obstacles:
        tags = ob.tags or {}
        kerb = (tags.get("kerb") or "").lower()
        height = kerb_height_cm(tags)
        observed = ob.observed_at.isoformat() if isinstance(ob.observed_at, date) else ob.observed_at
        base = {"source": OSM_SOURCE, "observed_at": observed,
                "is_sample": bool(getattr(ob, "is_sample", False))}
        if kerb in ("lowered", "flush", "rolled") or (
                height is not None and max_threshold_cm is not None and height <= max_threshold_cm):
            issues.append({**base, "type": "crossing", "match": "match",
                           "text": "Obniżony krawężnik na przejściu."})
        elif kerb == "raised" or (
                height is not None and max_threshold_cm is not None and height > max_threshold_cm):
            h = f" ({height:g} cm)" if height is not None else ""
            issues.append({**base, "type": "kerb", "match": "barrier",
                           "text": f"Wysoki krawężnik na przejściu{h}."})
        else:
            issues.append({**base, "type": "crossing", "match": "unknown",
                           "text": "Brak danych o krawężniku. Nie wiemy, czy jest obniżony."})
    return issues


def translate_path(path, obstacles_for_step, route_id):
    """GH path dict -> contract route dict. obstacles_for_step(i, coords) lists
    nearby Obstacle objects for step i."""
    coords = path["points"]["coordinates"]  # [lon, lat]
    details = path.get("details", {})
    steps, n_surface, n_unknown, n_barriers = [], 0, 0, 0
    for i, ins in enumerate(path.get("instructions", [])):
        a, b = ins["interval"]
        seg = coords[a:b + 1]
        geom = [[lat, lon] for lon, lat in seg]
        surface = (detail_at(details, "surface", a, b) or "").upper() or None
        if surface == "MISSING":
            surface = None
        smooth = (detail_at(details, "smoothness", a, b) or "").upper() or None
        issues = []
        if not surface:
            issues.append({"type": "surface", "match": "unknown",
                           "text": "Brak danych o nawierzchni tego odcinka.",
                           "source": OSM_SOURCE, "observed_at": None})
            n_unknown += 1
        elif surface in DIFFICULT_SURFACES:
            issues.append({"type": "surface", "match": "barrier",
                           "text": f"Trudna nawierzchnia: {surface_display(surface)}.",
                           "source": OSM_SOURCE, "observed_at": None})
            n_surface += 1
            n_barriers += 1
        elif smooth in BAD_SMOOTHNESS:
            issues.append({"type": "surface", "match": "barrier",
                           "text": "Nierówna nawierzchnia.",
                           "source": OSM_SOURCE, "observed_at": None})
            n_barriers += 1
        for issue in obstacles_for_step(i, geom):
            issues.append(issue)
            if issue["match"] == "unknown":
                n_unknown += 1
            elif issue["match"] == "barrier":
                n_barriers += 1
        steps.append({
            "index": i + 1,
            "instruction": ins.get("text") or f"Odcinek {i + 1}",
            "distance_m": round(ins.get("distance", 0)),
            "geometry": geom,
            "surface": (surface or "").lower() or None,
            "surface_display": surface_display(surface),
            "incline_pct": None,  # no elevation data in this build
            "issues": issues,
        })
    distance_m = round(path.get("distance", 0))
    duration_s = round(distance_m / 1.0)  # ~3,6 km/h (wózek / wózek dziecięcy)
    summary = {"steps": 0, "difficult_surface": n_surface,
               "unknown": n_unknown, "barriers": n_barriers}
    return {
        "id": route_id,
        "distance_m": distance_m,
        "duration_s": duration_s,
        "summary": summary,
        "summary_text": summary_text(distance_m, duration_s, summary),
        "geometry": [[lat, lon] for lon, lat in coords],
        "steps": steps,
    }


def plural(n, one, few, many):
    if n == 1:
        return one
    d, dd = n % 10, n % 100
    return few if 2 <= d <= 4 and not 12 <= dd <= 14 else many


def format_dist(m):
    if m < 1000:
        return f"{m} m"
    return f"{m / 1000:.1f}".replace(".", ",") + " km"


def summary_text(distance_m, duration_s, summary):
    mins = max(1, round(duration_s / 60))
    parts = [f"{format_dist(distance_m)}, ok. {mins} min", "bez schodów"]
    if summary["difficult_surface"]:
        n = summary["difficult_surface"]
        parts.append(f"{n} {plural(n, 'odcinek', 'odcinki', 'odcinków')} trudnej nawierzchni")
    if summary["unknown"]:
        n = summary["unknown"]
        parts.append(f"{n} {plural(n, 'przejście', 'przejścia', 'przejść')} bez danych")
    return " · ".join(parts)

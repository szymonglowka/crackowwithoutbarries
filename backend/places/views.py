import hashlib
from datetime import date

from django.conf import settings
from django.db.models import Prefetch, Q
from rest_framework import serializers, viewsets
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle

from . import catalog
from .matching import evaluate_place, format_value, parse_profile, top_fact
from .models import Fact, Place, Report, Source


class ReportThrottle(AnonRateThrottle):
    scope = "reports"


class ReportSerializer(serializers.Serializer):
    place = serializers.PrimaryKeyRelatedField(
        queryset=Place.objects.all(),
        error_messages={"does_not_exist": "Takie miejsce nie istnieje.", "incorrect_type": "Nieprawidłowe miejsce."},
    )
    parameter = serializers.CharField()
    value = serializers.JSONField()
    comment = serializers.CharField(required=False, allow_blank=True, default="")
    observed_at = serializers.DateField(
        error_messages={"invalid": "Podaj poprawną datę w formacie RRRR-MM-DD."}
    )
    email = serializers.EmailField(
        required=False, allow_blank=True, default="",
        error_messages={"invalid": "Podaj poprawny adres e-mail."},
    )
    website = serializers.CharField(required=False, allow_blank=True, default="")

    def validate_parameter(self, key):
        if key not in catalog.PARAMETERS_BY_KEY:
            raise serializers.ValidationError("Nieznany parametr.")
        return key

    def validate(self, attrs):
        param = catalog.PARAMETERS_BY_KEY.get(attrs.get("parameter"))
        value = attrs.get("value")
        if param is not None:
            ptype = param["type"]
            if ptype == "int":
                if isinstance(value, bool) or not isinstance(value, int):
                    raise serializers.ValidationError(
                        {"value": "Podaj liczbę całkowitą (np. liczbę stopni)."})
            elif ptype == "number":
                if isinstance(value, bool) or not isinstance(value, (int, float)):
                    raise serializers.ValidationError(
                        {"value": "Podaj liczbę."})
            elif ptype == "bool":
                if value not in (True, False, 0, 1):
                    raise serializers.ValidationError(
                        {"value": "Podaj wartość „tak” albo „nie”."})
                attrs["value"] = bool(value)
            elif ptype == "enum":
                if value not in param.get("choices", {}):
                    raise serializers.ValidationError(
                        {"value": "Wybierz jedną z dostępnych opcji."})
        observed = attrs.get("observed_at")
        if observed and observed > date.today():
            raise serializers.ValidationError(
                {"observed_at": "Data obserwacji nie może być w przyszłości."})
        return attrs


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([ReportThrottle])
def reports(request):
    """Create a user report (no account). Honeypot `website` drops silently with 201."""
    serializer = ReportSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=400)
    data = serializer.validated_data
    if data.get("website"):
        # Bot trap: pretend success, store nothing.
        return Response({"status": "pending"}, status=201)
    source, _ = Source.objects.get_or_create(
        key="user",
        defaults={"name": "Zgłoszenie użytkownika", "default_reliability": "user_report",
                  "refresh_policy": "na bieżąco"},
    )
    ip = request.META.get("HTTP_X_FORWARDED_FOR", request.META.get("REMOTE_ADDR", "")).split(",")[0].strip()
    ip_hash = hashlib.sha256(f"{ip}{settings.SECRET_KEY}".encode()).hexdigest()
    fact = Fact.objects.create(
        place=data["place"], parameter=data["parameter"], value=data["value"],
        source=source, reliability="user_report", observed_at=data["observed_at"],
        note=data.get("comment", ""), is_sample=False,
    )
    report = Report.objects.create(
        place=data["place"], parameter=data["parameter"], value=data["value"],
        comment=data.get("comment", ""), observed_at=data["observed_at"],
        email=data.get("email", ""), status="pending", ip_hash=ip_hash, fact=fact,
    )
    return Response({"id": report.id, "status": report.status, "fact_id": fact.id}, status=201)


@api_view(["GET"])
def place_history(request, pk):
    """Chronological (newest first) list of every fact for the place."""
    place = Place.objects.prefetch_related("facts__source").get(pk=pk)
    facts = sorted(place.facts.all(), key=lambda f: (f.observed_at, f.created_at))
    # previous value of the same parameter (any source) for each fact
    prev_display = {}
    last_by_param = {}
    for f in facts:
        prev_display[f.pk] = last_by_param.get(f.parameter)
        param = catalog.PARAMETERS_BY_KEY.get(f.parameter)
        last_by_param[f.parameter] = format_value(param, f.value) if param else str(f.value)
    out = []
    for f in reversed(facts):
        param = catalog.PARAMETERS_BY_KEY.get(f.parameter, {})
        out.append({
            "date": f.observed_at.isoformat(),
            "parameter": f.parameter,
            "label": param.get("label", f.parameter),
            "old_value_display": prev_display[f.pk],
            "new_value_display": format_value(param, f.value) if param else str(f.value),
            "source": {"key": f.source.key, "name": f.source.name},
            "reliability": f.reliability,
            "is_sample": f.is_sample,
            "note": f.note,
        })
    return Response(out)


def _source_dict(s):
    return {
        "key": s.key, "name": s.name, "url": s.url, "license": s.license,
        "default_reliability": s.default_reliability, "refresh_policy": s.refresh_policy,
        "status": s.status, "last_sync_at": s.last_sync_at, "last_error": s.last_error,
    }


def _place_base(place):
    lon, lat = place.location.coords
    return {
        "id": place.id,
        "name": place.name,
        "category": place.category,
        "category_label": catalog.CATEGORIES.get(place.category, place.category),
        "address": place.address,
        "lat": lat,
        "lon": lon,
        "is_sample": place.is_sample,
    }


class PlaceViewSet(viewsets.ReadOnlyModelViewSet):
    """GET /api/places/?q=&category=&<profile fields>  -> list with match summary
    GET /api/places/:id/?<profile fields>              -> full card"""

    def get_queryset(self):
        qs = Place.objects.prefetch_related(
            Prefetch("facts", queryset=Fact.objects.select_related("source"))
        )
        q = self.request.query_params.get("q")
        if q:
            qs = qs.filter(Q(name__icontains=q) | Q(address__icontains=q))
        category = self.request.query_params.get("category")
        if category:
            qs = qs.filter(category__in=category.split(","))
        return qs.order_by("name")

    def list(self, request):
        profile = parse_profile(request.query_params)
        results = []
        for place in self.get_queryset()[:200]:
            groups, summary = evaluate_place(place, profile, list(place.facts.all()))
            tf = top_fact(groups)
            results.append({
                **_place_base(place),
                "summary": summary,
                "low_data": summary["unknown"] > (summary["match"] + summary["barrier"]),
                "top_fact": tf and {
                    "label": tf["label"], "value_display": tf["value_display"],
                    "match": tf["match"], "status": tf["status"],
                    "observed_at": tf["sources"][0]["observed_at"],
                },
            })
        return Response({"count": len(results), "results": results})

    def retrieve(self, request, pk=None):
        place = self.get_queryset().get(pk=pk)
        profile = parse_profile(request.query_params)
        facts = list(place.facts.all())
        groups, summary = evaluate_place(place, profile, facts)
        return Response({
            **_place_base(place),
            "phone": place.phone,
            "website": place.website,
            "key_note": place.key_note,
            "osm_url": place.osm_id and f"https://www.openstreetmap.org/{place.osm_type}/{place.osm_id}",
            "summary": summary,
            "groups": groups,
            "last_changed": max((f.observed_at for f in facts), default=None),
            "sources": [_source_dict(s) for s in {f.source for f in facts}],
        })


@api_view(["GET"])
def meta(request):
    """Everything the frontend needs to render labels, statuses and profile forms."""
    return Response({
        "groups": catalog.GROUPS,
        "parameters": catalog.PARAMETERS,
        "categories": [{"key": k, "label": v} for k, v in catalog.CATEGORIES.items()],
        "reliability": catalog.RELIABILITY,
        "match": catalog.MATCH,
        "profile_fields": catalog.PROFILE_FIELDS,
        "profile_presets": catalog.PROFILE_PRESETS,
    })


@api_view(["GET"])
def sources(request):
    return Response([_source_dict(s) for s in Source.objects.order_by("key")])

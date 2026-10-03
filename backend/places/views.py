from django.db.models import Prefetch, Q
from rest_framework import viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response

from . import catalog
from .matching import evaluate_place, parse_profile, top_fact
from .models import Fact, Place, Source


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

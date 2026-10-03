# OWNER: Agent A2 (routing). See docs/agents/A2-routing.md and docs/API.md#route
import json
import time
import urllib.parse
import urllib.request

from django.contrib.gis.geos import LineString
from django.contrib.gis.measure import D
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from places.models import Place

from . import gh
from .gh import GHNoRoute, GHUnavailable, NO_ROUTE, SERVICE_DOWN
from .models import Obstacle

KRAKOW_BBOX = "19.79,49.97,20.22,50.13"  # minLon,minLat,maxLon,maxLat
UA = {"User-Agent": "BezProgu/1.0 (hackathon demo; kontakt: demo@localhost)"}

_geocode_cache = {}  # q -> (expires_at, results)
_last_remote = 0.0


def parse_latlon(raw):
    try:
        lat_s, lon_s = (raw or "").split(",")
        lat, lon = float(lat_s), float(lon_s)
    except (ValueError, AttributeError):
        return None
    if not (-90 <= lat <= 90 and -180 <= lon <= 180):
        return None
    return lat, lon


def profile_from(request):
    p = {}
    for key in ("max_steps", "max_threshold_cm", "min_door_width_cm",
                "max_incline_pct", "avoid_cobblestone"):
        v = request.query_params.get(key)
        if v in (None, ""):
            continue
        try:
            p[key] = float(v) if key in ("max_threshold_cm", "min_door_width_cm",
                                         "max_incline_pct") else int(v)
        except ValueError:
            continue
    return p


@api_view(["GET"])
@permission_classes([AllowAny])
def route(request):
    frm = parse_latlon(request.query_params.get("from"))
    to = parse_latlon(request.query_params.get("to"))
    if not frm or not to:
        return Response(
            {"detail": "Podaj poprawne punkty: from=lat,lon i to=lat,lon."}, status=400)
    avoid = {a.strip() for a in (request.query_params.get("avoid") or "").split(",") if a.strip()}
    profile = profile_from(request)
    max_threshold = profile.get("max_threshold_cm")
    custom_model = gh.build_custom_model(profile, avoid)

    try:
        paths = gh.fetch_paths(frm, to, custom_model)
    except GHNoRoute:
        return Response({"detail": NO_ROUTE}, status=404)
    except GHUnavailable:
        return Response({"detail": SERVICE_DOWN}, status=503)
    if not paths:
        return Response({"detail": NO_ROUTE}, status=404)

    def obstacles_for_step(_i, geom):
        if len(geom) < 2:
            return []
        try:
            line = LineString([(lon, lat) for lat, lon in geom], srid=4326)
            found = list(Obstacle.objects.filter(location__dwithin=(line, D(m=8))))
        except Exception:
            return []
        return gh.kerb_issues(found, max_threshold)

    routes = []
    for n, path in enumerate(paths[:2]):
        routes.append(gh.translate_path(
            path, obstacles_for_step, "main" if n == 0 else "alt-1"))
    # Drop a duplicate alternative (same geometry as main).
    if len(routes) == 2 and routes[0]["geometry"] == routes[1]["geometry"]:
        routes.pop()
    return Response({
        "routes": routes,
        "data_source": {"key": "osm", "name": "OpenStreetMap", "last_sync_at": None},
    })


@api_view(["GET"])
@permission_classes([AllowAny])
def geocode(request):
    q = (request.query_params.get("q") or "").strip()
    if not q:
        return Response([])
    results = [
        {"label": f"{p.name}, {p.address}" if p.address else p.name,
         "lat": p.location.y, "lon": p.location.x, "place_id": p.id}
        for p in Place.objects.filter(name__icontains=q)[:5]
    ]
    now = time.time()
    cached = _geocode_cache.get(q.lower())
    if cached and cached[0] > now:
        remote = cached[1]
    else:
        remote = photon_search(q)
        _geocode_cache[q.lower()] = (now + 3600, remote)
    return Response(_dedupe(results + remote))


def _dedupe(results):
    """Photon often returns the same name several times (e.g. station platforms)."""
    seen, out = set(), []
    for r in results:
        key = r["label"].lower()
        if key not in seen:
            seen.add(key)
            out.append(r)
    return out


def photon_search(q):
    """Photon limited to Kraków; failures fall back to local places only."""
    global _last_remote
    wait = 1.0 - (time.time() - _last_remote)
    if wait > 0:
        time.sleep(wait)
    url = ("https://photon.komoot.io/api/?" + urllib.parse.urlencode(
        {"q": q, "bbox": KRAKOW_BBOX, "limit": 5}))
    try:
        req = urllib.request.Request(url, headers=UA)
        with urllib.request.urlopen(req, timeout=10) as res:
            data = json.load(res)
        _last_remote = time.time()
    except Exception:
        return []
    out = []
    for f in data.get("features", [])[:5]:
        props = f.get("properties", {})
        geom = (f.get("geometry") or {}).get("coordinates") or [None, None]
        name = props.get("name") or ""
        city = props.get("city") or props.get("county") or ""
        label = f"{name}, {city}".strip(", ") if city and city not in name else (name or q)
        out.append({"label": label or q, "lat": geom[1], "lon": geom[0], "place_id": None})
    return [r for r in out if r["lat"] is not None and r["lon"] is not None]

"""Import Points of Interest from OpenStreetMap (Overpass API) as places + facts.

    python manage.py import_osm [--bbox south,west,north,east] [--offline] [--cache PATH]

Default bbox covers central Kraków (Stare Miasto, Kazimierz, Podgórze, Kleparz,
Dworzec). "Add another city" = pass a different --bbox.

Mapping OSM tags -> facts lives in TAG_FACTS / SURFACES below (pitch slide).
Source: `osm`, reliability `open_data`, observed_at = OSM element timestamp.

Network failures never delete data: Source(osm) becomes "unavailable".
Raw Overpass responses are cached so re-runs work offline.
"""
import json
import time
import urllib.parse
import urllib.request
from datetime import date
from pathlib import Path

from django.contrib.gis.geos import Point
from django.core.management.base import BaseCommand
from django.utils import timezone

from places.models import Fact, Place, Source

OVERPASS_URLS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass.nchc.org.tw/api/interpreter",
]
USER_AGENT = "BezProgu/1.0 (hackathon accessibility demo; contact: demo@localhost)"
DEFAULT_BBOX = "50.040,19.910,50.075,19.965"  # south,west,north,east (central Kraków)
CACHE_PATH = Path(__file__).resolve().parent.parent.parent / "fixtures" / "overpass_cache.json"
FIXTURE_PATH = Path(__file__).resolve().parent.parent.parent / "fixtures" / "osm_krakow.json"

# (POI pre-filter: must have `name` + one of these tags)
POI_FILTERS = [
    ('tourism', ['museum', 'hotel', 'hostel', 'guest_house', 'attraction']),
    ('amenity', ['restaurant', 'cafe', 'fast_food', 'toilets', 'cinema', 'theatre',
                 'townhall', 'library', 'place_of_worship']),
    ('shop', ['mall']),
    ('railway', ['station']),
    ('office', ['government']),
]

CATEGORY_MAP = {  # (tag_key, tag_value) -> our CATEGORIES key
    ('tourism', 'museum'): 'museum',
    ('tourism', 'hotel'): 'lodging', ('tourism', 'hostel'): 'lodging',
    ('tourism', 'guest_house'): 'lodging', ('tourism', 'attraction'): 'culture',
    ('amenity', 'restaurant'): 'food', ('amenity', 'cafe'): 'food',
    ('amenity', 'fast_food'): 'food', ('amenity', 'toilets'): 'toilet',
    ('amenity', 'cinema'): 'culture', ('amenity', 'theatre'): 'culture',
    ('amenity', 'townhall'): 'office', ('amenity', 'library'): 'culture',
    ('amenity', 'place_of_worship'): 'culture',
    ('shop', 'mall'): 'other', ('railway', 'station'): 'transport',
    ('office', 'government'): 'office',
}

SURFACES = {  # OSM surface -> our approach_surface enum (unknown values ignored)
    'asphalt': 'asphalt', 'paving_stones': 'paving_stones', 'paved': 'paving_stones',
    'concrete': 'concrete', 'concrete:plates': 'concrete',
    'sett': 'sett', 'paving_stones:sett': 'sett',
    'cobblestone': 'cobblestone', 'unhewn_cobblestone': 'cobblestone',
    'gravel': 'gravel', 'fine_gravel': 'gravel',
}


def to_bool(raw):
    if isinstance(raw, bool):
        return raw
    return str(raw).strip().lower() in ('yes', 'true', '1')


def to_float(raw):
    try:
        return float(str(raw).replace(',', '.'))
    except (ValueError, TypeError):
        return None


def map_tags(tags):
    """OSM tags -> [(parameter, value, note)]. One dict = one pitch slide."""
    out = []
    if 'wheelchair' in tags:
        w = tags['wheelchair'].strip().lower()
        if w == 'yes':
            out.append(('step_free_entrance', True, ''))
        elif w == 'no':
            out.append(('step_free_entrance', False, ''))
        elif w == 'limited':
            out.append(('step_free_entrance', False, 'OSM: ograniczona dostępność'))
    for key in ('toilets:wheelchair',):
        if key in tags:
            out.append(('accessible_toilet', to_bool(tags[key]), ''))
    if 'changing_table' in tags:
        out.append(('changing_table', to_bool(tags['changing_table']), ''))
    for key in ('ramp', 'ramp:wheelchair'):
        if key in tags:
            out.append(('ramp', to_bool(tags[key]), ''))
            break
    for key in ('door:width', 'width'):
        width = to_float(tags.get(key))
        if width is not None:
            out.append(('door_width_cm', width, ''))
            break
    if 'step_count' in tags:
        try:
            out.append(('entrance_steps', int(float(str(tags['step_count']))), ''))
        except (ValueError, TypeError):
            pass
    if 'kerb:height' in tags:
        h = to_float(tags['kerb:height'])
        if h is not None:
            out.append(('threshold_cm', round(h * 100, 1) if h < 3 else h, ''))
    if 'automatic_door' in tags:
        out.append(('automatic_door', to_bool(tags['automatic_door']), ''))
    if 'elevator' in tags:
        out.append(('elevator', to_bool(tags['elevator']), ''))
    if 'surface' in tags and tags['surface'].strip().lower() in SURFACES:
        out.append(('approach_surface', SURFACES[tags['surface'].strip().lower()], ''))
    return out


def map_category(tags):
    for (key, values) in POI_FILTERS:
        if tags.get(key) in values:
            return CATEGORY_MAP.get((key, tags[key]), 'other')
    return 'other'


def build_queries(bbox):
    """One light query per tag group (Overpass times out on a single big one)."""
    s, w, n, e = bbox
    queries = []
    for k, v in POI_FILTERS:
        queries.append(
            f'[out:json][timeout:60];nwr["name"]["{k}"~"^({"|".join(v)})$"]'
            f'({s},{w},{n},{e});out center meta tags;')
    queries.append(
        f'[out:json][timeout:60];(nwr["entrance"]["step_count"]({s},{w},{n},{e});'
        f'nwr["entrance"]["door:width"]({s},{w},{n},{e}););out center meta tags;')
    return queries


def fetch_overpass(query, cache_path=None, endpoints=None):
    """Try mirrors in turn (public Overpass instances rate-limit aggressively)."""
    data = urllib.parse.urlencode({"data": query}).encode()
    last_exc = None
    for url in (endpoints or OVERPASS_URLS):
        try:
            req = urllib.request.Request(url, data=data, headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(req, timeout=120) as resp:
                raw = resp.read()
            if cache_path is not None:
                cache_path.parent.mkdir(parents=True, exist_ok=True)
                cache_path.write_bytes(raw)
            return json.loads(raw)
        except Exception as exc:  # noqa: BLE001 - try next mirror
            last_exc = exc
    raise last_exc


def element_point(el):
    if 'lat' in el and 'lon' in el:
        return el['lat'], el['lon']
    c = el.get('center')
    if c:
        return c['lat'], c['lon']
    return None


def parse_timestamp(ts):
    try:
        return date.fromisoformat(ts[:10])
    except (ValueError, TypeError):
        return date.today()


class Command(BaseCommand):
    help = "Import POIs from OpenStreetMap (Overpass API) as places + facts"

    def add_arguments(self, parser):
        parser.add_argument('--bbox', default=DEFAULT_BBOX,
                            help='south,west,north,east (default: central Kraków)')
        parser.add_argument('--offline', action='store_true',
                            help='use cached Overpass response, no network')
        parser.add_argument('--cache', default=str(CACHE_PATH))
        parser.add_argument('--dump-fixture', default=None,
                            help='write dumpdata-style JSON of imported places+facts')
        parser.add_argument('--endpoint', default=None,
                            help='use a single Overpass endpoint URL')

    def handle(self, *args, **opts):
        source, _ = Source.objects.get_or_create(
            key='osm', defaults={'name': 'OpenStreetMap', 'url': 'https://www.openstreetmap.org',
                                 'license': 'ODbL 1.0', 'default_reliability': 'open_data',
                                 'refresh_policy': 'co 24 h (Overpass API)'})
        try:
            bbox = [p.strip() for p in opts['bbox'].split(',')]
            assert len(bbox) == 4, 'bbox musi mieć format: south,west,north,east'
            cache_path = Path(opts['cache'])
            if opts['offline']:
                payload = json.loads(cache_path.read_text())
                self.stdout.write('Tryb offline: używam pamięci podręcznej.')
            else:
                elements = []
                raws = []
                endpoints = [opts['endpoint']] if opts['endpoint'] else None
                for i, query in enumerate(build_queries(bbox)):
                    if i:
                        time.sleep(5)  # Overpass: max 1 req/s, bądź miły
                    raws.append(fetch_overpass(query, None, endpoints))
                for raw in raws:
                    elements.extend(raw.get('elements', []))
                payload = {'elements': elements}
                cache_path.parent.mkdir(parents=True, exist_ok=True)
                cache_path.write_text(json.dumps(payload))
                self.stdout.write(f'Pobrano {len(elements)} elementów '
                                  f'({len(build_queries(bbox))} zapytań).')
        except Exception as exc:  # noqa: BLE001 - keep old data, flag source
            source.status = 'unavailable'
            source.last_error = f'{type(exc).__name__}: {exc}'[:500]
            source.save(update_fields=['status', 'last_error'])
            self.stderr.write(f'Błąd importu OSM: {exc}. Zachowano dotychczasowe dane.')
            raise SystemExit(1)

        elements = payload.get('elements', [])
        pois = [el for el in elements if el.get('tags', {}).get('name') and 'entrance' not in el.get('tags', {})]
        entrances = [el for el in elements if 'entrance' in el.get('tags', {})]

        created_places, new_facts = 0, 0
        for el in pois:
            tags = el.get('tags', {})
            pt = element_point(el)
            if pt is None:
                continue
            lat, lon = pt
            # Bonus: attach nearby entrance nodes' tags (lowest priority).
            merged = dict(tags)
            for ent in entrances:
                ept = element_point(ent)
                if ept and abs(ept[0] - lat) < 0.0003 and abs(ept[1] - lon) < 0.0003:
                    for k, v in ent.get('tags', {}).items():
                        merged.setdefault(k, v)
            street = merged.get('addr:street', '')
            number = merged.get('addr:housenumber', '')
            address = f'{street} {number}, Kraków'.strip(' ,') if street else ''
            existing = Place.objects.filter(
                osm_type=el.get('type', 'node'), osm_id=el.get('id')).first()
            # Never overwrite a manually written key_note on re-import.
            if existing and existing.key_note:
                key_note = existing.key_note
            else:
                key_note = merged.get('wheelchair:description', '')[:500]
            place, created = Place.objects.update_or_create(
                osm_type=el.get('type', 'node'), osm_id=el.get('id'),
                defaults={'name': merged['name'][:255], 'category': map_category(merged),
                          'address': address[:255], 'location': Point(lon, lat),
                          'key_note': key_note})
            if created:
                created_places += 1
            observed = parse_timestamp(el.get('timestamp'))
            for param, value, note in map_tags(merged):
                latest = (Fact.objects.filter(place=place, parameter=param)
                          .order_by('-observed_at', '-created_at').first())
                if latest is not None and latest.value == value:
                    continue  # append-only: new fact only when value changed
                Fact.objects.create(place=place, parameter=param, value=value,
                                    source=source, reliability='open_data',
                                    observed_at=observed, note=note, is_sample=False)
                new_facts += 1

        source.status = 'ok'
        source.last_sync_at = timezone.now()
        source.last_error = ''
        source.save(update_fields=['status', 'last_sync_at', 'last_error'])
        if opts['dump_fixture']:
            self.dump_fixture(Path(opts['dump_fixture']))
        self.stdout.write(self.style.SUCCESS(
            f'OSM: {len(pois)} obiektów, {created_places} nowych miejsc, {new_facts} nowych faktów'))

    def dump_fixture(self, path):
        from django.core import serializers
        places = Place.objects.filter(is_sample=False, osm_id__isnull=False)
        facts = Fact.objects.filter(place__in=places)
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, 'w', encoding='utf-8') as fh:
            fh.write(serializers.serialize('json', list(places) + list(facts),
                                            use_natural_foreign_keys=False))
        self.stdout.write(f'Zapisano fiksturę: {path}')




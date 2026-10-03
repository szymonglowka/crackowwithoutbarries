"""Sources + a few clearly-marked SAMPLE places that exercise every UI state:
confirmed, open data, user report, conflict, outdated, missing, unavailable source.

    python manage.py seed_demo

Idempotent: wipes and recreates sample places only; OSM places are upserted
from places/fixtures/osm_krakow.json when present (offline-friendly demo).
"""
import json
from datetime import date, timedelta
from pathlib import Path

from django.contrib.gis.geos import GEOSGeometry, Point
from django.core.management.base import BaseCommand
from django.utils import timezone

from places.models import Fact, Place, Source

FIXTURE_PATH = Path(__file__).resolve().parent.parent.parent / "fixtures" / "osm_krakow.json"

SOURCES = [
    dict(key="osm", name="OpenStreetMap", url="https://www.openstreetmap.org",
         license="ODbL 1.0", default_reliability="open_data", refresh_policy="co 24 h (Overpass API)"),
    dict(key="krakow_open_data", name="Otwarte Dane Miasta Krakowa", url="https://otwartedane.um.krakow.pl",
         license="CC BY 4.0", default_reliability="open_data", refresh_policy="co tydzień"),
    dict(key="owner", name="Właściciel obiektu", license="Licencja udzielona przy rejestracji",
         default_reliability="confirmed", refresh_policy="na bieżąco, potwierdzenie co 12 mies."),
    dict(key="user", name="Zgłoszenie użytkownika", license="CC BY-SA 4.0 (regulamin)",
         default_reliability="user_report", refresh_policy="na bieżąco"),
]

today = date.today()
d = lambda days: today - timedelta(days=days)  # noqa: E731

# (name, category, address, lon, lat, key_note, phone, website, facts)
# facts: (parameter, value, source_key, days_ago, note)
SAMPLE_PLACES = [
    ("Sukiennice (przykład)", "museum", "Rynek Główny 1, Kraków", 19.9373, 50.0617,
     "Wejście główne od strony Rynku ma 3 stopnie. Użyj windy od strony ul. Szewskiej.",
     "+48 12 433 54 00", "https://muzeumkrakowa.pl", [
         ("entrance_steps", 3, "owner", 20, "Wejście główne"),
         ("step_free_entrance", True, "owner", 20, "Wejście boczne od ul. Szewskiej"),
         ("door_width_cm", 85, "owner", 20, ""),
         ("threshold_cm", 2, "osm", 200, ""),
         ("threshold_cm", 5, "user", 10, "Próg przy wejściu bocznym wydaje się wyższy"),  # conflict
         ("elevator", True, "owner", 20, ""),
         ("multiple_levels", True, "osm", 200, ""),
         ("approach_surface", "sett", "osm", 400, ""),
         ("accessible_toilet", True, "osm", 900, ""),  # outdated
         # changing_table, seating, corridor_width -> missing
     ]),
    ("Kino Pod Baranami (przykład)", "culture", "Rynek Główny 27, Kraków", 19.9352, 50.0612,
     "Sala główna w piwnicy, dostępna tylko po schodach.", "+48 12 423 07 68", "https://www.kinopodbaranami.pl", [
         ("entrance_steps", 1, "osm", 300, ""),
         ("step_free_entrance", False, "osm", 300, ""),
         ("elevator", False, "user", 45, "Sala w piwnicy, brak windy"),
         ("multiple_levels", True, "user", 45, ""),
     ]),
    ("Galeria Krakowska (przykład)", "other", "ul. Pawia 5, Kraków", 19.9456, 50.0672,
     "", "+48 12 428 99 00", "https://galeria-krakowska.pl", [
         ("entrance_steps", 0, "owner", 60, ""),
         ("step_free_entrance", True, "owner", 60, ""),
         ("automatic_door", True, "owner", 60, ""),
         ("door_width_cm", 180, "owner", 60, ""),
         ("elevator", True, "owner", 60, ""),
         ("accessible_toilet", True, "owner", 60, ""),
         ("changing_table", True, "owner", 60, ""),
         ("seating", True, "osm", 150, ""),
         ("stroller_parking", True, "user", 5, ""),
         ("approach_surface", "paving_stones", "osm", 150, ""),
     ]),
    ("Kawiarnia Na Uboczu (przykład)", "food", "ul. Józefa 12, Kraków", 19.9461, 50.0515,
     "", "", "", [
         ("entrance_steps", 2, "user", 3, ""),
     ]),
]


class Command(BaseCommand):
    help = "Create data sources and clearly-marked sample places"

    def handle(self, *args, **opts):
        sources = {}
        for s in SOURCES:
            obj, _ = Source.objects.update_or_create(key=s["key"], defaults=s)
            sources[s["key"]] = obj
        # Demo of "source unavailable": city open data pretends to have failed last sync.
        Source.objects.filter(key="krakow_open_data").update(
            status="unavailable", last_sync_at=timezone.now() - timedelta(days=9),
            last_error="Przekroczono czas oczekiwania na odpowiedź (przykład)",
        )
        Source.objects.filter(key="osm").update(last_sync_at=timezone.now())

        # Upsert by name so sample places keep stable IDs across restarts (links,
        # "recently viewed", demo script). Only their sample facts are reset -
        # real user reports on them survive.
        for name, cat, addr, lon, lat, note, phone, web, facts in SAMPLE_PLACES:
            place, _ = Place.objects.update_or_create(
                name=name, is_sample=True,
                defaults=dict(category=cat, address=addr, location=Point(lon, lat),
                              key_note=note, phone=phone, website=web),
            )
            place.facts.filter(is_sample=True).delete()
            Fact.objects.bulk_create([
                Fact(place=place, parameter=param, value=value, source=sources[src],
                     reliability=sources[src].default_reliability, observed_at=d(days),
                     note=fnote, is_sample=True)
                for param, value, src, days, fnote in facts
            ])
        self.stdout.write(self.style.SUCCESS(f"Seeded {len(SAMPLE_PLACES)} sample places"))
        self.load_osm_fixture(sources)
        self.ensure_owner_confirmation(sources)

    def load_osm_fixture(self, sources):
        """Upsert real OSM places+facts from the committed fixture (no network)."""
        if not FIXTURE_PATH.exists():
            self.stdout.write("Brak fikstury OSM — pomijam (uruchom import_osm z siecią).")
            return
        entries = json.loads(FIXTURE_PATH.read_text(encoding="utf-8"))
        source_by_pk = {e["pk"]: e["fields"] for e in entries if e["model"] == "places.source"}
        n_places, n_facts = 0, 0
        for e in entries:
            if e["model"] == "places.place":
                f = e["fields"]
                _, created = Place.objects.update_or_create(
                    osm_type=f["osm_type"], osm_id=f["osm_id"],
                    defaults={"name": f["name"], "category": f["category"],
                              "address": f.get("address", ""),
                              "location": GEOSGeometry(f["location"]),
                              "phone": f.get("phone", ""), "website": f.get("website", ""),
                              "key_note": f.get("key_note", ""), "is_sample": False})
                n_places += created
        # facts reference places by pk: map fixture place pk -> db place
        place_by_fixture_pk = {}
        for e in entries:
            if e["model"] == "places.place":
                obj = Place.objects.get(osm_type=e["fields"]["osm_type"], osm_id=e["fields"]["osm_id"])
                place_by_fixture_pk[e["pk"]] = obj
        for e in entries:
            if e["model"] != "places.fact":
                continue
            f = e["fields"]
            place = place_by_fixture_pk.get(f["place"])
            if place is None:
                continue
            src_key = source_by_pk.get(f["source"], {}).get("key", "osm")
            source = sources.get(src_key) or Source.objects.filter(key=src_key).first()
            if source is None:
                continue
            latest = (Fact.objects.filter(place=place, parameter=f["parameter"])
                      .order_by("-observed_at", "-created_at").first())
            if latest is not None and latest.value == f["value"]:
                continue
            Fact.objects.create(place=place, parameter=f["parameter"], value=f["value"],
                                source=source, reliability=f.get("reliability", "open_data"),
                                observed_at=date.fromisoformat(f["observed_at"][:10]),
                                note=f.get("note", ""), is_sample=False)
            n_facts += 1
        self.stdout.write(self.style.SUCCESS(
            f"Fikstura OSM: {n_places} nowych miejsc, {n_facts} nowych faktów"))

    def ensure_owner_confirmation(self, sources):
        """Owner confirmation (sample-labelled) on one real OSM place for the demo."""
        if Fact.objects.filter(source=sources["owner"], is_sample=True, place__is_sample=False).exists():
            return  # already done on a previous start - don't add one per restart
        place = Place.objects.filter(is_sample=False, osm_id__isnull=False).exclude(
            facts__source__key="owner").order_by("id").first()
        if place is None:
            if Place.objects.filter(is_sample=False).exists():
                self.stdout.write("Każde miejsce OSM ma już potwierdzenie właściciela.")
            else:
                self.stdout.write("Brak miejsc OSM — pomijam potwierdzenie właściciela.")
            return
        fact = place.facts.order_by("id").first()
        if fact is None:
            self.stdout.write(f"Miejsce {place.name} nie ma faktów — pomijam potwierdzenie.")
            return
        if Fact.objects.filter(place=place, parameter=fact.parameter,
                               source=sources["owner"]).exists():
            return
        Fact.objects.create(place=place, parameter=fact.parameter, value=fact.value,
                            source=sources["owner"], reliability="confirmed",
                            observed_at=date.today(), is_sample=True,
                            note="Potwierdzone przez właściciela (przykład)")
        self.stdout.write(self.style.SUCCESS(
            f"Potwierdzenie właściciela (przykład) na: {place.name}"))

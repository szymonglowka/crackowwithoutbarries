"""Sources + a few clearly-marked SAMPLE places that exercise every UI state:
confirmed, open data, user report, conflict, outdated, missing, unavailable source.

    python manage.py seed_demo

Idempotent: wipes and recreates sample places only.
"""
from datetime import date, timedelta

from django.contrib.gis.geos import Point
from django.core.management.base import BaseCommand
from django.utils import timezone

from places.models import Fact, Place, Source

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

        Place.objects.filter(is_sample=True).delete()
        for name, cat, addr, lon, lat, note, phone, web, facts in SAMPLE_PLACES:
            place = Place.objects.create(
                name=name, category=cat, address=addr, location=Point(lon, lat),
                key_note=note, phone=phone, website=web, is_sample=True,
            )
            Fact.objects.bulk_create([
                Fact(place=place, parameter=param, value=value, source=sources[src],
                     reliability=sources[src].default_reliability, observed_at=d(days),
                     note=fnote, is_sample=True)
                for param, value, src, days, fnote in facts
            ])
        self.stdout.write(self.style.SUCCESS(f"Seeded {len(SAMPLE_PLACES)} sample places"))

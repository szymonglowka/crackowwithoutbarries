"""Importer Otwartych Danych Miasta Krakowa (SZKIELET).

Candidate dataset: public toilets ("Toalety publiczne") on
https://otwartedane.um.krakow.pl (also mirrored on https://dane.gov.pl).
It lists locations but carries no accessibility attributes (steps, door width,
wheelchair toilet), so there is currently nothing reliable to map into facts.

    python manage.py import_krakow_open_data [--url CSV_URL]

Behaviour: streams a CSV with at least `name/lat/lon` columns and upserts
places (no facts unless accessibility columns are configured in COLUMN_FACTS).
On any failure it keeps old data and leaves Source(krakow_open_data) in
"unavailable" state — never deletes because a source is down.
"""
import csv
import urllib.request
from datetime import date

from django.contrib.gis.geos import Point
from django.core.management.base import BaseCommand
from django.utils import timezone

from places.models import Fact, Place, Source

DEFAULT_URL = "https://otwartedane.um.krakow.pl/dataset/toalety-publiczne"
USER_AGENT = "BezProgu/1.0 (hackathon accessibility demo; contact: demo@localhost)"

# CSV column -> (parameter, cast). Empty until the city publishes such columns.
COLUMN_FACTS = {}


class Command(BaseCommand):
    help = "Import accessibility data from Kraków open data (skeleton)"

    def add_arguments(self, parser):
        parser.add_argument("--url", default=DEFAULT_URL)

    def handle(self, *args, **opts):
        source, _ = Source.objects.get_or_create(
            key="krakow_open_data",
            defaults={"name": "Otwarte Dane Miasta Krakowa",
                      "url": "https://otwartedane.um.krakow.pl",
                      "license": "CC BY 4.0", "default_reliability": "open_data",
                      "refresh_policy": "co tydzień"})
        try:
            req = urllib.request.Request(opts["url"], headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(req, timeout=60) as resp:
                rows = list(csv.DictReader(
                    (line.decode("utf-8-sig") for line in resp),
                    delimiter=";"))
            if not rows or not {"name", "lat", "lon"} <= set(rows[0]):
                raise ValueError("CSV nie ma kolumn name/lat/lon — brak danych do zaimportowania")
            n = 0
            for row in rows:
                place, _ = Place.objects.get_or_create(
                    name=row["name"][:255],
                    defaults={"category": "toilet", "address": row.get("address", "")[:255],
                              "location": Point(float(row["lon"]), float(row["lat"]))})
                for col, (param, cast) in COLUMN_FACTS.items():
                    if row.get(col):
                        Fact.objects.create(
                            place=place, parameter=param, value=cast(row[col]),
                            source=source, reliability="open_data",
                            observed_at=date.today(), is_sample=False)
                        n += 1
            source.status = "ok"
            source.last_sync_at = timezone.now()
            source.last_error = ""
            source.save(update_fields=["status", "last_sync_at", "last_error"])
            self.stdout.write(self.style.SUCCESS(f"Otwarte dane: {len(rows)} miejsc, {n} faktów"))
        except Exception as exc:  # noqa: BLE001 - keep old data, flag source
            source.status = "unavailable"
            source.last_error = f"{type(exc).__name__}: {exc}"[:500]
            source.save(update_fields=["status", "last_error"])
            self.stderr.write(f"Błąd importu danych miejskich: {exc}. Zachowano dotychczasowe dane.")
            raise SystemExit(1)

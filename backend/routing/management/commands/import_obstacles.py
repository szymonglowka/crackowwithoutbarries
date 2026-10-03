# OWNER: Agent A2 (routing).
import json
import time
import urllib.request

from django.core.management.base import BaseCommand
from django.contrib.gis.geos import Point

from routing.models import Obstacle

OVERPASS_URL = "https://overpass-api.de/api/interpreter"
# Kraków bbox: south, west, north, east
QUERY = """[out:json][timeout:90];
(node["barrier"="kerb"](49.97,19.79,50.13,20.22);
 node["highway"="crossing"](49.97,19.79,50.13,20.22););
out body;"""
UA = {"User-Agent": "BezProgu/1.0 (hackathon demo; kontakt: demo@localhost)"}


class Command(BaseCommand):
    help = "Import barrier=kerb + highway=crossing nodes for Kraków from Overpass into routing.Obstacle"

    def handle(self, *args, **options):
        time.sleep(1)  # max 1 req/s (Overpass terms)
        req = urllib.request.Request(
            OVERPASS_URL, data=QUERY.encode(),
            headers={**UA, "Content-Type": "text/plain"})
        try:
            with urllib.request.urlopen(req, timeout=120) as res:
                data = json.load(res)
        except Exception as e:
            # Keep old data; never delete because a source is down.
            self.stderr.write(f"Overpass niedostępny, zachowano stare dane: {e}")
            raise SystemExit(1)
        from datetime import date
        today = date.today()
        created, updated = 0, 0
        for el in data.get("elements", []):
            if el.get("type") != "node":
                continue
            tags = el.get("tags", {})
            kind = "crossing" if tags.get("highway") == "crossing" else "kerb"
            _, was_created = Obstacle.objects.update_or_create(
                osm_id=el["id"],
                defaults={"kind": kind,
                          "location": Point(el["lon"], el["lat"], srid=4326),
                          "tags": tags, "observed_at": today})
            created, updated = created + was_created, updated + (not was_created)
        self.stdout.write(f"OK: {created} nowych, {updated} zaktualizowanych przeszkód.")

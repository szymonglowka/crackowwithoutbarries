# OWNER: Agent A2 (routing).
from django.contrib.gis.db import models


class Obstacle(models.Model):
    """Kerbs and crossings imported from OpenStreetMap (Overpass).

    GraphHopper does not know kerb heights, so we keep our own copy and match
    route steps against it (PostGIS dwithin ~8 m). Populated by the
    `import_obstacles` command; offline demo data lives in fixtures/.
    """

    KIND_CHOICES = [("kerb", "Krawężnik"), ("crossing", "Przejście")]

    osm_id = models.BigIntegerField(unique=True)
    kind = models.CharField(max_length=16, choices=KIND_CHOICES)
    location = models.PointField(geography=True, srid=4326)
    tags = models.JSONField(default=dict)  # raw OSM tags (kerb, kerb:height, tactile_paving, ...)
    observed_at = models.DateField(null=True, blank=True)
    is_sample = models.BooleanField(default=False, help_text="Przykładowe dane demonstracyjne")

    def __str__(self):
        return f"{self.kind} {self.osm_id}"

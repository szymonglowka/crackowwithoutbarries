from django.contrib.gis.db import models

from .catalog import CATEGORIES, STORED_RELIABILITY


class Source(models.Model):
    """Where facts come from. Each importer owns one Source row and updates its
    sync status, so the UI can say "source unavailable, showing data from <date>"."""

    STATUS_CHOICES = [("ok", "OK"), ("unavailable", "Niedostępne")]

    key = models.SlugField(unique=True)  # osm, krakow_open_data, owner, user, ...
    name = models.CharField(max_length=255)
    url = models.URLField(blank=True)
    license = models.CharField(max_length=255, blank=True)
    default_reliability = models.CharField(
        max_length=20, choices=[(r, r) for r in STORED_RELIABILITY]
    )
    refresh_policy = models.CharField(max_length=255, blank=True)  # human-readable, e.g. "co 24 h"
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="ok")
    last_sync_at = models.DateTimeField(null=True, blank=True)
    last_error = models.TextField(blank=True)

    def __str__(self):
        return self.name


class Place(models.Model):
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=20, choices=list(CATEGORIES.items()), default="other")
    address = models.CharField(max_length=255, blank=True)
    location = models.PointField(srid=4326)
    phone = models.CharField(max_length=50, blank=True)
    website = models.URLField(blank=True)
    # Most important note deciding the visit, e.g. "Wejście główne ma 3 stopnie. Użyj wejścia od ul. Bocznej."
    key_note = models.TextField(blank=True)
    osm_type = models.CharField(max_length=10, blank=True)  # node / way / relation
    osm_id = models.BigIntegerField(null=True, blank=True)
    is_sample = models.BooleanField(default=False, help_text="Fikcyjne dane demonstracyjne")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["osm_type", "osm_id"], name="unique_osm_object",
                                    condition=models.Q(osm_id__isnull=False)),
        ]

    def __str__(self):
        return self.name


class Fact(models.Model):
    """One claim about one parameter of one place, from one source, at one time.
    Facts are append-only: corrections add a new fact, which keeps the full
    history (/miejsce/:id/historia) for free."""

    place = models.ForeignKey(Place, on_delete=models.CASCADE, related_name="facts")
    parameter = models.CharField(max_length=50)  # key from catalog.PARAMETERS
    value = models.JSONField()  # int / float / bool / enum key
    source = models.ForeignKey(Source, on_delete=models.PROTECT, related_name="facts")
    reliability = models.CharField(max_length=20, choices=[(r, r) for r in STORED_RELIABILITY])
    observed_at = models.DateField(help_text="Kiedy informacja została pozyskana lub ostatnio potwierdzona")
    note = models.TextField(blank=True)
    is_sample = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-observed_at", "-created_at"]
        indexes = [models.Index(fields=["place", "parameter"])]

    def __str__(self):
        return f"{self.place} · {self.parameter}={self.value}"

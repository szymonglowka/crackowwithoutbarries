from django.contrib.gis import admin

from .models import Place


@admin.register(Place)
class PlaceAdmin(admin.GISModelAdmin):
    list_display = ("name", "created_at")
    default_lon = 19.9450
    default_lat = 50.0647
    default_zoom = 13

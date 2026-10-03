from django.contrib.gis import admin

from .models import Fact, Place, Source


class FactInline(admin.TabularInline):
    model = Fact
    extra = 1


@admin.register(Place)
class PlaceAdmin(admin.GISModelAdmin):
    list_display = ("name", "category", "is_sample", "updated_at")
    list_filter = ("category", "is_sample")
    search_fields = ("name", "address")
    inlines = [FactInline]


@admin.register(Source)
class SourceAdmin(admin.ModelAdmin):
    list_display = ("key", "name", "status", "last_sync_at")


@admin.register(Fact)
class FactAdmin(admin.ModelAdmin):
    list_display = ("place", "parameter", "value", "source", "reliability", "observed_at")
    list_filter = ("parameter", "source", "reliability")

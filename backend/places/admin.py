from django.contrib.gis import admin

from .models import Fact, Place, Report, Source


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


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ("place", "parameter", "value", "status", "observed_at", "created_at")
    list_filter = ("status", "parameter")
    actions = ("accept", "reject")

    @admin.action(description="Zaakceptuj (fakt zostaje jako zgłoszenie użytkownika)")
    def accept(self, request, queryset):
        queryset.update(status="accepted")

    @admin.action(description="Odrzuć (usuwa powiązany fakt z karty miejsca)")
    def reject(self, request, queryset):
        for report in queryset:
            if report.fact_id:
                report.fact.delete()
            report.status = "rejected"
            report.save(update_fields=["status"])

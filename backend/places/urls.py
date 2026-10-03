from django.urls import path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register("places", views.PlaceViewSet, basename="place")

urlpatterns = [
    path("meta/", views.meta),
    path("sources/", views.sources),
] + router.urls

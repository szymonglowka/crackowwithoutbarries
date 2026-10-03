from django.urls import path

from . import views

urlpatterns = [path("route/", views.route), path("geocode/", views.geocode)]

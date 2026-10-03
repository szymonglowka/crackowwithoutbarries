from rest_framework import viewsets
from rest_framework_gis.filters import InBBoxFilter

from .models import Place
from .serializers import PlaceSerializer


class PlaceViewSet(viewsets.ModelViewSet):
    queryset = Place.objects.all()
    serializer_class = PlaceSerializer
    bbox_filter_field = "location"
    filter_backends = (InBBoxFilter,)

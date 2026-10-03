# OWNER: Agent A2 (routing). GH responses are mocked; no network needed.
from unittest.mock import patch

from django.contrib.gis.geos import Point
from django.test import TestCase
from rest_framework.test import APIClient

from places.models import Place
from routing.gh import GHNoRoute, GHUnavailable, build_custom_model
from routing.models import Obstacle

GH_PATH = {
    "distance": 900,
    "time": 900000,
    "points": {"coordinates": [[19.9474, 50.0685], [19.9465, 50.0662], [19.9373, 50.0617]]},
    "instructions": [
        {"text": "Kieruj się na południe", "distance": 400, "interval": [0, 1]},
        {"text": "Skręć w prawo w ul. Floriańską", "distance": 500, "interval": [1, 2]},
    ],
    "details": {
        "surface": [[0, 1, "ASPHALT"], [1, 2, "SETT"]],
        "smoothness": [[0, 2, "GOOD"]],
        "road_class": [[0, 2, "FOOTWAY"]],
    },
}
FROM_TO = {"from": "50.0685,19.9474", "to": "50.0617,19.9373"}


class RouteViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    @patch("routing.views.gh.fetch_paths")
    def test_contract_shape(self, fetch):
        fetch.return_value = [GH_PATH]
        res = self.client.get("/api/route/", {**FROM_TO, "avoid": "cobblestone"})
        self.assertEqual(res.status_code, 200)
        route = res.json()["routes"][0]
        self.assertEqual(
            set(route),
            {"id", "distance_m", "duration_s", "summary", "summary_text",
             "geometry", "steps"})
        self.assertEqual(route["distance_m"], 900)
        self.assertIn("bez schodów", route["summary_text"])
        self.assertEqual(route["geometry"][0], [50.0685, 19.9474])
        step = route["steps"][1]
        self.assertEqual(step["surface"], "sett")
        self.assertEqual(step["surface_display"], "kostka brukowa")
        self.assertTrue(any(i["match"] == "barrier" for i in step["issues"]))
        self.assertEqual(route["summary"]["difficult_surface"], 1)

    @patch("routing.views.gh.fetch_paths")
    def test_crossing_without_kerb_data_is_unknown(self, fetch):
        Obstacle.objects.create(
            osm_id=1, kind="crossing",
            location=Point(19.9465, 50.0662, srid=4326),
            tags={"highway": "crossing"})
        fetch.return_value = [GH_PATH]
        res = self.client.get("/api/route/", FROM_TO)
        step0 = res.json()["routes"][0]["steps"][0]
        texts = [i["text"] for i in step0["issues"]]
        self.assertTrue(any("Brak danych o krawężniku" in t for t in texts))
        self.assertTrue(any(i["match"] == "unknown" for i in step0["issues"]))

    @patch("routing.views.gh.fetch_paths")
    def test_lowered_kerb_is_match(self, fetch):
        Obstacle.objects.create(
            osm_id=2, kind="kerb",
            location=Point(19.9465, 50.0662, srid=4326),
            tags={"barrier": "kerb", "kerb": "lowered"})
        fetch.return_value = [GH_PATH]
        res = self.client.get("/api/route/", FROM_TO)
        step0 = res.json()["routes"][0]["steps"][0]
        self.assertTrue(any(i["match"] == "match" for i in step0["issues"]))

    @patch("routing.views.gh.fetch_paths")
    def test_service_down_503(self, fetch):
        fetch.side_effect = GHUnavailable()
        res = self.client.get("/api/route/", FROM_TO)
        self.assertEqual(res.status_code, 503)
        self.assertIn("chwilowo niedostępna", res.json()["detail"])

    @patch("routing.views.gh.fetch_paths")
    def test_no_route_404(self, fetch):
        fetch.side_effect = GHNoRoute()
        res = self.client.get("/api/route/", FROM_TO)
        self.assertEqual(res.status_code, 404)

    def test_bad_params_400(self):
        res = self.client.get("/api/route/", {"from": "xx", "to": "50.06,19.93"})
        self.assertEqual(res.status_code, 400)

    def test_custom_model_cobble(self):
        m = build_custom_model({"avoid_cobblestone": 1}, set())
        self.assertTrue(any("COBBLESTONE" in p["if"] for p in m["priority"]))
        m2 = build_custom_model({}, set())
        self.assertEqual(m2, {})


class GeocodeTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.place = Place.objects.create(
            name="Sukiennice", address="Rynek Główny 1, Kraków",
            location=Point(19.9373, 50.0617, srid=4326))

    @patch("routing.views.photon_search", return_value=[])
    def test_local_place_first(self, _photon):
        res = self.client.get("/api/geocode/", {"q": "sukien"})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()[0]["place_id"], self.place.id)
        self.assertEqual(res.json()[0]["lat"], 50.0617)

    def test_empty_q(self):
        self.assertEqual(self.client.get("/api/geocode/", {"q": ""}).json(), [])

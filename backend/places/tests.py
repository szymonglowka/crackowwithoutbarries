"""Tests for POST /api/reports/, history and matching edge cases."""
from datetime import date, timedelta

from django.contrib.gis.geos import Point
from django.test import TestCase
from rest_framework.test import APITestCase

from .catalog import PARAMETERS_BY_KEY
from .matching import evaluate_parameter
from .models import Fact, Place, Report, Source


def make_place(name="Test"):
    return Place.objects.create(name=name, category="museum", location=Point(19.93, 50.06))


def make_source(key="owner", reliability="confirmed"):
    return Source.objects.get_or_create(
        key=key, defaults={"name": key, "default_reliability": reliability})[0]


class FakeFact:
    def __init__(self, value, source_id, reliability, observed_at, source_key="s", source_name="S"):
        self.value = value
        self.source_id = source_id
        self.source = type("S", (), {"key": source_key, "name": source_name})()
        self.reliability = reliability
        self.observed_at = observed_at
        self.created_at = observed_at
        self.note = ""
        self.is_sample = False


class MatchingTest(TestCase):
    def test_conflict_barrier_wins(self):
        today = date.today()
        facts = [
            FakeFact(2, 1, "confirmed", today, "owner", "Owner"),
            FakeFact(8, 2, "user_report", today, "user", "User"),
        ]
        r = evaluate_parameter(PARAMETERS_BY_KEY["threshold_cm"],
                               facts, {"max_threshold_cm": 5}, today=today)
        self.assertEqual(r["status"], "conflicting")
        self.assertEqual(r["match"], "barrier")
        self.assertEqual(len(r["sources"]), 2)

    def test_outdated(self):
        old = date.today() - timedelta(days=800)
        facts = [FakeFact(True, 1, "open_data", old, "osm", "OSM")]
        r = evaluate_parameter(PARAMETERS_BY_KEY["accessible_toilet"], facts, {})
        self.assertEqual(r["status"], "outdated")

    def test_missing_relevant_is_unknown(self):
        r = evaluate_parameter(PARAMETERS_BY_KEY["threshold_cm"], [],
                               {"max_threshold_cm": 2})
        self.assertEqual(r["status"], "missing")
        self.assertEqual(r["match"], "unknown")
        self.assertIsNone(r["value"])

    def test_missing_irrelevant_is_info(self):
        r = evaluate_parameter(PARAMETERS_BY_KEY["threshold_cm"], [], {})
        self.assertEqual(r["status"], "missing")
        self.assertEqual(r["match"], "info")


class ReportApiTest(APITestCase):
    def setUp(self):
        self.place = make_place()
        make_source("user", "user_report")

    def post(self, payload):
        return self.client.post("/api/reports/", payload, format="json")

    def test_create_report_and_fact(self):
        resp = self.post({"place": self.place.id, "parameter": "threshold_cm",
                          "value": 5, "observed_at": str(date.today())})
        self.assertEqual(resp.status_code, 201, resp.content)
        self.assertEqual(resp.data["status"], "pending")
        fact = Fact.objects.get(parameter="threshold_cm")
        self.assertEqual(fact.value, 5)
        self.assertEqual(fact.reliability, "user_report")
        self.assertFalse(fact.is_sample)
        report = Report.objects.get()
        self.assertEqual(report.fact_id, fact.id)
        self.assertTrue(report.ip_hash)  # hashed, never raw IP
        # visible on place card immediately
        detail = self.client.get(f"/api/places/{self.place.id}/")
        params = {p["key"]: p for g in detail.data["groups"] for p in g["parameters"]}
        self.assertEqual(params["threshold_cm"]["status"], "user_report")

    def test_honeypot_drops_silently(self):
        n = Fact.objects.count()
        resp = self.post({"place": self.place.id, "parameter": "threshold_cm",
                          "value": 5, "observed_at": str(date.today()),
                          "website": "http://spam.example"})
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(Fact.objects.count(), n)
        self.assertEqual(Report.objects.count(), 0)

    def test_bad_parameter_type_and_future(self):
        resp = self.post({"place": self.place.id, "parameter": "nie_istnieje",
                          "value": 1, "observed_at": str(date.today())})
        self.assertEqual(resp.status_code, 400)
        self.assertIn("parameter", resp.data)
        resp = self.post({"place": self.place.id, "parameter": "entrance_steps",
                          "value": "dużo", "observed_at": str(date.today())})
        self.assertEqual(resp.status_code, 400)
        self.assertIn("value", resp.data)
        future = str(date.today() + timedelta(days=1))
        resp = self.post({"place": self.place.id, "parameter": "entrance_steps",
                          "value": 2, "observed_at": future})
        self.assertEqual(resp.status_code, 400)
        self.assertIn("observed_at", resp.data)
        resp = self.post({"place": self.place.id, "parameter": "approach_surface",
                          "value": "lawa", "observed_at": str(date.today())})
        self.assertEqual(resp.status_code, 400)


class HistoryApiTest(APITestCase):
    def test_history_order_and_old_values(self):
        place = make_place()
        src = make_source()
        today = date.today()
        Fact.objects.create(place=place, parameter="threshold_cm", value=2,
                            source=src, reliability="confirmed",
                            observed_at=today - timedelta(days=30))
        Fact.objects.create(place=place, parameter="threshold_cm", value=5,
                            source=src, reliability="confirmed", observed_at=today)
        resp = self.client.get(f"/api/places/{place.id}/history/")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data), 2)
        newest = resp.data[0]
        self.assertEqual(newest["parameter"], "threshold_cm")
        self.assertEqual(newest["new_value_display"], "5 cm")
        self.assertEqual(newest["old_value_display"], "2 cm")
        self.assertIsNone(resp.data[1]["old_value_display"])

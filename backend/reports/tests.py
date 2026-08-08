"""Automated unit tests for 5 database-driven PDF reports."""

from django.contrib.auth.models import Group, User
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from assets.models import Asset
from cameras.models import Camera
from evidence.models import Evidence
from incidents.models import Incident
from labs.models import Lab
from monitoring.models import LabSession


class ReportsAPITestCase(TestCase):
    """Test suite for PDF report generation and security officer access."""

    def setUp(self):
        self.client = APIClient()

        # Create Security Officer User
        self.user = User.objects.create_user(
            username="officer_test",
            password="Password123!",
        )
        sec_group, _ = Group.objects.get_or_create(name="Security Officer")
        self.user.groups.add(sec_group)
        self.client.force_authenticate(user=self.user)

        # Setup Core Test Fixtures
        self.lab = Lab.objects.create(
            name="Robotics Research Lab",
            building="Engineering Block A",
            room_number="101",
            total_computers=20,
        )

        self.camera = Camera.objects.create(
            lab=self.lab,
            name="Ceiling Overhead Cam 1",
            ip_address="192.168.1.50",
            rtsp_url="rtsp://192.168.1.50:554/stream",
            status="Online",
        )

        self.asset = Asset.objects.create(
            lab=self.lab,
            name="Wireless Mouse",
            category="Peripheral",
            asset_tag="TAG-MOUSE-01",
            expected_quantity=20,
        )

        self.incident = Incident.objects.create(
            lab=self.lab,
            camera=self.camera,
            asset=self.asset,
            expected_quantity=20,
            detected_quantity=19,
            confidence=0.95,
            description="1 Mouse missing during monitoring cycle.",
            status="Open",
        )

        self.evidence = Evidence.objects.create(
            incident=self.incident,
            confidence=0.95,
            captured_at=self.incident.detected_at,
        )

        self.session = LabSession.objects.create(
            session_id="SES-9001",
            instructor_name="Engr. Awais Rathore",
            course_name="Computer Vision",
            course_code="CS-401",
            lab=self.lab,
            session_topic="Deep Learning Verification",
            planned_duration=120,
            status="Completed",
        )

    def test_incident_report_generation(self):
        """Test downloading Incident Report returns valid PDF."""
        url = reverse("incident_report")
        response = self.client.get(url, {"lab_id": self.lab.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response["Content-Type"], "application/pdf")
        self.assertTrue(response.content.startswith(b"%PDF"))

    def test_asset_missing_report_generation(self):
        """Test downloading Asset Missing Report returns valid PDF."""
        url = reverse("asset_missing_report")
        response = self.client.get(url, {"lab_id": self.lab.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response["Content-Type"], "application/pdf")
        self.assertTrue(response.content.startswith(b"%PDF"))

    def test_lab_security_report_generation(self):
        """Test downloading Laboratory Security Report returns valid PDF."""
        url = reverse("lab_security_report")
        response = self.client.get(url, {"lab_id": self.lab.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response["Content-Type"], "application/pdf")
        self.assertTrue(response.content.startswith(b"%PDF"))

    def test_evidence_report_generation(self):
        """Test downloading Evidence Report returns valid PDF."""
        url = reverse("evidence_report")
        response = self.client.get(url, {"lab_id": self.lab.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response["Content-Type"], "application/pdf")
        self.assertTrue(response.content.startswith(b"%PDF"))

    def test_lab_session_report_generation(self):
        """Test downloading Lab Session Report returns valid PDF."""
        url = reverse("lab_session_report")
        response = self.client.get(url, {"lab_id": self.lab.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response["Content-Type"], "application/pdf")
        self.assertTrue(response.content.startswith(b"%PDF"))

    def test_empty_filter_results_handled_gracefully(self):
        """Test that non-existent lab or out-of-range dates generate valid PDF with empty message."""
        url = reverse("incident_report")
        response = self.client.get(url, {"lab_id": 9999, "from_date": "2020-01-01", "to_date": "2020-01-02"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response["Content-Type"], "application/pdf")
        self.assertTrue(response.content.startswith(b"%PDF"))

"""Integration and API tests for DRF REST API Layer."""

from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from cameras.models import Camera
from labs.models import Lab


class RESTAPILayerTestCase(APITestCase):
    """Test cases for DRF Authentication, Dashboard, ViewSets, and Swagger docs."""

    def setUp(self):
        self.user = User.objects.create_superuser(
            username="admin_user",
            email="admin@labsecurity.com",
            password="Password123!"
        )
        self.lab = Lab.objects.create(
            name="Main Test Lab",
            building="Building A",
            room_number="101",
            total_computers=15
        )
        self.camera = Camera.objects.create(
            lab=self.lab,
            name="Camera 1",
            serial_number="CAM-001",
            location="Room 101 Front",
            status="Online"
        )

    def test_jwt_authentication_flow(self):
        url = reverse("token_obtain_pair")
        data = {"username": "admin_user", "password": "Password123!"}
        response = self.client.post(url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

        # Authenticate client
        access_token = response.data["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")

        # Check user profile endpoint
        profile_url = reverse("user_profile")
        profile_response = self.client.get(profile_url)
        self.assertEqual(profile_response.status_code, status.HTTP_200_OK)
        self.assertEqual(profile_response.data["username"], "admin_user")

    def test_dashboard_api(self):
        self.client.force_authenticate(user=self.user)
        url = reverse("dashboard")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("online_cameras", response.data)
        self.assertIn("system_health", response.data)
        self.assertEqual(response.data["total_labs"], 1)

    def test_viewsets_crud_and_filtering(self):
        self.client.force_authenticate(user=self.user)

        # Labs ViewSet
        labs_url = reverse("lab-list")
        labs_res = self.client.get(labs_url)
        self.assertEqual(labs_res.status_code, status.HTTP_200_OK)

        # Cameras ViewSet
        cams_url = reverse("camera-list")
        cams_res = self.client.get(cams_url)
        self.assertEqual(cams_res.status_code, status.HTTP_200_OK)

    def test_monitoring_and_scheduler_apis(self):
        self.client.force_authenticate(user=self.user)

        status_url = reverse("monitoring_status")
        res = self.client.get(status_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        scheduler_url = reverse("scheduler_status")
        sched_res = self.client.get(scheduler_url)
        self.assertEqual(sched_res.status_code, status.HTTP_200_OK)

    def test_openapi_swagger_schema(self):
        self.client.force_authenticate(user=self.user)
        schema_url = reverse("schema")
        response = self.client.get(schema_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

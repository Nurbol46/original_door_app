from rest_framework import status
from rest_framework.test import APITestCase
from app.users.models import Shop, User


class AuthFlowTests(APITestCase):
    def test_register_returns_tokens_and_user_id(self):
        payload = {
            "shop_name": "Smoke Shop",
            "full_name": "Smoke User",
            "number": "+7 777 000 00 00",
            "email": "register_test@example.com",
            "password": "secure12345",
        }
        response = self.client.post("/api/auth/register/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.assertIn("user_id", response.data)
        self.assertIsInstance(response.data["user_id"], int)
        created_user = User.objects.get(email=payload["email"])
        self.assertEqual(created_user.role, "user")
        self.assertTrue(Shop.objects.filter(user=created_user, name="Smoke Shop").exists())

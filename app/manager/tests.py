from datetime import timedelta

from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from app.orders.models import Notification, Order, Service
from app.users.models import Shop, User


class ManagerWorkflowTests(APITestCase):
    def setUp(self):
        self.manager = User.objects.create_user(
            username="manager@example.com", email="manager@example.com",
            password="manager123", full_name="Manager Name",
            number="+7 900 111 22 33", role="manager",
        )
        Shop.objects.create(
            user=self.manager, name="Manager Shop",
            city="Almaty", street="Abay", house_number="10",
        )
        self.user = User.objects.create_user(
            username="user@example.com", email="user@example.com",
            password="user12345", full_name="User Name",
            number="+7 900 333 44 55", role="user",
        )
        Shop.objects.create(
            user=self.user, name="User Shop",
            city="Astana", street="Baitursynov", house_number="25",
        )
        Service.objects.create(name="Монтаж", price="5000.00")

    def _login(self, email, password):
        response = self.client.post(
            "/api/auth/login/",
            {"email": email, "password": password},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        return response.data["access"]

    def test_user_manager_notification_flow(self):
        user_token = self._login("user@example.com", "user12345")
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {user_token}")

        create_response = self.client.post(
            "/api/orders/",
            {"order_type": "Установка двери", "comment": "Новая заявка"},
            format="json",
        )
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        order_id = Order.objects.filter(user=self.user).order_by("-id").values_list("id", flat=True).first()
        self.assertIsNotNone(order_id)

        rbac_response = self.client.get("/api/manager/services/")
        self.assertEqual(rbac_response.status_code, status.HTTP_403_FORBIDDEN)

        manager_token = self._login("manager@example.com", "manager123")
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {manager_token}")

        manager_list_response = self.client.get("/api/manager/orders/")
        self.assertEqual(manager_list_response.status_code, status.HTTP_200_OK)
        self.assertTrue(any(item["id"] == order_id for item in manager_list_response.data))

        work_date = (timezone.now().date() + timedelta(days=1)).isoformat()
        update_response = self.client.patch(
            f"/api/manager/orders/{order_id}/",
            {"status": "awaiting_service", "work_date": work_date},
            format="json",
        )
        self.assertEqual(update_response.status_code, status.HTTP_200_OK)

        order = Order.objects.get(id=order_id)
        self.assertEqual(order.status, "awaiting_service")
        self.assertEqual(str(order.work_date), work_date)
        self.assertGreaterEqual(Notification.objects.filter(order=order, user=self.user).count(), 1)

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {user_token}")
        has_new_response = self.client.get("/api/orders/has-new/")
        self.assertEqual(has_new_response.status_code, status.HTTP_200_OK)
        self.assertTrue(has_new_response.data["has_new"])


class ManagerOrderDetailViewTestCase(APITestCase):
    def setUp(self):
        self.manager = User.objects.create_user(
            username='manager', email='manager@example.com',
            password='testpass123', full_name='Manager User',
            number='+998991234567', role='manager',
        )
        self.user = User.objects.create_user(
            username='testuser', email='test@example.com',
            password='testpass123', full_name='Test User',
            number='+998991234568',
        )
        Shop.objects.create(
            user=self.user, name='Test Shop',
            city='Tashkent', street='Amir Timur', house_number='123',
        )
        self.order = Order.objects.create(
            order_type='Installation', user=self.user,
            city='Tashkent', street='Amir Timur', house='123',
            status=Order.OrderStatus.AWAITING_CALL,
        )

    def test_manager_order_list_requires_manager_role(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/manager/orders/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_manager_order_list_success(self):
        self.client.force_authenticate(user=self.manager)
        response = self.client.get('/api/manager/orders/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_manager_no_notification_if_status_unchanged(self):
        self.client.force_authenticate(user=self.manager)
        data = {'status': self.order.status}
        response = self.client.patch(f'/api/manager/orders/{self.order.id}/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Notification.objects.filter(order=self.order).count(), 0)

    def test_manager_delete_order(self):
        self.client.force_authenticate(user=self.manager)
        response = self.client.delete(f'/api/manager/orders/{self.order.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Order.objects.filter(id=self.order.id).exists())


class ManagerUserViewTestCase(APITestCase):
    def setUp(self):
        self.manager = User.objects.create_user(
            username='manager', email='manager@example.com',
            password='testpass123', full_name='Manager User',
            number='+998991234567', role='manager',
        )
        self.user = User.objects.create_user(
            username='testuser', email='test@example.com',
            password='testpass123', full_name='Test User',
            number='+998991234568',
        )
        Shop.objects.create(
            user=self.user, name='Test Shop',
            city='Tashkent', street='Amir Timur', house_number='123',
        )

    def test_manager_user_list_success(self):
        self.client.force_authenticate(user=self.manager)
        response = self.client.get('/api/manager/users/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 2)

    def test_manager_delete_user(self):
        self.client.force_authenticate(user=self.manager)
        response = self.client.delete(f'/api/manager/users/{self.user.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(User.objects.filter(id=self.user.id).exists())


class ManagerServiceViewTestCase(APITestCase):
    def setUp(self):
        self.manager = User.objects.create_user(
            username='manager', email='manager@example.com',
            password='testpass123', full_name='Manager User',
            number='+998991234567', role='manager',
        )
        self.user = User.objects.create_user(
            username='testuser', email='test@example.com',
            password='testpass123', full_name='Test User',
            number='+998991234568',
        )
        self.service = Service.objects.create(name='Test Service', price=100.00)

    def test_manager_service_list_requires_manager_role(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/manager/services/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_manager_service_list_success(self):
        self.client.force_authenticate(user=self.manager)
        response = self.client.get('/api/manager/services/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.data), 0)

    def test_manager_create_service(self):
        self.client.force_authenticate(user=self.manager)
        data = {'name': 'New Service', 'price': 200.00}
        response = self.client.post('/api/manager/services/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Service.objects.filter(name='New Service').exists())

    def test_manager_delete_service(self):
        self.client.force_authenticate(user=self.manager)
        service_id = self.service.id
        response = self.client.delete(f'/api/manager/services/{service_id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Service.objects.filter(id=service_id).exists())

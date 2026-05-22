from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from app.users.models import Shop
from .models import Order, OrderFile, Notification, Service

User = get_user_model()


class OrderModelTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser', email='test@example.com',
            password='testpass123', full_name='Test User', number='+998991234567',
        )
        self.shop = Shop.objects.create(
            user=self.user, name='Test Shop',
            city='Tashkent', street='Amir Timur', house_number='123',
        )

    def test_order_creation(self):
        order = Order.objects.create(
            order_type='Installation', user=self.user,
            city='Tashkent', street='Amir Timur', house='123', comment='Test comment',
        )
        self.assertEqual(order.user, self.user)
        self.assertEqual(order.status, Order.OrderStatus.AWAITING_CALL)

    def test_order_number_generation(self):
        order = Order.objects.create(
            order_type='Repair', user=self.user,
            city='Tashkent', street='Amir Timur', house='123',
        )
        self.assertIsNotNone(order.order_number)
        self.assertTrue(order.order_number.startswith('TE'))

    def test_order_unique_number(self):
        order1 = Order.objects.create(
            order_type='Installation', user=self.user,
            city='Tashkent', street='Amir Timur', house='123',
        )
        order2 = Order.objects.create(
            order_type='Repair', user=self.user,
            city='Tashkent', street='Amir Timur', house='123',
        )
        self.assertNotEqual(order1.order_number, order2.order_number)

    def test_order_str_representation(self):
        order = Order.objects.create(
            order_type='Installation', user=self.user,
            city='Tashkent', street='Amir Timur', house='123',
        )
        expected = f"Заявка {order.order_number} - {order.status}"
        self.assertEqual(str(order), expected)


class OrderAPITestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser', email='test@example.com',
            password='testpass123', full_name='Test User', number='+998991234567',
        )
        self.other_user = User.objects.create_user(
            username='otheruser', email='other@example.com',
            password='testpass123', full_name='Other User', number='+998991234568',
        )
        self.shop = Shop.objects.create(
            user=self.user, name='Test Shop',
            city='Tashkent', street='Amir Timur', house_number='123',
        )
        self.other_shop = Shop.objects.create(
            user=self.other_user, name='Other Shop',
            city='Samarkand', street='Registan', house_number='456',
        )

    def test_order_list_requires_authentication(self):
        response = self.client.get('/api/orders/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_order_list_authenticated(self):
        order1 = Order.objects.create(
            order_type='Installation', user=self.user,
            city='Tashkent', street='Amir Timur', house='123',
        )
        Order.objects.create(
            order_type='Repair', user=self.other_user,
            city='Samarkand', street='Registan', house='456',
        )
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/orders/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['id'], order1.id)

    def test_order_create_with_defaults(self):
        self.client.force_authenticate(user=self.user)
        data = {'order_type': 'Installation'}
        response = self.client.post('/api/orders/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['city'], self.shop.city)
        self.assertEqual(response.data['street'], self.shop.street)
        self.assertEqual(response.data['house'], self.shop.house_number)

    def test_order_create_with_date_range(self):
        self.client.force_authenticate(user=self.user)
        payload = {
            'order_type': 'Installation',
            'work_date_start': '2026-05-01',
            'work_date_end': '2026-05-10',
        }
        response = self.client.post('/api/orders/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['work_date_start'], '2026-05-01')
        self.assertEqual(response.data['work_date_end'], '2026-05-10')

    def test_order_create_rejects_invalid_date_range(self):
        self.client.force_authenticate(user=self.user)
        payload = {
            'order_type': 'Installation',
            'work_date_start': '2026-05-10',
            'work_date_end': '2026-05-01',
        }
        response = self.client.post('/api/orders/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_order_detail_view(self):
        order = Order.objects.create(
            order_type='Installation', user=self.user,
            city='Tashkent', street='Amir Timur', house='123',
        )
        self.client.force_authenticate(user=self.user)
        response = self.client.get(f'/api/orders/{order.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], order.id)

    def test_order_detail_forbidden_for_other_user(self):
        order = Order.objects.create(
            order_type='Installation', user=self.user,
            city='Tashkent', street='Amir Timur', house='123',
        )
        self.client.force_authenticate(user=self.other_user)
        response = self.client.get(f'/api/orders/{order.id}/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_order_list_filtered_by_user(self):
        for i in range(3):
            Order.objects.create(
                order_type=f'Type{i}', user=self.user,
                city='Tashkent', street='Amir Timur', house='123',
            )
        for i in range(2):
            Order.objects.create(
                order_type=f'OtherType{i}', user=self.other_user,
                city='Samarkand', street='Registan', house='456',
            )
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/orders/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 3)

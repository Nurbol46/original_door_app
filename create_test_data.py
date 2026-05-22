import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from app.users.models import User, Shop
from app.orders.models import Service


def ensure_user(email, password, full_name, number, role, shop_data):
    user, _ = User.objects.get_or_create(
        email=email,
        defaults={
            'username': email,
            'full_name': full_name,
            'number': number,
            'role': role,
        },
    )
    user.username = email
    user.full_name = full_name
    user.number = number
    user.role = role
    user.set_password(password)
    user.save()

    Shop.objects.update_or_create(user=user, defaults=shop_data)
    return user


ensure_user(
    email='manager@example.com',
    password='manager123',
    full_name='Иван Менеджер',
    number='+7 900 123 45 67',
    role='manager',
    shop_data={
        'name': 'Магазин Менеджера',
        'city': 'Бишкек',
        'street': 'Чуй',
        'house_number': '10',
    },
)

ensure_user(
    email='admin@gmail.com',
    password='admin',
    full_name='Администратор',
    number='+7 900 000 00 00',
    role='manager',
    shop_data={
        'name': 'Админ Профиль',
        'city': 'Бишкек',
        'street': 'Чуй',
        'house_number': '1',
    },
)

ensure_user(
    email='user@example.com',
    password='user123',
    full_name='Петр Пользователь',
    number='+7 900 234 56 78',
    role='user',
    shop_data={
        'name': 'Мой магазин',
        'city': 'Бишкек',
        'street': 'Манас',
        'house_number': '25',
    },
)

services = [
    {'name': 'Установка дверей', 'price': 5000},
    {'name': 'Ремонт замков', 'price': 2000},
    {'name': 'Покраска дверей', 'price': 3000},
    {'name': 'Установка доводчика', 'price': 1500},
]

for service_data in services:
    Service.objects.update_or_create(
        name=service_data['name'],
        defaults={'price': service_data['price']},
    )

print('✅ Тестовые данные созданы успешно!')
print('Менеджер: manager@example.com / manager123')
print('Менеджер: admin@gmail.com / admin')
print('Пользователь: user@example.com / user123')

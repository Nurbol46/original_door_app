from django.contrib.auth.hashers import make_password
from django.db import migrations


def create_admin_manager(apps, schema_editor):
    User = apps.get_model('users', 'User')
    Shop = apps.get_model('users', 'Shop')

    user, _ = User.objects.get_or_create(
        email='admin@gmail.com',
        defaults={
            'username': 'admin@gmail.com',
            'full_name': 'Администратор',
            'number': '+7 900 000 00 00',
            'role': 'manager',
        },
    )

    user.username = 'admin@gmail.com'
    user.full_name = 'Администратор'
    user.number = '+7 900 000 00 00'
    user.role = 'manager'
    user.password = make_password('admin')
    user.save()

    Shop.objects.update_or_create(
        user=user,
        defaults={
            'name': 'Админ Профиль',
            'city': 'Бишкек',
            'street': 'Чуй',
            'house_number': '1',
        },
    )


class Migration(migrations.Migration):
    dependencies = [
        ('users', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(create_admin_manager, migrations.RunPython.noop),
    ]

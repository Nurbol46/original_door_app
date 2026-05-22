from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0002_create_admin_manager'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='date_of_birth',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='user',
            name='avatar',
            field=models.ImageField(blank=True, null=True, upload_to='user_avatars/'),
        ),
    ]

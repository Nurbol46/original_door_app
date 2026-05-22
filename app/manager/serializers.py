from app.orders.models import Order
from app.users.models import User, Shop
from rest_framework import serializers


class ManagerOrderUpdateSerializer(serializers.ModelSerializer):

    class Meta:
        model = Order
        fields = ['status', 'specialist', 'work_date', 'work_date_start', 'work_date_end', 'comment']

    def validate(self, attrs):
        order = self.instance
        start = attrs.get('work_date_start', getattr(order, 'work_date_start', None))
        end = attrs.get('work_date_end', getattr(order, 'work_date_end', None))
        work_date = attrs.get('work_date', getattr(order, 'work_date', None))

        if start and end and start > end:
            raise serializers.ValidationError({
                'work_date_end': 'Дата окончания не может быть раньше даты начала.',
            })

        if work_date and start and end and not (start <= work_date <= end):
            raise serializers.ValidationError({
                'work_date': 'Дата должна быть в диапазоне, указанном пользователем',
            })

        return attrs


class ManagerShopSerializer(serializers.ModelSerializer):
    class Meta:
        model = Shop
        fields = ['name', 'city', 'street', 'house_number']


class ManagerUserSerializer(serializers.ModelSerializer):
    shop = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'full_name', 'email', 'number', 'role',
            'date_of_birth', 'avatar', 'is_active', 'date_joined', 'shop',
        ]

    def get_shop(self, obj):
        shop = Shop.objects.filter(user=obj).first()
        if not shop:
            return None
        return ManagerShopSerializer(shop).data

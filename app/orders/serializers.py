from rest_framework import serializers
from app.users.models import User
from .models import Order, OrderFile, Notification, Service


class OrderCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ['order_type', 'city', 'street', 'house', 'comment', 'work_date_start', 'work_date_end']
        extra_kwargs = {
            'city': {'required': False},
            'street': {'required': False},
            'house': {'required': False},
            'comment': {'required': False},
            'work_date_start': {'required': False, 'allow_null': True},
            'work_date_end': {'required': False, 'allow_null': True},
        }

    def validate(self, attrs):
        start = attrs.get('work_date_start')
        end = attrs.get('work_date_end')
        if start and end and start > end:
            raise serializers.ValidationError({
                'work_date_end': 'Дата окончания не может быть раньше даты начала.',
            })
        return attrs

    def create(self, validated_data):
        user = self.context['request'].user
        shop = user.shops
        validated_data['user'] = user
        validated_data['city'] = validated_data.get('city', shop.city)
        validated_data['street'] = validated_data.get('street', shop.street)
        validated_data['house'] = validated_data.get('house', shop.house_number)
        return Order.objects.create(**validated_data)


class OrderListSerializer(serializers.ModelSerializer):
    user_full_name = serializers.CharField(source='user.full_name', read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'order_type', 'status', 'created_at',
            'work_date', 'work_date_start', 'work_date_end', 'user_full_name',
        ]


class UserShortSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['full_name', 'number']


class OrderFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderFile
        fields = ['id', 'file', 'uploaded_by', 'uploaded_at']


class OrderDetailSerializer(serializers.ModelSerializer):
    user = UserShortSerializer(read_only=True)
    manager = UserShortSerializer(read_only=True)
    specialist = UserShortSerializer(read_only=True)
    files = OrderFileSerializer(many=True, read_only=True)
    user_full_name = serializers.CharField(source='user.full_name', read_only=True)
    address = serializers.SerializerMethodField()
    notes = serializers.CharField(source='comment', read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'order_type', 'user', 'manager',
            'specialist', 'status', 'city', 'street', 'house',
            'comment', 'created_at', 'work_date', 'work_date_start', 'work_date_end',
            'files', 'user_full_name', 'address', 'notes',
        ]

    def get_address(self, obj):
        parts = [obj.city, obj.street, obj.house]
        return ', '.join(filter(None, parts))


class NotificationSerializer(serializers.ModelSerializer):
    order = OrderListSerializer(read_only=True)

    class Meta:
        model = Notification
        fields = ['id', 'is_read', 'created_at', 'order']


class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = ['id', 'name', 'price']

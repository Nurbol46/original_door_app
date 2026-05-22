from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User, Shop


class RegisterSerializer(serializers.ModelSerializer):
    shop_name = serializers.CharField(write_only=True, required=False)
    password = serializers.CharField(write_only=True, required=True)
    access = serializers.SerializerMethodField(read_only=True)
    refresh = serializers.SerializerMethodField(read_only=True)
    user_id = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'shop_name', 'full_name', 'number', 'email', 'role', 'password', 'access', 'refresh', 'user_id']
        read_only_fields = ['id', 'role', 'access', 'refresh', 'user_id']

    def create(self, validated_data):
        shop_name = validated_data.pop('shop_name', 'Мой магазин')
        password = validated_data.pop('password')
        user = User.objects.create_user(
            username=validated_data['email'],
            full_name=validated_data['full_name'],
            number=validated_data['number'],
            email=validated_data['email'],
            role='user',
            password=password,
        )
        Shop.objects.create(
            user=user,
            name=shop_name,
            city='',
            street='',
            house_number='',
        )
        return user

    def get_access(self, obj):
        from rest_framework_simplejwt.tokens import RefreshToken
        return str(RefreshToken.for_user(obj).access_token)

    def get_refresh(self, obj):
        from rest_framework_simplejwt.tokens import RefreshToken
        return str(RefreshToken.for_user(obj))

    def get_user_id(self, obj):
        return obj.id


class ShopSerializer(serializers.ModelSerializer):
    class Meta:
        model = Shop
        fields = ['id', 'name', 'city', 'street', 'house_number']


class ProfileSerializer(serializers.ModelSerializer):
    shop = serializers.SerializerMethodField(read_only=True)
    shop_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    shop_city = serializers.CharField(write_only=True, required=False, allow_blank=True)
    shop_street = serializers.CharField(write_only=True, required=False, allow_blank=True)
    shop_house_number = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = [
            'id', 'full_name', 'number', 'email', 'role',
            'date_of_birth', 'avatar', 'shop',
            'shop_name', 'shop_city', 'shop_street', 'shop_house_number',
        ]

    def get_shop(self, obj):
        shop = Shop.objects.filter(user=obj).first()
        if not shop:
            return None
        return ShopSerializer(shop).data

    def update(self, instance, validated_data):
        shop_name = validated_data.pop('shop_name', None)
        shop_city = validated_data.pop('shop_city', None)
        shop_street = validated_data.pop('shop_street', None)
        shop_house_number = validated_data.pop('shop_house_number', None)

        instance.full_name = validated_data.get('full_name', instance.full_name)
        instance.number = validated_data.get('number', instance.number)
        instance.email = validated_data.get('email', instance.email)
        if 'email' in validated_data:
            instance.username = validated_data['email']
        if 'date_of_birth' in validated_data:
            instance.date_of_birth = validated_data['date_of_birth']
        if 'avatar' in validated_data:
            instance.avatar = validated_data['avatar']

        instance.save()

        shop, _ = Shop.objects.get_or_create(
            user=instance,
            defaults={
                'name': '',
                'city': '',
                'street': '',
                'house_number': '',
            },
        )

        if shop_name is not None:
            shop.name = shop_name
        if shop_city is not None:
            shop.city = shop_city
        if shop_street is not None:
            shop.street = shop_street
        if shop_house_number is not None:
            shop.house_number = shop_house_number

        shop.save()
        instance.save()
        return instance


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data['role'] = self.user.role
        data['full_name'] = self.user.full_name
        data['user_id'] = self.user.id
        return data

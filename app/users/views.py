from rest_framework import generics
from rest_framework.permissions import AllowAny
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from .serializers import CustomTokenObtainPairSerializer, ProfileSerializer, RegisterSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import User


class RegisterView(generics.CreateAPIView):
    """Регистрация нового пользователя."""
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]


class ProfileView(generics.RetrieveUpdateAPIView):
    """Просмотр и обновление профиля текущего пользователя."""
    serializer_class = ProfileSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_object(self):
        return self.request.user


class CustomTokenObtainPairView(TokenObtainPairView):
    """JWT токены + роль + имя пользователя."""
    serializer_class = CustomTokenObtainPairSerializer

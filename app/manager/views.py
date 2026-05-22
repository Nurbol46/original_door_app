from rest_framework import generics
from app.orders.permissions import IsManager
from app.orders.serializers import OrderListSerializer, OrderDetailSerializer, OrderFileSerializer, ServiceSerializer
from .serializers import ManagerOrderUpdateSerializer, ManagerUserSerializer
from app.orders.models import Order, OrderFile, Notification, Service
from app.users.models import User


class ManagerServiceListCreateView(generics.ListCreateAPIView):
    """Управление услугами: список и создание (только менеджер)."""
    serializer_class = ServiceSerializer
    permission_classes = [IsManager]
    queryset = Service.objects.all()


class ManagerServiceDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Просмотр, изменение и удаление услуги (только менеджер)."""
    serializer_class = ServiceSerializer
    permission_classes = [IsManager]
    queryset = Service.objects.all()


class ManagerOrderListView(generics.ListAPIView):
    """Список всех заявок, отсортирован по дате создания (только менеджер)."""
    serializer_class = OrderListSerializer
    permission_classes = [IsManager]

    def get_queryset(self):
        return Order.objects.all().order_by('-created_at')


class ManagerOrderDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Просмотр и обновление заявки (только менеджер).
    При изменении статуса или даты работы создаётся уведомление клиенту.
    """
    permission_classes = [IsManager]

    def get_queryset(self):
        return Order.objects.all()

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return ManagerOrderUpdateSerializer
        return OrderDetailSerializer

    def perform_update(self, serializer):
        obj = self.get_object()
        old_status = obj.status
        old_work_date = obj.work_date
        order = serializer.save()

        if old_status != order.status:
            Notification.objects.create(user=order.user, order=order)

        if old_work_date != order.work_date and order.work_date:
            Notification.objects.create(user=order.user, order=order)


class ManagerUserListView(generics.ListAPIView):
    """Список всех пользователей (только менеджер)."""
    serializer_class = ManagerUserSerializer
    permission_classes = [IsManager]

    def get_queryset(self):
        return User.objects.select_related().order_by('-date_joined')


class ManagerUserDetailView(generics.DestroyAPIView):
    """Удаление пользователя (только менеджер)."""
    serializer_class = ManagerUserSerializer
    permission_classes = [IsManager]

    def get_queryset(self):
        return User.objects.all()


class ManagerOrderFileView(generics.ListCreateAPIView):
    """Управление файлами заявки: список и загрузка (только менеджер)."""
    serializer_class = OrderFileSerializer
    permission_classes = [IsManager]

    def get_queryset(self):
        pk = self.kwargs.get('pk')
        return OrderFile.objects.filter(order__id=pk)

    def perform_create(self, serializer):
        pk = self.kwargs.get('pk')
        order = Order.objects.get(pk=pk)
        serializer.save(order=order, uploaded_by=self.request.user)

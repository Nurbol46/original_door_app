from django.urls import path
from .views import (
    ManagerOrderFileView,
    ManagerOrderListView,
    ManagerOrderDetailView,
    ManagerUserDetailView,
    ManagerUserListView,
    ManagerServiceListCreateView,
    ManagerServiceDetailView,
)

urlpatterns = [
    path('orders/', ManagerOrderListView.as_view(), name='manager-order-list'),
    path('orders/<int:pk>/', ManagerOrderDetailView.as_view(), name='manager-order-detail'),
    path('orders/<int:pk>/files/', ManagerOrderFileView.as_view(), name='manager-order-file-list-create'),
    path('users/', ManagerUserListView.as_view(), name='manager-user-list'),
    path('users/<int:pk>/', ManagerUserDetailView.as_view(), name='manager-user-detail'),
    path('services/', ManagerServiceListCreateView.as_view(), name='manager-service-list-create'),
    path('services/<int:pk>/', ManagerServiceDetailView.as_view(), name='manager-service-detail'),
]

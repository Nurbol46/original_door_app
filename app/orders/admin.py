from django.contrib import admin
from .models import Order, OrderFile, Notification, Service


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('order_number', 'user', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('order_number', 'user__email')


@admin.register(OrderFile)
class OrderFileAdmin(admin.ModelAdmin):
    list_display = ('order', 'uploaded_by', 'uploaded_at')


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('user', 'order', 'is_read', 'created_at')
    list_filter = ('is_read', 'created_at')


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ('name', 'price')

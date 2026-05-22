from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin
from django.contrib.auth.forms import UserChangeForm, UserCreationForm
from django.utils.html import format_html
from .models import User, Shop


class CustomUserCreationForm(UserCreationForm):
    class Meta(UserCreationForm.Meta):
        model = User
        fields = ('email', 'username', 'full_name', 'number', 'date_of_birth', 'avatar', 'role')


class CustomUserChangeForm(UserChangeForm):
    class Meta(UserChangeForm.Meta):
        model = User
        fields = '__all__'


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    model = User
    form = CustomUserChangeForm
    add_form = CustomUserCreationForm
    ordering = ('email',)
    list_display = ('email', 'full_name', 'role', 'date_of_birth', 'avatar_preview', 'is_staff', 'is_active')
    list_filter = ('role', 'is_staff', 'is_active')
    search_fields = ('email', 'username', 'full_name', 'number')
    readonly_fields = ('avatar_preview',)

    fieldsets = (
        (None, {'fields': ('email', 'username', 'password')}),
        ('Personal info', {'fields': ('full_name', 'number', 'date_of_birth', 'avatar', 'avatar_preview', 'role')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )

    add_fieldsets = (
        (
            None,
            {
                'classes': ('wide',),
                'fields': (
                    'email',
                    'username',
                    'full_name',
                    'number',
                    'date_of_birth',
                    'avatar',
                    'role',
                    'password1',
                    'password2',
                ),
            },
        ),
    )

    def avatar_preview(self, obj):
        if not obj or not obj.avatar:
            return 'Нет аватара'
        return format_html(
            '<img src="{}" style="width: 48px; height: 48px; object-fit: cover; border-radius: 12px;" />',
            obj.avatar.url,
        )

    avatar_preview.short_description = 'Аватар'


@admin.register(Shop)
class ShopAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'city', 'street', 'house_number')
    search_fields = ('name', 'user__email', 'user__full_name', 'city', 'street', 'house_number')

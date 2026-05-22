from rest_framework import generics, exceptions, filters
from rest_framework.permissions import AllowAny
from django.http import HttpResponse
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import HexColor
from reportlab.lib.utils import simpleSplit
from .serializers import (
    OrderCreateSerializer, OrderListSerializer, OrderDetailSerializer,
    OrderFileSerializer, NotificationSerializer, ServiceSerializer,
)
from .models import Order, OrderFile, Service, Notification
from rest_framework.views import APIView
from rest_framework.response import Response

_PDF_FONTS_READY = False


def _ensure_pdf_fonts():
    global _PDF_FONTS_READY
    if _PDF_FONTS_READY:
        return

    # DejaVu Sans supports Cyrillic, so the downloaded PDF stays readable.
    regular_font = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
    bold_font = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'

    pdfmetrics.registerFont(TTFont('DejaVuSans', regular_font))
    pdfmetrics.registerFont(TTFont('DejaVuSans-Bold', bold_font))
    _PDF_FONTS_READY = True


def _format_price(value):
    text = f"{value:.2f}".rstrip('0').rstrip('.')
    return f"{text} тг."


def _draw_pdf_header(pdf):
    pdf.setFillColor(HexColor('#111827'))
    pdf.setFont('DejaVuSans-Bold', 18)
    pdf.drawString(50, 800, 'Прайс-лист')

    pdf.setFillColor(HexColor('#6b7280'))
    pdf.setFont('DejaVuSans', 10)
    pdf.drawString(50, 784, 'Актуальные услуги и цены')

    pdf.setStrokeColor(HexColor('#e5e7eb'))
    pdf.line(50, 772, 545, 772)


def _new_price_page(pdf):
    pdf.showPage()
    _draw_pdf_header(pdf)


class OrderListCreateView(generics.ListCreateAPIView):
    """Список заявок пользователя и создание новой. Поиск по номеру заявки."""
    filter_backends = [filters.SearchFilter]
    search_fields = ['order_number']

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).order_by('-created_at')

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return OrderCreateSerializer
        return OrderListSerializer


class OrderDetailView(generics.RetrieveAPIView):
    """Полная информация о заявке пользователя."""
    serializer_class = OrderDetailSerializer

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user)


class OrderFileView(generics.ListCreateAPIView):
    """Управление файлами заявки: список и загрузка."""
    serializer_class = OrderFileSerializer

    def get_queryset(self):
        pk = self.kwargs.get('pk')
        return OrderFile.objects.filter(order__id=pk, order__user=self.request.user)

    def perform_create(self, serializer):
        pk = self.kwargs.get('pk')
        try:
            order = Order.objects.get(id=pk, user=self.request.user)
            serializer.save(order=order, uploaded_by=self.request.user)
        except Order.DoesNotExist:
            raise exceptions.NotFound(detail="Order not found.")


class NotificationListView(generics.ListAPIView):
    """Все уведомления пользователя, новые первыми."""
    serializer_class = NotificationSerializer

    def get_queryset(self):
        return self.request.user.notifications.all().order_by('-created_at')


class NotificationReadView(generics.UpdateAPIView):
    """Отметить уведомление как прочитанное."""
    serializer_class = NotificationSerializer

    def get_queryset(self):
        return self.request.user.notifications.filter(is_read=False)

    def perform_update(self, serializer):
        serializer.save(is_read=True)


class ServiceListView(generics.ListAPIView):
    """Публичный список всех услуг с ценами."""
    serializer_class = ServiceSerializer
    queryset = Service.objects.all()
    permission_classes = [AllowAny]


class ServicePDFView(generics.GenericAPIView):
    """Скачивание прайс-листа в формате PDF."""
    serializer_class = ServiceSerializer
    permission_classes = [AllowAny]

    def get(self, request):
        _ensure_pdf_fonts()

        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename="price_list.pdf"'
        p = canvas.Canvas(response)
        p.setTitle('Прайс-лист PRO Монтаж')
        _draw_pdf_header(p)

        services = Service.objects.all()
        y = 744

        for service in services:
            name_lines = simpleSplit(service.name, 'DejaVuSans', 12, 340) or ['Без названия']
            row_height = max(24, 18 * len(name_lines))

            if y - row_height < 80:
                _new_price_page(p)
                y = 744

            p.setFillColor(HexColor('#111827'))
            p.setFont('DejaVuSans', 12)
            for index, line in enumerate(name_lines):
                p.drawString(50, y - (index * 16), line)

            p.setFillColor(HexColor('#991b1b'))
            p.setFont('DejaVuSans-Bold', 12)
            p.drawRightString(545, y, _format_price(service.price))

            y -= row_height
            p.setStrokeColor(HexColor('#f1f5f9'))
            p.line(50, y - 8, 545, y - 8)
            y -= 18

        p.save()
        return response


class HasNewNotificationView(APIView):
    """Проверить наличие непрочитанных уведомлений."""

    def get(self, request):
        has_new = Notification.objects.filter(user=request.user, is_read=False).exists()
        return Response({"has_new": has_new})

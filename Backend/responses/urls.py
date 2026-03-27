from django.urls import path
from .views import ResponseCreateView

urlpatterns = [
    path('', ResponseCreateView.as_view(), name='create-response'),
]
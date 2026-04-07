from django.urls import path
from .views import questionnaire_analysis

urlpatterns = [
    path('<int:questionnaire_id>/', questionnaire_analysis, name='questionnaire-analysis'),
]
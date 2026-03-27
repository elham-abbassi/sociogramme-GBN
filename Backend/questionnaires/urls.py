from django.urls import path
from .views import QuestionnaireListView, QuestionnaireDetailView

urlpatterns = [
    path('', QuestionnaireListView.as_view(), name='questionnaire-list'),
    path('<int:pk>/', QuestionnaireDetailView.as_view(), name='questionnaire-detail'),
]
from django.urls import path
from .views import QuestionnaireListView, QuestionnaireDetailView, create_questionnaire

urlpatterns = [
    path('', QuestionnaireListView.as_view(), name='questionnaire-list'),
    path('<int:pk>/', QuestionnaireDetailView.as_view(), name='questionnaire-detail'),
    path('create/', create_questionnaire, name='questionnaire-create'),
]
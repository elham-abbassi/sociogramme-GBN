from django.urls import path
from .views import QuestionnaireListView, QuestionnaireDetailView, create_questionnaire, import_participants, get_departments

urlpatterns = [
    path('', QuestionnaireListView.as_view(), name='questionnaire-list'),
    path('<int:pk>/', QuestionnaireDetailView.as_view(), name='questionnaire-detail'),
    path('create/', create_questionnaire, name='questionnaire-create'),
    path('import-participants/', import_participants, name='import-participants'),
    path('departments/', get_departments, name='get-departments'),
]
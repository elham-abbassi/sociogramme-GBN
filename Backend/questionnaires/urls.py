from django.urls import path
from .views import (
    QuestionnaireListView, QuestionnaireDetailView,
    create_questionnaire, update_questionnaire, delete_questionnaire,
    clear_questionnaire_responses, import_participants, get_departments,
    permanent_staff, permanent_staff_detail,
)

urlpatterns = [
    path('', QuestionnaireListView.as_view(), name='questionnaire-list'),
    path('<int:pk>/', QuestionnaireDetailView.as_view(), name='questionnaire-detail'),
    path('create/', create_questionnaire, name='questionnaire-create'),
    path('<int:pk>/update/', update_questionnaire, name='questionnaire-update'),
    path('<int:pk>/delete/', delete_questionnaire, name='questionnaire-delete'),
    path('<int:pk>/clear-responses/', clear_questionnaire_responses, name='questionnaire-clear-responses'),
    path('import-participants/', import_participants, name='import-participants'),
    path('departments/', get_departments, name='get-departments'),
    path('permanent-staff/', permanent_staff, name='permanent-staff'),
    path('permanent-staff/<int:pk>/', permanent_staff_detail, name='permanent-staff-detail'),
]
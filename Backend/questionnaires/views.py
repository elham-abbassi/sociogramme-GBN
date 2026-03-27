from rest_framework import generics
from .models import Questionnaire
from .serializers import QuestionnaireSerializer


class QuestionnaireListView(generics.ListAPIView):
    queryset = Questionnaire.objects.all()
    serializer_class = QuestionnaireSerializer


class QuestionnaireDetailView(generics.RetrieveAPIView):
    queryset = Questionnaire.objects.all()
    serializer_class = QuestionnaireSerializer


    
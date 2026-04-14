from rest_framework import generics, status
from .models import Questionnaire
from .serializers import QuestionnaireSerializer, QuestionnaireCreateSerializer
from rest_framework.decorators import api_view
from rest_framework.response import Response


class QuestionnaireListView(generics.ListAPIView):
    queryset = Questionnaire.objects.all()
    serializer_class = QuestionnaireSerializer


class QuestionnaireDetailView(generics.RetrieveAPIView):
    queryset = Questionnaire.objects.all()
    serializer_class = QuestionnaireSerializer

@api_view(['POST'])
def create_questionnaire(request):
    serializer = QuestionnaireCreateSerializer(data=request.data)

    if serializer.is_valid():
        questionnaire = serializer.save()
        return Response(
            {"message": "Questionnaire créé", "id": questionnaire.id},
            status=status.HTTP_201_CREATED
        )

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
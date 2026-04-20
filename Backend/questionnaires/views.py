from rest_framework import generics, status
from .models import Questionnaire, OptionGroup, ChoiceOption
from .serializers import QuestionnaireSerializer, QuestionnaireCreateSerializer
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
import openpyxl


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


@api_view(['GET'])
def get_departments(_request):
    group = OptionGroup.objects.filter(name="Departement").first()
    if not group:
        return Response([], status=status.HTTP_200_OK)
    departments = list(
        ChoiceOption.objects.filter(option_group=group).values_list('label', flat=True)
    )
    return Response(departments, status=status.HTTP_200_OK)


@api_view(['POST'])
@parser_classes([MultiPartParser])
def import_participants(request):
    file = request.FILES.get('file')

    if not file:
        return Response({"error": "Aucun fichier fourni."}, status=status.HTTP_400_BAD_REQUEST)

    if not file.name.endswith('.xlsx'):
        return Response({"error": "Le fichier doit être au format .xlsx"}, status=status.HTTP_400_BAD_REQUEST)

    # Read names from Excel (first column, skip empty rows)
    try:
        wb = openpyxl.load_workbook(file)
        ws = wb.active
        names = []
        for row in ws.iter_rows(min_row=1, values_only=True):
            value = row[0]
            if value and str(value).strip():
                names.append(str(value).strip())
    except Exception as e:
        return Response({"error": f"Erreur de lecture du fichier: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

    if not names:
        return Response({"error": "Aucun nom trouvé dans le fichier."}, status=status.HTTP_400_BAD_REQUEST)

    # Use the "Staffs" group if it exists, otherwise fall back to "Participants"
    group = OptionGroup.objects.filter(name="Staffs").first()
    if not group:
        group, _ = OptionGroup.objects.get_or_create(name="Participants")

    # Keep permanent people, replace the rest
    ChoiceOption.objects.filter(option_group=group, is_permanent=False).delete()

    # Don't re-add names that are already in the permanent list
    permanent_names = set(
        ChoiceOption.objects.filter(option_group=group, is_permanent=True)
        .values_list('label', flat=True)
    )
    added = 0
    for name in names:
        if name not in permanent_names:
            ChoiceOption.objects.create(option_group=group, label=name)
            added += 1

    total = ChoiceOption.objects.filter(option_group=group).count()
    return Response({
        "message": f"{added} participants importés, {len(permanent_names)} permanents conservés. Total : {total}.",
        "count": total,
    }, status=status.HTTP_200_OK)
    
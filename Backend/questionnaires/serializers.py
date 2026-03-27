from rest_framework import serializers
from .models import Questionnaire, Question, ChoiceOption


class ChoiceOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChoiceOption
        fields = ['id', 'label']


class QuestionSerializer(serializers.ModelSerializer):
    options = ChoiceOptionSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = ['id', 'text', 'type', 'required', 'options']


class QuestionnaireSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)

    class Meta:
        model = Questionnaire
        fields = ['id', 'title', 'description', 'created_at', 'questions']
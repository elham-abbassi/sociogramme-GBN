from rest_framework import serializers
from .models import Questionnaire, Question, ChoiceOption, OptionGroup


class ChoiceOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChoiceOption
        fields = ['id', 'label']


class QuestionSerializer(serializers.ModelSerializer):
    options = serializers.SerializerMethodField()

    class Meta:
        model = Question
        fields = ['id', 'text', 'type', 'required', 'display_mode', 'options']

    def get_options(self, obj):
        if obj.option_group:
            return ChoiceOptionSerializer(obj.option_group.options.all(), many=True).data
        return []


class QuestionnaireSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)

    class Meta:
        model = Questionnaire
        fields = ['id', 'title', 'description', 'created_at', 'questions']
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


class QuestionCreateSerializer(serializers.Serializer):
    text = serializers.CharField()
    type = serializers.CharField()
    required = serializers.BooleanField(default=True)
    options = serializers.ListField(
        child=serializers.CharField(), required=False
    )


class QuestionnaireCreateSerializer(serializers.Serializer):
    title = serializers.CharField()
    description = serializers.CharField(required=False)
    questions = QuestionCreateSerializer(many=True)

    def create(self, validated_data):
        questions_data = validated_data.pop("questions")

        questionnaire = Questionnaire.objects.create(**validated_data)

        for q in questions_data:
            options = q.pop("options", [])

            question = Question.objects.create(
                questionnaire=questionnaire,
                **q
            )

            # Si question à choix → créer OptionGroup + options
            if question.type in ["single_choice", "multiple_choice"] and options:
                group = OptionGroup.objects.create(name=f"group_{question.id}")

                question.option_group = group
                question.save()

                for opt in options:
                    ChoiceOption.objects.create(
                        option_group=group,
                        label=opt
                    )

        return questionnaire        
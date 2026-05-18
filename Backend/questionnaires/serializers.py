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
        fields = ['id', 'text', 'type', 'required', 'display_mode', 'options',
                  'condition_question', 'condition_value']

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
    id = serializers.IntegerField(required=False)  # present when editing an existing question
    text = serializers.CharField()
    type = serializers.CharField()
    required = serializers.BooleanField(default=True)
    options = serializers.ListField(child=serializers.CharField(), required=False)
    condition_question_index = serializers.IntegerField(required=False, default=-1)
    condition_value = serializers.CharField(required=False, allow_blank=True, default="")


class QuestionnaireCreateSerializer(serializers.Serializer):
    title = serializers.CharField()
    description = serializers.CharField(required=False, allow_blank=True)
    questions = QuestionCreateSerializer(many=True)

    def create(self, validated_data):
        questions_data = validated_data.pop("questions")
        questionnaire = Questionnaire.objects.create(**validated_data)

        created_questions = []
        for q in questions_data:
            options = q.pop("options", [])
            condition_index = q.pop("condition_question_index", -1)
            condition_value = q.pop("condition_value", "")

            question = Question.objects.create(questionnaire=questionnaire, **q)

            # Attach options for choice questions
            if question.type in ["single_choice", "multiple_choice"] and options:
                group = OptionGroup.objects.create(name=f"group_{question.id}")
                question.option_group = group
                question.save()
                for opt in options:
                    ChoiceOption.objects.create(option_group=group, label=opt)

            created_questions.append((question, condition_index, condition_value))

        # Second pass: resolve condition_question_index → actual Question FK
        for question, condition_index, condition_value in created_questions:
            if 0 <= condition_index < len(created_questions):
                trigger_question = created_questions[condition_index][0]
                question.condition_question = trigger_question
                question.condition_value = condition_value
                question.save()

        return questionnaire


def _sync_options(question, options):
    """Replace the options for a choice question."""
    if question.option_group:
        question.option_group.options.all().delete()
        group = question.option_group
    else:
        group = OptionGroup.objects.create(name=f"group_{question.id}")
        question.option_group = group
        question.save()
    for opt in options:
        ChoiceOption.objects.create(option_group=group, label=opt)


class QuestionnaireUpdateSerializer(serializers.Serializer):
    title = serializers.CharField()
    description = serializers.CharField(required=False, allow_blank=True)
    questions = QuestionCreateSerializer(many=True)

    def update(self, instance, validated_data):
        instance.title = validated_data.get("title", instance.title)
        instance.description = validated_data.get("description", instance.description)
        instance.save()

        questions_data = validated_data.pop("questions")
        submitted_ids = [q["id"] for q in questions_data if "id" in q]

        # Delete questions removed by the admin (only if they had an id before)
        instance.questions.exclude(id__in=submitted_ids).delete()

        saved_questions = []
        for order, q in enumerate(questions_data):
            qid = q.pop("id", None)
            options = q.pop("options", [])
            condition_index = q.pop("condition_question_index", -1)
            condition_value = q.pop("condition_value", "")

            if qid:
                question = Question.objects.get(id=qid, questionnaire=instance)
                question.text = q["text"]
                question.type = q["type"]
                question.required = q.get("required", True)
                question.order = order
                question.condition_question = None
                question.condition_value = ""
                question.save()
            else:
                question = Question.objects.create(questionnaire=instance, order=order, **q)

            if question.type in ["single_choice", "multiple_choice"] and options:
                _sync_options(question, options)
            elif question.option_group and question.type not in ["single_choice", "multiple_choice"]:
                question.option_group.options.all().delete()

            saved_questions.append((question, condition_index, condition_value))

        # Resolve condition indexes
        for question, condition_index, condition_value in saved_questions:
            if 0 <= condition_index < len(saved_questions):
                question.condition_question = saved_questions[condition_index][0]
                question.condition_value = condition_value
                question.save()

        return instance

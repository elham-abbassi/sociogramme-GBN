from rest_framework import serializers
from .models import Response, Answer


class AnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Answer
        fields = ['question', 'value']


class ResponseSerializer(serializers.ModelSerializer):
    answers = AnswerSerializer(many=True)

    class Meta:
        model = Response
        fields = ["id", "questionnaire", "respondent_name", "department", "answers"]

    def create(self, validated_data):
        answers_data = validated_data.pop('answers')
        response = Response.objects.create(**validated_data)

        for answer_data in answers_data:
            Answer.objects.create(response=response, **answer_data)

        return response
from django.db import models
from questionnaires.models import Questionnaire, Question


class Response(models.Model):
    questionnaire = models.ForeignKey(
        Questionnaire,
        on_delete=models.CASCADE,
        related_name='responses'
    )
    submitted_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Response {self.id} - {self.questionnaire.title}"


class Answer(models.Model):
    response = models.ForeignKey(
        Response,
        on_delete=models.CASCADE,
        related_name='answers'
    )
    question = models.ForeignKey(
        Question,
        on_delete=models.CASCADE,
        related_name='answers'
    )
    value = models.TextField()

    def __str__(self):
        return f"Answer to {self.question.text}"

from django.db import models
from questionnaires.models import Questionnaire, Question


class Response(models.Model):
    questionnaire = models.ForeignKey(
        Questionnaire,
        on_delete=models.CASCADE,
        related_name='responses'
    )
    respondent_name = models.CharField(max_length=255, blank=True, default="")
    department = models.CharField(max_length=255, blank=True, default="")
    submitted_at = models.DateTimeField(auto_now_add=True)

def __str__(self):
    return f"{self.respondent_name} - {self.questionnaire.title}"   


class Answer(models.Model):
    response = models.ForeignKey(
        Response,
        on_delete=models.CASCADE,
        related_name='answers'
    )
    question = models.ForeignKey(
        Question,
        on_delete=models.CASCADE,
    )
    value = models.TextField()

    def __str__(self):
        return f"{self.question.text} -> {self.value}"


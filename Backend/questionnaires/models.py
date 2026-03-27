from django.db import models


class Questionnaire(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class Question(models.Model):
    QUESTION_TYPES = [
        ('text', 'Text'),
        ('number', 'Number'),
        ('single_choice', 'Single Choice'),
        ('multiple_choice', 'Multiple Choice'),
    ]

    questionnaire = models.ForeignKey(
        Questionnaire,
        on_delete=models.CASCADE,
        related_name='questions'
    )

    text = models.TextField()
    type = models.CharField(max_length=50, choices=QUESTION_TYPES)
    required = models.BooleanField(default=True)

    def __str__(self):
        return self.text


class ChoiceOption(models.Model):
    question = models.ForeignKey(
        Question,
        on_delete=models.CASCADE,
        related_name='options'
    )

    label = models.CharField(max_length=255)

    def __str__(self):
        return self.label
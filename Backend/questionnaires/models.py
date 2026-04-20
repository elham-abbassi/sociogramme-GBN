from django.db import models


class Questionnaire(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class OptionGroup(models.Model):
    name = models.CharField(max_length=255, unique=True)

    def __str__(self):
        return self.name
    
class Question(models.Model):
    order = models.PositiveIntegerField(default=0)
    class Meta:
            ordering = ['order']

    QUESTION_TYPES = [
        ('text', 'Text'),
        ('number', 'Number'),
        ('single_choice', 'Single Choice'),
        ('multiple_choice', 'Multiple Choice'),
        ('person_choice', 'Person Choice'),
       
    ]

    DISPLAY_MODES = [
        ('default', 'Default'),
        ('checkbox', 'Checkbox'),
        ('multi_select', 'Multi Select'),
    ]
    

    questionnaire = models.ForeignKey(
        Questionnaire,
        on_delete=models.CASCADE,
        related_name='questions'
    )

    text = models.TextField()
    type = models.CharField(max_length=50, choices=QUESTION_TYPES)
    required = models.BooleanField(default=True)
    display_mode = models.CharField(
        max_length=50,
        choices=DISPLAY_MODES,
        default='default',
        blank=True
    )
    
    option_group = models.ForeignKey(
        OptionGroup,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='questions'
    )

    def __str__(self):
        return self.text
        

class ChoiceOption(models.Model):
    option_group = models.ForeignKey(
        OptionGroup,
        on_delete=models.CASCADE,
        related_name='options'
    )

    label = models.CharField(max_length=255)
    department = models.CharField(max_length=255, blank=True)
    is_permanent = models.BooleanField(default=False)

    def __str__(self):
        return self.label
    


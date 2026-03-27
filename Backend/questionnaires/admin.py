from django.contrib import admin
from .models import Questionnaire, Question, ChoiceOption

admin.site.register(Questionnaire)
admin.site.register(Question)
admin.site.register(ChoiceOption)
from django.contrib import admin
from .models import Questionnaire, Question, ChoiceOption, OptionGroup


class ChoiceOptionInline(admin.TabularInline):
    model = ChoiceOption
    extra = 1


class QuestionInline(admin.TabularInline):
    model = Question
    extra = 1
    ordering = ['order']


@admin.register(Questionnaire)
class QuestionnaireAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "description", "created_at")
    search_fields = ("title", "description")
    inlines = [QuestionInline]


@admin.register(OptionGroup)
class OptionGroupAdmin(admin.ModelAdmin):
    list_display = ("id", "name")
    search_fields = ("name",)
    inlines = [ChoiceOptionInline]


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ("id", "text", "questionnaire", "type", "display_mode", "required", "option_group")
    list_filter = ("type", "display_mode", "required", "questionnaire", "option_group")
    search_fields = ("text",)


@admin.register(ChoiceOption)
class ChoiceOptionAdmin(admin.ModelAdmin):
    list_display = ("id", "label", "option_group")
    list_filter = ("option_group",)
    search_fields = ("label",)



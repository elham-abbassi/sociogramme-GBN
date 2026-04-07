from collections import Counter
from django.http import JsonResponse
from questionnaires.models import Questionnaire
from responses.models import Answer
import json

def questionnaire_analysis(request, questionnaire_id):
    try:
        questionnaire = Questionnaire.objects.get(id=questionnaire_id)
    except Questionnaire.DoesNotExist:
        return JsonResponse({"error": "Questionnaire not found"}, status=404)

    results = {
        "questionnaire_id": questionnaire.id,
        "title": questionnaire.title,
        "questions": []
    }

    for question in questionnaire.questions.all():
        answers = Answer.objects.filter(question=question)

        question_result = {
            "question_id": question.id,
            "question_text": question.text,
            "question_type": question.type,
            "total_answers": answers.count(),
        }

        # Text / single_choice 
        if question.type in ["text", "single_choice"]:
            values = [a.value for a in answers if a.value]

            counts = Counter(values)
            total = len(values)

            distribution = []
            for value, count in counts.items():
                percentage = (count / total * 100) if total > 0 else 0
                distribution.append({
                    "value": value,
                    "count": count,
                    "percentage": round(percentage, 2)
                })

            question_result["distribution"] = distribution

         # multiple_choice
        elif question.type == "multiple_choice":
            all_selected_options = []

            for a in answers:
                if a.value:
                    try:
                        parsed = json.loads(a.value)
                        if isinstance(parsed, list):
                            all_selected_options.extend(parsed)
                    except json.JSONDecodeError:
                        pass

            counts = Counter(all_selected_options)
            total = len(all_selected_options)

            distribution = []
            for value, count in counts.items():
                percentage = (count / total * 100) if total > 0 else 0
                distribution.append({
                    "value": value,
                    "count": count,
                    "percentage": round(percentage, 2)
                })

            question_result["distribution"] = distribution

        # Number
        elif question.type == "number":
            numeric_values = []
            for a in answers:
                try:
                    numeric_values.append(float(a.value))
                except (TypeError, ValueError):
                    pass

            if numeric_values:
                question_result["statistics"] = {
                    "count": len(numeric_values),
                    "mean": round(sum(numeric_values) / len(numeric_values), 2),
                    "min": min(numeric_values),
                    "max": max(numeric_values),
                }
            else:
                question_result["statistics"] = {
                    "count": 0,
                    "mean": None,
                    "min": None,
                    "max": None,
                }

        results["questions"].append(question_result)

    return JsonResponse(results, safe=False)
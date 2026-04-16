from collections import Counter
from django.http import JsonResponse
from questionnaires.models import Questionnaire, ChoiceOption
from responses.models import Answer, Response
import json


def questionnaire_analysis(request, questionnaire_id):
    try:
        questionnaire = Questionnaire.objects.get(id=questionnaire_id)
    except Questionnaire.DoesNotExist:
        return JsonResponse({"error": "Questionnaire not found"}, status=404)

    results = {
        "questionnaire_id": questionnaire.id,
        "title": questionnaire.title,
        "questions": [],
    }

    # --- Per-question analysis ---
    for question in questionnaire.questions.all():
        answers = Answer.objects.filter(question=question)

        question_result = {
            "question_id": question.id,
            "question_text": question.text,
            "question_type": question.type,
            "total_answers": answers.count(),
        }

        if question.type in ["text", "single_choice", "person_choice"]:
            values = [a.value for a in answers if a.value]
            counts = Counter(values)
            total = len(values)
            distribution = []
            for value, count in counts.items():
                percentage = (count / total * 100) if total > 0 else 0
                distribution.append({
                    "value": value,
                    "count": count,
                    "percentage": round(percentage, 2),
                })
            question_result["distribution"] = distribution

        elif question.type == "multiple_choice":
            all_selected = []
            for a in answers:
                if a.value:
                    try:
                        parsed = json.loads(a.value)
                        if isinstance(parsed, list):
                            all_selected.extend(parsed)
                    except json.JSONDecodeError:
                        pass
            counts = Counter(all_selected)
            total = len(all_selected)
            distribution = []
            for value, count in counts.items():
                percentage = (count / total * 100) if total > 0 else 0
                distribution.append({
                    "value": value,
                    "count": count,
                    "percentage": round(percentage, 2),
                })
            question_result["distribution"] = distribution

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
                    "count": 0, "mean": None, "min": None, "max": None,
                }

        results["questions"].append(question_result)

    # --- Sociogram data ---
    # Build name → department map from ChoiceOptions (which store employee info)
    name_to_dept = {}
    for opt in ChoiceOption.objects.all():
        if opt.department:
            name_to_dept[opt.label] = opt.department

    responses = Response.objects.filter(
        questionnaire=questionnaire
    ).prefetch_related("answers__question")

    nodes = {}  # name → {id, department}
    edges = {}  # "source||target" → {source, target, weight}

    for response in responses:
        respondent = (response.respondent_name or "").strip()
        dept = (response.department or "").strip()

        if respondent:
            # Respondent's own department overrides ChoiceOption department
            nodes[respondent] = {
                "id": respondent,
                "department": dept or name_to_dept.get(respondent, ""),
            }
            if dept:
                name_to_dept[respondent] = dept

        for answer in response.answers.all():
            q = answer.question
            # Only build edges for questions where people choose other people
            if q.type in ["multiple_choice", "person_choice"] and answer.value:
                try:
                    chosen = json.loads(answer.value)
                    if not isinstance(chosen, list):
                        continue
                    for target in chosen:
                        target = target.strip()
                        if not target or not respondent:
                            continue
                        # Add target node if not seen yet
                        if target not in nodes:
                            nodes[target] = {
                                "id": target,
                                "department": name_to_dept.get(target, ""),
                            }
                        # Add or increment edge
                        edge_key = f"{respondent}||{target}"
                        if edge_key not in edges:
                            edges[edge_key] = {
                                "source": respondent,
                                "target": target,
                                "weight": 0,
                            }
                        edges[edge_key]["weight"] += 1
                except (json.JSONDecodeError, TypeError):
                    pass

    # Fill in departments for nodes that were chosen but never responded
    for node_id, node in nodes.items():
        if not node["department"] and node_id in name_to_dept:
            node["department"] = name_to_dept[node_id]

    # --- Department interaction matrix ---
    dept_matrix = {}
    for edge in edges.values():
        src_dept = nodes.get(edge["source"], {}).get("department", "") or "Inconnu"
        tgt_dept = nodes.get(edge["target"], {}).get("department", "") or "Inconnu"
        key = (src_dept, tgt_dept)
        dept_matrix[key] = dept_matrix.get(key, 0) + edge["weight"]

    results["sociogram"] = {
        "nodes": list(nodes.values()),
        "edges": list(edges.values()),
    }

    results["department_interactions"] = [
        {"from": k[0], "to": k[1], "count": v}
        for k, v in dept_matrix.items()
    ]

    return JsonResponse(results, safe=False)

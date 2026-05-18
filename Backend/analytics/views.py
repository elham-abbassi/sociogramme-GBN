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
    # Build label → {department, group} map from ALL ChoiceOptions dynamically
    # Keys stored lowercase for case-insensitive matching
    name_to_dept = {}       # lowercase label → department
    name_to_group = {}      # lowercase label → group name
    name_to_permanent = {}  # lowercase label → is_permanent (True/False)
    label_canonical = {}    # lowercase → original-case label (for display)
    for opt in ChoiceOption.objects.select_related("option_group").all():
        key = opt.label.strip().lower()
        name_to_group[key] = opt.option_group.name
        name_to_permanent[key] = opt.is_permanent
        label_canonical[key] = opt.label.strip()
        if opt.department:
            name_to_dept[key] = opt.department

    def lookup_group(name):
        return name_to_group.get(name.lower(), "Répondant")

    def lookup_dept(name, fallback=""):
        return name_to_dept.get(name.lower(), fallback)

    def lookup_permanent(name):
        # Returns True/False for known ChoiceOption entries, None for pure respondents
        return name_to_permanent.get(name.lower(), None)

    responses = Response.objects.filter(
        questionnaire=questionnaire
    ).prefetch_related("answers__question")

    nodes = {}  # name → {id, department, group}
    edges = {}  # "source||target" → {source, target, weight}

    for response in responses:
        respondent = (response.respondent_name or "").strip()
        dept = (response.department or "").strip()

        if respondent:
            if respondent not in nodes:
                nodes[respondent] = {
                    "id": respondent,
                    "department": dept or lookup_dept(respondent),
                    "group": lookup_group(respondent),
                    "is_permanent": lookup_permanent(respondent),
                    "attributes": {},
                }
            if dept:
                name_to_dept[respondent.lower()] = dept

                # Add a department node (if not already there)
                if dept not in nodes:
                    nodes[dept] = {
                        "id": dept,
                        "department": dept,
                        "group": lookup_group(dept) or "Département",
                        "is_permanent": None,
                        "attributes": {},
                    }

                # Membership edge: respondent → their department (dashed in frontend)
                edge_key = f"{respondent}||dept::{dept}"
                if edge_key not in edges:
                    edges[edge_key] = {
                        "source": respondent,
                        "target": dept,
                        "weight": 1,
                        "type": "membership",
                    }

        for answer in response.answers.all():
            q = answer.question
            # Single-choice answers → node attributes (keyed by OptionGroup name)
            if q.type == "single_choice" and answer.value and respondent in nodes:
                attr_key = q.option_group.name if q.option_group else q.text
                nodes[respondent]["attributes"][attr_key] = answer.value

            if q.type in ["multiple_choice", "person_choice"] and answer.value:
                try:
                    chosen = json.loads(answer.value)
                    if not isinstance(chosen, list):
                        continue
                    for target in chosen:
                        target = target.strip()
                        if not target or not respondent:
                            continue
                        if target not in nodes:
                            nodes[target] = {
                                "id": target,
                                "department": lookup_dept(target),
                                "group": name_to_group.get(target.lower(), "Inconnu"),
                                "is_permanent": lookup_permanent(target),
                                "attributes": {},
                            }
                        edge_key = f"{respondent}||{target}"
                        if edge_key not in edges:
                            edges[edge_key] = {
                                "source": respondent,
                                "target": target,
                                "weight": 0,
                                "type": "choice",
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

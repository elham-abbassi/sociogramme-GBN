import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../services/api";
import Select from "react-select";
import Navbar from "../components/Navbar";

function QuestionnairePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [questionnaire, setQuestionnaire] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});

  const respondentName = localStorage.getItem("respondentName") || "";
  const respondentDepartment = localStorage.getItem("respondentDepartment") || "";

  useEffect(() => {
    api.get(`/questionnaires/${id}/`)
      .then((res) => setQuestionnaire(res.data))
      .catch((err) => console.error("Erreur lors du chargement du questionnaire:", err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <><Navbar /><p className="loading">Chargement...</p></>;
  if (!questionnaire) return <><Navbar /><p className="error">Questionnaire introuvable.</p></>;

  const handleChange = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleCheckboxChange = (questionId, optionLabel, checked) => {
    setAnswers((prev) => {
      const current = prev[questionId] || [];
      return {
        ...prev,
        [questionId]: checked
          ? [...current, optionLabel]
          : current.filter((item) => item !== optionLabel),
      };
    });
  };

  const handleMultiSelect = (questionId, selectedOptions) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: selectedOptions ? selectedOptions.map((opt) => opt.value) : [],
    }));
  };

  const handleSubmit = async () => {
    if (!respondentName || !respondentDepartment) {
      alert("Informations utilisateur manquantes.");
      return;
    }

    const formattedAnswers = Object.keys(answers).map((questionId) => {
      const answerValue = answers[questionId];
      return {
        question: parseInt(questionId, 10),
        value: Array.isArray(answerValue) ? JSON.stringify(answerValue) : answerValue,
      };
    });

    const payload = {
      questionnaire: questionnaire.id,
      respondent_name: respondentName,
      department: respondentDepartment,
      answers: formattedAnswers,
    };

    try {
      await api.post("/responses/", payload);
      alert("Réponses envoyées avec succès !");
      setAnswers({});
      localStorage.removeItem("respondentName");
      localStorage.removeItem("respondentDepartment");
      navigate("/");
    } catch (error) {
      console.error("Erreur lors de l'envoi des réponses:", error);
      alert("Erreur lors de l'envoi des réponses.");
    }
  };

  return (
    <>
      <Navbar />
      <div className="page">
        <h1>{questionnaire.title}</h1>
        <p style={{ color: "var(--text-light)", marginBottom: "6px" }}>{questionnaire.description}</p>
        <div style={{ display: "flex", gap: "16px", marginBottom: "24px", fontSize: "13px", color: "var(--text-light)" }}>
          <span><strong style={{ color: "var(--text)" }}>Nom :</strong> {respondentName}</span>
          <span><strong style={{ color: "var(--text)" }}>Département :</strong> {respondentDepartment}</span>
        </div>

        <form>
          {questionnaire.questions.map((q) => (
            <div key={q.id} className="question-block">
              <p className="question-text">{q.text}</p>

              {q.type === "multiple_choice" && q.display_mode === "checkbox" && (
                <div style={{ display: "flex", gap: "40px", alignItems: "flex-start" }}>
                  <div>
                    {q.options.map((opt) => (
                      <div key={opt.id} style={{ marginBottom: "6px" }}>
                        <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                          <input
                            type="checkbox"
                            checked={(answers[q.id] || []).includes(opt.label)}
                            onChange={(e) => handleCheckboxChange(q.id, opt.label, e.target.checked)}
                          />
                          {opt.label}
                        </label>
                      </div>
                    ))}
                  </div>
                  <div>
                    <strong style={{ fontSize: "13px" }}>Sélectionnés :</strong>
                    {(answers[q.id] || []).length === 0 ? (
                      <p style={{ color: "var(--text-light)", fontSize: "13px" }}>Aucune sélection</p>
                    ) : (
                      <ul style={{ margin: "4px 0 0", paddingLeft: "16px", fontSize: "13px" }}>
                        {(answers[q.id] || []).map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}

              {q.type === "multiple_choice" && q.display_mode === "multi_select" && (
                <Select
                  isMulti
                  options={q.options
                    .slice()
                    .sort((a, b) => a.label.localeCompare(b.label))
                    .map((opt) => ({ value: opt.label, label: opt.label }))}
                  styles={{ container: (base) => ({ ...base, maxWidth: "400px" }) }}
                  onChange={(selected) => handleMultiSelect(q.id, selected)}
                />
              )}

              {q.type === "single_choice" && (
                q.options.map((opt) => (
                  <div key={opt.id} style={{ marginBottom: "6px" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                      <input
                        type="radio"
                        name={`question-${q.id}`}
                        value={opt.label}
                        onChange={(e) => handleChange(q.id, e.target.value)}
                      />
                      {opt.label}
                    </label>
                  </div>
                ))
              )}

              {q.type === "text" && (
                <input
                  type="text"
                  className="input"
                  style={{ maxWidth: "400px" }}
                  onChange={(e) => handleChange(q.id, e.target.value)}
                  placeholder="Votre réponse"
                />
              )}

              {q.type === "number" && (
                <input
                  type="number"
                  className="input"
                  style={{ maxWidth: "200px" }}
                  onChange={(e) => handleChange(q.id, e.target.value)}
                  placeholder="Votre réponse"
                />
              )}
            </div>
          ))}

          <button type="button" className="btn btn-primary" onClick={handleSubmit}>
            Envoyer les réponses
          </button>
        </form>
      </div>
    </>
  );
}

export default QuestionnairePage;

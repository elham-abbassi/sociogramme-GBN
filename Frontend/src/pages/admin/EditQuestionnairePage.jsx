import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
import Navbar from "../../components/Navbar";

function EditQuestionnairePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    api.get(`/questionnaires/${id}/`).then((res) => {
      const q = res.data;
      setTitle(q.title);
      setDescription(q.description || "");

      // Map API questions → form format
      const mapped = q.questions.map((ques) => ({
        id: ques.id,
        text: ques.text,
        type: ques.type,
        required: ques.required,
        options: ques.options.map((o) => o.label),
        condition_question_index: -1,  // resolved below
        condition_value: ques.condition_value || "",
        _condition_question_id: ques.condition_question,  // raw FK id
      }));

      // Resolve condition_question FK id → index in the list
      mapped.forEach((q, i) => {
        if (q._condition_question_id) {
          const idx = mapped.findIndex((m) => m.id === q._condition_question_id);
          if (idx >= 0) mapped[i].condition_question_index = idx;
        }
      });

      setQuestions(mapped);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  const addQuestion = () => {
    setQuestions([...questions, {
      text: "", type: "text", required: true, options: [],
      condition_question_index: -1, condition_value: "",
    }]);
  };

  const updateQuestion = (index, field, value) => {
    const updated = [...questions];
    updated[index][field] = value;
    if (field === "condition_question_index") updated[index].condition_value = "";
    setQuestions(updated);
  };

  const addOption = (index) => {
    const updated = [...questions];
    updated[index].options.push("");
    setQuestions(updated);
  };

  const updateOption = (qIndex, optIndex, value) => {
    const updated = [...questions];
    updated[qIndex].options[optIndex] = value;
    setQuestions(updated);
  };

  const removeQuestion = (index) => {
    const updated = questions
      .filter((_, i) => i !== index)
      .map((q) => {
        if (q.condition_question_index === index) return { ...q, condition_question_index: -1, condition_value: "" };
        if (q.condition_question_index > index) return { ...q, condition_question_index: q.condition_question_index - 1 };
        return q;
      });
    setQuestions(updated);
  };

  const handleSubmit = async () => {
    setMessage("");
    try {
      await api.put(`/questionnaires/${id}/update/`, { title, description, questions });
      setMessage("✓ Questionnaire mis à jour avec succès !");
    } catch (err) {
      console.error(err);
      setMessage("Erreur lors de la mise à jour.");
    }
  };

  if (loading) return <><Navbar /><p className="loading">Chargement...</p></>;

  return (
    <>
      <Navbar />
      <div className="page">
        <Link to="/admin" className="back-link">← Retour au dashboard</Link>
        <h1>Modifier le questionnaire</h1>

        <div className="card">
          <div className="form-group">
            <label className="form-label">Titre</label>
            <input type="text" className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="textarea" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </div>

        {questions.map((q, index) => {
          const triggerCandidates = questions
            .slice(0, index)
            .map((prev, i) => ({ ...prev, _index: i }))
            .filter((prev) => prev.type === "single_choice" && prev.options.some((o) => o.trim()));

          const triggerQuestion = q.condition_question_index >= 0 ? questions[q.condition_question_index] : null;
          const dependentCount = questions.filter((other) => other.condition_question_index === index).length;
          const isConditional = q.condition_question_index >= 0 && q.condition_value;

          return (
            <div key={index} style={{ marginLeft: isConditional ? "24px" : "0" }}>
              {isConditional && (
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: "6px",
                  background: "#e8f4fb", border: "1px solid #b3d8ee",
                  borderRadius: "6px 6px 0 0", padding: "5px 12px",
                  fontSize: "12px", color: "#0796cb", marginBottom: "-1px",
                }}>
                  Visible si<strong>Q{q.condition_question_index + 1}</strong> = &ldquo;{q.condition_value}&rdquo;
                </div>
              )}
            <div
              className="card"
              style={isConditional ? { borderTop: "3px solid #0796cb", marginBottom: 0 } : {}}
            >

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <strong>Question {index + 1}</strong>
                  {dependentCount > 0 && (
                    <span style={{
                      background: "#fff3cd", border: "1px solid #ffc107",
                      borderRadius: "6px", padding: "2px 8px",
                      fontSize: "11px", color: "#856404",
                    }}>
                      → {dependentCount} question{dependentCount > 1 ? "s" : ""} conditionnelle{dependentCount > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                <button className="btn btn-danger" onClick={() => removeQuestion(index)}>Supprimer</button>
              </div>

              <div className="form-group">
                <label className="form-label">Texte de la question</label>
                <input type="text" className="input" value={q.text} onChange={(e) => updateQuestion(index, "text", e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Type</label>
                <select className="select" value={q.type} onChange={(e) => updateQuestion(index, "type", e.target.value)}>
                  <option value="text">Texte</option>
                  <option value="number">Nombre</option>
                  <option value="single_choice">Choix unique</option>
                  <option value="multiple_choice">Choix multiple</option>
                </select>
              </div>

              {(q.type === "single_choice" || q.type === "multiple_choice") && (
                <div className="form-group">
                  <label className="form-label">Options</label>
                  {q.options.map((opt, optIndex) => (
                    <input
                      key={optIndex}
                      type="text"
                      className="input"
                      style={{ marginBottom: "6px" }}
                      placeholder={`Option ${optIndex + 1}`}
                      value={opt}
                      onChange={(e) => updateOption(index, optIndex, e.target.value)}
                    />
                  ))}
                  <button className="btn btn-secondary" onClick={() => addOption(index)} style={{ marginTop: "6px" }}>
                    + Ajouter une option
                  </button>
                </div>
              )}

              {index > 0 && (
                <div style={{ marginTop: "12px", padding: "12px 14px", background: "#f4f8fb", border: "1px solid var(--border)", borderRadius: "8px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-light)", display: "block", marginBottom: "8px" }}>
                    Question conditionnelle (optionnel)
                  </label>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                    <span style={{ fontSize: "13px" }}>Afficher si la question</span>
                    <select
                      className="select"
                      style={{ flex: "1 1 180px", fontSize: "13px" }}
                      value={q.condition_question_index}
                      onChange={(e) => updateQuestion(index, "condition_question_index", parseInt(e.target.value))}
                    >
                      <option value={-1}>— aucune condition —</option>
                      {triggerCandidates.map((prev) => (
                        <option key={prev._index} value={prev._index}>
                          Q{prev._index + 1} : {prev.text || "(sans texte)"}
                        </option>
                      ))}
                    </select>
                    {triggerQuestion && (
                      <>
                        <span style={{ fontSize: "13px" }}>a pour réponse</span>
                        <select
                          className="select"
                          style={{ flex: "1 1 140px", fontSize: "13px" }}
                          value={q.condition_value}
                          onChange={(e) => updateQuestion(index, "condition_value", e.target.value)}
                        >
                          <option value="">— choisir —</option>
                          {triggerQuestion.options.filter((o) => o.trim()).map((opt, i) => (
                            <option key={i} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </>
                    )}
                  </div>
                  {triggerCandidates.length === 0 && (
                    <p style={{ fontSize: "12px", color: "var(--text-light)", margin: "6px 0 0" }}>
                      Aucune question à choix unique avant celle-ci.
                    </p>
                  )}
                </div>
              )}
            </div>
            </div>
          );
        })}

        <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
          <button className="btn btn-secondary" onClick={addQuestion}>+ Ajouter une question</button>
          <button className="btn btn-primary" onClick={handleSubmit}>Enregistrer les modifications</button>
        </div>

        {message && (
          <p className={message.startsWith("✓") ? "msg-success" : "msg-error"} style={{ marginTop: "16px" }}>
            {message}
          </p>
        )}
      </div>
    </>
  );
}

export default EditQuestionnairePage;

import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import Navbar from "../../components/Navbar";

function CreateQuestionnairePage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState([]);
  const [message, setMessage] = useState("");

  const addQuestion = () => {
    setQuestions([...questions, { text: "", type: "text", required: true, options: [] }]);
  };

  const updateQuestion = (index, field, value) => {
    const updated = [...questions];
    updated[index][field] = value;
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
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    try {
      await api.post("/questionnaires/create/", { title, description, questions });
      setMessage("Questionnaire créé avec succès !");
      setTitle("");
      setDescription("");
      setQuestions([]);
    } catch (error) {
      console.error(error);
      setMessage("Erreur lors de la création.");
    }
  };

  return (
    <>
      <Navbar />
      <div className="page">
        <Link to="/admin" className="back-link">← Retour au dashboard</Link>
        <h1>Créer un questionnaire</h1>

        <div className="card">
          <div className="form-group">
            <label className="form-label">Titre</label>
            <input
              type="text"
              className="input"
              placeholder="Titre du questionnaire"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="textarea"
              placeholder="Description (optionnelle)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        {questions.map((q, index) => (
          <div key={index} className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <strong>Question {index + 1}</strong>
              <button className="btn btn-danger" onClick={() => removeQuestion(index)}>
                Supprimer
              </button>
            </div>

            <div className="form-group">
              <label className="form-label">Texte de la question</label>
              <input
                type="text"
                className="input"
                placeholder="Texte de la question"
                value={q.text}
                onChange={(e) => updateQuestion(index, "text", e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Type</label>
              <select
                className="select"
                value={q.type}
                onChange={(e) => updateQuestion(index, "type", e.target.value)}
              >
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
          </div>
        ))}

        <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
          <button className="btn btn-secondary" onClick={addQuestion}>
            + Ajouter une question
          </button>
          <button className="btn btn-primary" onClick={handleSubmit}>
            Créer le questionnaire
          </button>
        </div>

        {message && (
          <p className={message.includes("succès") ? "msg-success" : "msg-error"} style={{ marginTop: "16px" }}>
            {message}
          </p>
        )}
      </div>
    </>
  );
}

export default CreateQuestionnairePage;

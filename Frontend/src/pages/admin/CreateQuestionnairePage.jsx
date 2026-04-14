import { useState } from "react";
import api from "../../services/api";

function CreateQuestionnairePage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState([]);
  const [message, setMessage] = useState("");

  // Ajouter une question
  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        text: "",
        type: "text",
        required: true,
        options: [],
      },
    ]);
  };

  // Modifier une question
  const updateQuestion = (index, field, value) => {
    const updated = [...questions];
    updated[index][field] = value;
    setQuestions(updated);
  };

  // Ajouter une option
  const addOption = (index) => {
    const updated = [...questions];
    updated[index].options.push("");
    setQuestions(updated);
  };

  // Modifier option
  const updateOption = (qIndex, optIndex, value) => {
    const updated = [...questions];
    updated[qIndex].options[optIndex] = value;
    setQuestions(updated);
  };

  // Supprimer question
  const removeQuestion = (index) => {
    const updated = questions.filter((_, i) => i !== index);
    setQuestions(updated);
  };

  // Submit
  const handleSubmit = async () => {
    const data = {
      title,
      description,
      questions,
    };

    try {
      await api.post("/questionnaires/create/", data);
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
    <div style={{ padding: "20px" }}>
      <h1>Créer un questionnaire</h1>

      <input
        type="text"
        placeholder="Titre"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={{ display: "block", marginBottom: "10px", width: "300px" }}
      />

      <textarea
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        style={{ display: "block", marginBottom: "20px", width: "300px" }}
      />

      <button onClick={addQuestion}>Ajouter une question</button>

      {questions.map((q, index) => (
        <div
          key={index}
          style={{
            border: "1px solid #ccc",
            padding: "10px",
            marginTop: "15px",
          }}
        >
          <input
            type="text"
            placeholder="Texte de la question"
            value={q.text}
            onChange={(e) =>
              updateQuestion(index, "text", e.target.value)
            }
          />

          <br />

          <select
            value={q.type}
            onChange={(e) =>
              updateQuestion(index, "type", e.target.value)
            }
          >
            <option value="text">Texte</option>
            <option value="number">Nombre</option>
            <option value="single_choice">Choix unique</option>
            <option value="multiple_choice">Choix multiple</option>
          </select>

          <br />

          {(q.type === "single_choice" ||
            q.type === "multiple_choice") && (
            <div>
              <p>Options :</p>

              {q.options.map((opt, optIndex) => (
                <input
                  key={optIndex}
                  type="text"
                  placeholder="Option"
                  value={opt}
                  onChange={(e) =>
                    updateOption(index, optIndex, e.target.value)
                  }
                />
              ))}

              <br />
              <button onClick={() => addOption(index)}>
                Ajouter option
              </button>
            </div>
          )}

          <br />
          <button onClick={() => removeQuestion(index)}>
            Supprimer question
          </button>
        </div>
      ))}

      <br />
      <button onClick={handleSubmit}>Créer questionnaire</button>

      {message && <p>{message}</p>}
    </div>
  );
}

export default CreateQuestionnairePage;

import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../services/api";

function QuestionnairePage() {
  const { id } = useParams();

  const [questionnaire, setQuestionnaire] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});

  useEffect(() => {
    const fetchQuestionnaire = async () => {
      try {
        const response = await api.get(`/questionnaires/${id}/`);
        console.log("Questionnaire:", response.data);
        setQuestionnaire(response.data);
      } catch (error) {
        console.error("Erreur lors du chargement du questionnaire:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestionnaire();
  }, [id]);

  const handleChange = (questionId, value) => {
    setAnswers((prevAnswers) => ({
      ...prevAnswers,
      [questionId]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!questionnaire) return;

    const formattedAnswers = Object.keys(answers).map((questionId) => ({
      question: parseInt(questionId),
      value: answers[questionId],
    }));

    const payload = {
      questionnaire: questionnaire.id,
      answers: formattedAnswers,
    };

    console.log("Sending:", payload);

    try {
      const response = await api.post("/responses/", payload);
      console.log("Response saved:", response.data);
      alert("Réponses envoyées avec succès !");
    } catch (error) {
      console.error("Erreur lors de l'envoi des réponses:", error);
      alert("Erreur lors de l'envoi des réponses.");
    }
  };

  if (loading) return <p>Chargement...</p>;
  if (!questionnaire) return <p>Questionnaire introuvable.</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>{questionnaire.title}</h1>
      <p>{questionnaire.description}</p>

      <form>
        {questionnaire.questions.map((q) => (
          <div key={q.id} style={{ marginBottom: "20px" }}>
            <p>
              <strong>{q.text}</strong>
            </p>

            {q.options && q.options.length > 0 ? (
              q.options.map((opt) => (
                <div key={opt.id}>
                  <label>
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
            ) : (
              <input
                type="text"
                onChange={(e) => handleChange(q.id, e.target.value)}
                placeholder="Votre réponse"
              />
            )}
          </div>
        ))}

        <button type="button" onClick={handleSubmit}>
          Envoyer
        </button>
      </form>
    </div>
  );
}

export default QuestionnairePage;
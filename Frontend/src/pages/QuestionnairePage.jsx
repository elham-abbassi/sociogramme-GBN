
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../services/api";
import Select from "react-select";


function QuestionnairePage() {
  const { id } = useParams(); 
  const navigate = useNavigate();

  const [questionnaire, setQuestionnaire] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});

  const respondentName = localStorage.getItem("respondentName") || "";
  const respondentDepartment = localStorage.getItem("respondentDepartment") || "";

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

  if (loading) return <p>Chargement...</p>;
  if (!questionnaire) return <p>Questionnaire introuvable.</p>;

  const handleChange = (questionId, value) => {
    setAnswers((prevAnswers) => ({
      ...prevAnswers,
      [questionId]: value,
    }));
  };

  const handleCheckboxChange = (questionId, optionLabel, checked) => {
    setAnswers((prevAnswers) => {
      const currentAnswers = prevAnswers[questionId] || [];

      if (checked) {
        return {
          ...prevAnswers,
          [questionId]: [...currentAnswers, optionLabel],
        };
      } else {
        return {
          ...prevAnswers,
          [questionId]: currentAnswers.filter(
            (item) => item !== optionLabel
          ),
        };
      }
    });
  };


  const handleMultiSelect = (questionId, selectedOptions) => {
  const values = selectedOptions
    ? selectedOptions.map((opt) => opt.value)
    : [];

  setAnswers((prev) => ({
    ...prev,
    [questionId]: values,
  }));
};

const handleSubmit = async () => {
  if (!questionnaire) return;

  if (!respondentName || !respondentDepartment) {
    alert("Informations utilisateur manquantes.");
    return;
  }

  const formattedAnswers = Object.keys(answers).map((questionId) => {
    const answerValue = answers[questionId];

    return {
      question: parseInt(questionId, 10),
      value: Array.isArray(answerValue)
        ? JSON.stringify(answerValue)
        : answerValue,
    };
  });

  const payload = {
    questionnaire: questionnaire.id,
    respondent_name: respondentName,
    department: respondentDepartment,
    answers: formattedAnswers,
  };

  console.log("Sending:", payload);

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
    <div style={{ padding: "20px" }}>
      <h1>{questionnaire.title}</h1>
      <p>{questionnaire.description}</p>
      <p><strong>Nom :</strong> {respondentName}</p>
      <p><strong>Département :</strong> {respondentDepartment}</p>
    <form>
    {questionnaire.questions.map((q) => (
    <div key={q.id} style={{ marginBottom: "20px" }}>
      <p>
        <strong>{q.text}</strong>
      </p>
    {q.type === "multiple_choice" && q.display_mode === "checkbox" && (
      <div style={{ display: "flex", gap: "30px", alignItems: "flex-start" }}>
        <div>
          {q.options.map((opt) => (
            <div key={opt.id}>
              <label>
                <input
                  type="checkbox"
                  checked={(answers[q.id] || []).includes(opt.label)}
                  onChange={(e) =>
                    handleCheckboxChange(q.id, opt.label, e.target.checked)
                  }
                />
                {opt.label}
              </label>
            </div>
          ))}
        </div>
        <div>
        <strong>Sélectionnés :</strong>
        {(answers[q.id] || []).length === 0 ? (
          <p>Aucune sélection</p>
        ) : (
          <ul>
            {(answers[q.id] || []).map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )}

  {q.type === "multiple_choice" && q.display_mode === "multi_select" && (
  <div style={{ display: "flex", gap: "30px", alignItems: "flex-start" }}>
    <Select
    isMulti
    options={q.options
      .slice()
      .sort((a, b) => a.label.localeCompare(b.label))
      .map((opt) => ({
        value: opt.label,
        label: opt.label,
    }))}
    styles={{
      container: (base) => ({
        ...base,
        width: "300px",
      }),
    }}
    onChange={(selectedOptions) =>
      handleMultiSelect(q.id, selectedOptions)
    }
  />
  </div>
)}

  {q.type === "single_choice" && (
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
    )}

    {q.type === "text" && (
      <input
        type="text"
        onChange={(e) => handleChange(q.id, e.target.value)}
        placeholder="Votre réponse"
      />
    )}

    {q.type === "number" && (
      <input
        type="number"
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
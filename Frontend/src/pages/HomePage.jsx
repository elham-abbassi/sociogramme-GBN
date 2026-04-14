import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

function HomePage() {
  const [questionnaires, setQuestionnaires] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchQuestionnaires = async () => {
      try {
        const response = await api.get("/questionnaires/");
        setQuestionnaires(response.data);
      } catch (err) {
        setError("Erreur lors du chargement des questionnaires.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestionnaires();
  }, []);

  if (loading) return <p>Chargement...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>Liste des questionnaires</h1>
      <p>Choisissez un questionnaire pour répondre.</p>

      {questionnaires.length === 0 ? (
        <p>Aucun questionnaire trouvé.</p>
      ) : (
        <div>
          {questionnaires.map((questionnaire) => (
            <div
              key={questionnaire.id}
              style={{
                border: "1px solid #ccc",
                borderRadius: "8px",
                padding: "16px",
                marginBottom: "16px",
              }}
            >
              <h3>{questionnaire.title}</h3>
              <p>{questionnaire.description}</p>

              <Link to={`/respondent-info/${questionnaire.id}`}>
                Répondre au questionnaire
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default HomePage;
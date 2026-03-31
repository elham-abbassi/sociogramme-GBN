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

      {questionnaires.length === 0 ? (
        <p>Aucun questionnaire trouvé.</p>
      ) : (
        <ul>
          {questionnaires.map((questionnaire) => (
            <li key={questionnaire.id}>
              <Link to={`/questionnaire/${questionnaire.id}`}>
                <h3>{questionnaire.title}</h3>
              </Link>
              <p>{questionnaire.description}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default HomePage;
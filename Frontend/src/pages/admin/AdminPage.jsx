import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";

function AdminPage() {
  const [questionnaires, setQuestionnaires] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchQuestionnaires = async () => {
      try {
        const response = await api.get("/questionnaires/");
        setQuestionnaires(response.data);
      } catch (err) {
        console.error(err);
        setError("Erreur lors du chargement des questionnaires.");
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
      <h1>Admin Dashboard</h1>
      <p>Gérez les questionnaires et consultez les analyses.</p>

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

              <Link
                to={`/analysis/${questionnaire.id}`}
                style={{ marginRight: "12px" }}
              >
                Voir analyse
              </Link>

              <Link to={`/questionnaire/${questionnaire.id}`}>
                Voir questionnaire
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminPage;
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import Navbar from "../components/Navbar";

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

  if (loading) return <><Navbar /><p className="loading">Chargement...</p></>;
  if (error)   return <><Navbar /><p className="error">{error}</p></>;

  return (
    <>
      <Navbar />
      <div className="page">
        <h1>Questionnaires</h1>
        <p style={{ color: "var(--text-light)", marginBottom: "24px" }}>
          Choisissez un questionnaire pour répondre.
        </p>

        {questionnaires.length === 0 ? (
          <p>Aucun questionnaire trouvé.</p>
        ) : (
          questionnaires.map((q) => (
            <div key={q.id} className="card">
              <div className="card-title">{q.title}</div>
              <div className="card-desc">{q.description}</div>
              <Link to={`/respondent-info/${q.id}`} className="btn btn-primary">
                Répondre au questionnaire
              </Link>
            </div>
          ))
        )}
      </div>
    </>
  );
}

export default HomePage;

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../services/api";

function AnalysisPage() {
  const { id } = useParams();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const response = await api.get(`/analysis/${id}/`);
        setAnalysis(response.data);
      } catch (err) {
        console.error(err);
        setError("Erreur lors du chargement de l’analyse.");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [id]);

  if (loading) return <p>Chargement de l’analyse...</p>;
  if (error) return <p>{error}</p>;
  if (!analysis) return <p>Aucune analyse trouvée.</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>Analyse du questionnaire</h1>
      <h2>{analysis.title}</h2>

      {analysis.questions.map((question) => (
        <div
          key={question.question_id}
          style={{
            border: "1px solid #ccc",
            borderRadius: "8px",
            padding: "16px",
            marginBottom: "20px",
          }}
        >
          <h3>{question.question_text}</h3>
          <p>
            <strong>Type :</strong> {question.question_type}
          </p>
          <p>
            <strong>Nombre de réponses :</strong> {question.total_answers}
          </p>

          {question.distribution && (
            <div>
              <h4>Distribution</h4>
              <ul>
                {question.distribution.map((item, index) => (
                  <li key={index}>
                    {item.value} — {item.count} réponse(s) — {item.percentage}%
                  </li>
                ))}
              </ul>
            </div>
          )}

          {question.statistics && (
            <div>
              <h4>Statistiques</h4>
              <ul>
                <li>Count : {question.statistics.count}</li>
                <li>Mean : {question.statistics.mean}</li>
                <li>Min : {question.statistics.min}</li>
                <li>Max : {question.statistics.max}</li>
              </ul>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default AnalysisPage;
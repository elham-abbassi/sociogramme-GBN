import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";

function ImportParticipants() {
  const fileRef = useRef(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleImport = async () => {
    const file = fileRef.current?.files[0];
    if (!file) {
      setMessage("Veuillez sélectionner un fichier .xlsx");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    setMessage("");

    try {
      const res = await api.post("/questionnaires/import-participants/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMessage(`✓ ${res.data.message}`);
      fileRef.current.value = "";
    } catch (err) {
      setMessage(`Erreur : ${err.response?.data?.error || "Échec de l'import."}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: "8px",
        padding: "16px",
        marginBottom: "24px",
        background: "#fafafa",
      }}
    >
      <h3 style={{ margin: "0 0 8px" }}>Importer la liste des participants</h3>
      <p style={{ margin: "0 0 12px", color: "#666", fontSize: "13px" }}>
        Fichier Excel (.xlsx) avec les noms dans la première colonne.
        Chaque upload remplace la liste existante.
      </p>
      <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
        <input ref={fileRef} type="file" accept=".xlsx" />
        <button
          onClick={handleImport}
          disabled={loading}
          style={{ padding: "8px 16px", cursor: loading ? "not-allowed" : "pointer" }}
        >
          {loading ? "Import en cours..." : "Importer"}
        </button>
      </div>
      {message && (
        <p
          style={{
            marginTop: "10px",
            color: message.startsWith("✓") ? "green" : "red",
            fontSize: "13px",
          }}
        >
          {message}
        </p>
      )}
    </div>
  );
}

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

      <ImportParticipants />

      <div style={{ marginBottom: "20px" }}>
        <Link to="/admin/create-questionnaire">
          <button style={{ padding: "10px" }}>
            Créer un questionnaire
          </button>
        </Link>
      </div>

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
                to={`/admin/analysis/${questionnaire.id}`}
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

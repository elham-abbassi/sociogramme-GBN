import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";
import Navbar from "../../components/Navbar";

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
    <div className="import-box">
      <h3 style={{ margin: "0 0 4px" }}>Importer la liste des participants</h3>
      <p style={{ color: "var(--text-light)", fontSize: "13px", margin: "0 0 10px" }}>
        Fichier Excel (.xlsx) avec les noms dans la première colonne. Chaque upload remplace la liste existante.
      </p>
      <div className="import-row">
        <input ref={fileRef} type="file" accept=".xlsx" />
        <button className="btn btn-primary" onClick={handleImport} disabled={loading}>
          {loading ? "Import en cours..." : "Importer"}
        </button>
      </div>
      {message && (
        <p className={message.startsWith("✓") ? "msg-success" : "msg-error"}>
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
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/questionnaires/")
      .then((res) => setQuestionnaires(res.data))
      .catch((err) => {
        console.error(err);
        setError("Erreur lors du chargement des questionnaires.");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    navigate("/admin/login");
  };

  if (loading) return <><Navbar /><p className="loading">Chargement...</p></>;
  if (error)   return <><Navbar /><p className="error">{error}</p></>;

  return (
    <>
      <Navbar />
      <div className="page">
        <div className="section-header">
          <h1 style={{ margin: 0 }}>Admin Dashboard</h1>
          <button className="btn btn-secondary" onClick={handleLogout}>
            Se déconnecter
          </button>
        </div>

        <ImportParticipants />

        <div style={{ marginBottom: "20px" }}>
          <Link to="/admin/create-questionnaire" className="btn btn-primary">
            + Créer un questionnaire
          </Link>
        </div>

        {questionnaires.length === 0 ? (
          <p>Aucun questionnaire trouvé.</p>
        ) : (
          questionnaires.map((q) => (
            <div key={q.id} className="card">
              <div className="card-title">{q.title}</div>
              <div className="card-desc">{q.description}</div>
              <div style={{ display: "flex", gap: "12px" }}>
                <Link to={`/admin/analysis/${q.id}`} className="btn btn-primary">
                  Voir analyse
                </Link>
                <Link to={`/questionnaire/${q.id}`} className="btn btn-secondary">
                  Voir questionnaire
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}

export default AdminPage;

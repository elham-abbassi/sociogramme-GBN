import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";
import Navbar from "../../components/Navbar";

function PermanentStaff() {
  const [list, setList] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const load = () => {
    api.get("/questionnaires/permanent-staff/").then((res) => setList(res.data));
  };

  useEffect(() => {
    load();
    api.get("/questionnaires/departments/").then((res) => {
      const skip = ["", "none", "(none)", "null", "n/a", "aucun", "aucune"];
      setDepartments((res.data || []).filter((d) => !skip.includes(d.trim().toLowerCase())));
    });
  }, []);

  const handleAdd = async () => {
    if (!name.trim()) { setMessage("Le nom est requis."); return; }
    setLoading(true);
    setMessage("");
    try {
      await api.post("/questionnaires/permanent-staff/", { name: name.trim(), department: department.trim() });
      setName("");
      setDepartment("");
      load();
      setMessage("✓ Ajouté avec succès.");
    } catch (err) {
      setMessage(err.response?.data?.error || "Erreur lors de l'ajout.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer ce membre permanent ?")) return;
    try {
      await api.delete(`/questionnaires/permanent-staff/${id}/`);
      load();
    } catch {
      setMessage("Erreur lors de la suppression.");
    }
  };

  const [pendingDept, setPendingDept] = useState({}); // id → pending value

  const handleSaveDept = async (id) => {
    const value = pendingDept[id] ?? "";
    try {
      await api.patch(`/questionnaires/permanent-staff/${id}/`, { department: value });
      setPendingDept((prev) => { const next = { ...prev }; delete next[id]; return next; });
      load();
    } catch {
      setMessage("Erreur lors de la mise à jour.");
    }
  };

  return (
    <div className="import-box">
      <h3 style={{ margin: "0 0 4px" }}>Membres permanents</h3>
      <p style={{ color: "var(--text-light)", fontSize: "13px", margin: "0 0 12px" }}>
        Ces personnes restent dans la liste même quand vous importez un nouveau fichier Excel.
      </p>

      {/* Add form */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
        <input
          type="text"
          className="input"
          style={{ flex: "1 1 160px" }}
          placeholder="Nom complet"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <select
          className="input"
          style={{ flex: "1 1 140px" }}
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
        >
          <option value="">Département (optionnel)</option>
          {departments.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <button className="btn btn-primary" onClick={handleAdd} disabled={loading}>
          {loading ? "..." : "+ Ajouter"}
        </button>
      </div>

      {message && (
        <p className={message.startsWith("✓") ? "msg-success" : "msg-error"} style={{ marginBottom: "10px" }}>
          {message}
        </p>
      )}

      {/* Current list */}
      {list.length === 0 ? (
        <p style={{ color: "var(--text-light)", fontSize: "13px" }}>Aucun membre permanent pour l'instant.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)", textAlign: "left" }}>
              <th style={{ padding: "6px 8px" }}>Nom</th>
              <th style={{ padding: "6px 8px" }}>Département</th>
              <th style={{ padding: "6px 8px", width: "80px" }}></th>
            </tr>
          </thead>
          <tbody>
            {list.map((s) => (
              <tr key={s.id} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "6px 8px" }}>{s.label}</td>
                <td style={{ padding: "4px 8px" }}>
                  <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    <select
                      className="input"
                      style={{ padding: "3px 8px", fontSize: "12px", flex: 1 }}
                      value={s.id in pendingDept ? pendingDept[s.id] : (s.department || "")}
                      onChange={(e) => setPendingDept((prev) => ({ ...prev, [s.id]: e.target.value }))}
                    >
                      <option value="" disabled>Ajouter le département</option>
                      {departments.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                    {s.id in pendingDept && (
                      <>
                        <button
                          className="btn btn-primary"
                          style={{ padding: "3px 10px", fontSize: "12px" }}
                          onClick={() => handleSaveDept(s.id)}
                        >
                          ✓
                        </button>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: "3px 10px", fontSize: "12px" }}
                          onClick={() => setPendingDept((prev) => { const next = { ...prev }; delete next[s.id]; return next; })}
                        >
                          ✕
                        </button>
                      </>
                    )}
                  </div>
                </td>
                <td style={{ padding: "6px 8px" }}>
                  <button
                    className="btn btn-danger"
                    style={{ padding: "3px 10px", fontSize: "12px" }}
                    onClick={() => handleDelete(s.id)}
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

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

function DeleteModal({ questionnaire, onClose, onRefresh }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const handleClearResponses = async () => {
    setBusy(true);
    try {
      const res = await api.delete(`/questionnaires/${questionnaire.id}/clear-responses/`);
      setMsg(`✓ ${res.data.message}`);
      onRefresh();
    } catch {
      setMsg("Erreur lors de la suppression des réponses.");
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteAll = async () => {
    setBusy(true);
    try {
      await api.delete(`/questionnaires/${questionnaire.id}/delete/`);
      onRefresh();
      onClose();
    } catch {
      setMsg("Erreur lors de la suppression.");
      setBusy(false);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
    }}>
      <div style={{
        background: "#fff", borderRadius: "14px", padding: "32px",
        maxWidth: "420px", width: "90%", boxShadow: "0 12px 40px rgba(0,0,0,0.15)",
      }}>
        {/* Header */}
        <div style={{ marginBottom: "20px" }}>
          <p style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.8px", color: "var(--text-light)", margin: "0 0 6px" }}>
            Questionnaire
          </p>
          <h3 style={{ margin: 0, fontSize: "18px" }}>{questionnaire.title}</h3>
        </div>

        {/* Feedback message */}
        {msg && (
          <div style={{
            background: msg.startsWith("✓") ? "#f0fdf4" : "#fef2f2",
            border: `1px solid ${msg.startsWith("✓") ? "#bbf7d0" : "#fecaca"}`,
            borderRadius: "8px", padding: "10px 14px", marginBottom: "16px",
            fontSize: "13px", color: msg.startsWith("✓") ? "#166534" : "#991b1b",
          }}>
            {msg}
          </div>
        )}

        {/* Options */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
          {/* Clear responses */}
          <div style={{
            border: "1px solid var(--border)", borderRadius: "10px", padding: "14px 16px",
            cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.6 : 1,
            transition: "border-color 0.15s",
          }}
            onClick={!busy ? handleClearResponses : undefined}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = "#0796cb"}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--border)"}
          >
            <div style={{ fontWeight: "600", fontSize: "14px", marginBottom: "4px" }}>
              Réinitialiser les réponses
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-light)", lineHeight: "1.5" }}>
              Efface toutes les réponses collectées. Le questionnaire reste intact et peut être réutilisé.
            </div>
          </div>

          {/* Delete all */}
          <div style={{
            border: "1px solid #fecaca", borderRadius: "10px", padding: "14px 16px",
            cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.6 : 1,
            background: "#fff5f5", transition: "border-color 0.15s",
          }}
            onClick={!busy ? handleDeleteAll : undefined}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = "#e74c3c"}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = "#fecaca"}
          >
            <div style={{ fontWeight: "600", fontSize: "14px", color: "#c0392b", marginBottom: "4px" }}>
              Supprimer le questionnaire
            </div>
            <div style={{ fontSize: "12px", color: "#e57373", lineHeight: "1.5" }}>
              Supprime définitivement le questionnaire et toutes ses réponses. Irréversible.
            </div>
          </div>
        </div>

        {/* Cancel */}
        <button
          className="btn btn-secondary"
          style={{ width: "100%" }}
          onClick={onClose}
          disabled={busy}
        >
          Annuler
        </button>
      </div>
    </div>
  );
}

function AdminPage() {
  const [questionnaires, setQuestionnaires] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const navigate = useNavigate();

  const loadQuestionnaires = () => {
    api.get("/questionnaires/")
      .then((res) => setQuestionnaires(res.data))
      .catch(() => setError("Erreur lors du chargement des questionnaires."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadQuestionnaires(); }, []);

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

        <PermanentStaff />

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
                <Link to={`/admin/edit-questionnaire/${q.id}`} className="btn btn-secondary">
                  Modifier
                </Link>
                <button className="btn btn-danger" onClick={() => setDeleteTarget(q)}>
                  Supprimer
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {deleteTarget && (
        <DeleteModal
          questionnaire={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onRefresh={loadQuestionnaires}
        />
      )}
    </>
  );
}

export default AdminPage;

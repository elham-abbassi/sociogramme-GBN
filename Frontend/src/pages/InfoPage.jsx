import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import Navbar from "../components/Navbar";

function InfoPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    api.get("/questionnaires/departments/")
      .then((res) => setDepartments(res.data))
      .catch((err) => console.error("Erreur chargement départements:", err));
  }, []);

  const handleContinue = () => {
    if (!name.trim() || !department) {
      alert("Veuillez remplir votre nom et votre département.");
      return;
    }
    localStorage.setItem("respondentName", name);
    localStorage.setItem("respondentDepartment", department);
    navigate(`/questionnaire/${id}`);
  };

  return (
    <>
      <Navbar />
      <div className="page" style={{ maxWidth: "500px" }}>
        <h1>Informations personnelles</h1>
        <p style={{ color: "var(--text-light)", marginBottom: "24px" }}>
          Veuillez remplir vos informations avant de commencer le questionnaire.
        </p>

        <div className="card">
          <div className="form-group">
            <label className="form-label">Nom</label>
            <input
              type="text"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Votre nom"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Département</label>
            <select
              className="select"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            >
              <option value="">-- Choisissez votre département --</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          <button className="btn btn-primary" onClick={handleContinue}>
            Continuer →
          </button>
        </div>
      </div>
    </>
  );
}

export default InfoPage;

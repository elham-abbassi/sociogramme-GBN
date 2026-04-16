import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";

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
    <div style={{ padding: "20px" }}>
      <h1>Informations personnelles</h1>
      <p>Veuillez remplir vos informations avant de commencer le questionnaire.</p>

      <div style={{ marginBottom: "12px" }}>
        <label>Nom</label>
        <br />
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Votre nom"
          style={{ width: "300px", padding: "8px" }}
        />
      </div>

      <div style={{ marginBottom: "12px" }}>
        <label>Département</label>
        <br />
        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          style={{ width: "300px", padding: "8px" }}
        >
          <option value="">-- Choisissez votre département --</option>
          {departments.map((dept) => (
            <option key={dept} value={dept}>
              {dept}
            </option>
          ))}
        </select>
      </div>

      <button onClick={handleContinue}>Continuer</button>
    </div>
  );
}

export default InfoPage;

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import logo from "../../assets/logo.png";

function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!password.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/auth/login/", { password });
      localStorage.setItem("adminToken", res.data.token);
      navigate("/admin");
    } catch {
      setError("Mot de passe incorrect.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <div className="login-logo">
          <img src={logo} alt="GBN Logo" />
        </div>

        <h2 style={{ textAlign: "center", marginBottom: "24px" }}>Espace Admin</h2>

        <div className="form-group">
          <label className="form-label">Mot de passe</label>
          <input
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            placeholder="••••••••"
          />
        </div>

        <button
          className="btn btn-primary"
          onClick={handleLogin}
          disabled={loading}
          style={{ width: "100%", justifyContent: "center" }}
        >
          {loading ? "Connexion..." : "Se connecter"}
        </button>

        {error && <p className="msg-error" style={{ textAlign: "center" }}>{error}</p>}
      </div>
    </div>
  );
}

export default AdminLoginPage;

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

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
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        background: "#f5f5f5",
      }}
    >
      <div
        style={{
          background: "#fff",
          padding: "40px",
          borderRadius: "10px",
          border: "1px solid #ddd",
          width: "320px",
        }}
      >
        <h2 style={{ margin: "0 0 24px", textAlign: "center" }}>Admin</h2>

        <label style={{ fontSize: "13px", color: "#555" }}>Mot de passe</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          placeholder="••••••••"
          style={{
            display: "block",
            width: "100%",
            padding: "10px",
            margin: "6px 0 16px",
            borderRadius: "6px",
            border: "1px solid #ccc",
            fontSize: "14px",
            boxSizing: "border-box",
          }}
        />

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: "100%",
            padding: "10px",
            background: "#4e79a7",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            fontSize: "15px",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Connexion..." : "Se connecter"}
        </button>

        {error && (
          <p style={{ color: "red", marginTop: "12px", textAlign: "center", fontSize: "13px" }}>
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

export default AdminLoginPage;

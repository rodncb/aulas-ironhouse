import React, { useState } from "react";
import "../styles/Login.css";
import logoCompleta from "../assets/logo_completa.png";
import { useNavigate } from "react-router-dom";

const Login = ({ onLogin }) => {
  const [userType, setUserType] = useState("professor");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleUserTypeChange = (tipo) => {
    setUserType(tipo);
    setError("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!email || !password) {
        setError("Por favor, preencha todos os campos");
        setLoading(false);
        return;
      }

      console.log(`Tentando login para ${email} como ${userType}`);

      // Chama a função handleLogin passada pelo App.jsx (que usa useAuth.signIn)
      const result = await onLogin(email, password, userType); // Passa userType também

      if (!result || !result.success) {
        console.error("Falha no login reportada pelo App:", result?.error);
        setError(
          result?.error || "Email ou senha incorretos. Tente novamente."
        );
        setLoading(false);
        return;
      }

      // A verificação de tipo e o redirecionamento agora são tratados pelo App.jsx / useAuth
      console.log("Login bem-sucedido, App.jsx cuidará do redirecionamento.");
      // O redirecionamento será feito pelo App.jsx após o estado do usuário ser atualizado pelo useAuth
      // navigate(userType === "admin" ? "/admin" : "/professor"); // REMOVIDO
    } catch (err) {
      console.error("Exceção no login:", err.message);
      setError("Ocorreu um erro inesperado. Tente novamente mais tarde.");
    } finally {
      setLoading(false); // Garante que loading seja false no final
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <img src={logoCompleta} alt="IronHouse Logo" className="login-logo" />
          <h2>Entrar</h2>
        </div>

        <div className="user-type-selector">
          <button
            className={userType === "professor" ? "active" : ""}
            onClick={() => handleUserTypeChange("professor")}
          >
            Professor
          </button>
          <button
            className={userType === "admin" ? "active" : ""}
            onClick={() => handleUserTypeChange("admin")}
          >
            Administrador
          </button>
        </div>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              disabled={loading}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Senha</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
              disabled={loading}
              autoComplete="current-password"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;

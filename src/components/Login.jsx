import React, { useState } from "react";
import "../styles/Login.css";
import logoCompleta from "../assets/logo_completa.png";
// import { useNavigate } from "react-router-dom"; // Não está sendo usado

const Login = ({ onLogin }) => {
  const [userType, setUserType] = useState("professor");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  // const navigate = useNavigate(); // Não está sendo usado

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
      {/* Mudança 1: login-box -> login-card */}
      <div className="login-card">
        {/* Mudança 5: Ajuste na estrutura do logo */}
        <div className="login-logo">
          <img src={logoCompleta} alt="IronHouse Logo" />
          {/* Removido h1 que não está no CSS original */}
        </div>

        {/* Mudança 2: user-type-selector -> user-type-toggle */}
        <div className="user-type-toggle">
          {/* Mudança 3: Adiciona className="toggle-btn" */}
          <button
            className={`toggle-btn ${userType === "professor" ? "active" : ""}`}
            onClick={() => handleUserTypeChange("professor")}
          >
            Professor
          </button>
          {/* Mudança 3: Adiciona className="toggle-btn" */}
          <button
            className={`toggle-btn ${userType === "admin" ? "active" : ""}`}
            onClick={() => handleUserTypeChange("admin")}
          >
            Administrador
          </button>
        </div>

        {/* Mudança 4: Adiciona className="login-form" */}
        <form className="login-form" onSubmit={handleLogin}>
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
            {loading ? (
              <span className="loading-text">
                <span className="loading-spinner"></span>
                Entrando...
              </span>
            ) : (
              "Entrar"
            )}
          </button>
        </form>
        {/* Elementos como login-footer, recovery-options etc. não estão no JSX atual */}
      </div>
    </div>
  );
};

export default Login;

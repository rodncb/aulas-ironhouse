import React, { useState } from "react";
import "../styles/Login.css";
import logoCompleta from "../assets/logo_completa.png";

const Login = ({ onLogin }) => {
  const [userType, setUserType] = useState("professor"); // 'professor' ou 'admin'
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Atualiza o tipo de usuário quando alterado
  const handleUserTypeChange = (tipo) => {
    setUserType(tipo);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // Impede o refresh padrão do formulário
    setError("");
    setLoading(true);

    // Validação básica
    if (!username || !password) {
      setError("Por favor, preencha todos os campos");
      setLoading(false);
      return;
    }

    try {
      // Usar o onLogin para autenticação com o Supabase
      const result = await onLogin(username, password);
      
      // Se não tiver success, mostrar erro
      if (!result || !result.success) {
        setError(result?.error || "Falha na autenticação. Verifique suas credenciais.");
        setLoading(false);
      }
      // Se não houver erro, o redirecionamento será feito pelo App.jsx
      
    } catch (error) {
      console.error("Erro de login:", error);
      setError("Erro ao tentar login. Verifique sua conexão e tente novamente.");
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-logo">
          <img src={logoCompleta} alt="Iron House" />
          <h1>Fitness e Performance</h1>
        </div>

        <div className="user-type-toggle">
          <button
            className={`toggle-btn ${userType === "professor" ? "active" : ""}`}
            onClick={() => handleUserTypeChange("professor")}
            type="button"
            disabled={loading}
          >
            Professor
          </button>
          <button
            className={`toggle-btn ${userType === "admin" ? "active" : ""}`}
            onClick={() => handleUserTypeChange("admin")}
            type="button"
            disabled={loading}
          >
            Administrador
          </button>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Email</label>
            <input
              type="email" 
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Digite seu email"
              autoComplete="username"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Senha</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite sua senha"
              autoComplete="current-password"
              disabled={loading}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="login-button" disabled={loading}>
            {loading
              ? "Entrando..."
              : `Entrar como ${
                  userType === "professor" ? "Professor" : "Administrador"
                }`}
          </button>
        </form>

        <div className="login-footer">
          <p>© {new Date().getFullYear()} Iron House Fitness e Performance</p>
        </div>
      </div>
    </div>
  );
};

export default Login;

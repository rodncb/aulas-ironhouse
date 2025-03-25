import React, { useState } from "react";
import "../styles/Login.css";
import logoCompleta from "../assets/logo_completa.png";

const Login = ({ onLogin }) => {
  const [userType, setUserType] = useState("professor"); // 'professor' ou 'admin'
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    // Validação básica
    if (!username || !password) {
      setError("Por favor, preencha todos os campos");
      return;
    }

    // Simulação de autenticação
    // Em uma aplicação real, isto seria feito através de uma API
    if (userType === "professor") {
      // Credenciais de exemplo para professor
      if (username === "professor" && password === "123456") {
        onLogin(userType, { nome: "Professor", role: "professor" });
      } else {
        setError("Credenciais inválidas para Professor");
      }
    } else {
      // Credenciais de exemplo para admin
      if (username === "admin" && password === "123456") {
        onLogin(userType, { nome: "Administrador", role: "admin" });
      } else {
        setError("Credenciais inválidas para Administrador");
      }
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
            onClick={() => setUserType("professor")}
            type="button"
          >
            Professor
          </button>
          <button
            className={`toggle-btn ${userType === "admin" ? "active" : ""}`}
            onClick={() => setUserType("admin")}
            type="button"
          >
            Administrador
          </button>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Usuário</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={
                userType === "professor"
                  ? "Nome do Professor"
                  : "Nome do Administrador"
              }
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
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="login-button">
            Entrar como{" "}
            {userType === "professor" ? "Professor" : "Administrador"}
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

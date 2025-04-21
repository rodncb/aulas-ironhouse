import React, { useState, useEffect } from "react";
import "../styles/Login.css";
import logoCompleta from "../assets/logo_completa.png";
import { supabase } from "../services/supabase";

const Login = ({ onLogin }) => {
  const [userType, setUserType] = useState("professor"); // 'professor' ou 'admin'
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const [connectionChecked, setConnectionChecked] = useState(false);

  // Verificar conectividade com Supabase ao carregar o componente
  useEffect(() => {
    const checkSupabaseConnection = async () => {
      try {
        const { data, error } = await supabase
          .from("alunos")
          .select("count")
          .limit(1);

        if (error) {
          console.error("Erro de conexão com Supabase:", error.message);
          setConnectionError(true);
        } else {
          console.log("Conexão com Supabase verificada com sucesso");
          setConnectionError(false);
        }
      } catch (err) {
        console.error("Exceção ao verificar conexão:", err.message);
        setConnectionError(true);
      } finally {
        setConnectionChecked(true);
      }
    };

    checkSupabaseConnection();
  }, []);

  // Atualiza o tipo de usuário quando alterado
  const handleUserTypeChange = (tipo) => {
    setUserType(tipo);
    setError(""); // Limpar mensagens de erro ao trocar tipo de usuário
  };

  // Login direto com Supabase
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validação básica
    if (!username || !password) {
      setError("Por favor, preencha todos os campos");
      setLoading(false);
      return;
    }

    try {
      if (connectionError) {
        setError(
          "Não foi possível conectar ao servidor. Verifique sua conexão de internet."
        );
        setLoading(false);
        return;
      }

      console.log(`Tentando login para ${username} como ${userType}`);

      // Autenticação direta com o Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: username,
        password: password,
      });

      if (error) {
        console.error("Erro de autenticação:", error);
        setError(`Erro: ${error.message}`);
        setLoading(false);
        return;
      }

      if (!data || !data.session) {
        setError("Falha na autenticação. Nenhuma sessão criada.");
        setLoading(false);
        return;
      }

      console.log("Login bem-sucedido para:", username);

      // Carregar página inicial após login
      window.location.reload();
    } catch (error) {
      console.error("Exceção durante login:", error);

      // Mensagem de erro mais amigável
      let errorMessage =
        "Erro ao tentar login. Verifique sua conexão e tente novamente.";
      setError(errorMessage);
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

        {connectionError && connectionChecked && (
          <div className="connection-error">
            <p>❌ Problema de conexão com o servidor detectado.</p>
            <button
              onClick={() => window.location.reload()}
              className="reload-btn"
            >
              Tentar novamente
            </button>
          </div>
        )}

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

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Email</label>
            <input
              type="email"
              id="username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError(""); // Limpa o erro quando o usuário começa a digitar
              }}
              placeholder="Digite seu email"
              autoComplete="username"
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Senha</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(""); // Limpa o erro quando o usuário começa a digitar
              }}
              placeholder="Digite sua senha"
              autoComplete="current-password"
              disabled={loading}
              required
            />
          </div>

          {error && (
            <div className="error-message">
              <span role="img" aria-label="Error">
                ⚠️
              </span>{" "}
              {error}
            </div>
          )}

          <button
            type="submit"
            className={`login-button ${loading ? "loading" : ""}`}
            disabled={loading || connectionError}
          >
            {loading ? (
              <span className="loading-text">
                <span className="loading-spinner"></span>
                Entrando...
              </span>
            ) : (
              `Entrar como ${
                userType === "professor" ? "Professor" : "Administrador"
              }`
            )}
          </button>
        </form>

        <div className="login-footer">
          <p>© {new Date().getFullYear()} Iron House Fitness e Performance</p>
          <div className="connection-status">
            <span
              className={`status-indicator ${
                connectionError ? "offline" : "online"
              }`}
            ></span>
            {connectionError ? "Offline" : "Online"}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

import React, { useState, useEffect } from "react";
import "../styles/Login.css";
import logoCompleta from "../assets/logo_completa.png";
import {
  supabase,
  resetSupabaseClient,
  verifyRedirectURLs,
} from "../services/supabase";

const Login = ({ onLogin }) => {
  const [userType, setUserType] = useState("professor"); // 'professor' ou 'admin'
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [connectivityChecked, setConnectivityChecked] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const [domainInfo, setDomainInfo] = useState(null);

  // Estado para controlar o reset do cliente Supabase
  const [resettingClient, setResettingClient] = useState(false);
  const [resetMessage, setResetMessage] = useState("");

  // Verificar conectividade com Supabase e informações de redirecionamento ao carregar
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

        // Verificar informações de domínio e redirecionamento
        const redirectInfo = await verifyRedirectURLs();
        setDomainInfo(redirectInfo);
        console.log("Informações de domínio:", redirectInfo);
      } catch (err) {
        console.error("Exceção ao verificar conexão:", err.message);
        setConnectionError(true);
      } finally {
        setConnectivityChecked(true);
      }
    };

    checkSupabaseConnection();
  }, []);

  // Atualiza o tipo de usuário quando alterado
  const handleUserTypeChange = (tipo) => {
    setUserType(tipo);
    setError(""); // Limpar mensagens de erro ao trocar tipo de usuário
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
      // Verificar conectividade antes de tentar login
      if (connectionError) {
        setError(
          "Não foi possível conectar ao servidor. Verifique sua conexão de internet."
        );
        setLoading(false);
        return;
      }

      console.log(`Tentando login para ${username} como ${userType}`);

      // Usar o onLogin para autenticação com o Supabase
      const result = await onLogin(username, password);

      // Verificar resultado do login
      if (!result || !result.success) {
        const errorMessage =
          result?.message ||
          "Falha na autenticação. Verifique suas credenciais.";
        console.error("Erro de login:", errorMessage);

        setError(errorMessage);
        setLoading(false);

        // Adicionar vibração para feedback tátil em dispositivos móveis
        if (window.navigator && window.navigator.vibrate) {
          window.navigator.vibrate(200);
        }
      } else {
        console.log("Login bem-sucedido para:", username);
      }
      // Se não houver erro, o redirecionamento será feito pelo App.jsx
    } catch (error) {
      console.error("Exceção durante login:", error);

      // Mensagem de erro mais amigável baseada no tipo de erro
      let errorMessage =
        "Erro ao tentar login. Verifique sua conexão e tente novamente.";

      if (
        error.message?.includes("credentials") ||
        error.message?.includes("password")
      ) {
        errorMessage = "Credenciais inválidas. Verifique seu email e senha.";
      } else if (
        error.message?.includes("network") ||
        error.message?.includes("fetch")
      ) {
        errorMessage =
          "Problema de conexão com o servidor. Verifique sua internet.";
      } else if (error.message?.includes("too many")) {
        errorMessage =
          "Muitas tentativas de login. Tente novamente mais tarde.";
      }

      setError(errorMessage);
      setLoading(false);
    }
  };

  // Função para fazer login direto via Supabase
  const handleDirectLogin = async () => {
    try {
      setLoading(true);
      setError("");

      if (!username || !password) {
        setError("Por favor, preencha email e senha para login direto");
        setLoading(false);
        return;
      }

      console.log("Tentando login direto via Supabase...");
      console.log("Email:", username);

      // Autenticação simples direta com o Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: username,
        password: password,
      });

      if (error) {
        console.error("Erro no login direto:", error);
        setError(`Erro: ${error.message}`);
        setLoading(false);
        return;
      }

      if (data?.session) {
        console.log("Login direto bem-sucedido!");
        window.location.reload(); // Recarregar a página para atualizar o estado
      } else {
        setError("Login direto falhou: Nenhuma sessão retornada");
        setLoading(false);
      }
    } catch (error) {
      console.error("Exceção durante login direto:", error);
      setError(`Erro: ${error.message}`);
      setLoading(false);
    }
  };

  // Função para resetar o cliente Supabase
  const handleResetClient = async () => {
    setResettingClient(true);
    setResetMessage("");

    try {
      const result = await resetSupabaseClient();

      if (result.success) {
        setResetMessage(
          "Cliente resetado com sucesso. Tente fazer login agora."
        );
        // Limpar os campos de entrada
        setUsername("");
        setPassword("");
        setError("");
      } else {
        setResetMessage(
          "Erro ao resetar cliente: " + (result.error || "Erro desconhecido")
        );
      }
    } catch (error) {
      setResetMessage("Exceção ao resetar cliente: " + error.message);
    } finally {
      setResettingClient(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-logo">
          <img src={logoCompleta} alt="Iron House" />
          <h1>Fitness e Performance</h1>
        </div>

        {connectionError && connectivityChecked && (
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

        <form onSubmit={handleSubmit} className="login-form">
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

          <button
            type="button"
            onClick={handleDirectLogin}
            className="direct-login-button"
            disabled={loading || connectionError}
          >
            Login direto (recomendado)
          </button>
        </form>

        <div className="reset-section">
          <button
            onClick={handleResetClient}
            className="reset-button"
            disabled={resettingClient}
          >
            {resettingClient
              ? "Resetando..."
              : "Problemas para entrar? Resetar"}
          </button>

          {resetMessage && <div className="reset-message">{resetMessage}</div>}

          {domainInfo && (
            <div className="domain-info">
              <p>
                <strong>Solução de problemas:</strong>
              </p>
              <p>
                Domínio atual:{" "}
                <strong>
                  {typeof window !== "undefined"
                    ? window.location.hostname
                    : "desconhecido"}
                </strong>
              </p>
              <p>
                Ambiente:{" "}
                <strong>
                  {domainInfo.isProduction ? "Produção" : "Desenvolvimento"}
                </strong>
              </p>
              <p>
                Se estiver com problemas para entrar, utilize o botão "Login
                direto".
              </p>
            </div>
          )}
        </div>

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

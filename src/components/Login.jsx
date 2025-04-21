import React, { useState } from "react";
import "../styles/Login.css";
import logoCompleta from "../assets/logo_completa.png";
import { supabase } from "../services/supabase"; // Corrigido a importação para incluir as chaves
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
      // Verificação de campos
      if (!email || !password) {
        setError("Por favor, preencha todos os campos");
        setLoading(false);
        return;
      }

      console.log(`Tentando login para ${email} como ${userType}`);

      // Autenticação com o Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        console.error("Erro de autenticação:", error.message);
        setError("Email ou senha incorretos. Tente novamente.");
        setLoading(false);
        return;
      }

      // Verificar o tipo de usuário (professor ou admin)
      const { data: userData, error: userError } = await supabase
        .from("usuarios")
        .select("tipo, nome")
        .eq("email", email)
        .single();

      if (userError || !userData) {
        console.error("Erro ao obter tipo de usuário:", userError?.message);
        setError("Erro ao verificar perfil de usuário.");
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      // Verificar se o tipo de usuário corresponde ao selecionado
      if (userData.tipo !== userType) {
        setError(
          `Este usuário não é um ${
            userType === "professor" ? "professor" : "administrador"
          }. Selecione o tipo correto.`
        );
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      // Login bem-sucedido
      console.log("Login bem-sucedido:", userData);

      // Chamar a função de callback com os dados do usuário logado
      onLogin({
        id: data.user.id,
        email: data.user.email,
        nome: userData.nome,
        tipo: userData.tipo,
      });

      // Redirecionar para a página apropriada
      setLoading(false);
      navigate(userType === "admin" ? "/admin" : "/professor");
    } catch (err) {
      console.error("Exceção no login:", err.message);
      setError("Ocorreu um erro inesperado. Tente novamente mais tarde.");
      setLoading(false);
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

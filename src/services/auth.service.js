import supabase from "./supabase";

// Sistema de autenticação com Supabase
const authService = {
  // Registro de usuário
  async register(email, password, userData) {
    try {
      // Validar o e-mail antes de prosseguir
      if (!this.validateEmail(email)) {
        return { success: false, error: "Formato de email inválido" };
      }

      // Registrar o usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nome: userData.nome,
            role: userData.role || "professor",
          },
          // Não redirecionar automaticamente
          emailRedirectTo: window.location.origin,
        },
      });

      if (authError) {
        console.error("Erro durante registro:", authError);
        throw new Error(authError.message);
      }

      return { success: true, data: authData };
    } catch (error) {
      console.error("Exceção durante registro:", error);
      return { success: false, error: error.message };
    }
  },

  // Login de usuário
  async login(email, password) {
    try {
      console.log("Tentando login para:", email);
      console.log("Domínio atual:", window.location.hostname);

      // Usar Supabase para autenticação
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Erro de autenticação:", error);
        console.error("Código do erro:", error.status, error.name);
        throw new Error(error.message);
      }

      if (!data || !data.session) {
        console.error("Sessão não foi criada após login");
        throw new Error("Falha ao criar sessão de usuário");
      }

      // Verificar se o usuário tem role definido nos metadados
      const userRole = data.user?.user_metadata?.role;
      if (!userRole) {
        console.warn("Usuário não tem role definido nos metadados");
      }

      console.log("Login bem-sucedido:", data.user.email);
      console.log("Detalhes da sessão:", {
        expiry: data.session.expires_at,
        tokenType: data.session.token_type,
        userID: data.user.id,
      });

      return {
        success: true,
        data: {
          user: {
            id: data.user.id,
            email: data.user.email,
            role: userRole || "professor", // Fallback para professor se não estiver definido
            nome: data.user.user_metadata?.nome || "Usuário",
          },
          session: data.session,
        },
      };
    } catch (error) {
      console.error("Exceção durante login:", error);
      return {
        success: false,
        error: error.message,
        details: "Verifique suas credenciais e tente novamente",
      };
    }
  },

  // Valida formato de email
  validateEmail(email) {
    if (!email) return false;
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  },

  // Logout de usuário
  async logout() {
    try {
      console.log("Iniciando logout...");
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Erro durante logout:", error);
        throw new Error(error.message);
      }

      console.log("Logout realizado com sucesso");
      return { success: true };
    } catch (error) {
      console.error("Exceção durante logout:", error);
      return { success: false, error: error.message };
    }
  },

  // Obter usuário atual
  async getCurrentUser() {
    try {
      console.log("Verificando usuário atual...");

      // Primeiro tenta obter a sessão (mais rápido)
      const { data: sessionData } = await supabase.auth.getSession();

      if (!sessionData?.session) {
        console.log("Nenhuma sessão ativa encontrada");
        return { success: false, error: "Sem sessão ativa" };
      }

      // Se temos uma sessão, obtém os dados do usuário completos
      const { data, error } = await supabase.auth.getUser();

      if (error) {
        console.error("Erro ao obter usuário:", error);
        throw new Error(error.message);
      }

      if (!data.user) {
        console.log("Usuário não encontrado mesmo com sessão ativa");
        return { success: false, error: "Usuário não encontrado" };
      }

      console.log("Usuário atual recuperado com sucesso:", data.user.email);

      return {
        success: true,
        data: {
          id: data.user.id,
          email: data.user.email,
          nome: data.user.user_metadata?.nome || "Usuário",
          role: data.user.user_metadata?.role || "professor",
        },
      };
    } catch (error) {
      console.error("Exceção ao obter usuário atual:", error);
      return { success: false, error: error.message };
    }
  },

  // Verificar se a sessão é válida
  async verificarSessao() {
    try {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error("Erro ao verificar sessão:", error);
        return { valida: false, error: error.message };
      }

      const sessaoValida = !!data?.session;
      console.log("Sessão válida?", sessaoValida);

      return { valida: sessaoValida };
    } catch (error) {
      console.error("Exceção ao verificar sessão:", error);
      return { valida: false, error: error.message };
    }
  },

  // Criar usuário admin (usado na inicialização)
  async criarUsuarioAdmin() {
    try {
      // Verificar se já existe um admin
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "admin")
        .limit(1);

      if (error) {
        console.error("Erro ao verificar admin existente:", error.message);
        throw new Error(error.message);
      }

      if (data && data.length > 0) {
        return { success: true };
      }

      console.log("Criando usuário admin");
      // Se não existe, criar o usuário admin
      return await this.register("admin@example.com", "admin123", {
        nome: "Administrador",
        role: "admin",
      });
    } catch (error) {
      console.error("Exceção ao criar admin:", error.message);
      return { success: false, error: error.message };
    }
  },

  // Criar usuário professor (usado na inicialização)
  async criarUsuarioProfessor() {
    try {
      // Verificar se já existe um professor com este email
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("email", "professor@example.com")
        .limit(1);

      if (error) {
        console.error("Erro ao verificar professor existente:", error.message);
        throw new Error(error.message);
      }

      if (data && data.length > 0) {
        return { success: true };
      }

      console.log("Criando usuário professor");
      // Se não existe, criar o usuário professor
      return await this.register("professor@example.com", "professor123", {
        nome: "Professor",
        role: "professor",
      });
    } catch (error) {
      console.error("Exceção ao criar professor:", error.message);
      return { success: false, error: error.message };
    }
  },
};

export default authService;

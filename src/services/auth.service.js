import { supabase } from "./supabase";

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
        throw new Error(authError.message);
      }

      return { success: true, data: authData };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Login de usuário
  async login(email, password) {
    try {
      // Usar Supabase para autenticação
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data || !data.session) {
        throw new Error("Falha ao criar sessão de usuário");
      }

      // Verificar se o usuário tem role definido nos metadados
      const userRole = data.user?.user_metadata?.role;

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
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw new Error(error.message);
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Obter usuário atual
  async getCurrentUser() {
    try {
      // Primeiro tenta obter a sessão (mais rápido)
      const { data: sessionData } = await supabase.auth.getSession();

      if (!sessionData?.session) {
        return { success: false, error: "Sem sessão ativa" };
      }

      // Se temos uma sessão, obtém os dados do usuário completos
      const { data, error } = await supabase.auth.getUser();

      if (error) {
        throw new Error(error.message);
      }

      if (!data.user) {
        return { success: false, error: "Usuário não encontrado" };
      }

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
      return { success: false, error: error.message };
    }
  },

  // Verificar se a sessão é válida
  async verificarSessao() {
    try {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        return { valida: false, error: error.message };
      }

      const sessaoValida = !!data?.session;

      return { valida: sessaoValida };
    } catch (error) {
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
        throw new Error(error.message);
      }

      if (data && data.length > 0) {
        return { success: true };
      }

      // Se não existe, criar o usuário admin
      return await this.register("admin@example.com", "admin123", {
        nome: "Administrador",
        role: "admin",
      });
    } catch (error) {
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
        throw new Error(error.message);
      }

      if (data && data.length > 0) {
        return { success: true };
      }

      // Se não existe, criar o usuário professor
      return await this.register("professor@example.com", "professor123", {
        nome: "Professor",
        role: "professor",
      });
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
};

export default authService;

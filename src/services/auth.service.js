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

      if (error) throw new Error(error.message);

      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
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
      if (error) throw new Error(error.message);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Obter usuário atual
  async getCurrentUser() {
    try {
      const { data, error } = await supabase.auth.getUser();

      if (error) throw new Error(error.message);

      if (!data.user) {
        return { success: false, error: "Usuário não encontrado" };
      }

      return {
        success: true,
        data: {
          id: data.user.id,
          email: data.user.email,
          nome: data.user.user_metadata?.nome,
          role: data.user.user_metadata?.role,
        },
      };
    } catch (error) {
      return { success: false, error: error.message };
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

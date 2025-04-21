import supabase from "./supabase";

const usersService = {
  // Login de usuário
  login: async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { data };
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      throw error;
    }
  },

  // Registrar um novo usuário (requer perfil de admin)
  register: async (userData) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            nome: userData.nome,
            role: userData.role || "professor",
          },
        },
      });

      if (error) throw error;
      return { data };
    } catch (error) {
      console.error("Erro ao cadastrar usuário:", error);
      throw error;
    }
  },

  // Atualizar perfil do usuário
  updateProfile: async (userId, userData) => {
    try {
      // Primeiro, atualizar os metadados de autenticação se necessário
      let authUpdateResult = null;
      if (userData.email || userData.password) {
        const authUpdate = {};
        if (userData.email) authUpdate.email = userData.email;
        if (userData.password) authUpdate.password = userData.password;

        const { data, error } = await supabase.auth.admin.updateUserById(
          userId,
          authUpdate
        );

        if (error) throw error;
        authUpdateResult = data;
      }

      // Depois, atualizar o perfil na tabela profiles
      const profileData = {};
      if (userData.nome) profileData.nome = userData.nome;
      if (userData.role) profileData.role = userData.role;

      const { data, error } = await supabase
        .from("profiles")
        .update(profileData)
        .eq("id", userId)
        .select();

      if (error) throw error;

      return { data: { auth: authUpdateResult, profile: data } };
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
      throw error;
    }
  },

  // Obter dados do usuário atual
  getCurrentUser: async () => {
    try {
      const { data, error } = await supabase.auth.getUser();

      if (error) throw error;

      // Se não foi encontrado um usuário
      if (!data.user) {
        throw new Error("Usuário não encontrado");
      }

      return {
        data: {
          id: data.user.id,
          email: data.user.email,
          nome: data.user.user_metadata?.nome,
          role: data.user.user_metadata?.role,
        },
      };
    } catch (error) {
      console.error("Erro ao obter usuário atual:", error);
      throw error;
    }
  },

  // Listar todos os usuários (apenas para admins)
  listUsers: async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("nome");

      if (error) throw error;
      return { data };
    } catch (error) {
      console.error("Erro ao listar usuários:", error);
      throw error;
    }
  },

  // Deletar um usuário
  deleteUser: async (userId) => {
    try {
      // Admin API para deletar o usuário
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);

      if (authError) throw authError;

      return { success: true };
    } catch (error) {
      console.error("Erro ao deletar usuário:", error);
      throw error;
    }
  },
};

export default usersService;

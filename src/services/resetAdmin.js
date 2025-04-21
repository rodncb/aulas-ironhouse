import { supabase } from "./supabase";

/**
 * Função temporária para criar um novo usuário admin no Supabase
 * Use esta função apenas em desenvolvimento para resolver problemas de acesso
 */
export async function criarNovoAdmin() {
  try {
    console.log("Tentando criar um novo usuário admin...");

    // Gerar uma senha temporária forte
    const novaSenha = "IronHouse@2025"; // Você deve alterar esta senha após o login

    // Criar usuário admin no Supabase
    const { data, error } = await supabase.auth.signUp({
      email: "ironhouse.admin@example.com",
      password: novaSenha,
      options: {
        data: {
          nome: "Administrador IronHouse",
          role: "admin",
        },
      },
    });

    if (error) {
      console.error("Erro ao criar usuário admin:", error);
      return { success: false, error: error.message };
    }

    console.log("Novo usuário admin criado com sucesso!");
    console.log("Email:", "ironhouse.admin@example.com");
    console.log("Senha:", novaSenha);
    console.log(
      "IMPORTANTE: Faça login com estas credenciais e altere a senha imediatamente."
    );

    return {
      success: true,
      data: {
        email: "ironhouse.admin@example.com",
        senha: novaSenha,
      },
    };
  } catch (error) {
    console.error("Erro inesperado ao criar admin:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Função para atualizar os metadados de um usuário existente
 * Útil quando o usuário foi criado sem os metadados corretos
 */
export async function atualizarMetadados(email) {
  try {
    // Por segurança, verificamos se o usuário está logado
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError) {
      console.error("Erro ao obter usuário atual:", userError);
      return {
        success: false,
        error: "Você precisa estar logado para atualizar metadados",
      };
    }

    // Atualizar metadados do usuário
    const { data, error } = await supabase.auth.updateUser({
      data: {
        nome: "Administrador IronHouse",
        role: "admin",
      },
    });

    if (error) {
      console.error("Erro ao atualizar metadados:", error);
      return { success: false, error: error.message };
    }

    console.log("Metadados atualizados com sucesso!");
    return { success: true, data };
  } catch (error) {
    console.error("Erro inesperado ao atualizar metadados:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Função para criar um novo usuário professor no Supabase
 */
export async function criarNovoProfessor() {
  try {
    console.log("Tentando criar um novo usuário professor...");

    // Gerar uma senha temporária forte
    const novaSenha = "Professor@2025"; // Você deve alterar esta senha após o login

    // Criar usuário professor no Supabase
    const { data, error } = await supabase.auth.signUp({
      email: "professor@ironhouse.com.br",
      password: novaSenha,
      options: {
        data: {
          nome: "Professor IronHouse",
          role: "professor",
        },
      },
    });

    if (error) {
      console.error("Erro ao criar usuário professor:", error);
      return { success: false, error: error.message };
    }

    console.log("Novo usuário professor criado com sucesso!");
    console.log("Email:", "professor@ironhouse.com.br");
    console.log("Senha:", novaSenha);
    console.log(
      "IMPORTANTE: Faça login com estas credenciais e altere a senha imediatamente."
    );

    return {
      success: true,
      data: {
        email: "professor@ironhouse.com.br",
        senha: novaSenha,
      },
    };
  } catch (error) {
    console.error("Erro inesperado ao criar professor:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Função para atualizar os metadados para tornar o usuário um professor
 */
export async function atualizarMetadadosProfessor() {
  try {
    // Por segurança, verificamos se o usuário está logado
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError) {
      console.error("Erro ao obter usuário atual:", userError);
      return {
        success: false,
        error: "Você precisa estar logado para atualizar metadados",
      };
    }

    // Atualizar metadados do usuário
    const { data, error } = await supabase.auth.updateUser({
      data: {
        nome: "Professor IronHouse",
        role: "professor",
      },
    });

    if (error) {
      console.error("Erro ao atualizar metadados para professor:", error);
      return { success: false, error: error.message };
    }

    console.log("Metadados atualizados com sucesso para professor!");
    return { success: true, data };
  } catch (error) {
    console.error(
      "Erro inesperado ao atualizar metadados para professor:",
      error
    );
    return { success: false, error: error.message };
  }
}

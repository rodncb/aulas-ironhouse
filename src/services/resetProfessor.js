import { supabase } from "./supabase";

/**
 * Função para criar um novo usuário professor com o email prof@ironhouse.com
 */
export async function criarProfessorCorreto() {
  try {
    console.log(
      "Tentando criar um novo usuário professor com email correto..."
    );

    // Definir email e senha que correspondem aos usados na tentativa de login
    const email = "prof@ironhouse.com";
    const senha = "Professor@2025"; // Você deve alterar esta senha após o login

    // Criar usuário professor no Supabase
    // eslint-disable-next-line no-unused-vars
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: senha,
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
    console.log("Email:", email);
    console.log("Senha:", senha);
    console.log(
      "IMPORTANTE: Faça login com estas credenciais e altere a senha imediatamente."
    );

    return {
      success: true,
      data: {
        email: email,
        senha: senha,
      },
    };
  } catch (error) {
    console.error("Erro inesperado ao criar professor:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Função para verificar se o usuário professor existe
 */
export async function verificarProfessor() {
  try {
    console.log("Verificando se o usuário professor existe...");

    // Usar admin para verificar usuários não é recomendado em produção
    // Este é apenas um exemplo de verificação simplificada
    const { data, error } = await supabase.auth.signInWithPassword({
      email: "prof@ironhouse.com",
      password: "Professor@2025",
    });

    if (error) {
      console.log("Usuário professor não encontrado ou credenciais inválidas");
      return { success: false, error: error.message };
    }

    console.log("Usuário professor encontrado!");
    return { success: true, data };
  } catch (error) {
    console.error("Erro ao verificar professor:", error);
    return { success: false, error: error.message };
  }
}

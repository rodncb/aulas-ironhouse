import { supabase } from "./supabase";

/**
 * Função para criar um novo usuário professor com o email prof@ironhouse.com
 */
export async function criarProfessorCorreto() {
  try {
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
      return { success: false, error: error.message };
    }

    return {
      success: true,
      message: "Professor criado com sucesso",
      data: { email, senha },
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Função para verificar se o usuário professor existe
 */
export async function verificarProfessor() {
  try {
    // Usar admin para verificar usuários não é recomendado em produção
    // Este é apenas um exemplo de verificação simplificada
    const { data, error } = await supabase.auth.signInWithPassword({
      email: "prof@ironhouse.com",
      password: "Professor@2025",
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

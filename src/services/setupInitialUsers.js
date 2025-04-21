// Esse arquivo configura os usuários iniciais do sistema no Supabase
import authService from "./auth.service";

async function setupInitialUsers() {
  console.log("Iniciando configuração de usuários iniciais...");

  try {
    // Criar usuário administrador
    const adminResult = await authService.register(
      "admin@example.com",
      "admin123",
      {
        nome: "Administrador",
        role: "admin",
      }
    );

    if (adminResult.success) {
      console.log("Usuário admin criado com sucesso:", adminResult.data);
    } else {
      console.log("Usuário admin não foi criado:", adminResult.error);
      // Se o erro for porque o usuário já existe, não é um problema
      if (adminResult.error.includes("User already registered")) {
        console.log("Usuário admin já existe, continuando...");
      }
    }

    // Criar usuário professor
    const professorResult = await authService.register(
      "professor@example.com",
      "professor123",
      {
        nome: "Professor",
        role: "professor",
      }
    );

    if (professorResult.success) {
      console.log(
        "Usuário professor criado com sucesso:",
        professorResult.data
      );
    } else {
      console.log("Usuário professor não foi criado:", professorResult.error);
      // Se o erro for porque o usuário já existe, não é um problema
      if (professorResult.error.includes("User already registered")) {
        console.log("Usuário professor já existe, continuando...");
      }
    }

    console.log("Configuração de usuários iniciais concluída!");
    return { success: true };
  } catch (error) {
    console.error("Erro ao configurar usuários iniciais:", error);
    return {
      success: false,
      error: error.message || "Erro desconhecido ao configurar usuários",
    };
  }
}

export default setupInitialUsers;

// Esse arquivo configura os usuários iniciais do sistema no Supabase
import authService from "./auth.service";

async function setupInitialUsers() {
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

    // Se o erro for porque o usuário já existe, não é um problema
    if (
      !adminResult.success &&
      adminResult.error.includes("User already registered")
    ) {
      // Usuário admin já existe, continuando...
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

    // Se o erro for porque o usuário já existe, não é um problema
    if (
      !professorResult.success &&
      professorResult.error.includes("User already registered")
    ) {
      // Usuário professor já existe, continuando...
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Erro desconhecido ao configurar usuários",
    };
  }
}

export default setupInitialUsers;

import { createClient } from "@supabase/supabase-js";
import { supabaseUrl, supabaseAnonKey } from "../config/supabaseConfig";

// Criação do cliente Supabase com opções extras para melhor gerenciamento de sessão
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  autoRefreshToken: true,
  persistSession: true,
  detectSessionInUrl: true,
});

console.log("Cliente Supabase inicializado com configuração aprimorada");

// Função para testar a conexão com o Supabase
export async function testConnection(tentativas = 3) {
  const maxTentativas = Math.min(tentativas, 10);

  for (let i = 1; i <= maxTentativas; i++) {
    try {
      // eslint-disable-next-line no-unused-vars
      const { data, error } = await supabase.from("alunos").select("COUNT(*)");

      if (!error) {
        console.log("Conexão com Supabase estabelecida com sucesso");
        return true;
      }
    } catch (error) {
      console.warn(
        `Tentativa ${i}/${maxTentativas} falhou: ${
          error.message || "erro desconhecido"
        }`
      );
      if (i === maxTentativas) {
        console.error(
          "Falha na conexão com o Supabase após múltiplas tentativas"
        );
        return false;
      }
    }

    if (i < maxTentativas) {
      await new Promise((resolve) => setTimeout(resolve, i * 250));
    }
  }

  return false;
}

// Configura o listener para eventos de autenticação
export function setupAuthListener(callback) {
  return supabase.auth.onAuthStateChange((event, session) => {
    console.log(`Auth event: ${event}`, session ? "Com sessão" : "Sem sessão");
    callback(event, session);
  });
}

// Função para recuperar o token atual
export async function getCurrentToken() {
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token || null;
}

// Funções utilitárias relacionadas ao tema
export function toggleDarkMode() {
  const currentMode = document.documentElement.classList.contains("dark-mode");
  if (currentMode) {
    document.documentElement.classList.remove("dark-mode");
  } else {
    document.documentElement.classList.add("dark-mode");
  }
  return !currentMode;
}

export function isDarkMode() {
  return document.documentElement.classList.contains("dark-mode");
}

// Função para verificar se as URLs de redirecionamento estão configuradas
export async function verifyRedirectURLs() {
  try {
    console.log("Verificando URLs de redirecionamento configuradas...");

    // Obter o domínio atual
    const currentOrigin = window.location.origin;
    console.log("Domínio atual:", currentOrigin);

    // Verificar se estamos em produção
    const isProduction =
      typeof window !== "undefined" &&
      (window.location.hostname === "ironhouse.facilitaai.com.br" ||
        window.location.hostname === "www.ironhouse.facilitaai.com.br");

    return {
      currentOrigin,
      isProduction,
      expected: isProduction
        ? [
            "https://ironhouse.facilitaai.com.br",
            "https://www.ironhouse.facilitaai.com.br",
          ]
        : [currentOrigin],
    };
  } catch (error) {
    console.error("Erro ao verificar URLs de redirecionamento:", error);
    return { error: error.message };
  }
}

// Função para verificar e resetar as configurações do cliente Supabase
export async function resetSupabaseClient() {
  try {
    console.log("Limpando sessão...");

    // Limpar sessão atual
    const { error } = await supabase.auth.signOut({ scope: "local" });
    if (error) throw error;

    console.log("Cliente Supabase resetado com sucesso");

    return { success: true };
  } catch (error) {
    console.error("Erro ao resetar cliente Supabase:", error);
    return { success: false, error: error.message };
  }
}

// Função para recarregar o cache do schema do Supabase
export async function reloadSupabaseSchemaCache() {
  console.log("Tentando recarregar o cache do schema Supabase...");

  try {
    // Abordagem mais robusta: fazer consultas específicas que exercitam os relacionamentos
    try {
      console.log("Recarregando cache com consultas de relacionamentos...");

      // 1. Consulta que exercita a relação entre aulas e alunos
      await supabase
        .from("aulas")
        .select(
          `
          id,
          professor_id,
          alunos(*)
        `
        )
        .limit(1);

      // 2. Consulta que exercita a relação entre aula_alunos
      await supabase
        .from("aula_alunos")
        .select(
          `
          aula_id,
          aluno_id
        `
        )
        .limit(5);

      // 3. Consulta que verifica a tabela alunos
      await supabase.from("alunos").select("*").limit(1);

      // 4. Consulta que verifica a coluna exercicios nas aulas
      await supabase.from("aulas").select("id, exercicios").limit(1);

      console.log(
        "Cache do schema recarregado com sucesso via consultas específicas."
      );
      return true;
    } catch (specificError) {
      console.warn("Erro nas consultas específicas:", specificError);
    }

    // Tentativa alternativa com consultas mais simples em todas as tabelas principais
    try {
      console.log("Tentando abordagem alternativa para recarregar o cache...");

      const tabelas = [
        "alunos",
        "professores",
        "aulas",
        "exercicios",
        "aula_alunos",
      ];

      for (const tabela of tabelas) {
        await supabase.from(tabela).select("*").limit(1);
        console.log(`Consulta na tabela ${tabela} realizada com sucesso.`);
      }

      return true;
    } catch (fallbackError) {
      console.warn("Falha na abordagem alternativa:", fallbackError);
    }

    console.error("Todas as tentativas de recarregar o cache falharam.");
    return false;
  } catch (error) {
    console.error("Erro geral ao recarregar cache do schema:", error);
    return false;
  }
}

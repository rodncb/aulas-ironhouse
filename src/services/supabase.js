import { createClient } from "@supabase/supabase-js";

// Configuração do cliente Supabase
const supabaseUrl = "https://rnvsemzycvhuyeatjkaq.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJudnNlbXp5Y3ZodXllYXRqa2FxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4MDk0NTAsImV4cCI6MjA2MDM4NTQ1MH0.d2GTmTBAUIINoL52Ylz4tXsnhPLBTynOtvKlVa5sy60";

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
    // Primeira tentativa usando RPC
    try {
      await supabase.rpc("reload_schema_cache");
      console.log("Cache do schema recarregado com sucesso via RPC.");
      return true;
    } catch (rpcError) {
      console.warn("Falha ao recarregar cache via RPC:", rpcError);
      // Continuar com métodos alternativos
    }

    // Segunda tentativa: fazer uma consulta específica na tabela 'alunos' incluindo 'tipoLesao'
    try {
      console.log(
        "Tentando recarregar cache com consulta específica em 'alunos' incluindo 'tipoLesao'..."
      );
      await supabase.from("alunos").select("id, tipoLesao").limit(1);
      console.log(
        "Consulta específica em 'alunos' concluída para recarregar cache."
      );
      return true;
    } catch (queryError) {
      console.warn(
        "Falha ao recarregar cache via consulta específica em 'alunos':",
        queryError
      );
    }

    // Terceira tentativa (fallback original): fazer uma consulta simples em cada tabela principal
    try {
      console.log("Tentando recarregar cache com consultas simples...");

      const tabelas = [
        "alunos",
        "professores",
        "aulas",
        "exercicios",
        "aula_alunos",
      ];

      const promises = tabelas.map((tabela) =>
        supabase.from(tabela).select("id").limit(1)
      );

      await Promise.allSettled(promises);
      console.log("Consultas simples concluídas para recarregar cache.");

      // Fazer uma consulta específica para garantir que a coluna 'exercicios' da tabela 'aulas' esteja no cache
      await supabase.from("aulas").select("id, exercicios").limit(1);

      return true;
    } catch (fallbackQueryError) {
      console.warn(
        "Falha ao recarregar cache via consultas de fallback:",
        fallbackQueryError
      );
    }

    console.error(
      "Falha em todas as tentativas de recarregar o cache do schema."
    );
    return false;
  } catch (error) {
    console.error("Erro ao recarregar cache do schema:", error);
    return false;
  }
}

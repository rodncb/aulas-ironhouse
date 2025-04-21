import { createClient } from "@supabase/supabase-js";

// Configuração do cliente Supabase com chaves atualizadas
const supabaseUrl = "https://rnvsemzycvhuyeatjkaq.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJudnNlbXp5Y3ZodXllYXRqa2FxIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NzY1MDAxMTQsImV4cCI6MTk5MjA3NjExNH0.8TxLqnYMATIOkisR7HM5yJjkMO6C4kF_GCiLIL9BX4M";

// Determina se estamos em produção baseado no domínio
const isProduction =
  typeof window !== "undefined" &&
  (window.location.hostname === "ironhouse.facilitaai.com.br" ||
    window.location.hostname === "www.ironhouse.facilitaai.com.br");

console.log(
  "Ambiente detectado:",
  isProduction ? "Produção" : "Desenvolvimento"
);
console.log(
  "Hostname:",
  typeof window !== "undefined" ? window.location.hostname : "indefinido"
);

// Criação do cliente Supabase com configuração simplificada
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

console.log("Cliente Supabase configurado com configuração padrão");

if (typeof window !== "undefined") {
  // Observer para eventos de autenticação
  supabase.auth.onAuthStateChange((event, session) => {
    console.log(
      "Evento Auth:",
      event,
      "Sessão:",
      session ? "Presente" : "Ausente"
    );

    // Log adicional para depuração
    if (session) {
      console.log("Usuário autenticado:", {
        id: session.user.id,
        email: session.user.email,
        role: session.user.user_metadata?.role || "desconhecido",
      });
    }
  });

  // Verificar e exibir token atual
  supabase.auth.getSession().then(({ data, error }) => {
    if (data?.session) {
      console.log("Sessão existente detectada");
    } else if (error) {
      console.error("Erro ao verificar sessão:", error.message);
    } else {
      console.log("Nenhuma sessão encontrada");
    }
  });
}

// Função para recarregar o cache do schema do Supabase
export async function reloadSupabaseSchemaCache() {
  try {
    await supabase.rpc("reload_schema_cache");
    return true;
  } catch (error) {
    try {
      const { error: sqlError } = await supabase.rpc("execute_sql", {
        sql_query: "SELECT pg_reload_conf();",
      });

      if (sqlError) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }
}

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

    // Verificar se o domínio atual está nas URLs de redirecionamento
    console.log(
      "Para que a autenticação funcione corretamente, certifique-se de que este domínio está configurado nas URLs de redirecionamento no Supabase Auth Settings."
    );

    // Verificar se estamos em produção
    if (isProduction) {
      console.log(
        "Ambiente de produção detectado. URLs de redirecionamento devem incluir:",
        "https://ironhouse.facilitaai.com.br",
        "https://www.ironhouse.facilitaai.com.br"
      );
    }

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

    // Limpar todas as sessões
    await supabase.auth.signOut();

    console.log("Cliente Supabase resetado.");

    return { success: true };
  } catch (error) {
    console.error("Erro ao resetar cliente Supabase:", error);
    return { success: false, error: error.message };
  }
}

// Exporta o cliente Supabase
export { supabase };

// Export default para manter compatibilidade
export default supabase;

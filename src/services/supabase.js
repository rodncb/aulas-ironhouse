import { createClient } from "@supabase/supabase-js";

// Configuração do cliente Supabase com chaves atualizadas
const supabaseUrl = "https://rnvsemzycvhuyeatjkaq.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJudnNlbXp5Y3ZodXllYXRqa2FxIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NzY1MDAxMTQsImV4cCI6MTk5MjA3NjExNH0.8TxLqnYMATIOkisR7HM5yJjkMO6C4kF_GCiLIL9BX4M";

// Checando se estamos em produção ou desenvolvimento
const isProduction = window.location.hostname === 'ironhouse.facilitaai.com.br';

// Opções para o cliente Supabase
const options = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: isProduction ? localStorage : undefined, // Use localStorage em produção
    storageKey: 'ironhouse-auth', // Usar chave simples
  }
};

// Inicializa o cliente Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey, options);

// Adicionar interceptor de debug para autenticação (em modo de desenvolvimento)
if (process.env.NODE_ENV !== 'production') {
  console.log('Supabase client initialized with URL:', supabaseUrl);
  
  // Observer para eventos de autenticação
  supabase.auth.onAuthStateChange((event, session) => {
    console.log('Auth event:', event, 'Session:', session ? 'Present' : 'None');
  });
}

// Função para recarregar o cache do schema do Supabase
export async function reloadSupabaseSchemaCache() {
  try {
    await supabase.rpc('reload_schema_cache');
    return true;
  } catch (error) {
    try {
      const { error: sqlError } = await supabase.rpc('execute_sql', {
        sql_query: 'SELECT pg_reload_conf();'
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
      const { data, error } = await supabase.from('alunos').select('COUNT(*)');
      
      if (!error) {
        return true;
      }
    } catch (error) {
      if (i === maxTentativas) {
        console.error('Falha na conexão com o Supabase');
        return false;
      }
    }
    
    if (i < maxTentativas) {
      await new Promise(resolve => setTimeout(resolve, i * 250));
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

// Funções utilitárias relacionadas ao tema
export function toggleDarkMode() {
  const currentMode = document.documentElement.classList.contains('dark-mode');
  if (currentMode) {
    document.documentElement.classList.remove('dark-mode');
  } else {
    document.documentElement.classList.add('dark-mode');
  }
  return !currentMode;
}

export function isDarkMode() {
  return document.documentElement.classList.contains('dark-mode');
}

// Exporta o cliente Supabase
export { supabase };

// Export default para manter compatibilidade
export default supabase;

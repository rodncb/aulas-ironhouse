// Configuração do Supabase para diferentes ambientes
// Este arquivo centraliza a configuração de URLs e chaves para facilitar o deploy

// A chave anônima do Supabase é segura para incluir no cliente
// Nunca inclua chaves de serviço ou chaves com privilégios elevados no front-end

// Chave anônima correta para desenvolvimento e produção
const SUPABASE_URL = "https://rnvsemzycvhuyeatjkaq.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJudnNlbXp5Y3ZodXllYXRqa2FxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4MDk0NTAsImV4cCI6MjA2MDM4NTQ1MH0.d2GTmTBAUIINoL52Ylz4tXsnhPLBTynOtvKlVa5sy60";

// Configura a URL e a chave do Supabase baseado no ambiente
const supabaseConfig = {
  // Ambiente de produção (GitHub Pages)
  production: {
    url: SUPABASE_URL,
    anonKey: SUPABASE_ANON_KEY
  },
  
  // Ambiente de desenvolvimento (local)
  development: {
    url: process.env.REACT_APP_SUPABASE_URL || SUPABASE_URL,
    anonKey: process.env.REACT_APP_SUPABASE_KEY || SUPABASE_ANON_KEY
  }
};

// Determinar qual ambiente está sendo usado
const environment = process.env.NODE_ENV === "production" ? "production" : "development";

// Exportar a configuração para o ambiente atual
export const supabaseUrl = supabaseConfig[environment].url;
export const supabaseAnonKey = supabaseConfig[environment].anonKey;

// Criar objeto de configuração para exportação padrão
const config = {
  url: supabaseUrl,
  key: supabaseAnonKey
};

export default config;

// Configuração do Supabase para diferentes ambientes
// Este arquivo centraliza a configuração de URLs e chaves para facilitar o deploy

import { createClient } from "@supabase/supabase-js";

// A chave anônima do Supabase é segura para incluir no cliente
// Nunca inclua chaves de serviço ou chaves com privilégios elevados no front-end

// Chave anônima correta para desenvolvimento e produção
const SUPABASE_URL = "https://rnvsemzycvhuyeatjkaq.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJudnNlbXp5Y3ZodXllYXRqa2FxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4MDk0NTAsImV4cCI6MjA2MDM4NTQ1MH0.d2GTmTBAUIINoL52Ylz4tXsnhPLBTynOtvKlVa5sy60";

// Determinar qual ambiente está sendo usado
const environment =
  process.env.NODE_ENV === "production" ? "production" : "development";

// Obter a URL e a chave para o ambiente atual
const supabaseUrl =
  environment === "production"
    ? SUPABASE_URL
    : process.env.REACT_APP_SUPABASE_URL || SUPABASE_URL;

const supabaseAnonKey =
  environment === "production"
    ? SUPABASE_ANON_KEY
    : process.env.REACT_APP_SUPABASE_KEY || SUPABASE_ANON_KEY;

// Criar e exportar a instância do cliente Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;

// Exportar URL e Chave separadamente (opcional, se ainda forem necessários em algum lugar)
export { supabaseUrl, supabaseAnonKey };

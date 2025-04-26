// Script para adicionar administradores como professores
const { createClient } = require("@supabase/supabase-js");

// Configurar cliente do Supabase
const supabaseUrl =
  process.env.REACT_APP_SUPABASE_URL ||
  "https://mpcchupbibmhwkhxqqnm.supabase.co";
const supabaseKey =
  process.env.REACT_APP_SUPABASE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wY2NodXBiaWJtaHdraHhxcW5tIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTc3MzM5NzIsImV4cCI6MjAxMzMwOTk3Mn0.wc7eb0aMqDGCsfELWWRxsrkE_qx7KQr5xU5hKLkO9YA";

// Criar cliente do Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Script para adicionar administradores como professores no sistema
 * Isso permitirá que os administradores também apareçam na lista de professores
 * e possam iniciar aulas
 */

// Lista de administradores para adicionar como professores
const adminProfessores = [
  {
    id: "930b8d22-a623-48d1-a6bf-13cd8ca8e9d7", // UID do Supabase
    nome: "Marco Fernandes",
    email: "marcovfernandes89@gmail.com",
    role: "admin",
    isAdmin: true,
  },
  {
    id: "7318009d-8a2a-4ec8-a8fb-34d7bd74f6ba", // UID do Supabase
    nome: "Fabio Augusto",
    email: "fabioaugustogp@gmail.com", // Corrigindo o email (estava sem o 'l')
    role: "admin",
    isAdmin: true,
  },
  {
    id: "414cb5a8-1422-4bf8-bc5e-7b25f4228495", // UID do Supabase
    nome: "Rafael Fernandes",
    email: "fernandesrafa97@gmail.com",
    role: "admin",
    isAdmin: true,
  },
];

async function inserirAdminComoProfessores() {
  console.log("Inserindo administradores como professores...");

  try {
    // Para cada administrador na lista
    for (const professor of adminProfessores) {
      // Verificar se já existe um professor com esse ID
      const { data: existingProfessor, error: checkError } = await supabase
        .from("professores")
        .select("*")
        .eq("id", professor.id)
        .maybeSingle();

      if (checkError) {
        console.error(
          `Erro ao verificar professor ${professor.nome}:`,
          checkError
        );
        continue;
      }

      if (existingProfessor) {
        console.log(
          `Professor já existe para ${professor.nome} (${professor.id})`
        );
        continue;
      }

      // Inserir o professor no banco de dados
      const { data, error } = await supabase
        .from("professores")
        .insert([professor])
        .select();

      if (error) {
        console.error(`Erro ao inserir professor ${professor.nome}:`, error);
      } else {
        console.log(`Professor inserido com sucesso: ${professor.nome}`);
      }
    }

    console.log("Processo finalizado!");
  } catch (error) {
    console.error("Erro durante o processo:", error);
  } finally {
    // Encerrar a conexão
    process.exit(0);
  }
}

// Executar a função
inserirAdminComoProfessores();

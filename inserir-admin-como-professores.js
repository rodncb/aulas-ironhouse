import { supabase } from "./src/services/supabase.js";

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
    email: "fabioaugustogp@gmai.com",
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
      const { data: existingProfessor } = await supabase
        .from("professores")
        .select("*")
        .eq("id", professor.id)
        .single();

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

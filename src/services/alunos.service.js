import { supabase } from "./supabase";

// Função auxiliar para emitir evento de erro de cache
const emitSchemaCacheError = (error) => {
  if (error && error.message && error.message.includes("schema cache")) {
    // Disparar evento personalizado para notificar App.js
    const event = new CustomEvent("schema-cache-error", {
      detail: { message: error.message },
    });
    window.dispatchEvent(event);
    console.warn(
      "Erro de cache do esquema detectado. Evento disparado para possível recarga."
    );
  }
};

// Funções individuais
async function getAll() {
  try {
    const { data, error } = await supabase
      .from("alunos")
      .select("*")
      .order("nome");

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Erro ao buscar alunos:", error);
    emitSchemaCacheError(error);
    throw error;
  }
}

async function createAluno(alunoData) {
  try {
    const { data, error } = await supabase
      .from("alunos")
      .insert([
        {
          ...alunoData,
          // Garantir que os campos opcionais sejam nulos se vazios
          // Corrigido para usar tipoLesao consistentemente
          tipoLesao: alunoData.tipoLesao || null,
          objetivo: alunoData.objetivo || null,
        },
      ])
      .select();

    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error("Erro ao criar aluno:", error);
    emitSchemaCacheError(error);
    throw error;
  }
}

async function updateAluno(id, alunoData) {
  try {
    // Garantir que o id seja válido
    if (!id) {
      throw new Error("ID do aluno não fornecido");
    }

    // Log detalhado para debug
    console.log(
      `[updateAluno] Iniciando atualização do aluno ${id} com dados:`,
      alunoData
    );

    // Tratar caso especial de atualização de status
    if (alunoData.status !== undefined) {
      console.log(
        `[updateAluno] Atualizando status do aluno para: ${alunoData.status}`
      );

      // Garantir que o status seja uma string válida
      if (typeof alunoData.status !== "string") {
        alunoData.status = alunoData.status ? "ativo" : "inativo";
      }
    }

    // Executar a atualização no Supabase
    const { data, error } = await supabase
      .from("alunos")
      .update(alunoData)
      .eq("id", id)
      .select();

    if (error) {
      console.error("[updateAluno] Erro do Supabase:", error);
      // Verificar se é um erro de cache de esquema
      emitSchemaCacheError(error);
      throw error;
    }

    if (!data || data.length === 0) {
      console.warn(
        `[updateAluno] Nenhum dado retornado ao atualizar aluno ${id}`
      );

      // Tente buscar o aluno para confirmar se a atualização foi bem-sucedida
      const { data: alunoAtualizado, error: erroConsulta } = await supabase
        .from("alunos")
        .select("*")
        .eq("id", id)
        .single();

      if (erroConsulta) {
        console.error(
          "[updateAluno] Erro ao verificar atualização:",
          erroConsulta
        );
        throw new Error("Erro ao verificar a atualização do aluno");
      }

      if (alunoAtualizado) {
        console.log(
          "[updateAluno] Aluno encontrado após atualização:",
          alunoAtualizado
        );
        return alunoAtualizado;
      }

      return null;
    }

    console.log("[updateAluno] Aluno atualizado com sucesso:", data[0]);
    return data[0];
  } catch (error) {
    console.error("[updateAluno] Erro ao atualizar aluno:", error);
    emitSchemaCacheError(error);
    throw error;
  }
}

async function deleteAluno(id) {
  try {
    const { error } = await supabase.from("alunos").delete().eq("id", id);

    if (error) {
      emitSchemaCacheError(error);
      throw error;
    }
  } catch (error) {
    console.error("Erro ao deletar aluno:", error);
    emitSchemaCacheError(error);
    throw error;
  }
}

// Nova função para buscar a última aula realizada por um aluno
async function getUltimaAulaRealizada(alunoId) {
  try {
    // 1. Encontrar os IDs das aulas que o aluno participou
    const { data: aulaAlunosData, error: aulaAlunosError } = await supabase
      .from("aula_alunos")
      .select("aula_id")
      .eq("aluno_id", alunoId);

    if (aulaAlunosError) throw aulaAlunosError;
    if (!aulaAlunosData || aulaAlunosData.length === 0) {
      return null; // Aluno não participou de nenhuma aula
    }

    const aulaIds = aulaAlunosData.map((item) => item.aula_id);

    // 2. Buscar a aula mais recente com status 'realizada' entre essas aulas
    const { data: ultimaAulaData, error: ultimaAulaError } = await supabase
      .from("aulas")
      .select("data, status")
      .in("id", aulaIds)
      .eq("status", "realizada")
      .order("data", { ascending: false })
      .limit(1)
      .maybeSingle(); // Use maybeSingle para retornar null se não encontrar

    if (ultimaAulaError) throw ultimaAulaError;

    return ultimaAulaData; // Retorna a última aula realizada ou null
  } catch (error) {
    console.error("Erro ao buscar última aula realizada do aluno:", error);
    // Não emitir erro de cache aqui, pois pode ser um erro esperado (ex: aluno novo)
    // emitSchemaCacheError(error);
    throw error; // Propagar o erro para ser tratado no componente
  }
}

// Exportar funções individuais para compatibilidade com código existente
export {
  getAll as getAlunos,
  createAluno,
  updateAluno,
  deleteAluno,
  getUltimaAulaRealizada,
}; // Adicionar nova função

// Exportar o objeto de serviço como padrão
const alunosService = {
  getAll,
  createAluno,
  updateAluno,
  deleteAluno,
  getUltimaAulaRealizada, // Adicionar nova função
};

export default alunosService;

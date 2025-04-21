import { supabase, reloadSupabaseSchemaCache } from "./supabase";

/**
 * Obtém um aluno específico pelo ID
 * @param {string} id - ID do aluno
 * @returns {Promise<Object>} - Objeto com os dados do aluno
 */
export const obterAlunoPorId = async (id) => {
  try {
    const { data, error } = await supabase
      .from("alunos")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    // Mapear status para o campo ativo
    return {
      ...data,
      ativo: data.status === "ativo",
    };
  } catch (error) {
    console.error("Erro ao buscar aluno:", error);
    throw error;
  }
};

/**
 * Atualiza o status de um aluno
 * @param {string} id - ID do aluno
 * @param {boolean} ativo - Novo status do aluno
 * @returns {Promise<Object>} - Objeto com os dados atualizados do aluno
 */
export const atualizarStatusAluno = async (id, ativo) => {
  try {
    const { data, error } = await supabase
      .from("alunos")
      .update({ status: ativo ? "ativo" : "inativo" })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return {
      ...data,
      ativo: data.status === "ativo",
    };
  } catch (error) {
    console.error("Erro ao atualizar status do aluno:", error);
    throw error;
  }
};

/**
 * Obtém o histórico de aulas de um aluno
 * @param {string} alunoId - ID do aluno
 * @returns {Promise<Array>} - Array com as aulas do aluno
 */
export const obterHistoricoAulasPorAluno = async (alunoId) => {
  try {
    // Primeiro, buscamos todas as aulas relacionadas a esse aluno
    const { data: aulaAlunos, error: errorAulaAlunos } = await supabase
      .from("aula_alunos")
      .select("aula_id")
      .eq("aluno_id", alunoId);

    if (errorAulaAlunos) throw errorAulaAlunos;

    if (!aulaAlunos || aulaAlunos.length === 0) {
      return [];
    }

    // Extraímos os IDs das aulas
    const aulasIds = aulaAlunos.map((item) => item.aula_id);

    // Buscamos os detalhes completos das aulas
    const { data: aulas, error: errorAulas } = await supabase
      .from("aulas")
      .select(
        `
        *,
        professor:professor_id (id, nome, especialidade),
        aula_alunos!inner (
          aluno_id
        )
      `
      )
      .in("id", aulasIds)
      .order("data", { ascending: false });

    if (errorAulas) throw errorAulas;

    if (!aulas || aulas.length === 0) {
      return [];
    }

    // Para cada aula, vamos buscar os alunos participantes e os exercícios
    const aulasCompletas = await Promise.all(
      aulas.map(async (aula) => {
        // Buscar todos os alunos desta aula
        const { data: alunosAula, error: errorAlunos } = await supabase
          .from("aula_alunos")
          .select("alunos:aluno_id (id, nome, idade, lesao, objetivo)")
          .eq("aula_id", aula.id);

        if (errorAlunos) {
          console.error("Erro ao buscar alunos da aula:", errorAlunos);
        }

        // Extrair os alunos do resultado
        const alunos = alunosAula
          ? alunosAula.map((item) => item.alunos).filter(Boolean)
          : [];

        // Buscar exercícios se houver
        let exercicios = [];
        if (aula.exercicios_ids && aula.exercicios_ids.length > 0) {
          const { data: exerciciosData, error: errorExercicios } =
            await supabase
              .from("exercicios")
              .select("*")
              .in("id", aula.exercicios_ids);

          if (!errorExercicios) {
            exercicios = exerciciosData || [];
          }
        }

        return {
          ...aula,
          alunos,
          exercicios,
        };
      })
    );

    return aulasCompletas;
  } catch (error) {
    console.error("Erro ao buscar histórico de aulas do aluno:", error);
    throw error;
  }
};

/**
 * Atualiza os dados de um aluno
 * @param {string} id - ID do aluno
 * @param {Object} dadosAluno - Novos dados do aluno
 * @returns {Promise<Object>} - Objeto com os dados atualizados do aluno
 */
export const atualizarAluno = async (id, dadosAluno) => {
  try {
    // Forçar a recarga do cache do esquema antes de qualquer operação
    await reloadSupabaseSchemaCache();

    // Verifica se a idade é uma string e converte para número
    if (dadosAluno.idade && typeof dadosAluno.idade === "string") {
      dadosAluno.idade = parseInt(dadosAluno.idade);
    }

    console.log("Enviando dados para atualização:", dadosAluno);

    // Faz a atualização
    const { data, error } = await supabase
      .from("alunos")
      .update(dadosAluno)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Erro do Supabase:", error);
      throw error;
    }

    console.log("Dados atualizados com sucesso:", data);

    return {
      ...data,
      ativo: data.status === "ativo",
    };
  } catch (error) {
    console.error("Erro ao atualizar dados do aluno:", error);
    throw error;
  }
};

/**
 * Garante que as colunas plano e nivel existam na tabela alunos
 * Tenta atualizar um aluno existente com esses campos para criar as colunas
 */
export const garantirColunasExistem = async () => {
  try {
    console.log("Tentando garantir que as colunas plano e nivel existam...");

    // Primeiro, vamos tentar buscar um aluno qualquer
    const { data: alunos, error: errorBusca } = await supabase
      .from("alunos")
      .select("id")
      .limit(1);

    if (errorBusca) {
      console.error("Erro ao buscar alunos:", errorBusca);
      return false;
    }

    if (!alunos || alunos.length === 0) {
      console.log("Nenhum aluno encontrado para testar");
      return false;
    }

    // Vamos tentar atualizar o primeiro aluno com os campos plano e nivel
    // Se as colunas não existirem, elas serão criadas automaticamente
    const alunoId = alunos[0].id;
    const { error: errorUpdate } = await supabase
      .from("alunos")
      .update({
        plano: "8 Check-in",
        nivel: "Iniciante",
      })
      .eq("id", alunoId);

    if (errorUpdate) {
      console.error("Erro ao garantir colunas:", errorUpdate);
      return false;
    }

    console.log("Colunas plano e nivel verificadas com sucesso");
    return true;
  } catch (err) {
    console.error("Erro ao garantir colunas:", err);
    return false;
  }
};

// Exportamos as funções individualmente acima
// E também como um objeto de serviço abaixo
const AlunosService = {
  obterAlunoPorId,
  atualizarStatusAluno,
  obterHistoricoAulasPorAluno,
  atualizarAluno,
  garantirColunasExistem,
};

export default AlunosService;

import { supabase } from "./supabase";

/**
 * Serviço para gerenciar a relação entre aulas e alunos utilizando a tabela de junção aula_alunos
 */
export const aulaAlunosService = {
  /**
   * Adiciona um aluno a uma aula
   * @param {string} aulaId - ID da aula
   * @param {string} alunoId - ID do aluno
   * @returns {Promise<Object>} - Os dados da relação criada
   */
  async adicionarAluno(aulaId, alunoId) {
    const { data, error } = await supabase
      .from("aula_alunos")
      .insert([{ aula_id: aulaId, aluno_id: alunoId }])
      .select()
      .single();

    if (error) {
      // Se o erro for de duplicação (aluno já na aula), retorna um objeto de erro específico
      if (error.code === "23505") {
        // Código para violação de restrição unique
        return {
          error: true,
          message: "Este aluno já está na aula",
          isDuplicate: true,
        };
      }
      throw error;
    }
    return data;
  },

  /**
   * Remove um aluno de uma aula
   * @param {string} aulaId - ID da aula
   * @param {string} alunoId - ID do aluno
   * @returns {Promise<boolean>} - Verdadeiro se a remoção foi bem-sucedida
   */
  async removerAluno(aulaId, alunoId) {
    const { error } = await supabase
      .from("aula_alunos")
      .delete()
      .match({ aula_id: aulaId, aluno_id: alunoId });

    if (error) throw error;
    return true;
  },

  /**
   * Obtém todos os alunos de uma aula
   * @param {string} aulaId - ID da aula
   * @returns {Promise<Array>} - Lista de alunos com dados completos
   */
  async getAlunosDaAula(aulaId) {
    const { data, error } = await supabase
      .from("aula_alunos")
      .select("aluno_id")
      .eq("aula_id", aulaId);

    if (error) throw error;

    if (data.length === 0) return [];

    // Obter os dados completos dos alunos
    const alunoIds = data.map((item) => item.aluno_id);
    const { data: alunos, error: alunosError } = await supabase
      .from("alunos")
      .select("*")
      .in("id", alunoIds);

    if (alunosError) throw alunosError;
    return alunos;
  },

  /**
   * Atualiza a lista de alunos de uma aula
   * @param {string} aulaId - ID da aula
   * @param {Array<string>} alunoIds - Lista de IDs de alunos
   * @returns {Promise<boolean>} - Verdadeiro se a atualização foi bem-sucedida
   */
  async atualizarAlunosDaAula(aulaId, alunoIds) {
    // Primeiro, remover todos os alunos atuais da aula
    const { error: deleteError } = await supabase
      .from("aula_alunos")
      .delete()
      .eq("aula_id", aulaId);

    if (deleteError) throw deleteError;

    // Se não temos novos alunos para adicionar, retorna
    if (!alunoIds || alunoIds.length === 0) return true;

    // Adicionar os novos alunos
    const novasRelacoes = alunoIds.map((alunoId) => ({
      aula_id: aulaId,
      aluno_id: alunoId,
    }));

    const { error: insertError } = await supabase
      .from("aula_alunos")
      .insert(novasRelacoes);

    if (insertError) throw insertError;
    return true;
  },

  /**
   * Atualiza o número total de alunos em uma aula
   * @param {string} aulaId - ID da aula
   * @returns {Promise<number>} - Número total de alunos atualizado
   */
  async atualizarTotalAlunos(aulaId) {
    // Obter contagem de alunos
    const { count, error: countError } = await supabase
      .from("aula_alunos")
      .select("*", { count: "exact", head: true })
      .eq("aula_id", aulaId);

    if (countError) throw countError;

    console.log(
      `Atualizando contador de alunos para aula ${aulaId}: ${count} alunos`
    );

    // Atualizar o campo total_alunos na aula
    const { data, error: updateError } = await supabase
      .from("aulas")
      .update({
        total_alunos: count,
        totalAlunos: count, // Atualizar ambos os campos para garantir compatibilidade
      })
      .eq("id", aulaId)
      .select()
      .single();

    if (updateError) throw updateError;

    console.log(
      `Contador atualizado com sucesso: ${data.total_alunos} alunos para aula ${aulaId}`
    );

    return data.total_alunos;
  },
};

export default aulaAlunosService;

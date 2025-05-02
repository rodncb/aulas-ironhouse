import supabase from "../config/supabaseConfig.js"; // Corrigido: Importação default do caminho correto

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
    try {
      // Verificar se os IDs são válidos
      if (!aulaId || !alunoId) {
        return {
          error: true,
          message: "IDs de aula ou aluno inválidos",
          details: { aulaId, alunoId },
        };
      }

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
        return {
          error: true,
          message: error.message || "Erro ao adicionar aluno à aula",
          details: error,
        };
      }

      return data;
    } catch (err) {
      return {
        error: true,
        message: err.message || "Erro inesperado ao adicionar aluno",
        details: err,
      };
    }
  },

  /**
   * Remove um aluno de uma aula
   * @param {string} aulaId - ID da aula
   * @param {string} alunoId - ID do aluno
   * @returns {Promise<boolean>} - Verdadeiro se a remoção foi bem-sucedida
   */
  async removerAluno(aulaId, alunoId) {
    try {
      // Validar parâmetros
      if (!aulaId || !alunoId) {
        return false;
      }

      // Verificar se a relação existe antes de tentar remover
      const { data: existingRelation, error: checkError } = await supabase
        .from("aula_alunos")
        .select("*")
        .eq("aula_id", aulaId)
        .eq("aluno_id", alunoId)
        .maybeSingle();

      if (checkError) {
        throw checkError;
      }

      // Se não existe relação, não precisamos fazer nada
      if (!existingRelation) {
        return true;
      }

      // Remover a relação
      const { error } = await supabase
        .from("aula_alunos")
        .delete()
        .match({ aula_id: aulaId, aluno_id: alunoId });

      if (error) {
        throw error;
      }

      return true;
    } catch (err) {
      throw err;
    }
  },

  /**
   * Obtém todos os alunos de uma aula
   * @param {string} aulaId - ID da aula
   * @returns {Promise<Array>} - Lista de alunos com dados completos
   */
  async getAlunosDaAula(aulaId) {
    try {
      // Validar parâmetro
      if (!aulaId) {
        return [];
      }

      const { data, error } = await supabase
        .from("aula_alunos")
        .select("aluno_id")
        .eq("aula_id", aulaId);

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        return [];
      }

      // Obter os dados completos dos alunos
      const alunoIds = data.map((item) => item.aluno_id);

      const { data: alunos, error: alunosError } = await supabase
        .from("alunos")
        .select("*")
        .in("id", alunoIds);

      if (alunosError) {
        throw alunosError;
      }

      return alunos || [];
    } catch (err) {
      // Retornar array vazio em vez de propagar o erro para evitar quebrar a UI
      return [];
    }
  },

  /**
   * Atualiza a lista de alunos de uma aula
   * @param {string} aulaId - ID da aula
   * @param {Array<string>} alunoIds - Lista de IDs de alunos
   * @returns {Promise<boolean>} - Verdadeiro se a atualização foi bem-sucedida
   */
  async atualizarAlunosDaAula(aulaId, alunoIds) {
    try {
      // Validar entrada
      if (!aulaId) {
        return false;
      }

      if (!Array.isArray(alunoIds)) {
        return false;
      }

      // Filtrar apenas IDs válidos (não nulos, não undefined, não vazios)
      const alunoIdsValidos = alunoIds.filter(
        (id) => id && id.toString().trim() !== ""
      );

      // Primeiro, remover todos os alunos atuais da aula
      const { error: deleteError } = await supabase
        .from("aula_alunos")
        .delete()
        .eq("aula_id", aulaId);

      if (deleteError) {
        throw deleteError;
      }

      // Se não temos novos alunos para adicionar, retorna
      if (alunoIdsValidos.length === 0) {
        return true;
      }

      // Adicionar os novos alunos
      const novasRelacoes = alunoIdsValidos.map((alunoId) => ({
        aula_id: aulaId,
        aluno_id: alunoId,
      }));

      const { data, error: insertError } = await supabase
        .from("aula_alunos")
        .insert(novasRelacoes)
        .select();

      if (insertError) {
        throw insertError;
      }

      return true;
    } catch (err) {
      throw err;
    }
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

    return data.total_alunos;
  },

  /**
   * Atualiza as observações de um aluno em uma aula específica
   * @param {string} aulaId - ID da aula
   * @param {string} alunoId - ID do aluno
   * @param {string} observacoes - Texto das observações
   * @returns {Promise<Object>} - Os dados atualizados
   */
  async atualizarObservacoes(aulaId, alunoId, observacoes) {
    try {
      // Verificar se os IDs são válidos
      if (!aulaId || !alunoId) {
        return {
          error: true,
          message: "IDs de aula ou aluno inválidos",
        };
      }

      // Atualizar as observações na tabela de relacionamento
      const { data, error } = await supabase
        .from("aula_alunos")
        .update({ observacoes: observacoes })
        .eq("aula_id", aulaId)
        .eq("aluno_id", alunoId)
        .select()
        .single();

      if (error) {
        return {
          error: true,
          message: error.message || "Erro ao atualizar observações",
        };
      }

      return data;
    } catch (err) {
      return {
        error: true,
        message: err.message || "Erro inesperado ao atualizar observações",
      };
    }
  },
};

export default aulaAlunosService;

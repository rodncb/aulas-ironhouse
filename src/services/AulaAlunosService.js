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
    console.log(
      `[AulaAlunosService] Tentando adicionar aluno ${alunoId} à aula ${aulaId}`
    );

    try {
      // Verificar se os IDs são válidos
      if (!aulaId || !alunoId) {
        console.error("[AulaAlunosService] IDs inválidos:", {
          aulaId,
          alunoId,
        });
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
          console.log(
            `[AulaAlunosService] Aluno ${alunoId} já existe na aula ${aulaId}`
          );
          return {
            error: true,
            message: "Este aluno já está na aula",
            isDuplicate: true,
          };
        }
        console.error(`[AulaAlunosService] Erro ao adicionar aluno:`, error);
        return {
          error: true,
          message: error.message || "Erro ao adicionar aluno à aula",
          details: error,
        };
      }

      console.log(
        `[AulaAlunosService] Aluno ${alunoId} adicionado com sucesso à aula ${aulaId}`
      );
      return data;
    } catch (err) {
      console.error(`[AulaAlunosService] Erro crítico:`, err);
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
    console.log(
      `[AulaAlunosService] Removendo aluno ${alunoId} da aula ${aulaId}`
    );

    try {
      // Validar parâmetros
      if (!aulaId || !alunoId) {
        console.error("[AulaAlunosService] IDs inválidos:", {
          aulaId,
          alunoId,
        });
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
        console.error(
          "[AulaAlunosService] Erro ao verificar relação existente:",
          checkError
        );
        throw checkError;
      }

      // Se não existe relação, não precisamos fazer nada
      if (!existingRelation) {
        console.log(
          `[AulaAlunosService] Aluno ${alunoId} não está na aula ${aulaId}`
        );
        return true;
      }

      // Remover a relação
      const { error } = await supabase
        .from("aula_alunos")
        .delete()
        .match({ aula_id: aulaId, aluno_id: alunoId });

      if (error) {
        console.error("[AulaAlunosService] Erro ao remover aluno:", error);
        throw error;
      }

      console.log(
        `[AulaAlunosService] Aluno ${alunoId} removido com sucesso da aula ${aulaId}`
      );
      return true;
    } catch (err) {
      console.error("[AulaAlunosService] Erro crítico ao remover aluno:", err);
      throw err;
    }
  },

  /**
   * Obtém todos os alunos de uma aula
   * @param {string} aulaId - ID da aula
   * @returns {Promise<Array>} - Lista de alunos com dados completos
   */
  async getAlunosDaAula(aulaId) {
    console.log(`[AulaAlunosService] Buscando alunos da aula ${aulaId}`);

    try {
      // Validar parâmetro
      if (!aulaId) {
        console.error("[AulaAlunosService] ID de aula inválido");
        return [];
      }

      const { data, error } = await supabase
        .from("aula_alunos")
        .select("aluno_id")
        .eq("aula_id", aulaId);

      if (error) {
        console.error(
          `[AulaAlunosService] Erro ao buscar relações de alunos:`,
          error
        );
        throw error;
      }

      if (!data || data.length === 0) {
        console.log(
          `[AulaAlunosService] Nenhum aluno encontrado para a aula ${aulaId}`
        );
        return [];
      }

      // Obter os dados completos dos alunos
      const alunoIds = data.map((item) => item.aluno_id);

      console.log(
        `[AulaAlunosService] Encontrados ${alunoIds.length} IDs de alunos, buscando detalhes...`
      );

      const { data: alunos, error: alunosError } = await supabase
        .from("alunos")
        .select("*")
        .in("id", alunoIds);

      if (alunosError) {
        console.error(
          `[AulaAlunosService] Erro ao buscar detalhes dos alunos:`,
          alunosError
        );
        throw alunosError;
      }

      console.log(
        `[AulaAlunosService] Recuperados ${
          alunos?.length || 0
        } alunos com dados completos`
      );
      return alunos || [];
    } catch (err) {
      console.error(
        `[AulaAlunosService] Erro crítico ao buscar alunos da aula:`,
        err
      );
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
    console.log(
      `[AulaAlunosService] Atualizando alunos da aula ${aulaId}`,
      alunoIds
    );

    try {
      // Validar entrada
      if (!aulaId) {
        console.error("[AulaAlunosService] ID da aula inválido");
        return false;
      }

      if (!Array.isArray(alunoIds)) {
        console.error(
          "[AulaAlunosService] Lista de IDs de alunos não é um array"
        );
        return false;
      }

      // Filtrar apenas IDs válidos (não nulos, não undefined, não vazios)
      const alunoIdsValidos = alunoIds.filter(
        (id) => id && id.toString().trim() !== ""
      );

      console.log(
        `[AulaAlunosService] ${alunoIdsValidos.length} alunos válidos encontrados`
      );

      // Primeiro, remover todos os alunos atuais da aula
      const { error: deleteError } = await supabase
        .from("aula_alunos")
        .delete()
        .eq("aula_id", aulaId);

      if (deleteError) {
        console.error(
          `[AulaAlunosService] Erro ao remover alunos existentes:`,
          deleteError
        );
        throw deleteError;
      }

      // Se não temos novos alunos para adicionar, retorna
      if (alunoIdsValidos.length === 0) {
        console.log(
          `[AulaAlunosService] Nenhum aluno para adicionar à aula ${aulaId}`
        );
        return true;
      }

      // Adicionar os novos alunos
      const novasRelacoes = alunoIdsValidos.map((alunoId) => ({
        aula_id: aulaId,
        aluno_id: alunoId,
      }));

      console.log(
        `[AulaAlunosService] Inserindo ${novasRelacoes.length} alunos na aula ${aulaId}`
      );

      const { data, error: insertError } = await supabase
        .from("aula_alunos")
        .insert(novasRelacoes)
        .select();

      if (insertError) {
        console.error(
          `[AulaAlunosService] Erro ao inserir novos alunos:`,
          insertError
        );
        throw insertError;
      }

      console.log(
        `[AulaAlunosService] Alunos atualizados com sucesso na aula ${aulaId}`
      );
      return true;
    } catch (err) {
      console.error(
        `[AulaAlunosService] Erro crítico ao atualizar alunos:`,
        err
      );
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

  /**
   * Atualiza as observações de um aluno em uma aula específica
   * @param {string} aulaId - ID da aula
   * @param {string} alunoId - ID do aluno
   * @param {string} observacoes - Texto das observações
   * @returns {Promise<Object>} - Os dados atualizados
   */
  async atualizarObservacoes(aulaId, alunoId, observacoes) {
    console.log(
      `[AulaAlunosService] Atualizando observações do aluno ${alunoId} na aula ${aulaId}`
    );

    try {
      // Verificar se os IDs são válidos
      if (!aulaId || !alunoId) {
        console.error("[AulaAlunosService] IDs inválidos:", {
          aulaId,
          alunoId,
        });
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
        console.error(
          `[AulaAlunosService] Erro ao atualizar observações:`,
          error
        );
        return {
          error: true,
          message: error.message || "Erro ao atualizar observações",
          details: error,
        };
      }

      console.log(
        `[AulaAlunosService] Observações atualizadas com sucesso para o aluno ${alunoId} na aula ${aulaId}`
      );
      return data;
    } catch (err) {
      console.error(`[AulaAlunosService] Erro crítico:`, err);
      return {
        error: true,
        message: err.message || "Erro inesperado ao atualizar observações",
        details: err,
      };
    }
  },
};

export default aulaAlunosService;

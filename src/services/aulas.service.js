import {
  supabase,
  reloadSupabaseSchemaCache,
  testConnection,
} from "./supabase";
import { aulaAlunosService } from "./AulaAlunosService";

/**
 * Função utilitária para tentar uma operação e recarregar o cache do esquema se necessário
 * @param {Function} operation - Função que realiza a operação no Supabase
 * @returns {Promise<any>} - Resultado da operação
 */
async function tryOperationWithCacheReload(operation) {
  try {
    return await operation();
  } catch (error) {
    // Verifica se o erro está relacionado ao cache do esquema
    if (error.message.includes("schema cache")) {
      // Tenta recarregar o cache do esquema
      const reloaded = await reloadSupabaseSchemaCache();

      if (reloaded) {
        try {
          // Tenta a operação novamente após recarregar o cache
          return await operation();
        } catch (retryError) {
          throw retryError;
        }
      } else {
        throw error;
      }
    } else {
      // Se não for um erro relacionado ao cache, apenas propaga o erro
      throw error;
    }
  }
}

export const aulasService = {
  async getAll() {
    return tryOperationWithCacheReload(async () => {
      try {
        await testConnection(1);
      } catch (err) {
        // Ignora erro
      }

      // Antes da chamada principal, verificar se há tabelas existentes
      try {
        await supabase.rpc("get_tables_info");
      } catch (err) {
        // Ignora erro
      }

      const { data: aulasData, error: aulasError } = await supabase
        .from("aulas")
        .select(
          `
          *,
          professor:professores (id, nome),
          aula_alunos (
            aluno:alunos (*)
          )
        `
        )
        .order("created_at", { ascending: false });

      if (aulasError) {
        throw aulasError;
      }

      // Se não houver dados, tentar uma consulta mais simples para diagnóstico
      if (!aulasData || aulasData.length === 0) {
        try {
          await supabase.from("aulas").select("*");
        } catch (err) {
          // Ignora erro
        }
      }

      // Processar os dados para formatar a estrutura desejada
      const aulasComAlunos =
        aulasData?.map((aula) => {
          // Extrair os dados do professor corretamente
          const professorData = aula.professor || null;

          // Mapear os dados dos alunos da tabela de junção
          const alunos =
            aula.aula_alunos?.map((rel) => rel.aluno).filter(Boolean) || []; // Filtrar nulos caso haja inconsistência

          return {
            ...aula,
            professor: professorData, // Manter a estrutura aninhada do professor
            alunos: alunos, // Substituir aula_alunos pelo array de alunos
            aula_alunos: undefined, // Remover a estrutura intermediária
          };
        }) || [];

      return aulasComAlunos;
    });
  },

  async getAulaAtual() {
    return tryOperationWithCacheReload(async () => {
      // Primeiro vamos verificar se existe alguma aula com status "atual"
      const { data: aulasAtuais, error: erroAtuais } = await supabase
        .from("aulas")
        .select("*")
        .eq("status", "atual");

      if (erroAtuais) {
        // Ignora erro
      }

      // Agora vamos verificar aulas com status "ativa"
      const { data: aulasAtivas, error: erroAtivas } = await supabase
        .from("aulas")
        .select("*")
        .eq("status", "ativa");

      if (erroAtivas) {
        // Ignora erro
      }

      // Agora sim fazemos a consulta com OR
      const { data, error } = await supabase
        .from("aulas")
        .select("*")
        .or(`status.eq.atual,status.eq.ativa`)
        .maybeSingle();

      if (error) {
        throw error;
      }

      // Se encontrou uma aula atual, buscar os alunos associados
      if (data) {
        try {
          // Utilizar o serviço dedicado para buscar alunos, que já faz o join correto
          const alunos = await aulaAlunosService.getAlunosDaAula(data.id);
          return { ...data, alunos: alunos };
        } catch (err) {
          return { ...data, alunos: [] }; // Retorna array vazio em caso de erro
        }
      }

      return data; // Retorna null se não houver aula atual
    });
  },

  async create(aula) {
    return tryOperationWithCacheReload(async () => {
      // Separar os alunos e professor do objeto de aula antes de inserir
      const { alunos, professor, ...aulaData } = aula;

      // Garantir que o campo total_alunos seja inicializado corretamente
      aulaData.total_alunos = alunos?.length || 0;

      // SOLUÇÃO: Salvar corretamente a relação com o professor
      if (professor) {
        aulaData.professor_id = professor.id;
      }

      const { data, error } = await supabase
        .from("aulas")
        .insert([aulaData])
        .select()
        .single();

      if (error) throw error;

      // Se tiver alunos, adicionar à tabela de junção
      if (alunos && alunos.length > 0) {
        try {
          await aulaAlunosService.atualizarAlunosDaAula(
            data.id,
            alunos.map((a) => (typeof a === "object" ? a.id : a))
          );
        } catch (err) {
          // Não falharemos a criação da aula se a adição de alunos falhar
        }
      }

      // Buscar dados atualizados incluindo alunos
      const dadosAtualizados = { ...data };
      try {
        dadosAtualizados.alunos = await aulaAlunosService.getAlunosDaAula(
          data.id
        );

        // SOLUÇÃO: Buscar dados do professor para incluir na resposta
        if (data.professor_id) {
          const { data: professorData, error: professorError } = await supabase
            .from("professores")
            .select("id, nome")
            .eq("id", data.professor_id)
            .single();

          if (!professorError && professorData) {
            dadosAtualizados.professor = professorData;
          }
        }
      } catch (err) {
        dadosAtualizados.alunos = [];
      }

      return dadosAtualizados;
    });
  },

  async update(id, aula) {
    return tryOperationWithCacheReload(async () => {
      // Separar os alunos e professor do objeto de aula antes de atualizar
      const { alunos, professor, ...aulaData } = aula;

      // Atualizar total_alunos se a lista de alunos for fornecida
      if (alunos) {
        aulaData.total_alunos = alunos.length;
      }

      // SOLUÇÃO: Salvar a relação com o professor corretamente
      // Se tiver um professor, garantir que o ID do professor seja armazenado no campo correto
      if (professor) {
        aulaData.professor_id = professor.id;
      } else {
        aulaData.professor_id = null;
      }

      const { data, error } = await supabase
        .from("aulas")
        .update(aulaData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      // Se tiver alunos, atualizar na tabela de junção
      if (alunos) {
        try {
          await aulaAlunosService.atualizarAlunosDaAula(
            id,
            alunos.map((a) => (typeof a === "object" ? a.id : a))
          );
        } catch (err) {
          // Não falharemos a atualização da aula se a atualização de alunos falhar
        }
      }

      // Buscar dados atualizados incluindo alunos
      const dadosAtualizados = { ...data };
      try {
        dadosAtualizados.alunos = await aulaAlunosService.getAlunosDaAula(id);

        // SOLUÇÃO: Buscar dados do professor atualizados
        if (data.professor_id) {
          const { data: professorData, error: professorError } = await supabase
            .from("professores")
            .select("id, nome")
            .eq("id", data.professor_id)
            .single();

          if (!professorError && professorData) {
            dadosAtualizados.professor = professorData;
          }
        }
      } catch (err) {
        dadosAtualizados.alunos = [];
      }

      return dadosAtualizados;
    });
  },

  async finalizarAulaAtual() {
    return tryOperationWithCacheReload(async () => {
      const aulaAtual = await this.getAulaAtual();
      if (aulaAtual) {
        const { error } = await supabase
          .from("aulas")
          .update({ status: "realizada" })
          .eq("id", aulaAtual.id);

        if (error) {
          throw error;
        }
      }
    });
  },

  async delete(id) {
    return tryOperationWithCacheReload(async () => {
      // Primeiro remover todas as relações na tabela de junção
      try {
        await aulaAlunosService.atualizarAlunosDaAula(id, []);
      } catch (err) {
        // Não falharemos a exclusão da aula se a remoção de alunos falhar
      }

      // Agora excluir a aula
      const { error } = await supabase.from("aulas").delete().eq("id", id);

      if (error) throw error;
      return true;
    });
  },

  /**
   * Adiciona um aluno a uma aula existente
   * @param {string} aulaId - ID da aula
   * @param {string} alunoId - ID do aluno
   * @returns {Promise<Object>} - Dados atualizados da aula
   */
  async adicionarAluno(aulaId, alunoId) {
    return tryOperationWithCacheReload(async () => {
      const resultado = await aulaAlunosService.adicionarAluno(aulaId, alunoId);

      // Se encontrou um erro de duplicação, apenas retorna o erro
      if (resultado.error && resultado.isDuplicate) {
        return resultado;
      }

      // Atualizar o contador de alunos na aula
      try {
        await aulaAlunosService.atualizarTotalAlunos(aulaId);
      } catch (err) {
        // Não falhar toda a operação devido a um erro ao atualizar o contador
      }

      // Obter a aula atualizada com todos os alunos
      const { data, error } = await supabase
        .from("aulas")
        .select("*")
        .eq("id", aulaId)
        .single();

      if (error) throw error;

      const dadosAtualizados = { ...data };
      try {
        dadosAtualizados.alunos = await aulaAlunosService.getAlunosDaAula(
          aulaId
        );

        // Garantir que o contador seja coerente com o número real de alunos
        if (dadosAtualizados.alunos) {
          const contagem = dadosAtualizados.alunos.length;

          // Se o contador não corresponder ao número real de alunos, atualizar
          if (data.total_alunos !== contagem || data.totalAlunos !== contagem) {
            await supabase
              .from("aulas")
              .update({
                total_alunos: contagem,
                totalAlunos: contagem,
              })
              .eq("id", aulaId);

            dadosAtualizados.total_alunos = contagem;
            dadosAtualizados.totalAlunos = contagem;
          }
        }
      } catch (err) {
        dadosAtualizados.alunos = [];
      }

      return dadosAtualizados;
    });
  },

  /**
   * Remove um aluno de uma aula existente
   * @param {string} aulaId - ID da aula
   * @param {string} alunoId - ID do aluno
   * @returns {Promise<Object>} - Dados atualizados da aula
   */
  async removerAluno(aulaId, alunoId) {
    return tryOperationWithCacheReload(async () => {
      await aulaAlunosService.removerAluno(aulaId, alunoId);

      // Atualizar o contador de alunos na aula
      try {
        await aulaAlunosService.atualizarTotalAlunos(aulaId);
      } catch (err) {
        // Não falhar toda a operação devido a um erro ao atualizar o contador
      }

      // Obter a aula atualizada com todos os alunos
      const { data, error } = await supabase
        .from("aulas")
        .select("*")
        .eq("id", aulaId)
        .single();

      if (error) throw error;

      const dadosAtualizados = { ...data };
      try {
        dadosAtualizados.alunos = await aulaAlunosService.getAlunosDaAula(
          aulaId
        );

        // Garantir que o contador seja coerente com o número real de alunos
        if (dadosAtualizados.alunos) {
          const contagem = dadosAtualizados.alunos.length;

          // Se o contador não corresponder ao número real de alunos, atualizar
          if (data.total_alunos !== contagem || data.totalAlunos !== contagem) {
            await supabase
              .from("aulas")
              .update({
                total_alunos: contagem,
                totalAlunos: contagem,
              })
              .eq("id", aulaId);

            dadosAtualizados.total_alunos = contagem;
            dadosAtualizados.totalAlunos = contagem;
          }
        }
      } catch (err) {
        dadosAtualizados.alunos = [];
      }

      return dadosAtualizados;
    });
  },

  /**
   * Obtém os detalhes completos de uma aula, incluindo alunos
   * @param {string} aulaId - ID da aula
   * @returns {Promise<Object>} - Dados da aula com alunos
   */
  async getById(aulaId) {
    return tryOperationWithCacheReload(async () => {
      const { data, error } = await supabase
        .from("aulas")
        .select("*")
        .eq("id", aulaId)
        .single();

      if (error) throw error;

      const dadosAula = { ...data };
      try {
        dadosAula.alunos = await aulaAlunosService.getAlunosDaAula(aulaId);
      } catch (err) {
        dadosAula.alunos = [];
      }

      return dadosAula;
    });
  },

  /**
   * Atualiza o status de uma aula
   * @param {string} aulaId - ID da aula
   * @param {string} status - Novo status (atual, ativa, realizada, cancelada)
   * @returns {Promise<Object>} - Dados atualizados da aula
   */
  async updateStatus(aulaId, status) {
    return tryOperationWithCacheReload(async () => {
      // Verificar se o ID e status são válidos
      if (!aulaId) {
        throw new Error("ID de aula inválido");
      }

      if (!status) {
        throw new Error("Status de aula inválido");
      }

      // Verificar se a aula existe
      const { data: aulaExistente, error: erroVerificacao } = await supabase
        .from("aulas")
        .select("id, status")
        .eq("id", aulaId)
        .single();

      if (erroVerificacao) {
        throw erroVerificacao;
      }

      if (!aulaExistente) {
        throw new Error(`Aula com ID ${aulaId} não encontrada`);
      }

      const { data, error } = await supabase
        .from("aulas")
        .update({ status })
        .eq("id", aulaId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Incluir os alunos da aula na resposta
      const dadosAtualizados = { ...data };
      try {
        dadosAtualizados.alunos = await aulaAlunosService.getAlunosDaAula(
          aulaId
        );
      } catch (err) {
        dadosAtualizados.alunos = [];
      }

      return dadosAtualizados;
    });
  },
};

// Adicionando export default para compatibilidade
export default aulasService;

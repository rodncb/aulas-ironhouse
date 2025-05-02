import supabase from "../config/supabaseConfig.js"; // Corrigido: Importação default do caminho correto

const aulasService = {
  /**
   * Obtém todas as aulas
   */
  getAll: async () => {
    try {
      const { data, error } = await supabase
        .from("aulas")
        .select(
          `
          *,
          professor:professor_id(*),
          alunos(*)
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Erro ao buscar todas as aulas:", error);
      throw error;
    }
  },

  /**
   * Obtém aulas por ID do professor
   * @param {number} professorId - ID do professor
   * @param {string} status - Status da aula (opcional)
   */
  getAulasByProfessorId: async (professorId, status = null) => {
    try {
      let query = supabase
        .from("aulas")
        .select(
          `
          *,
          professor:professor_id(*),
          alunos(*)
        `
        )
        .eq("professor_id", professorId)
        .order("created_at", { ascending: false });

      if (status) {
        query = query.eq("status", status);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(`Erro ao buscar aulas do professor ${professorId}:`, error);
      throw error;
    }
  },

  /**
   * Obtém aulas de um professor por status específico
   * @param {string} professorId - ID do professor
   * @param {string} status - Status da aula (em_andamento, finalizada, cancelada, etc)
   */
  getAulasByProfessorAndStatus: async (professorId, status) => {
    try {
      // Buscar as aulas do professor com o status especificado
      const { data, error } = await supabase
        .from("aulas")
        .select(
          `
          *,
          professor:professor_id(*),
          alunos(*)
        `
        )
        .eq("professor_id", professorId)
        .eq("status", status)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Se não encontrou aulas ou ocorreu um erro
      if (!data || data.length === 0) {
        return [];
      }

      return data;
    } catch (error) {
      console.error(
        `Erro ao buscar aulas do professor ${professorId} com status ${status}:`,
        error
      );
      throw error;
    }
  },

  /**
   * Obtém aulas por ID do aluno
   * @param {number} alunoId - ID do aluno
   */
  getAulasByAlunoId: async (alunoId) => {
    try {
      console.log(`[INFO] Buscando aulas para o aluno com ID: ${alunoId}`);

      // Abordagem mais direta usando join na consulta
      const { data, error } = await supabase
        .from("aula_alunos")
        .select(
          `
          aluno_id,
          observacoes,
          aula:aulas (
            id, 
            data,
            status,
            observacoes,
            created_at,
            professor:professores (id, nome, email)
          )
        `
        )
        .eq("aluno_id", alunoId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error(
          `[ERROR] Erro ao buscar aulas do aluno ${alunoId}:`,
          error
        );
        throw error;
      }

      if (!data || data.length === 0) {
        console.log(`[INFO] Nenhuma aula encontrada para o aluno ${alunoId}`);
        return [];
      }

      // Transformar o resultado em um formato mais adequado para o componente
      const aulas = data
        .filter((item) => item.aula !== null) // Filtrar registros com aula nula
        .map((item) => {
          // Para cada registro, extraímos a aula e adicionamos as observações específicas do aluno
          const aula = item.aula;
          if (aula) {
            // Adicionar as observações do relacionamento aula_alunos ao objeto aula
            aula.observacoes_aluno = item.observacoes || "";
          }
          return aula;
        });

      console.log(
        `[SUCCESS] Encontradas ${aulas.length} aulas para o aluno ${alunoId}`
      );
      return aulas;
    } catch (error) {
      console.error(`[ERROR] Erro ao buscar aulas do aluno ${alunoId}:`, error);
      throw error;
    }
  },

  /**
   * Obtém uma aula por ID
   * @param {number} id - ID da aula
   */
  getById: async (id) => {
    try {
      console.log(`Buscando aula com ID ${id}`);

      // 1. Buscar dados básicos da aula primeiro
      const { data: aulaBasica, error: aulaError } = await supabase
        .from("aulas")
        .select("*")
        .eq("id", id)
        .single();

      if (aulaError) {
        console.error(`Erro ao buscar dados básicos da aula ${id}:`, aulaError);
        throw aulaError;
      }

      if (!aulaBasica) {
        throw new Error(`Aula com ID ${id} não encontrada`);
      }

      console.log(
        `Aula básica encontrada: ${aulaBasica.id}, status: ${aulaBasica.status}`
      );

      // 2. Buscar o professor separadamente
      let professor = null;
      try {
        const { data: profData, error: profError } = await supabase
          .from("professores")
          .select("*")
          .eq("id", aulaBasica.professor_id)
          .single();

        if (!profError && profData) {
          professor = profData;
        } else {
          console.log(`Aviso: Professor não encontrado para aula ${id}`);
        }
      } catch (profErr) {
        console.warn(`Erro ao buscar professor da aula ${id}:`, profErr);
      }

      // 3. Usar a própria coluna JSONB 'alunos' para evitar joins complexos
      const alunos = aulaBasica.alunos || [];

      // 4. Montar o objeto aula completo
      const aulaCompleta = {
        ...aulaBasica,
        professor: professor || { id: aulaBasica.professor_id },
      };

      console.log(
        `Aula ${id} montada com sucesso. Tem ${alunos.length} aluno(s).`
      );

      return aulaCompleta;
    } catch (error) {
      console.error(`Erro ao buscar aula ${id}:`, error);
      throw error;
    }
  },

  /**
   * Cria uma nova aula
   * @param {Object} aulaData - Dados da aula
   */
  create: async (aulaData) => {
    try {
      // Extrair os alunos para inserir na tabela de relacionamentos depois
      const alunos = aulaData.alunos || [];

      // Preparar os dados da aula sem usar o espalhamento
      const aulaBasica = {
        professor_id: aulaData.professor_id,
        data: aulaData.data,
        status: aulaData.status || "em_andamento",
        observacoes: aulaData.observacoes || "",
      };

      // Incluir outros campos se existirem
      if (aulaData.titulo) aulaBasica.titulo = aulaData.titulo;
      if (aulaData.descricao) aulaBasica.descricao = aulaData.descricao;
      if (aulaData.hora) aulaBasica.hora = aulaData.hora;
      if (aulaData.exercicios) aulaBasica.exercicios = aulaData.exercicios;

      console.log("Criando aula com dados:", aulaBasica);
      console.log("Alunos a serem associados:", alunos);

      // Inserir a aula básica
      const { data, error } = await supabase
        .from("aulas")
        .insert([aulaBasica])
        .select();

      if (error) {
        console.error("Erro ao inserir aula básica:", error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.error("Nenhum dado retornado ao criar aula");
        throw new Error("Falha ao criar aula: nenhum dado retornado");
      }

      const aulaId = data[0].id;
      console.log(`Aula criada com ID: ${aulaId}`);

      // Se temos alunos, adicioná-los à tabela de relacionamento
      if (alunos.length > 0) {
        try {
          // Criar os registros para a tabela de relacionamento
          const alunosRelacionamentos = alunos.map((aluno) => ({
            aula_id: aulaId,
            aluno_id: aluno.id,
          }));

          console.log(
            "Inserindo relacionamentos de alunos:",
            alunosRelacionamentos
          );

          // Inserir os relacionamentos
          const { error: relError } = await supabase
            .from("aula_alunos")
            .insert(alunosRelacionamentos);

          if (relError) {
            console.error("Erro ao adicionar alunos à aula:", relError);
            // Continuamos mesmo com erro na inserção dos alunos
          }
        } catch (relErr) {
          console.error("Erro ao processar relacionamentos de alunos:", relErr);
          // Continuamos mesmo com erro nos relacionamentos
        }
      }

      // Atualizar a coluna "alunos" no formato JSONB diretamente
      if (alunos.length > 0) {
        try {
          console.log("Atualizando campo JSONB de alunos");
          const alunosJSON = alunos.map((aluno) => ({
            id: aluno.id,
            nome: aluno.nome,
            idade: aluno.idade,
            lesao: aluno.lesao,
            observacoes: aluno.observacoes,
          }));

          const { error: updateError } = await supabase
            .from("aulas")
            .update({ alunos: alunosJSON })
            .eq("id", aulaId);

          if (updateError) {
            console.error(
              "Erro ao atualizar campo JSONB de alunos:",
              updateError
            );
          }
        } catch (jsonErr) {
          console.error("Erro ao processar JSON de alunos:", jsonErr);
        }
      }

      // Retornar dados básicos da aula em vez de buscar novamente
      return {
        id: aulaId,
        ...aulaBasica,
        alunos: alunos,
      };
    } catch (error) {
      console.error("Erro ao criar aula:", error);
      throw error;
    }
  },

  /**
   * Atualiza uma aula
   * @param {number} id - ID da aula
   * @param {Object} aulaData - Novos dados da aula
   */
  update: async (id, aulaData) => {
    try {
      // Extrair os alunos para atualizar relacionamentos
      const alunos = aulaData.alunos || [];

      // Remover alunos para atualizar apenas dados básicos da aula
      // eslint-disable-next-line no-unused-vars
      const { alunos: _, ...aulaBasica } = aulaData;

      // Atualizar os dados básicos da aula
      const { error } = await supabase
        .from("aulas")
        .update(aulaBasica)
        .eq("id", id);

      if (error) throw error;

      // Deletar relacionamentos anteriores
      const { error: deleteError } = await supabase
        .from("aula_alunos")
        .delete()
        .eq("aula_id", id);

      if (deleteError) {
        console.error(
          "Erro ao remover alunos anteriores da aula:",
          deleteError
        );
      }

      // Se temos alunos, recriar os relacionamentos
      // Aqui confiamos no trigger para atualizar o campo JSONB 'alunos'
      if (alunos.length > 0) {
        // Criar os registros para a tabela de relacionamento
        const alunosRelacionamentos = alunos.map((aluno) => ({
          aula_id: id,
          aluno_id: aluno.id,
        }));

        // Inserir os novos relacionamentos
        const { error: relError } = await supabase
          .from("aula_alunos")
          .insert(alunosRelacionamentos);

        if (relError) {
          console.error("Erro ao adicionar novos alunos à aula:", relError);
        }
      }

      // Retornar a aula com todos os dados atualizados
      return await aulasService.getById(id);
    } catch (error) {
      console.error(`Erro ao atualizar aula ${id}:`, error);
      throw error;
    }
  },

  /**
   * Exclui uma aula
   * @param {number} id - ID da aula
   */
  delete: async (id) => {
    try {
      // Primeiro, deletar os relacionamentos com alunos
      const { error: relError } = await supabase
        .from("aula_alunos")
        .delete()
        .eq("aula_id", id);

      if (relError) {
        console.error("Erro ao remover relacionamentos dos alunos:", relError);
      }

      // Depois, deletar a aula
      const { error } = await supabase.from("aulas").delete().eq("id", id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error(`Erro ao excluir aula ${id}:`, error);
      throw error;
    }
  },

  /**
   * Finaliza automaticamente todas as aulas em andamento
   * @returns {Promise<{count: number, success: boolean}>} - Número de aulas finalizadas
   */
  finalizarAulasEmAndamento: async () => {
    try {
      console.log("Iniciando finalização automática de aulas em andamento...");

      // 1. Buscar todas as aulas com status "em_andamento"
      const { data: aulasEmAndamento, error: fetchError } = await supabase
        .from("aulas")
        .select("*")
        .eq("status", "em_andamento");

      if (fetchError) {
        console.error("Erro ao buscar aulas em andamento:", fetchError);
        throw fetchError;
      }

      if (!aulasEmAndamento || aulasEmAndamento.length === 0) {
        console.log("Nenhuma aula em andamento encontrada para finalizar");
        return { count: 0, success: true };
      }

      console.log(
        `Encontradas ${aulasEmAndamento.length} aulas em andamento para finalizar`
      );

      // 2. Atualizar todas para status "finalizada"
      const { error: updateError } = await supabase
        .from("aulas")
        .update({
          status: "finalizada",
          observacoes: (aula) =>
            `${
              aula.observacoes || ""
            }\n[SISTEMA] Aula finalizada automaticamente às 23:59h.`,
        })
        .eq("status", "em_andamento");

      if (updateError) {
        console.error("Erro ao finalizar aulas em andamento:", updateError);
        throw updateError;
      }

      console.log(
        `${aulasEmAndamento.length} aulas finalizadas automaticamente`
      );
      return {
        count: aulasEmAndamento.length,
        success: true,
      };
    } catch (error) {
      console.error("Erro ao finalizar aulas em andamento:", error);
      return {
        error: error.message,
        success: false,
      };
    }
  },

  /**
   * Adiciona um aluno a uma aula existente
   * @param {number} aulaId - ID da aula
   * @param {number} alunoId - ID do aluno
   */
  adicionarAluno: async (aulaId, alunoId) => {
    try {
      console.log(`Adicionando aluno ${alunoId} à aula ${aulaId}`);

      // Usar a função RPC para adicionar o aluno
      const { data: result, error: rpcError } = await supabase.rpc(
        "add_aluno_to_aula",
        {
          p_aula_id: aulaId,
          p_aluno_id: alunoId,
        }
      );

      if (rpcError) {
        console.error("Erro ao adicionar aluno via RPC:", rpcError);
        throw rpcError;
      }

      console.log("Resultado da adição de aluno via RPC:", result);

      // Buscar a aula atualizada
      return await aulasService.getById(aulaId);
    } catch (error) {
      console.error(
        `Erro ao adicionar aluno ${alunoId} à aula ${aulaId}:`,
        error
      );
      throw error;
    }
  },

  /**
   * Remove um aluno de uma aula existente (versão mais robusta)
   * @param {number} aulaId - ID da aula
   * @param {number} alunoId - ID do aluno
   */
  removerAlunoCompleto: async (aulaId, alunoId) => {
    try {
      console.log(`[ROBUSTO] Removendo aluno ${alunoId} da aula ${aulaId}`);

      // 1. Remover da tabela de relacionamento
      const { error: relacaoError } = await supabase
        .from("aula_alunos")
        .delete()
        .eq("aula_id", aulaId)
        .eq("aluno_id", alunoId);

      if (relacaoError) {
        console.error("Erro ao remover da tabela aula_alunos:", relacaoError);
      } else {
        console.log("Relação removida com sucesso da tabela aula_alunos");
      }

      // 2. Obter a aula atual para atualizar o campo JSON de alunos
      const { data: aulaAtual, error: aulaError } = await supabase
        .from("aulas")
        .select("alunos")
        .eq("id", aulaId)
        .single();

      if (aulaError) {
        console.error("Erro ao buscar dados da aula:", aulaError);
      } else if (aulaAtual && aulaAtual.alunos) {
        // Filtrar o aluno do array JSON
        const alunosAtualizados = aulaAtual.alunos.filter(
          (a) => a.id !== alunoId
        );

        // Atualizar o campo JSON diretamente
        const { error: updateError } = await supabase
          .from("aulas")
          .update({ alunos: alunosAtualizados })
          .eq("id", aulaId);

        if (updateError) {
          console.error("Erro ao atualizar campo JSON de alunos:", updateError);
        } else {
          console.log("Campo JSON de alunos atualizado com sucesso");
        }
      }

      // 3. Tentar usar a função RPC como backup
      try {
        const { error: rpcError } = await supabase.rpc(
          "remove_aluno_from_aula",
          {
            p_aula_id: aulaId,
            p_aluno_id: alunoId,
          }
        );

        if (rpcError) {
          console.warn(
            "Aviso: RPC não conseguiu remover o aluno (isso pode ser normal se já foi removido):",
            rpcError
          );
        }
      } catch (rpcErr) {
        console.warn("Erro ao chamar RPC (ignorado):", rpcErr);
      }

      // 4. Forçar refresh do cache do schema
      try {
        await supabase.rpc("reload_schema_cache");
      } catch (cacheErr) {
        console.warn(
          "Erro ao recarregar cache do schema (ignorado):",
          cacheErr
        );
      }

      // Buscar a aula atualizada para confirmar
      return await aulasService.getById(aulaId);
    } catch (error) {
      console.error(
        `Erro ao remover aluno ${alunoId} da aula ${aulaId} (versão robusta):`,
        error
      );
      throw error;
    }
  },

  /**
   * Obtém aulas por status
   * @param {string} status - Status da aula (atual, ativa, finalizada, cancelada)
   */
  getAulasByStatus: async (status) => {
    try {
      const { data, error } = await supabase
        .from("aulas")
        .select(
          `
          *,
          professor:professor_id(*),
          alunos(*)
        `
        )
        .eq("status", status)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(`Erro ao buscar aulas com status ${status}:`, error);
      throw error;
    }
  },
};

export default aulasService;

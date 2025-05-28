import supabase from "../config/supabaseConfig.js"; // Corrigido: Importação default do caminho correto

const exerciciosService = {
  // Criar um novo exercício
  async create(exercicioData) {
    try {
      const { data, error } = await supabase
        .from("exercicios")
        .insert({
          nome: exercicioData.nome,
          musculatura: exercicioData.musculatura,
          aparelho: exercicioData.aparelho, // Adicionado aparelho
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Mapear para o formato usado na aplicação
      return {
        id: data.id,
        _id: data.id, // Para compatibilidade
        nome: data.nome,
        musculatura: data.musculatura,
        aparelho: data.aparelho, // Adicionado aparelho
      };
    } catch (error) {
      console.error("Erro ao criar exercício:", error);
      throw error;
    }
  },

  // Buscar todos os exercícios
  async getAll() {
    try {
      const { data, error } = await supabase
        .from("exercicios")
        .select("*")
        .order("nome");

      if (error) throw error;

      // Mapear para o formato usado na aplicação
      return data.map((exercicio) => ({
        id: exercicio.id,
        _id: exercicio.id, // Para compatibilidade
        nome: exercicio.nome,
        musculatura: exercicio.musculatura,
        aparelho: exercicio.aparelho, // Adicionado aparelho
      }));
    } catch (error) {
      console.error("Erro ao buscar exercícios:", error);
      throw error;
    }
  },

  // Buscar exercício por ID
  async getById(id) {
    try {
      const { data, error } = await supabase
        .from("exercicios")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      return {
        id: data.id,
        _id: data.id, // Para compatibilidade
        nome: data.nome,
        musculatura: data.musculatura,
        aparelho: data.aparelho, // Adicionado aparelho
      };
    } catch (error) {
      console.error(`Erro ao buscar exercício com id ${id}:`, error);
      throw error;
    }
  },

  // Atualizar exercício por ID
  async update(id, exercicioData) {
    try {
      const { data, error } = await supabase
        .from("exercicios")
        .update({
          nome: exercicioData.nome,
          musculatura: exercicioData.musculatura,
          aparelho: exercicioData.aparelho, // Adicionado aparelho
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        _id: data.id, // Para compatibilidade
        nome: data.nome,
        musculatura: data.musculatura,
        aparelho: data.aparelho, // Adicionado aparelho
      };
    } catch (error) {
      console.error(`Erro ao atualizar exercício com id ${id}:`, error);
      throw error;
    }
  },

  // Excluir exercício por ID
  async delete(id) {
    try {
      const { error } = await supabase.from("exercicios").delete().eq("id", id);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error(`Erro ao excluir exercício com id ${id}:`, error);
      throw error; // Re-throw para que o componente possa tratar
    }
  },

  // Associar exercícios a uma aula
  async associarExerciciosAula(aulaId, exerciciosIds) {
    // Esta função parece ser um placeholder, não há código assíncrono real aqui.
    // Removendo try/catch desnecessário ou adicionando lógica real se necessário.
    // Por enquanto, apenas retornando sucesso como antes, mas sem o try/catch.
    // Para implementar quando a tabela de relacionamento entre aulas e exercícios for criada
    // Por enquanto, salvamos essa relação apenas no frontend
    return { success: true };
    /*
    // Exemplo se houvesse lógica assíncrona:
    try {
      // const { data, error } = await supabase...;
      // if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error(`Erro ao associar exercícios à aula ${aulaId}:`, error);
      throw error; // Re-throw para que o componente possa tratar
    }
    */
  },

  // Adicionando a função getAllMusculaturas que estava faltando
  // Esta função busca todas as musculaturas distintas da tabela de exercícios
  async getAllMusculaturas() {
    try {
      // Usando uma view ou função RPC se disponível seria mais eficiente.
      // Como alternativa, buscamos todos os exercícios e extraímos as musculaturas.
      const { data, error } = await supabase
        .from("exercicios")
        .select("musculatura")
        .neq("musculatura", null) // Ignora valores nulos
        .neq("musculatura", ""); // Ignora strings vazias

      if (error) throw error;

      // Extrai musculaturas únicas
      const musculaturasUnicas = [
        ...new Set(data.map((item) => item.musculatura)),
      ];

      // Mapeia para o formato esperado (array de strings ou objetos)
      // Retornando como array de strings por simplicidade, ajuste se necessário
      return musculaturasUnicas;
    } catch (error) {
      console.error("Erro ao buscar musculaturas:", error);
      throw error;
    }
  },

  // Buscar exercícios associados a uma aula
  async getExerciciosByAulaId(aulaId) {
    try {
      // Primeiro buscar os IDs de exercícios relacionados a esta aula
      const { data: aulaExercicios, error: relError } = await supabase
        .from("aula_exercicios")
        .select("exercicio_id")
        .eq("aula_id", aulaId);

      if (relError) {
        console.error(
          `Erro ao buscar relação aula-exercícios: ${relError.message}`
        );
        return [];
      }

      // Se não encontrou relações, retornar array vazio
      if (!aulaExercicios || aulaExercicios.length === 0) {
        return [];
      }

      // Extrair os IDs dos exercícios
      const exerciciosIds = aulaExercicios.map((item) => item.exercicio_id);

      // Buscar os detalhes completos dos exercícios
      const { data: exercicios, error: exerciciosError } = await supabase
        .from("exercicios")
        .select("*")
        .in("id", exerciciosIds);

      if (exerciciosError) {
        console.error(
          `Erro ao buscar detalhes dos exercícios: ${exerciciosError.message}`
        );
        return [];
      }

      return exercicios || [];
    } catch (error) {
      console.error(`Erro ao buscar exercícios da aula ${aulaId}:`, error);
      return [];
    }
  },
};

export default exerciciosService;

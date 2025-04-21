import { supabase } from "./supabase";

const exerciciosService = {
  // Criar um novo exercício
  async create(exercicioData) {
    try {
      const { data, error } = await supabase
        .from("exercicios")
        .insert({
          nome: exercicioData.nome,
          musculatura: exercicioData.musculatura,
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
      throw error;
    }
  },

  // Associar exercícios a uma aula
  async associarExerciciosAula(aulaId, exerciciosIds) {
    try {
      // Para implementar quando a tabela de relacionamento entre aulas e exercícios for criada
      // Por enquanto, salvamos essa relação apenas no frontend
      return { success: true };
    } catch (error) {
      console.error(`Erro ao associar exercícios à aula ${aulaId}:`, error);
      throw error;
    }
  },
};

export default exerciciosService;

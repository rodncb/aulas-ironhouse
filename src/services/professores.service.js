import supabase from "../config/supabaseConfig.js"; // Corrigido: Importação default do caminho correto

export const professoresService = {
  async getAll() {
    const { data, error } = await supabase
      .from("professores")
      .select("*")
      .order("nome");

    if (error) throw error;
    return data;
  },

  async getById(id) {
    const { data, error } = await supabase
      .from("professores")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(professor) {
    const { data, error } = await supabase
      .from("professores")
      .insert([professor])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id, professor) {
    const { data, error } = await supabase
      .from("professores")
      .update(professor)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase.from("professores").delete().eq("id", id);

    if (error) throw error;
    return true;
  },

  /**
   * Exclui professor e desabilita usuário relacionado automaticamente
   * Usa a função SQL criada no backend
   */
  async deleteComplete(professorId) {
    try {
      const { data, error } = await supabase.rpc("excluir_professor_completo", {
        prof_id: professorId, // Mudado de professor_id para prof_id
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Erro ao excluir professor completo:", error);
      throw error;
    }
  },

  /**
   * Desabilita professor sem excluir (mais seguro)
   * Usa a função SQL criada no backend
   */
  async disable(professorId) {
    try {
      const { data, error } = await supabase.rpc("desabilitar_professor", {
        professor_id: professorId,
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Erro ao desabilitar professor:", error);
      throw error;
    }
  },

  /**
   * Busca professores com possíveis duplicações
   */
  async findDuplicates() {
    try {
      const { data, error } = await supabase.from("professores").select(`
          id,
          nome,
          email,
          created_at,
          aulas:aulas(count)
        `);

      if (error) throw error;

      // Agrupar por nome (normalizado) para identificar duplicatas
      const grouped = data.reduce((acc, professor) => {
        const nomeNormalizado = professor.nome.toLowerCase().trim();
        if (!acc[nomeNormalizado]) {
          acc[nomeNormalizado] = [];
        }
        acc[nomeNormalizado].push({
          ...professor,
          aulaCount: professor.aulas?.[0]?.count || 0,
        });
        return acc;
      }, {});

      // Retornar apenas grupos com mais de 1 professor
      const duplicates = Object.entries(grouped)
        .filter(([_, professores]) => professores.length > 1)
        .map(([nome, professores]) => ({
          nome,
          professores: professores.sort((a, b) => b.aulaCount - a.aulaCount), // Ordenar por número de aulas
        }));

      return duplicates;
    } catch (error) {
      console.error("Erro ao buscar duplicatas:", error);
      throw error;
    }
  },
};

// Adicionando export default para compatibilidade
export default professoresService;

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
};

// Adicionando export default para compatibilidade
export default professoresService;

// Importando o cliente Supabase
import supabase from "./supabase";

// Utilitário para tratamento de erros
const handleResponse = async (response) => {
  if (response.error) {
    throw new Error(
      response.error.message || "Erro ao comunicar com o servidor"
    );
  }
  return response.data;
};

// API simplificada que usa o Supabase
const api = {
  // Operações genéricas para tabelas do Supabase
  getAll: async (table) => {
    const response = await supabase.from(table).select("*");
    return handleResponse(response);
  },

  getById: async (table, id) => {
    const response = await supabase
      .from(table)
      .select("*")
      .eq("id", id)
      .single();
    return handleResponse(response);
  },

  create: async (table, data) => {
    const response = await supabase.from(table).insert(data).select();
    return handleResponse(response);
  },

  update: async (table, id, data) => {
    const response = await supabase
      .from(table)
      .update(data)
      .eq("id", id)
      .select();
    return handleResponse(response);
  },

  delete: async (table, id) => {
    const response = await supabase.from(table).delete().eq("id", id);
    return handleResponse(response);
  },

  // Método personalizado para consultas mais complexas
  query: async (table, queryFn) => {
    let query = supabase.from(table).select("*");
    query = queryFn(query);
    const response = await query;
    return handleResponse(response);
  },
};

export default api;

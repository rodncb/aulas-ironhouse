// Re-exportar o cliente Supabase da configuração central para compatibilidade
import supabase from "../config/supabaseConfig.js";

// Exportar como padrão e como nomeado para manter compatibilidade com ambos os estilos de importação
export default supabase;
export { supabase };

// Exportar função para recarregar o esquema do Supabase se necessário
export const reloadSupabaseSchemaCache = async () => {
  try {
    // Qualquer função que precise ser recuperada do arquivo original
    // pode ser implementada aqui
    return true;
  } catch (error) {
    console.error("Erro ao recarregar cache:", error);
    return false;
  }
};

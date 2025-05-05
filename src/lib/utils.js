/**
 * Utilitários centralizados para a aplicação Ironhouse
 */

/**
 * Função para voltar para a tela Geral (Dashboard)
 * @param {Event} e - Evento (opcional)
 */
export const voltarPagina = (e) => {
  // Prevenir propagação do evento se for passado
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }
  // Sempre navegar para a seção 'geral'
  navegarPara("geral");
};

/**
 * Função para navegar para uma seção específica
 * @param {string} secao - Nome da seção para navegar
 */
export const navegarPara = (secao) => {
  window.dispatchEvent(
    new CustomEvent("navegarPara", {
      detail: { secao },
    })
  );
};

/**
 * Função para formatar data em formato pt-BR
 * @param {string|Date} data - Data para formatar
 * @returns {string} Data formatada
 */
export const formatarData = (dataString) => {
  if (!dataString) return "";

  try {
    // Se a data já estiver no formato DD/MM/YYYY, retorna sem alteração
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dataString)) {
      return dataString;
    }

    // CORREÇÃO: Tratar YYYY-MM-DD diretamente para evitar problemas de fuso
    if (/^\d{4}-\d{2}-\d{2}$/.test(dataString)) {
      const parts = dataString.split("-");
      // Simplesmente rearranja as partes da string
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }

    // Se não for YYYY-MM-DD nem DD/MM/YYYY, tentar converter como antes (fallback)
    console.warn(`Formato de data não reconhecido diretamente: ${dataString}. Tentando conversão padrão.`);
    let data = new Date(dataString);

    // Verifica se a data é válida após o fallback
    if (isNaN(data.getTime())) {
      console.warn(`Data inválida após fallback: ${dataString}`);
      // Retorna a string original ou um valor padrão em caso de falha total
      return dataString; // Ou "Data inválida"
    }

    // Formata a data (do fallback) no padrão brasileiro: DD/MM/YYYY
    // Este ainda pode ter problemas de fuso para formatos ambíguos
    return `${String(data.getDate()).padStart(2, "0")}/${String(
      data.getMonth() + 1
    ).padStart(2, "0")}/${data.getFullYear()}`;

  } catch (error) {
    console.error("Erro ao formatar data:", error, dataString);
    // Retorna a string original se falhar
    return dataString;
  }
};

/**
 * Função para obter label formatado de status de aula
 * @param {string} status - Status da aula ('atual', 'ativa', 'realizada', 'cancelada')
 * @returns {JSX.Element} Elemento React com o estilo apropriado
 */
export const getStatusLabel = (status) => {
  switch (status) {
    case "realizada":
      return <span className="status-realizada">Realizada</span>;
    case "cancelada":
      return <span className="status-cancelada">Cancelada</span>;
    case "ativa":
    case "atual":
    default:
      return <span className="status-atual">Atual</span>;
  }
};

/**
 * Função utilitária para gerar ID único com base no timestamp
 * @returns {number} ID único
 */
export const gerarId = () => Date.now();

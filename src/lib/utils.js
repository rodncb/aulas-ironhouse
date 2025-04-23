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

    // Tenta converter a string para um objeto Date
    let data;

    // Tenta interpretar formatos comuns
    if (dataString.includes("-")) {
      // Formato ISO: YYYY-MM-DD
      const parts = dataString.split("-");
      if (parts.length === 3) {
        data = new Date(
          parseInt(parts[0]),
          parseInt(parts[1]) - 1,
          parseInt(parts[2])
        );
      } else {
        data = new Date(dataString);
      }
    } else if (dataString.includes("/")) {
      // Formato: DD/MM/YYYY ou MM/DD/YYYY
      const parts = dataString.split("/");
      if (parts.length === 3) {
        // Assume DD/MM/YYYY (formato brasileiro)
        data = new Date(
          parseInt(parts[2]),
          parseInt(parts[1]) - 1,
          parseInt(parts[0])
        );
      } else {
        data = new Date(dataString);
      }
    } else if (!isNaN(dataString) && dataString.length > 8) {
      // Timestamp em milissegundos
      data = new Date(parseInt(dataString));
    } else {
      // Outros formatos
      data = new Date(dataString);
    }

    // Verifica se a data é válida
    if (isNaN(data.getTime())) {
      console.warn(`Data inválida: ${dataString}`);

      // Retorna data atual como fallback
      const hoje = new Date();
      return `${String(hoje.getDate()).padStart(2, "0")}/${String(
        hoje.getMonth() + 1
      ).padStart(2, "0")}/${hoje.getFullYear()}`;
    }

    // Formata a data no padrão brasileiro: DD/MM/YYYY
    return `${String(data.getDate()).padStart(2, "0")}/${String(
      data.getMonth() + 1
    ).padStart(2, "0")}/${data.getFullYear()}`;
  } catch (error) {
    console.error("Erro ao formatar data:", error, dataString);

    // Retorna a string original se falhar ou a data atual como último recurso
    if (dataString) return dataString;

    const hoje = new Date();
    return `${String(hoje.getDate()).padStart(2, "0")}/${String(
      hoje.getMonth() + 1
    ).padStart(2, "0")}/${hoje.getFullYear()}`;
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

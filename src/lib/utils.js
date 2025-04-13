/**
 * Utilitários centralizados para a aplicação Ironhouse
 */

/**
 * Função para voltar à página anterior ou navegar para o dashboard
 * @param {Event} e - Evento (opcional)
 */
export const voltarPagina = (e) => {
  // Prevenir propagação do evento se for passado
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }

  // Tentar voltar na história do navegador
  if (window.history.length > 1) {
    window.history.back();
  } else {
    // Se não houver histórico, navegar para o dashboard
    navegarPara("geral");
  }
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
    const data = new Date(dataString);
    return data.toLocaleDateString("pt-BR");
  } catch (error) {
    return dataString;
  }
};

/**
 * Função para obter label formatado de status de aula
 * @param {string} status - Status da aula ('atual', 'realizada', 'cancelada')
 * @returns {JSX.Element} Elemento React com o estilo apropriado
 */
export const getStatusLabel = (status) => {
  switch (status) {
    case "realizada":
      return <span className="status-realizada">Realizada</span>;
    case "cancelada":
      return <span className="status-cancelada">Cancelada</span>;
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

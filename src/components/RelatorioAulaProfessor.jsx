import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDownload,
  faRefresh,
  faFileAlt,
  faCalendarAlt,
  faUser,
  faClock,
  faChevronLeft,
  faChevronRight,
  faList,
} from "@fortawesome/free-solid-svg-icons";

const RelatorioAulaProfessor = () => {
  const STORAGE_KEY = "relatorio-horario-professor";

  // Estilos CSS para as cores da legenda de pontualidade
  React.useEffect(() => {
    const styles = `
      .horario-badge {
        padding: 6px 10px;
        border-radius: 6px;
        font-weight: 500;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
        white-space: nowrap;
      }
      
      .horario-badge.pontual {
        background-color: #d4edda;
        color: #155724;
        border: 1px solid #c3e6cb;
      }
      
      .horario-badge.atraso-leve {
        background-color: #fff3cd;
        color: #856404;
        border: 1px solid #ffeaa7;
      }
      
      .horario-badge.atraso-significativo {
        background-color: #f8d7da;
        color: #721c24;
        border: 1px solid #f5c6cb;
      }
      
      .horario-badge.sem-horario {
        background-color: #e9ecef;
        color: #6c757d;
        border: 1px solid #dee2e6;
      }

      .horario-cell {
        text-align: center;
        padding: 12px 8px;
      }
      
      .data-cell, .professor-cell {
        vertical-align: middle;
      }
      
      .data-cell svg, .professor-cell svg {
        margin-right: 8px;
        color: #6c757d;
      }
    `;

    const styleSheet = document.createElement("style");
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);

    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);

  // Função para carregar dados do localStorage
  const carregarDadosSalvos = () => {
    try {
      const dadosSalvos = localStorage.getItem(STORAGE_KEY);
      if (dadosSalvos) {
        return JSON.parse(dadosSalvos);
      }
    } catch (error) {
      console.error("Erro ao carregar dados salvos:", error);
    }
    return null;
  };

  // Função para salvar dados no localStorage
  const salvarDados = (dados) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dados));
    } catch (error) {
      console.error("Erro ao salvar dados:", error);
    }
  };

  // Função para limpar dados salvos
  const limparDadosSalvos = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error("Erro ao limpar dados salvos:", error);
    }
  };

  // Expor função de limpeza globalmente para uso quando sair dos relatórios
  useEffect(() => {
    window.limparDadosRelatorioHorario = limparDadosSalvos;
    return () => {
      delete window.limparDadosRelatorioHorario;
    };
  }, []);  // Carregar dados salvos na inicialização
  const dadosSalvos = carregarDadosSalvos();

  const [loading, setLoading] = useState(false);
  const [aulas, setAulas] = useState(dadosSalvos?.aulas || []);
  const [professores, setProfessores] = useState([]);
  const [dadosRelatorio, setDadosRelatorio] = useState(
    dadosSalvos?.dadosRelatorio || []
  );
  const [filtros, setFiltros] = useState(
    dadosSalvos?.filtros || {
      dataInicial: "2025-05-31",
      dataFinal: "",
      professor: "todos",
    }
  );

  // Estados para paginação
  const [paginaAtual, setPaginaAtual] = useState(dadosSalvos?.paginaAtual || 1);
  const [itensPorPagina, setItensPorPagina] = useState(
    dadosSalvos?.itensPorPagina || 20
  );

  // Funções utilitárias para paginação
  const calcularDadosPaginacao = useCallback(() => {
    const totalItens = dadosRelatorio.length;
    const totalPaginas = Math.ceil(totalItens / itensPorPagina);
    const indiceInicial = (paginaAtual - 1) * itensPorPagina;
    const indiceFinal = indiceInicial + itensPorPagina;
    const dadosPagina = dadosRelatorio.slice(indiceInicial, indiceFinal);

    return {
      totalItens,
      totalPaginas,
      indiceInicial,
      indiceFinal,
      dadosPagina,
      temPaginaAnterior: paginaAtual > 1,
      temProximaPagina: paginaAtual < totalPaginas,
    };
  }, [dadosRelatorio, paginaAtual, itensPorPagina]);

  // Reset da página quando mudam os dados ou filtros
  useEffect(() => {
    setPaginaAtual(1);
  }, [dadosRelatorio]);

  const alterarItensPorPagina = (novoValor) => {
    setItensPorPagina(novoValor);
    setPaginaAtual(1);
  };

  const irParaPagina = (pagina) => {
    const { totalPaginas } = calcularDadosPaginacao();
    if (pagina >= 1 && pagina <= totalPaginas) {
      setPaginaAtual(pagina);
    }
  };

  // Função para determinar a cor baseada no horário
  const determinarCorHorario = (hora) => {
    if (!hora || hora === "00:00") return "sem-horario";

    const minutos = parseInt(hora.split(":")[1]);

    // Verde: xx:49 a xx:05 (considerando que 49-59 e 00-05 são pontuais)
    if (minutos >= 49 || minutos <= 5) {
      return "pontual"; // Verde
    }
    // Amarelo: xx:06 a xx:15 (atraso leve)
    else if (minutos >= 6 && minutos <= 15) {
      return "atraso-leve"; // Amarelo
    }
    // Vermelho: xx:16 a xx:48 (atraso significativo)
    else {
      return "atraso-significativo"; // Vermelho
    }
  };

  // Função para processar dados do relatório
  const processarDadosRelatorio = useCallback(() => {
    console.log("🔍 PROCESSANDO DADOS - Filtros:", filtros);
    console.log("🔍 TOTAL AULAS CARREGADAS:", aulas?.length || 0);

    if (!aulas || aulas.length === 0) {
      setDadosRelatorio([]);
      return;
    }

    // Log das primeiras aulas para verificar as datas
    console.log(
      "🔍 PRIMEIRAS 5 AULAS:",
      aulas.slice(0, 5).map((a) => ({
        id: a.id,
        data: a.data,
        dataSubstring: a.data.substring(0, 10),
        professor: a.professor?.nome,
      }))
    );

    // Filtrar aulas
    let aulasFiltradas = [...aulas];

    // Aplicar filtros selecionados pelo usuário
    aulasFiltradas = aulasFiltradas.filter((aula) => {
      // Filtro por professor
      if (
        filtros.professor !== "todos" &&
        aula.professor_id?.toString() !== filtros.professor
      ) {
        return false;
      }

      // Filtro por data/período
      if (filtros.dataInicial || filtros.dataFinal) {
        // Extrair apenas a data (YYYY-MM-DD) da aula, sem conversão de timezone
        const aulaData = aula.data.substring(0, 10); // Pega apenas YYYY-MM-DD

        if (filtros.dataInicial && !filtros.dataFinal) {
          const resultado = aulaData >= filtros.dataInicial;
          if (!resultado) {
            console.log(
              `🚫 AULA FILTRADA: ${aulaData} < ${filtros.dataInicial}`
            );
          }
          return resultado;
        } else if (filtros.dataInicial && filtros.dataFinal) {
          return (
            aulaData >= filtros.dataInicial && aulaData <= filtros.dataFinal
          );
        } else if (!filtros.dataInicial && filtros.dataFinal) {
          return aulaData <= filtros.dataFinal;
        }
      }

      return true;
    });

    console.log("🔍 AULAS APÓS FILTRO:", aulasFiltradas.length);
    console.log("🔍 PRIMEIRA AULA FILTRADA:", aulasFiltradas[0]?.data);
    console.log(
      "🔍 ÚLTIMA AULA FILTRADA:",
      aulasFiltradas[aulasFiltradas.length - 1]?.data
    );

    // Ordenar por data e professor
    aulasFiltradas.sort((a, b) => {
      const dataA = new Date(a.data);
      const dataB = new Date(b.data);
      if (dataA !== dataB) {
        return dataA - dataB;
      }
      const nomeA = a.professor?.nome || "";
      const nomeB = b.professor?.nome || "";
      return nomeA.localeCompare(nomeB);
    });

    setDadosRelatorio(aulasFiltradas);
  }, [aulas, filtros]);

  // Carregar apenas professores na inicialização
  useEffect(() => {
    carregarProfessores();
  }, []);

  // Salvar dados no localStorage sempre que houver mudanças importantes
  useEffect(() => {
    const dadosParaSalvar = {
      aulas,
      dadosRelatorio,
      filtros,
      paginaAtual,
      itensPorPagina,
      timestamp: Date.now(),
    };
    salvarDados(dadosParaSalvar);
  }, [aulas, dadosRelatorio, filtros, paginaAtual, itensPorPagina]);

  // Função para limpar dados salvos (será usada quando sair dos relatórios)
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Manter dados salvos mesmo ao fechar/recarregar a página
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // Reprocessar dados quando filtros mudarem (mas só se temos dados)
  useEffect(() => {
    if (aulas.length > 0) {
      processarDadosRelatorio();
    }
  }, [aulas, processarDadosRelatorio]);

  const carregarProfessores = async () => {
    try {
      const { supabase } = await import("../services/supabase");

      const { data: professoresData, error: professoresError } = await supabase
        .from("professores")
        .select("*")
        .order("nome");

      if (professoresError) {
        console.error("Erro ao buscar professores:", professoresError);
        throw professoresError;
      }

      setProfessores(professoresData || []);
    } catch (error) {
      console.error("Erro ao carregar professores:", error);
      toast.error(`Erro ao carregar professores: ${error.message}`);
    }
  };

  // Função para carregar todos os dados com paginação real
  const carregarTodosOsDados = async (tabela, selectClause, orderBy = 'id') => {
    const { supabase } = await import("../services/supabase");
    let todosOsDados = [];
    let inicio = 0;
    const tamanhoPagina = 1000;
    let temMaisDados = true;

    while (temMaisDados) {
      console.log(`📄 Carregando página ${Math.floor(inicio / tamanhoPagina) + 1} de ${tabela}...`);
      
      const { data, error } = await supabase
        .from(tabela)
        .select(selectClause)
        .order(orderBy, { ascending: false })
        .range(inicio, inicio + tamanhoPagina - 1);

      if (error) {
        console.error(`❌ Erro ao carregar ${tabela}:`, error);
        throw error;
      }

      if (data && data.length > 0) {
        todosOsDados = [...todosOsDados, ...data];
        console.log(`✅ Carregados ${data.length} registros de ${tabela}, total: ${todosOsDados.length}`);
        
        // Se recebeu menos dados que o tamanho da página, chegou ao fim
        if (data.length < tamanhoPagina) {
          temMaisDados = false;
        } else {
          inicio += tamanhoPagina;
        }
      } else {
        temMaisDados = false;
      }
    }

    console.log(`🎯 Total de registros carregados de ${tabela}: ${todosOsDados.length}`);
    return todosOsDados;
  };

  const carregarDados = async () => {
    console.log("🚀 INICIANDO CARREGAMENTO DE DADOS COM PAGINAÇÃO REAL");
    setLoading(true);
    try {
      // Carregar todas as aulas com paginação real
      console.log("📊 Carregando todas as aulas do Supabase...");
      const todasAsAulas = await carregarTodosOsDados(
        'aulas',
        `*,
         professor:professor_id(*)`,
        'data'
      );

      console.log("📊 DADOS CARREGADOS:", todasAsAulas?.length || 0, "aulas");
      
      if (todasAsAulas && todasAsAulas.length > 0) {
        console.log("📊 PRIMEIRA AULA:", todasAsAulas[0].data);
        console.log("📊 ÚLTIMA AULA:", todasAsAulas[todasAsAulas.length - 1].data);

        // Verificar se existem aulas antes de 24/06
        const aulasAntes24Jun = todasAsAulas.filter(
          (aula) => aula.data.substring(0, 10) < "2025-06-24"
        );
        console.log("📊 AULAS ANTES DE 24/06:", aulasAntes24Jun.length);

        if (aulasAntes24Jun.length > 0) {
          console.log("📊 EXEMPLO AULA ANTES 24/06:", aulasAntes24Jun[0].data);
        }

        // Verificar aulas a partir de 31/05
        const aulasApartir31Mai = todasAsAulas.filter(
          (aula) => aula.data.substring(0, 10) >= "2025-05-31"
        );
        console.log("📊 AULAS A PARTIR DE 31/05:", aulasApartir31Mai.length);
      }

      setAulas(todasAsAulas || []);
    } catch (error) {
      console.error("Erro detalhado ao carregar aulas:", error);
      toast.error(`Erro ao carregar aulas: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatarData = (dataString) => {
    const data = new Date(dataString + "T12:00:00"); // Forçar meio-dia para evitar problemas de timezone
    return data.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const gerarPDF = async () => {
    try {
      let titulo = "RELATÓRIO HORÁRIO/PROFESSOR";
      let subtitulo = "";

      if (filtros.dataInicial && filtros.dataFinal) {
        subtitulo = `Período: ${formatarData(
          filtros.dataInicial
        )} a ${formatarData(filtros.dataFinal)}`;
      } else if (filtros.dataInicial) {
        subtitulo = `Data: ${formatarData(filtros.dataInicial)}`;
      } else {
        subtitulo = `Data: ${new Date().toLocaleDateString("pt-BR")}`;
      }

      let htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Relatório Horário/Professor</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .header h1 { color: #2c3e50; margin: 0; }
            .header p { color: #7f8c8d; margin: 5px 0; }
            .summary { background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
            .table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            .table th, .table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            .table th { background-color: #34495e; color: white; }
            .table tr:nth-child(even) { background-color: #f2f2f2; }
            .horario-pontual { background-color: #d4edda; color: #155724; padding: 4px 8px; border-radius: 4px; }
            .horario-atraso-leve { background-color: #fff3cd; color: #856404; padding: 4px 8px; border-radius: 4px; }
            .horario-atraso-significativo { background-color: #f8d7da; color: #721c24; padding: 4px 8px; border-radius: 4px; }
            .horario-sem-horario { background-color: #e9ecef; color: #6c757d; padding: 4px 8px; border-radius: 4px; }
            .no-data { text-align: center; padding: 40px; color: #7f8c8d; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${titulo}</h1>
            <p>${subtitulo}</p>
            <p>Gerado em: ${new Date().toLocaleString("pt-BR")}</p>
          </div>
          
          <div class="summary">
            <strong>Resumo:</strong><br>
            Total de Aulas: ${dadosRelatorio.length}
          </div>`;

      if (dadosRelatorio.length === 0) {
        htmlContent +=
          '<div class="no-data"><h3>Nenhuma aula encontrada</h3><p>Não há aulas para os filtros selecionados.</p></div>';
      } else {
        htmlContent += `
          <table class="table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Professor</th>
                <th>Horário</th>
              </tr>
            </thead>
            <tbody>`;

        // Usar TODOS OS DADOS para o PDF (não apenas da página atual)
        dadosRelatorio.forEach((aula) => {
          const corHorario = determinarCorHorario(aula.hora);
          htmlContent += `
            <tr>
              <td>${formatarData(aula.data)}</td>
              <td>${aula.professor?.nome || "Professor não encontrado"}</td>
              <td><span class="horario-${corHorario}">${
            aula.hora || "Não definido"
          }</span></td>
            </tr>`;
        });

        htmlContent += `</tbody></table>`;
      }

      htmlContent += `</body></html>`;

      const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const newWindow = window.open(url, "_blank");

      if (newWindow) {
        newWindow.onload = () => {
          setTimeout(() => {
            newWindow.print();
          }, 500);
        };
      }

      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 60000);

      toast.success("Relatório aberto para impressão/salvamento como PDF!");
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Erro ao exportar relatório");
    }
  };

  return (
    <div className="relatorio-container">
      <div className="relatorio-header">
        <div className="relatorio-title">
          <FontAwesomeIcon icon={faClock} className="title-icon" />
          <div>
            <h2>Relatório Horário/Professor</h2>
            <p>Relatório de pontualidade de horários das aulas</p>
          </div>
        </div>

        <div className="relatorio-actions">
          <button
            className="btn-search"
            onClick={carregarDados}
            disabled={loading}
          >
            <FontAwesomeIcon icon={faRefresh} />
            Pesquisar
          </button>

          <button
            className="btn-export"
            onClick={gerarPDF}
            disabled={loading || dadosRelatorio.length === 0}
          >
            <FontAwesomeIcon icon={faDownload} />
            Exportar
          </button>
        </div>
      </div>

      <div className="relatorio-filtros">
        <div className="filtro-group">
          <label>
            <FontAwesomeIcon icon={faUser} />
            Professor:
          </label>
          <select
            value={filtros.professor}
            onChange={(e) =>
              setFiltros({ ...filtros, professor: e.target.value })
            }
          >
            <option value="todos">Todos os Professores</option>
            {professores.map((professor) => (
              <option key={professor.id} value={professor.id.toString()}>
                {professor.nome}
              </option>
            ))}
          </select>
        </div>

        <div className="filtro-group">
          <label>
            <FontAwesomeIcon icon={faCalendarAlt} />
            Data Inicial:
          </label>
          <input
            type="date"
            value={filtros.dataInicial}
            onChange={(e) =>
              setFiltros({ ...filtros, dataInicial: e.target.value })
            }
            className="input-data"
          />
        </div>

        <div className="filtro-group">
          <label>
            <FontAwesomeIcon icon={faCalendarAlt} />
            Data Final:
          </label>
          <input
            type="date"
            value={filtros.dataFinal}
            onChange={(e) =>
              setFiltros({ ...filtros, dataFinal: e.target.value })
            }
            className="input-data"
            min={filtros.dataInicial}
          />
        </div>
      </div>

      {/* Legenda das cores */}
      <div className="legenda-cores">
        <h4>
          <FontAwesomeIcon icon={faClock} style={{ marginRight: "10px" }} />
          Legenda de Pontualidade
        </h4>
        <div className="legenda-items">
          <div className="legenda-item pontual">
            <span className="cor-exemplo"></span>
            <div>
              <strong>Pontual</strong>
              <div style={{ fontSize: "12px", opacity: 0.8 }}>
                xx:49 - xx:05 (16 min antes/depois)
              </div>
            </div>
          </div>
          <div className="legenda-item atraso-leve">
            <span className="cor-exemplo"></span>
            <div>
              <strong>Atraso Leve</strong>
              <div style={{ fontSize: "12px", opacity: 0.8 }}>
                xx:06 - xx:15 (6-15 min de atraso)
              </div>
            </div>
          </div>
          <div className="legenda-item atraso-significativo">
            <span className="cor-exemplo"></span>
            <div>
              <strong>Atraso Significativo</strong>
              <div style={{ fontSize: "12px", opacity: 0.8 }}>
                xx:16 - xx:48 (16+ min de atraso)
              </div>
            </div>
          </div>
        </div>
        <div
          style={{
            textAlign: "center",
            marginTop: "15px",
            fontSize: "12px",
            color: "#6c757d",
            fontStyle: "italic",
          }}
        >
          💡 A pontualidade é calculada baseada nos minutos do horário de
          chegada
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Carregando dados do relatório...</p>
        </div>
      ) : (
        <div className="relatorio-content">
          {dadosRelatorio.length === 0 ? (
            <div className="no-data">
              <FontAwesomeIcon icon={faFileAlt} className="no-data-icon" />
              <h3>Nenhuma aula encontrada</h3>
              <p>
                Selecione os filtros acima e clique em "Pesquisar" para
                visualizar as aulas.
              </p>
            </div>
          ) : (
            <>
              {/* Controles de paginação */}
              <div className="pagination-controls">
                <div className="pagination-info">
                  <FontAwesomeIcon icon={faList} />
                  <span>
                    Mostrando {calcularDadosPaginacao().indiceInicial + 1} a{" "}
                    {Math.min(
                      calcularDadosPaginacao().indiceFinal,
                      calcularDadosPaginacao().totalItens
                    )}{" "}
                    de {calcularDadosPaginacao().totalItens} registros
                  </span>
                </div>

                <div className="pagination-size">
                  <label>Itens por página:</label>
                  <select
                    value={itensPorPagina}
                    onChange={(e) =>
                      alterarItensPorPagina(Number(e.target.value))
                    }
                  >
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>

              <div className="relatorio-table">
                <table>
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Professor</th>
                      <th>Horário</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calcularDadosPaginacao().dadosPagina.map((aula, index) => (
                      <tr key={index}>
                        <td className="data-cell">
                          <FontAwesomeIcon icon={faCalendarAlt} />
                          {formatarData(aula.data)}
                        </td>
                        <td className="professor-cell">
                          <FontAwesomeIcon icon={faUser} />
                          {aula.professor?.nome || "Professor não encontrado"}
                        </td>
                        <td className="horario-cell">
                          <span
                            className={`horario-badge ${determinarCorHorario(
                              aula.hora
                            )}`}
                          >
                            <FontAwesomeIcon icon={faClock} />
                            {aula.hora || "Não definido"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Navegação da paginação */}
              {calcularDadosPaginacao().totalPaginas > 1 && (
                <div className="pagination-navigation">
                  <button
                    className="pagination-btn"
                    onClick={() => irParaPagina(paginaAtual - 1)}
                    disabled={!calcularDadosPaginacao().temPaginaAnterior}
                  >
                    <FontAwesomeIcon icon={faChevronLeft} />
                    Anterior
                  </button>

                  <div className="pagination-pages">
                    {Array.from(
                      { length: calcularDadosPaginacao().totalPaginas },
                      (_, i) => i + 1
                    )
                      .filter((pagina) => {
                        const atual = paginaAtual;
                        return (
                          pagina === 1 ||
                          pagina === calcularDadosPaginacao().totalPaginas ||
                          (pagina >= atual - 2 && pagina <= atual + 2)
                        );
                      })
                      .map((pagina, index, array) => (
                        <React.Fragment key={pagina}>
                          {index > 0 && array[index - 1] !== pagina - 1 && (
                            <span className="pagination-ellipsis">...</span>
                          )}
                          <button
                            className={`pagination-page ${
                              pagina === paginaAtual ? "active" : ""
                            }`}
                            onClick={() => irParaPagina(pagina)}
                          >
                            {pagina}
                          </button>
                        </React.Fragment>
                      ))}
                  </div>

                  <button
                    className="pagination-btn"
                    onClick={() => irParaPagina(paginaAtual + 1)}
                    disabled={!calcularDadosPaginacao().temProximaPagina}
                  >
                    Próxima
                    <FontAwesomeIcon icon={faChevronRight} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default RelatorioAulaProfessor;

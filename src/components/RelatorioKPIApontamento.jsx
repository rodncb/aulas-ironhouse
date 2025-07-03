import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDownload,
  faRefresh,
  faFileAlt,
  faCalendarAlt,
  faUser,
  faChevronLeft,
  faChevronRight,
  faList,
  faChartBar,
  faClock,
  faPercentage,
} from "@fortawesome/free-solid-svg-icons";

const RelatorioKPIApontamento = () => {
  const STORAGE_KEY = "relatorio-kpi-apontamento";

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
    window.limparDadosRelatorioKPI = limparDadosSalvos;
    return () => {
      delete window.limparDadosRelatorioKPI;
    };
  }, []);

  // Carregar dados salvos na inicialização
  const dadosSalvos = carregarDadosSalvos();

  const [loading, setLoading] = useState(false);
  const [aulas, setAulas] = useState(dadosSalvos?.aulas || []);
  const [professores, setProfessores] = useState([]);
  const [dadosRelatorio, setDadosRelatorio] = useState(
    dadosSalvos?.dadosRelatorio || []
  );
  const [filtros, setFiltros] = useState(
    dadosSalvos?.filtros || {
      dataInicial: "",
      dataFinal: "",
      professor: "todos",
    }
  );

  // Estados para paginação
  const [paginaAtual, setPaginaAtual] = useState(dadosSalvos?.paginaAtual || 1);
  const [itensPorPagina, setItensPorPagina] = useState(
    dadosSalvos?.itensPorPagina || 20
  );

  // Estado para controlar exibição do gráfico
  const [mostrarGrafico, setMostrarGrafico] = useState(
    dadosSalvos?.mostrarGrafico || false
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

  // Função para determinar a categoria baseada no horário
  const determinarCategoriaHorario = (hora) => {
    if (!hora || hora === "00:00") return "sem-horario";

    const minutos = parseInt(hora.split(":")[1]);

    // Verde: xx:49 a xx:05 (considerando que 49-59 e 00-05 são pontuais)
    if (minutos >= 49 || minutos <= 5) {
      return "pontual";
    }
    // Amarelo: xx:06 a xx:15 (atraso leve)
    else if (minutos >= 6 && minutos <= 15) {
      return "atraso-leve";
    }
    // Vermelho: xx:16 a xx:48 (atraso significativo)
    else {
      return "atraso-significativo";
    }
  };

  // Função para processar dados do relatório KPI
  const processarDadosRelatorio = useCallback(() => {
    if (!aulas || aulas.length === 0) {
      setDadosRelatorio([]);
      return;
    }

    // Filtrar aulas pelos critérios selecionados
    let aulasFiltradas = aulas.filter((aula) => {
      // Filtro por professor
      if (
        filtros.professor !== "todos" &&
        aula.professor_id?.toString() !== filtros.professor
      ) {
        return false;
      }

      // Filtro por data
      if (filtros.dataInicial || filtros.dataFinal) {
        const aulaData = aula.data.substring(0, 10);
        if (filtros.dataInicial && filtros.dataFinal) {
          return (
            aulaData >= filtros.dataInicial && aulaData <= filtros.dataFinal
          );
        } else if (filtros.dataInicial) {
          return aulaData >= filtros.dataInicial;
        } else if (filtros.dataFinal) {
          return aulaData <= filtros.dataFinal;
        }
      }

      return true;
    });

    if (aulasFiltradas.length === 0) {
      setDadosRelatorio([]);
      return;
    }

    // Agrupar por professor e calcular KPIs
    const kpisPorProfessor = aulasFiltradas.reduce((acc, aula) => {
      const professorId = aula.professor_id;
      const professorNome = aula.professor?.nome || "Professor não encontrado";
      const categoria = determinarCategoriaHorario(aula.hora);

      if (!acc[professorId]) {
        acc[professorId] = {
          professor_id: professorId,
          professor_nome: professorNome,
          total_aulas: 0,
          pontual: 0,
          atraso_leve: 0,
          atraso_significativo: 0,
          sem_horario: 0,
        };
      }

      acc[professorId].total_aulas++;
      acc[professorId][categoria.replace("-", "_")]++;

      return acc;
    }, {});

    // Converter para array e calcular porcentagens
    const dadosProcessados = Object.values(kpisPorProfessor).map((prof) => {
      const total = prof.total_aulas;
      const pontualPercent =
        total > 0 ? ((prof.pontual / total) * 100).toFixed(1) : 0;
      const atrasoLevePercent =
        total > 0 ? ((prof.atraso_leve / total) * 100).toFixed(1) : 0;
      const atrasoSignificativoPercent =
        total > 0 ? ((prof.atraso_significativo / total) * 100).toFixed(1) : 0;

      return {
        ...prof,
        pontual_percent: parseFloat(pontualPercent),
        atraso_leve_percent: parseFloat(atrasoLevePercent),
        atraso_significativo_percent: parseFloat(atrasoSignificativoPercent),
      };
    });

    // Ordenar por nome do professor
    dadosProcessados.sort((a, b) =>
      a.professor_nome.localeCompare(b.professor_nome)
    );

    setDadosRelatorio(dadosProcessados);
  }, [aulas, filtros]);

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

  // Carregar professores na inicialização
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
      mostrarGrafico,
      timestamp: Date.now(),
    };
    salvarDados(dadosParaSalvar);
  }, [
    aulas,
    dadosRelatorio,
    filtros,
    paginaAtual,
    itensPorPagina,
    mostrarGrafico,
  ]);

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

  const carregarDados = async () => {
    setLoading(true);
    try {
      const { supabase } = await import("../services/supabase");

      // Buscar aulas com joins para professores
      const { data: aulasData, error: aulasError } = await supabase
        .from("aulas")
        .select(
          `
          *,
          professor:professor_id(*)
        `
        )
        .order("data", { ascending: false });

      if (aulasError) {
        console.error("Erro ao buscar aulas:", aulasError);
        throw aulasError;
      }

      setAulas(aulasData || []);
    } catch (error) {
      console.error("Erro ao carregar aulas:", error);
      toast.error(`Erro ao carregar aulas: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatarData = (dataString) => {
    const data = new Date(dataString + "T12:00:00");
    return data.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Calcular KPIs gerais
  const calcularKPIsGerais = () => {
    if (dadosRelatorio.length === 0) return null;

    const totalAulas = dadosRelatorio.reduce(
      (total, prof) => total + prof.total_aulas,
      0
    );
    const totalPontual = dadosRelatorio.reduce(
      (total, prof) => total + prof.pontual,
      0
    );
    const totalAtrasoLeve = dadosRelatorio.reduce(
      (total, prof) => total + prof.atraso_leve,
      0
    );
    const totalAtrasoSignificativo = dadosRelatorio.reduce(
      (total, prof) => total + prof.atraso_significativo,
      0
    );

    return {
      totalAulas,
      pontualPercent:
        totalAulas > 0 ? ((totalPontual / totalAulas) * 100).toFixed(1) : 0,
      atrasoLevePercent:
        totalAulas > 0 ? ((totalAtrasoLeve / totalAulas) * 100).toFixed(1) : 0,
      atrasoSignificativoPercent:
        totalAulas > 0
          ? ((totalAtrasoSignificativo / totalAulas) * 100).toFixed(1)
          : 0,
    };
  };

  const gerarPDF = async () => {
    try {
      let titulo = "RELATÓRIO KPI DE APONTAMENTO";
      let subtitulo = "";

      if (filtros.dataInicial && filtros.dataFinal) {
        subtitulo = `Período: ${formatarData(
          filtros.dataInicial
        )} a ${formatarData(filtros.dataFinal)}`;
      } else if (filtros.dataInicial) {
        subtitulo = `A partir de: ${formatarData(filtros.dataInicial)}`;
      } else if (filtros.dataFinal) {
        subtitulo = `Até: ${formatarData(filtros.dataFinal)}`;
      } else {
        subtitulo = `Data: ${new Date().toLocaleDateString("pt-BR")}`;
      }

      const kpisGerais = calcularKPIsGerais();

      let htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Relatório KPI de Apontamento</title>
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
            .kpi-pontual { color: #28a745; font-weight: bold; }
            .kpi-atraso-leve { color: #ffc107; font-weight: bold; }
            .kpi-atraso-significativo { color: #dc3545; font-weight: bold; }
            .no-data { text-align: center; padding: 40px; color: #7f8c8d; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${titulo}</h1>
            <p>${subtitulo}</p>
            <p>Gerado em: ${new Date().toLocaleString("pt-BR")}</p>
          </div>`;

      if (kpisGerais) {
        htmlContent += `
          <div class="summary">
            <strong>KPIs Gerais:</strong><br>
            Total de Aulas: ${kpisGerais.totalAulas}<br>
            <span class="kpi-pontual">Pontualidade Geral: ${kpisGerais.pontualPercent}%</span><br>
            <span class="kpi-atraso-leve">Atraso Leve: ${kpisGerais.atrasoLevePercent}%</span><br>
            <span class="kpi-atraso-significativo">Atraso Significativo: ${kpisGerais.atrasoSignificativoPercent}%</span>
          </div>`;
      }

      if (dadosRelatorio.length === 0) {
        htmlContent +=
          '<div class="no-data"><h3>Nenhuma aula encontrada</h3><p>Não há aulas para os filtros selecionados.</p></div>';
      } else {
        htmlContent += `
          <table class="table">
            <thead>
              <tr>
                <th>Professor</th>
                <th>Total Aulas</th>
                <th>Pontual (%)</th>
                <th>Atraso Leve (%)</th>
                <th>Atraso Significativo (%)</th>
              </tr>
            </thead>
            <tbody>`;

        dadosRelatorio.forEach((prof) => {
          htmlContent += `
            <tr>
              <td>${prof.professor_nome}</td>
              <td style="text-align: center;">${prof.total_aulas}</td>
              <td style="text-align: center;"><span class="kpi-pontual">${prof.pontual_percent}% (${prof.pontual})</span></td>
              <td style="text-align: center;"><span class="kpi-atraso-leve">${prof.atraso_leve_percent}% (${prof.atraso_leve})</span></td>
              <td style="text-align: center;"><span class="kpi-atraso-significativo">${prof.atraso_significativo_percent}% (${prof.atraso_significativo})</span></td>
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
          <FontAwesomeIcon icon={faPercentage} className="title-icon" />
          <div>
            <h2>Relatório KPI de Apontamento</h2>
            <p>Análise de pontualidade dos professores por categoria</p>
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

          <button
            className={`btn-chart ${mostrarGrafico ? "active" : ""}`}
            onClick={() => setMostrarGrafico(!mostrarGrafico)}
            disabled={loading || dadosRelatorio.length === 0}
          >
            <FontAwesomeIcon icon={faChartBar} />
            {mostrarGrafico ? "Ocultar" : "Mostrar"} Gráfico
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

      {/* KPIs Gerais */}
      {dadosRelatorio.length > 0 &&
        (() => {
          const kpisGerais = calcularKPIsGerais();
          return (
            <div className="kpis-gerais">
              <div className="kpi-card">
                <div className="kpi-icon pontual">
                  <FontAwesomeIcon icon={faClock} />
                </div>
                <div className="kpi-content">
                  <h3>Pontualidade Geral</h3>
                  <span className="kpi-value pontual">
                    {kpisGerais.pontualPercent}%
                  </span>
                </div>
              </div>
              <div className="kpi-card">
                <div className="kpi-icon atraso-leve">
                  <FontAwesomeIcon icon={faClock} />
                </div>
                <div className="kpi-content">
                  <h3>Atraso Leve</h3>
                  <span className="kpi-value atraso-leve">
                    {kpisGerais.atrasoLevePercent}%
                  </span>
                </div>
              </div>
              <div className="kpi-card">
                <div className="kpi-icon atraso-significativo">
                  <FontAwesomeIcon icon={faClock} />
                </div>
                <div className="kpi-content">
                  <h3>Atraso Significativo</h3>
                  <span className="kpi-value atraso-significativo">
                    {kpisGerais.atrasoSignificativoPercent}%
                  </span>
                </div>
              </div>
              <div className="kpi-card">
                <div className="kpi-icon total">
                  <FontAwesomeIcon icon={faFileAlt} />
                </div>
                <div className="kpi-content">
                  <h3>Total de Aulas</h3>
                  <span className="kpi-value total">
                    {kpisGerais.totalAulas}
                  </span>
                </div>
              </div>
            </div>
          );
        })()}

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Carregando dados do relatório...</p>
        </div>
      ) : (
        <div
          className={`relatorio-content ${
            mostrarGrafico ? "mostrar-grafico" : ""
          }`}
        >
          {dadosRelatorio.length === 0 ? (
            <div className="no-data">
              <FontAwesomeIcon icon={faFileAlt} className="no-data-icon" />
              <h3>Nenhuma aula encontrada</h3>
              <p>
                Selecione os filtros acima e clique em "Pesquisar" para
                visualizar o relatório KPI.
              </p>
            </div>
          ) : (
            <>
              {/* Gráfico de Barras CSS */}
              {mostrarGrafico && (
                <div className="grafico-container">
                  <h3>
                    <FontAwesomeIcon icon={faChartBar} />
                    {calcularDadosPaginacao().dadosPagina.length === 1
                      ? `Análise de Pontualidade - ${
                          calcularDadosPaginacao().dadosPagina[0]
                            ?.professor_nome
                        }`
                      : "Análise de Pontualidade por Professor"}
                  </h3>
                  <div
                    className={`grafico-barras ${
                      calcularDadosPaginacao().dadosPagina.length === 1
                        ? "um-professor"
                        : calcularDadosPaginacao().dadosPagina.length <= 3
                        ? "poucos-professores"
                        : ""
                    }`}
                  >
                    {calcularDadosPaginacao().dadosPagina.map((prof, index) => {
                      const maxHeight =
                        calcularDadosPaginacao().dadosPagina.length === 1
                          ? 220
                          : calcularDadosPaginacao().dadosPagina.length <= 3
                          ? 200
                          : 160;
                      const multiplier =
                        calcularDadosPaginacao().dadosPagina.length === 1
                          ? 2.2
                          : calcularDadosPaginacao().dadosPagina.length <= 3
                          ? 2.0
                          : 1.6;

                      return (
                        <div key={index} className="barra-professor">
                          <div className="professor-label">
                            {calcularDadosPaginacao().dadosPagina.length === 1
                              ? prof.professor_nome
                              : prof.professor_nome.split(" ")[0]}
                          </div>
                          <div className="barra-container">
                            <div
                              className="barra pontual"
                              style={{
                                height: `${Math.min(
                                  prof.pontual_percent * multiplier,
                                  maxHeight
                                )}px`,
                              }}
                              title={`Pontual: ${prof.pontual_percent}%`}
                            ></div>
                            <div
                              className="barra atraso-leve"
                              style={{
                                height: `${Math.min(
                                  prof.atraso_leve_percent * multiplier,
                                  maxHeight
                                )}px`,
                              }}
                              title={`Atraso Leve: ${prof.atraso_leve_percent}%`}
                            ></div>
                            <div
                              className="barra atraso-significativo"
                              style={{
                                height: `${Math.min(
                                  prof.atraso_significativo_percent *
                                    multiplier,
                                  maxHeight
                                )}px`,
                              }}
                              title={`Atraso Significativo: ${prof.atraso_significativo_percent}%`}
                            ></div>
                          </div>
                          <div className="percentual-label">
                            {prof.pontual_percent}%
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Resumo detalhado para um professor */}
                  {calcularDadosPaginacao().dadosPagina.length === 1 && (
                    <div className="resumo-um-professor">
                      <div className="resumo-detalhes">
                        <div className="detalhe-item">
                          <span className="detalhe-label">Total de Aulas:</span>
                          <span className="detalhe-valor">
                            {calcularDadosPaginacao().dadosPagina[0]
                              ?.total_aulas || 0}
                          </span>
                        </div>
                        <div className="detalhe-item">
                          <span className="detalhe-label">Pontual:</span>
                          <span className="detalhe-valor destaque-pontual">
                            {calcularDadosPaginacao().dadosPagina[0]?.pontual ||
                              0}{" "}
                            aulas (
                            {calcularDadosPaginacao().dadosPagina[0]
                              ?.pontual_percent || 0}
                            %)
                          </span>
                        </div>
                        <div className="detalhe-item">
                          <span className="detalhe-label">Atraso Leve:</span>
                          <span className="detalhe-valor destaque-leve">
                            {calcularDadosPaginacao().dadosPagina[0]
                              ?.atraso_leve || 0}{" "}
                            aulas (
                            {calcularDadosPaginacao().dadosPagina[0]
                              ?.atraso_leve_percent || 0}
                            %)
                          </span>
                        </div>
                        <div className="detalhe-item">
                          <span className="detalhe-label">
                            Atraso Significativo:
                          </span>
                          <span className="detalhe-valor destaque-significativo">
                            {calcularDadosPaginacao().dadosPagina[0]
                              ?.atraso_significativo || 0}{" "}
                            aulas (
                            {calcularDadosPaginacao().dadosPagina[0]
                              ?.atraso_significativo_percent || 0}
                            %)
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="legenda-cores">
                    <h4>
                      <FontAwesomeIcon
                        icon={faClock}
                        style={{ marginRight: "10px" }}
                      />
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
                  </div>
                </div>
              )}

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
                      <th>Professor</th>
                      <th className="total-aulas-col">Total Aulas</th>
                      <th className="kpi-col pontual">Pontual (%)</th>
                      <th className="kpi-col atraso-leve">Atraso Leve (%)</th>
                      <th className="kpi-col atraso-significativo">
                        Atraso Significativo (%)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {calcularDadosPaginacao().dadosPagina.map((prof, index) => (
                      <tr key={index}>
                        <td className="professor-cell">
                          <FontAwesomeIcon icon={faUser} />
                          {prof.professor_nome}
                        </td>
                        <td className="total-cell">
                          <span
                            className="badge"
                            title={`Total de aulas ministradas: ${prof.total_aulas}`}
                          >
                            {prof.total_aulas}
                          </span>
                        </td>
                        <td className="kpi-cell pontual">
                          <span
                            className="kpi-badge pontual"
                            data-percent={prof.pontual_percent}
                            title={`Pontual: ${prof.pontual_percent}% (${prof.pontual} de ${prof.total_aulas} aulas)`}
                          >
                            {prof.pontual_percent}% ({prof.pontual})
                          </span>
                        </td>
                        <td className="kpi-cell atraso-leve">
                          <span
                            className="kpi-badge atraso-leve"
                            data-percent={prof.atraso_leve_percent}
                            title={`Atraso Leve: ${prof.atraso_leve_percent}% (${prof.atraso_leve} de ${prof.total_aulas} aulas)`}
                          >
                            {prof.atraso_leve_percent}% ({prof.atraso_leve})
                          </span>
                        </td>
                        <td className="kpi-cell atraso-significativo">
                          <span
                            className="kpi-badge atraso-significativo"
                            data-percent={prof.atraso_significativo_percent}
                            title={`Atraso Significativo: ${prof.atraso_significativo_percent}% (${prof.atraso_significativo} de ${prof.total_aulas} aulas)`}
                          >
                            {prof.atraso_significativo_percent}% (
                            {prof.atraso_significativo})
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

export default RelatorioKPIApontamento;

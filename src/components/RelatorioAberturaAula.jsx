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
} from "@fortawesome/free-solid-svg-icons";

const RelatorioAberturaAula = () => {
  const STORAGE_KEY = "relatorio-volume-aulas";

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
    window.limparDadosRelatorioVolume = limparDadosSalvos;
    return () => {
      delete window.limparDadosRelatorioVolume;
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

  // Função para processar dados do relatório (NOVA LÓGICA)
  const processarDadosRelatorio = useCallback(() => {
    // Função para aplicar filtros de data de forma consistente
    const aplicarFiltroData = (aula) => {
      if (!filtros.dataInicial && !filtros.dataFinal) {
        return true; // Sem filtros de data, inclui todas
      }

      // Extrair apenas a data (YYYY-MM-DD) da aula, sem conversão de timezone
      const aulaData = aula.data.substring(0, 10); // Pega apenas YYYY-MM-DD

      if (filtros.dataInicial && filtros.dataFinal) {
        // Período: data deve estar entre dataInicial e dataFinal (inclusive)
        return aulaData >= filtros.dataInicial && aulaData <= filtros.dataFinal;
      } else if (filtros.dataInicial) {
        // Apenas data inicial: data deve ser igual ou posterior
        return aulaData >= filtros.dataInicial;
      } else if (filtros.dataFinal) {
        // Apenas data final: data deve ser igual ou anterior
        return aulaData <= filtros.dataFinal;
      }

      return true;
    };

    if (!aulas || aulas.length === 0) {
      setDadosRelatorio([]);
      return;
    }

    // Filtrar aulas pelos critérios selecionados
    // SOLUÇÃO: Filtrar aulas vazias para evitar discrepância entre total de aulas e alunos
    // Problema identificado: 497 aulas vazias (6,92% do total) causavam inconsistência no relatório
    let aulasFiltradas = aulas.filter((aula) => {
      // Filtro por professor
      if (
        filtros.professor !== "todos" &&
        aula.professor_id?.toString() !== filtros.professor
      ) {
        return false;
      }

      // Filtro por data
      if (!aplicarFiltroData(aula)) {
        return false;
      }

      // FILTRO: Excluir aulas vazias (sem alunos)
      const temAlunos = aula.aula_alunos && aula.aula_alunos.length > 0;
      if (!temAlunos) {
        // Log apenas em desenvolvimento
        if (process.env.NODE_ENV === "development") {
          console.log("🚫 AULA VAZIA FILTRADA:", {
            id: aula.id,
            data: aula.data,
            professor: aula.professor?.nome,
            status: aula.status,
            total_alunos_relacionados: aula.aula_alunos?.length || 0,
          });
        }
        return false;
      }

      return true;
    });

    if (aulasFiltradas.length === 0) {
      setDadosRelatorio([]);
      return;
    }

    // Determinar o período para exibição
    let periodoTexto = "Todos os Períodos";
    if (filtros.dataInicial && filtros.dataFinal) {
      periodoTexto = `${formatarData(filtros.dataInicial)} a ${formatarData(
        filtros.dataFinal
      )}`;
    } else if (filtros.dataInicial) {
      periodoTexto = `A partir de ${formatarData(filtros.dataInicial)}`;
    } else if (filtros.dataFinal) {
      periodoTexto = `Até ${formatarData(filtros.dataFinal)}`;
    }

    let dadosConsolidados = [];

    if (filtros.professor === "todos") {
      // Agrupar por professor - NOVA LÓGICA: conta ALUNOS, não aulas
      const estatisticasPorProfessor = aulasFiltradas.reduce((acc, aula) => {
        const professorId = aula.professor_id;
        const professorNome =
          aula.professor?.nome || "Professor não encontrado";
        const totalAlunosNaAula = aula.aula_alunos?.length || 0;

        if (!acc[professorId]) {
          acc[professorId] = {
            professor_nome: professorNome,
            total_aulas: 0,
            total_alunos: 0,
          };
        }

        acc[professorId].total_aulas++;
        acc[professorId].total_alunos += totalAlunosNaAula;
        return acc;
      }, {});

      // Converter para array e ordenar por nome
      const professoresArray = Object.values(estatisticasPorProfessor).sort(
        (a, b) => a.professor_nome.localeCompare(b.professor_nome)
      );

      // Adicionar cada professor como uma linha
      let totalGeralAulas = 0;
      let totalGeralAlunos = 0;

      professoresArray.forEach((prof) => {
        totalGeralAulas += prof.total_aulas;
        totalGeralAlunos += prof.total_alunos;

        dadosConsolidados.push({
          periodo_texto: periodoTexto,
          professor_texto: prof.professor_nome,
          total_aulas: prof.total_aulas,
          total_alunos: prof.total_alunos,
          is_total: false,
        });
      });

      // Adicionar linha de total geral
      dadosConsolidados.push({
        periodo_texto: periodoTexto,
        professor_texto: "TOTAL GERAL",
        total_aulas: totalGeralAulas,
        total_alunos: totalGeralAlunos,
        is_total: true,
      });
    } else {
      // Professor específico
      const professorSelecionado = professores.find(
        (p) => p.id.toString() === filtros.professor
      );
      const professorTexto =
        professorSelecionado?.nome || "Professor Selecionado";

      const totalAulas = aulasFiltradas.length;
      const totalAlunos = aulasFiltradas.reduce((total, aula) => {
        return total + (aula.aula_alunos?.length || 0);
      }, 0);

      dadosConsolidados = [
        {
          periodo_texto: periodoTexto,
          professor_texto: professorTexto,
          total_aulas: totalAulas,
          total_alunos: totalAlunos,
          is_total: false,
        },
      ];
    }

    setDadosRelatorio(dadosConsolidados);
  }, [aulas, professores, filtros]);

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

  const carregarDados = async () => {
    setLoading(true);
    try {
      const { supabase } = await import("../services/supabase");

      // Buscar aulas com joins para professores e alunos
      const { data: aulasData, error: aulasError } = await supabase
        .from("aulas")
        .select(
          `
          *,
          professor:professor_id(*),
          aula_alunos(
            id,
            observacoes,
            aluno:aluno_id(*)
          )
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
    const data = new Date(dataString + "T12:00:00"); // Forçar meio-dia para evitar problemas de timezone
    return data.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const gerarPDF = async () => {
    try {
      let titulo = "RELATÓRIO DE VOLUME DE AULAS";
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

      // Calcular totais usando TODOS OS DADOS (não apenas da página atual)
      const totalAulas = dadosRelatorio.reduce(
        (total, item) => (item.is_total ? 0 : total + item.total_aulas),
        0
      );
      const totalAlunos = dadosRelatorio.reduce(
        (total, item) => (item.is_total ? 0 : total + item.total_alunos),
        0
      );

      let htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Relatório de Volume de Aulas</title>
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
            .table .linha-total { background-color: #e9ecef; font-weight: bold; }
            .no-data { text-align: center; padding: 40px; color: #7f8c8d; }
            .total-alunos { color: #e74c3c; font-weight: bold; }
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
            Total de Aulas no Período: ${totalAulas}<br>
            <span class="total-alunos">Total de Alunos Atendidos: ${totalAlunos}</span>
          </div>`;

      if (dadosRelatorio.length === 0) {
        htmlContent +=
          '<div class="no-data"><h3>Nenhuma aula encontrada</h3><p>Não há aulas para os filtros selecionados.</p></div>';
      } else {
        htmlContent += `
          <table class="table">
            <thead>
              <tr>
                <th>Período</th>
                <th>Professor</th>
                <th>Total de Aulas</th>
                <th>Total de Alunos</th>
              </tr>
            </thead>
            <tbody>`;

        // Usar TODOS OS DADOS para o PDF (não apenas a página atual)
        dadosRelatorio.forEach((item) => {
          const styleClass = item.is_total ? 'class="linha-total"' : "";
          htmlContent += `
            <tr ${styleClass}>
              <td>${item.periodo_texto}</td>
              <td>${item.professor_texto}</td>
              <td style="text-align: center;">${item.total_aulas}</td>
              <td style="text-align: center;"><strong class="total-alunos">${item.total_alunos}</strong></td>
            </tr>`;
        });

        htmlContent += `</tbody></table>`;
      }

      htmlContent += `</body></html>`;

      // Criar um blob HTML e abrir em nova janela para impressão/salvamento como PDF
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
          <FontAwesomeIcon icon={faFileAlt} className="title-icon" />
          <div>
            <h2>Relatório de Volume de Aulas</h2>
            <p>
              Selecione os filtros e clique em Pesquisar para gerar o relatório
            </p>
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
                      <th>Período</th>
                      <th>Professor</th>
                      <th className="total-aulas-col">Total de Aulas</th>
                      <th className="total-alunos-col">Total de Alunos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calcularDadosPaginacao().dadosPagina.map((item, index) => (
                      <tr
                        key={index}
                        className={item.is_total ? "linha-total" : ""}
                      >
                        <td className="periodo-cell">{item.periodo_texto}</td>
                        <td
                          className={`professor-cell ${
                            item.is_total ? "professor-total" : ""
                          }`}
                        >
                          {item.professor_texto}
                        </td>
                        <td className="total-cell total-aulas-col">
                          <span
                            className={`badge ${
                              item.is_total ? "badge-total" : ""
                            }`}
                          >
                            {item.total_aulas}
                          </span>
                        </td>
                        <td className="total-cell total-alunos-col">
                          <span
                            className={`badge ${
                              item.is_total ? "badge-total" : ""
                            }`}
                          >
                            {item.total_alunos}
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

export default RelatorioAberturaAula;

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
  const [loading, setLoading] = useState(false);
  const [aulas, setAulas] = useState([]);
  const [professores, setProfessores] = useState([]);
  const [dadosRelatorio, setDadosRelatorio] = useState([]);
  const [filtros, setFiltros] = useState({
    dataInicial: "2025-05-31",
    dataFinal: "",
    professor: "todos",
  });

  // Estados para paginação
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(20);

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

  // Função para processar dados do relatório
  const processarDadosRelatorio = useCallback(() => {
    if (!aulas || aulas.length === 0) {
      setDadosRelatorio([]);
      return;
    }

    // Filtrar todas as aulas
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
        // Usar data diretamente sem conversão problemática de timezone
        const aulaData = aula.data.split("T")[0]; // Garantir formato YYYY-MM-DD

        // Se só tem data inicial, filtrar só por essa data
        if (filtros.dataInicial && !filtros.dataFinal) {
          if (aulaData !== filtros.dataInicial) {
            return false;
          }
        }
        // Se tem ambas as datas, filtrar por período
        else if (filtros.dataInicial && filtros.dataFinal) {
          if (aulaData < filtros.dataInicial || aulaData > filtros.dataFinal) {
            return false;
          }
        }
        // Se só tem data final (caso raro), filtrar até essa data
        else if (!filtros.dataInicial && filtros.dataFinal) {
          if (aulaData > filtros.dataFinal) {
            return false;
          }
        }
      }

      return true;
    });

    // Agrupar por professor e data
    const agrupamento = aulasFiltradas.reduce((acc, aula) => {
      const professorNome = aula.professor?.nome || "Professor não encontrado";
      const dataFormatada = aula.data
        ? formatarData(aula.data)
        : "Data não definida";

      const chave = `${aula.professor_id}_${aula.data}`;

      if (!acc[chave]) {
        acc[chave] = {
          professor_id: aula.professor_id,
          professor_nome: professorNome,
          data: aula.data,
          data_formatada: dataFormatada,
          aulas: [],
          total_aulas: 0,
        };
      }

      acc[chave].aulas.push(aula);
      acc[chave].total_aulas++;

      return acc;
    }, {});

    // Converter para array e ordenar
    const dadosProcessados = Object.values(agrupamento).sort((a, b) => {
      if (a.professor_nome !== b.professor_nome) {
        return a.professor_nome.localeCompare(b.professor_nome);
      }
      return new Date(a.data || 0) - new Date(b.data || 0);
    });

    setDadosRelatorio(dadosProcessados);
  }, [aulas, filtros]);

  // Carregar apenas professores na inicialização
  useEffect(() => {
    carregarProfessores();
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

  const carregarDados = async () => {
    setLoading(true);
    try {
      const { supabase } = await import("../services/supabase");
      
      let todasAulas = [];
      let hasMore = true;
      let offset = 0;
      const batchSize = 1000;

      console.log("🔄 Iniciando carregamento com paginação real para Relatório de Abertura de Aula (novo)...");

      while (hasMore) {
        console.log(`📄 Carregando lote ${Math.floor(offset / batchSize) + 1} (offset: ${offset})...`);
        
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
          .order("data", { ascending: false })
          .range(offset, offset + batchSize - 1);

        if (aulasError) {
          console.error("Erro ao buscar aulas:", aulasError);
          throw aulasError;
        }

        const dadosRecebidos = aulasData || [];
        console.log(`✅ Lote ${Math.floor(offset / batchSize) + 1}: ${dadosRecebidos.length} registros carregados`);
        
        // Log das datas das primeiras e últimas aulas do lote
        if (dadosRecebidos.length > 0) {
          const primeiraData = dadosRecebidos[0]?.data?.substring(0, 10);
          const ultimaData = dadosRecebidos[dadosRecebidos.length - 1]?.data?.substring(0, 10);
          console.log(`📅 Lote ${Math.floor(offset / batchSize) + 1}: ${primeiraData} até ${ultimaData}`);
        }
        
        todasAulas = [...todasAulas, ...dadosRecebidos];
        
        // Se recebemos menos dados que o tamanho do lote, chegamos ao fim
        hasMore = dadosRecebidos.length === batchSize;
        offset += batchSize;
      }

      console.log(`🎉 Carregamento completo! Total de aulas carregadas: ${todasAulas.length}`);
      
      // Log das datas extremas carregadas
      if (todasAulas.length > 0) {
        const datasOrdenadas = todasAulas
          .map(aula => aula.data?.substring(0, 10))
          .filter(Boolean)
          .sort();
        
        const dataMinima = datasOrdenadas[0];
        const dataMaxima = datasOrdenadas[datasOrdenadas.length - 1];
        
        console.log(`📊 Dados históricos carregados desde: ${dataMinima} até ${dataMaxima}`);
        
        // Verificar se temos dados antes de 24/06/2025
        const aulasAntes24Jun = todasAulas.filter(aula => {
          const aulaData = aula.data?.substring(0, 10);
          return aulaData && aulaData < "2025-06-24";
        });
        
        console.log(`🔍 Aulas antes de 24/06/2025: ${aulasAntes24Jun.length}`);
        
        if (aulasAntes24Jun.length > 0) {
          const datasAntes24Jun = aulasAntes24Jun
            .map(aula => aula.data?.substring(0, 10))
            .filter(Boolean)
            .sort();
          console.log(`📈 Dados históricos confirmados desde: ${datasAntes24Jun[0]} até ${datasAntes24Jun[datasAntes24Jun.length - 1]}`);
        }
      }

      setAulas(todasAulas);
    } catch (error) {
      console.error("Erro detalhado ao carregar aulas:", error);
      console.error("Stack trace:", error.stack);
      toast.error(`Erro ao carregar aulas: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatarData = (dataString) => {
    const data = new Date(dataString);
    return data.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const gerarPDF = async () => {
    try {
      // Criar título dinâmico baseado nos filtros
      let titulo = "RELATÓRIO DE AULAS";
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

      // Criar HTML simples para o relatório
      let htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Relatório de Aulas</title>
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
            .aula-item { margin-bottom: 10px; padding: 8px; background: #e9ecef; border-radius: 4px; }
            .alunos-list { margin-top: 5px; font-size: 14px; }
            .aluno-item { color: #495057; margin: 2px 0; }
            .observacoes { font-style: italic; color: #6c757d; margin-top: 5px; }
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
            Total de Professores/Datas com Aulas: ${dadosRelatorio.length}<br>
            Total de Aulas: ${dadosRelatorio.reduce(
              (total, item) => total + item.total_aulas,
              0
            )}
          </div>`;

      if (dadosRelatorio.length === 0) {
        htmlContent +=
          '<div class="no-data"><h3>Nenhuma aula encontrada</h3><p>Não há aulas para os filtros selecionados.</p></div>';
      } else {
        htmlContent += `
          <table class="table">
            <thead>
              <tr>
                <th>Professor</th>
                <th>Data</th>
                <th>Total de Aulas</th>
                <th>Detalhes das Aulas</th>
              </tr>
            </thead>
            <tbody>`;

        dadosRelatorio.forEach((item) => {
          htmlContent += `
            <tr>
              <td>${item.professor_nome}</td>
              <td>${item.data_formatada}</td>
              <td style="text-align: center;"><strong>${item.total_aulas}</strong></td>
              <td>`;

          item.aulas.forEach((aula) => {
            htmlContent += `
              <div class="aula-item">
                <strong>Data:</strong> ${formatarData(aula.data)} | 
                <strong>Status:</strong> ${aula.status}`;

            if (aula.aula_alunos && aula.aula_alunos.length > 0) {
              htmlContent += `
                <div class="alunos-list">
                  <strong>Alunos:</strong>`;

              aula.aula_alunos.forEach((aulaAluno) => {
                htmlContent += `
                  <div class="aluno-item">
                    • ${aulaAluno.aluno?.nome || "Nome não disponível"}`;

                if (aulaAluno.observacoes) {
                  htmlContent += `<div class="observacoes">Obs: ${aulaAluno.observacoes}</div>`;
                }

                htmlContent += `</div>`;
              });

              htmlContent += `</div>`;
            } else {
              htmlContent += `<div class="aluno-item">Nenhum aluno registrado</div>`;
            }

            if (aula.anotacoes) {
              htmlContent += `<div class="observacoes">Anotações da aula: ${aula.anotacoes}</div>`;
            }

            htmlContent += `</div>`;
          });

          htmlContent += `</td></tr>`;
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
            <h2>Relatório de Aulas por Professor e Data</h2>
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
          <div className="relatorio-summary">
            <div className="summary-card">
              <FontAwesomeIcon icon={faCalendarAlt} className="summary-icon" />
              <div>
                <h3>{dadosRelatorio.length}</h3>
                <p>Professores/Datas com Aulas</p>
              </div>
            </div>

            <div className="summary-card">
              <FontAwesomeIcon icon={faFileAlt} className="summary-icon" />
              <div>
                <h3>
                  {dadosRelatorio.reduce(
                    (total, item) => total + item.total_aulas,
                    0
                  )}
                </h3>
                <p>Total de Aulas</p>
              </div>
            </div>
          </div>

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
                      <th>Professor</th>
                      <th>Data</th>
                      <th>Total de Aulas</th>
                      <th>Detalhes das Aulas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calcularDadosPaginacao().dadosPagina.map((item, index) => (
                      <tr key={index}>
                        <td className="professor-cell">
                          <FontAwesomeIcon icon={faUser} />
                          {item.professor_nome}
                        </td>
                        <td className="periodo-cell">
                          <FontAwesomeIcon icon={faCalendarAlt} />
                          {item.data_formatada}
                        </td>
                        <td className="total-cell">
                          <span className="badge">{item.total_aulas}</span>
                        </td>
                        <td className="detalhes-cell">
                          <div className="aulas-detalhes">
                            {item.aulas.map((aula, aulaIndex) => (
                              <div key={aulaIndex} className="aula-item">
                                <span className="aula-data">
                                  {formatarData(aula.data)}
                                </span>
                                <span
                                  className={`aula-status status-${aula.status}`}
                                >
                                  {aula.status}
                                </span>
                                {aula.aula_alunos &&
                                  aula.aula_alunos.length > 0 && (
                                    <div className="alunos-info">
                                      <strong>Alunos:</strong>
                                      {aula.aula_alunos.map(
                                        (aulaAluno, alunoIndex) => (
                                          <div
                                            key={alunoIndex}
                                            className="aluno-detalhe"
                                          >
                                            •{" "}
                                            {aulaAluno.aluno?.nome ||
                                              "Nome não disponível"}
                                            {aulaAluno.observacoes && (
                                              <div className="observacoes-aluno">
                                                Obs: {aulaAluno.observacoes}
                                              </div>
                                            )}
                                          </div>
                                        )
                                      )}
                                    </div>
                                  )}
                                {aula.anotacoes && (
                                  <div className="anotacoes-aula">
                                    <strong>Anotações:</strong> {aula.anotacoes}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
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

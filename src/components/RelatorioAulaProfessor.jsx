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
} from "@fortawesome/free-solid-svg-icons";

const RelatorioAulaProfessor = () => {
  const [loading, setLoading] = useState(false);
  const [aulas, setAulas] = useState([]);
  const [professores, setProfessores] = useState([]);
  const [dadosRelatorio, setDadosRelatorio] = useState([]);
  const [filtros, setFiltros] = useState({
    dataInicial: "",
    dataFinal: "",
    professor: "todos",
  });

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
    console.log("Processando dados do relatório...");
    console.log("Aulas disponíveis:", aulas);

    if (!aulas || aulas.length === 0) {
      console.log("Nenhuma aula encontrada");
      setDadosRelatorio([]);
      return;
    }

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
        const aulaData = new Date(aula.data).toISOString().split("T")[0];

        if (filtros.dataInicial && !filtros.dataFinal) {
          if (aulaData !== filtros.dataInicial) {
            return false;
          }
        } else if (filtros.dataInicial && filtros.dataFinal) {
          if (aulaData < filtros.dataInicial || aulaData > filtros.dataFinal) {
            return false;
          }
        } else if (!filtros.dataInicial && filtros.dataFinal) {
          if (aulaData > filtros.dataFinal) {
            return false;
          }
        }
      }

      return true;
    });

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

    console.log("Aulas após filtros:", aulasFiltradas);
    setDadosRelatorio(aulasFiltradas);
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
      console.log("Carregando professores...");

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
      console.log("Iniciando carregamento de aulas...");

      const { supabase } = await import("../services/supabase");

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
      console.error("Erro detalhado ao carregar aulas:", error);
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
        <h4>Legenda de Pontualidade:</h4>
        <div className="legenda-items">
          <span className="legenda-item pontual">
            <span className="cor-exemplo"></span>
            Pontual (xx:49 - xx:05)
          </span>
          <span className="legenda-item atraso-leve">
            <span className="cor-exemplo"></span>
            Atraso Leve (xx:06 - xx:15)
          </span>
          <span className="legenda-item atraso-significativo">
            <span className="cor-exemplo"></span>
            Atraso Significativo (xx:16 - xx:48)
          </span>
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
                  {dadosRelatorio.map((aula, index) => (
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
          )}
        </div>
      )}
    </div>
  );
};

export default RelatorioAulaProfessor;

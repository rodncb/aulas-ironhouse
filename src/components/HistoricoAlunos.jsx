import React, { useState, useEffect } from "react";
import "../styles/GerenciamentoAlunos.css";
import "../styles/Modal.css"; // Adicionando o CSS da modal
import alunosService from "../services/alunos.service"; // Importar serviço de alunos
import aulasService from "../services/aulas.service"; // Importar serviço de aulas

// Função auxiliar para interpretar horários de início/fim com base no status da aula
const interpretarHorarios = (aula) => {
  const hora = aula.hora;

  // Se não temos hora registrada (NULL ou undefined), retornar valores padrão
  if (!hora) {
    return {
      horaInicio: "--:--",
      horaFim: "--:--",
    };
  }

  // Tratar especificamente aulas canceladas com hora '00:00'
  if (hora === "00:00" && aula.status === "cancelada") {
    return {
      horaInicio: "Cancelada",
      horaFim: "Cancelada",
    };
  }

  // Com base no status da aula, interpretamos a hora
  switch (aula.status) {
    case "atual":
    case "em_andamento":
      // Para aulas em andamento, a hora é o horário de início
      return {
        horaInicio: hora,
        horaFim: "--:--", // Ainda não finalizada
      };
    case "realizada":
    case "finalizada":
      // Para aulas finalizadas, assumir duração de 1 hora
      const [horas, minutos] = hora.split(':').map(Number);
      const inicioDate = new Date();
      inicioDate.setHours(horas, minutos);
      
      // Subtrair 1 hora para obter horário de início estimado
      inicioDate.setHours(inicioDate.getHours() - 1);
      
      const horaInicioFormatada = inicioDate.toTimeString().slice(0, 5);
      
      return {
        horaInicio: horaInicioFormatada,
        horaFim: hora, // A hora registrada é de fim
      };
    default:
      return {
        horaInicio: hora,
        horaFim: "--:--",
      };
  }
};

const HistoricoAlunos = () => {
  const [alunos, setAlunos] = useState([]);
  const [alunoSelecionado, setAlunoSelecionado] = useState(null);
  const [historicoAulas, setHistoricoAulas] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [modalAula, setModalAula] = useState(null);
  const [aulaExpandida, setAulaExpandida] = useState(null);
  const [loading, setLoading] = useState(true); // Estado para controlar carregamento
  const [error, setError] = useState(null); // Estado para controlar erros

  useEffect(() => {
    // Carregar alunos do Supabase
    const fetchAlunos = async () => {
      try {
        setLoading(true);
        const alunosData = await alunosService.getAll();
        setAlunos(alunosData);
        setError(null);
      } catch (err) {
        console.error("Erro ao carregar alunos:", err);
        setError("Não foi possível carregar os alunos. Tente novamente.");
      } finally {
        setLoading(false);
      }
    };

    fetchAlunos();

    // Código antigo usando localStorage
    // const alunosSalvos = localStorage.getItem("alunos");
    // if (alunosSalvos) {
    //   setAlunos(JSON.parse(alunosSalvos));
    // }
  }, []);

  const handleAlunoSelect = async (aluno) => {
    try {
      setLoading(true);

      // Buscar todas as aulas do Supabase
      const todasAulas = await aulasService.getAll();

      // Filtrar apenas as aulas que este aluno participou
      const aulasDoAluno = todasAulas.filter(
        (aula) => aula.alunos && aula.alunos.some((a) => a.id === aluno.id)
      );

      setHistoricoAulas(aulasDoAluno);
      setAlunoSelecionado(aluno);
      setAulaExpandida(null);
      setError(null);

      // Código antigo usando localStorage
      // Buscar informações completas do aluno, incluindo objetivo e lesão
      // const alunosCompletos = JSON.parse(localStorage.getItem("alunos") || "[]");
      // const alunoCompleto =
      //   alunosCompletos.find((a) => a.id === aluno.id) || aluno;
      //
      // setAlunoSelecionado({
      //   ...aluno,
      //   objetivo: alunoCompleto.objetivo || "",
      //   lesao: alunoCompleto.lesao || "Não",
      // });
      //
      // setAulaExpandida(null);
      //
      // // Buscar histórico de aulas do aluno
      // const historicoAulas = localStorage.getItem("historicoAulas");
      // if (historicoAulas) {
      //   const todasAulas = JSON.parse(historicoAulas);
      //   // Filtrar apenas as aulas que este aluno participou
      //   const aulasDoAluno = todasAulas.filter(
      //     (aula) => aula.alunos && aula.alunos.some((a) => a.id === aluno.id)
      //   );
      //   setHistoricoAulas(aulasDoAluno);
      // }
    } catch (err) {
      console.error("Erro ao buscar histórico de aulas:", err);
      setError(
        "Não foi possível carregar o histórico de aulas. Tente novamente."
      );
    } finally {
      setLoading(false);
    }
  };

  const verDetalhesAula = (aula) => {
    setAulaExpandida(aula.id === aulaExpandida ? null : aula.id);
  };

  const formatarData = (dataString) => {
    if (!dataString) return "";
    try {
      const data = new Date(dataString);
      return data.toLocaleDateString("pt-BR");
    } catch (error) {
      return dataString;
    }
  };

  const getStatusLabel = (status) => {
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

  const filteredAlunos = alunos.filter((aluno) =>
    aluno.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="gerenciamento-container">
      <h1>Histórico de Alunos</h1>
      <p className="instrucao">
        Selecione um aluno para visualizar seu histórico de aulas.
      </p>

      {/* Exibir mensagem de erro, se houver */}
      {error && <div className="error-message">{error}</div>}

      {/* Exibir indicador de carregamento */}
      {loading && <div className="loading-indicator">Carregando...</div>}

      <div className="list-controls">
        <div className="show-entries">
          <span>Mostrar</span>
          <select
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span>registros</span>
        </div>

        <div className="search-box">
          <span>Buscar:</span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Nome do aluno..."
          />
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Idade</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredAlunos.slice(0, itemsPerPage).map((aluno) => (
              <tr key={aluno.id}>
                <td>{aluno.nome}</td>
                <td>{aluno.idade}</td>
                <td className="actions">
                  <button
                    className="btn-visualizar"
                    onClick={() => handleAlunoSelect(aluno)}
                    disabled={loading}
                  >
                    Ver Histórico
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {alunoSelecionado && (
        <div className="historico-container">
          <h2>Histórico de Aulas de {alunoSelecionado.nome}</h2>

          <div className="info-aluno-detalhes">
            <div className="dados-pessoais">
              <p>
                <strong>Idade:</strong> {alunoSelecionado.idade} anos
              </p>
              <p>
                <strong>Lesão:</strong> {alunoSelecionado.lesao || "Não"}
              </p>
              <p>
                <strong>Objetivo:</strong>{" "}
                {alunoSelecionado.objetivo || "Não especificado"}
              </p>
            </div>

            <div className="resumo-historico">
              <p>
                <strong>Total de aulas:</strong> {historicoAulas.length}
              </p>
              <p>
                <strong>Aulas realizadas:</strong>{" "}
                {
                  historicoAulas.filter((aula) => aula.status === "realizada")
                    .length
                }
              </p>
              <p>
                <strong>Aulas canceladas:</strong>{" "}
                {
                  historicoAulas.filter((aula) => aula.status === "cancelada")
                    .length
                }
              </p>
              <p>
                <strong>Aulas atuais:</strong>{" "}
                {
                  historicoAulas.filter((aula) => aula.status === "atual")
                    .length
                }
              </p>
            </div>
          </div>

          {historicoAulas.length > 0 ? (
            <div className="historico-aulas-lista">
              {historicoAulas.map((aula) => (
                <div key={aula.id} className={`aula-card aula-${aula.status}`}>
                  <div
                    className="aula-header"
                    onClick={() => verDetalhesAula(aula)}
                  >
                    <div className="aula-data-horario">
                      <div className="aula-data">{formatarData(aula.data)}</div>
                      <div className="aula-horario">
                        {(() => {
                          const horarios = interpretarHorarios(aula);
                          if (aula.status === "realizada" || aula.status === "finalizada") {
                            return `${horarios.horaInicio} - ${horarios.horaFim}`;
                          }
                          return horarios.horaInicio || "--:--";
                        })()}
                      </div>
                    </div>
                    <div className="aula-professor">
                      Professor:{" "}
                      {aula.professor ? aula.professor.nome : "Não definido"}
                    </div>
                    <div className="aula-status">
                      Status: {getStatusLabel(aula.status)}
                    </div>
                    <div className="aula-toggle">
                      {aulaExpandida === aula.id ? "▲" : "▼"}
                    </div>
                  </div>
                  {aulaExpandida === aula.id && (
                    <div className="aula-detalhes">
                      <div className="aula-info-detalhada">
                        <h4>Informações</h4>
                        <p>
                          <strong>Data:</strong> {formatarData(aula.data)}
                        </p>
                        <div className="horario-container">
                          {(() => {
                            const horarios = interpretarHorarios(aula);
                            
                            if (aula.status === "finalizada" || aula.status === "realizada") {
                              return (
                                <>
                                  <div className="horario-inicio">
                                    <strong>Horário de Início:</strong>{" "}
                                    <span className="hora-valor">
                                      {horarios.horaInicio}
                                    </span>
                                  </div>
                                  <div className="horario-fim">
                                    <strong>Horário de Término:</strong>{" "}
                                    <span className="hora-valor">
                                      {horarios.horaFim}
                                    </span>
                                  </div>
                                </>
                              );
                            } else {
                              return (
                                <>
                                  <div className="horario-inicio">
                                    <strong>Horário de Início:</strong>{" "}
                                    <span className="hora-valor">
                                      {horarios.horaInicio}
                                    </span>
                                  </div>
                                  <div className="horario-fim">
                                    <strong>Horário de Término:</strong>{" "}
                                    <span className="hora-valor">
                                      {horarios.horaFim}
                                    </span>
                                  </div>
                                </>
                              );
                            }
                          })()}
                        </div>
                        <p>
                          <strong>Professor:</strong>{" "}
                          {aula.professor
                            ? aula.professor.nome
                            : "Não definido"}
                        </p>
                      </div>
                      <div className="aula-exercicios">
                        <h4>Exercícios</h4>
                        {aula.exercicios && aula.exercicios.length > 0 ? (
                          <ul>
                            {aula.exercicios.map((exercicio) => (
                              <li key={exercicio.id}>{exercicio.nome}</li>
                            ))}
                          </ul>
                        ) : (
                          <p>Nenhum exercício registrado.</p>
                        )}
                      </div>
                      <div className="aula-notas">
                        <h4>Anotações</h4>
                        <p>{aula.anotacoes || "Nenhuma anotação."}</p>
                      </div>
                      {aula.lesoes && (
                        <div className="aula-lesoes">
                          <h4>Lesões/Restrições</h4>
                          <p>{aula.lesoes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="sem-registros">
              Nenhuma aula registrada para este aluno.
            </div>
          )}
        </div>
      )}

      {/* Modal de detalhes da aula (visualização apenas) */}
      {modalAula && (
        <div className="modal-backdrop" onClick={() => setModalAula(null)}>
          <div className="detalhes-modal" onClick={(e) => e.stopPropagation()}>
            <button className="btn-fechar" onClick={() => setModalAula(null)}>
              ×
            </button>
            <h2>Detalhes da Aula</h2>
            <div className="detalhes-data">
              <p>
                <strong>Data:</strong> {formatarData(modalAula.data)}
              </p>
              <p>
                <strong>Status:</strong> {getStatusLabel(modalAula.status)}
              </p>
              <p>
                <strong>Professor:</strong>{" "}
                {modalAula.professor
                  ? modalAula.professor.nome
                  : "Não definido"}
              </p>

              {modalAula.anotacoes && (
                <p>
                  <strong>Anotações:</strong> {modalAula.anotacoes}
                </p>
              )}

              {modalAula.lesoes && (
                <p>
                  <strong>Lesões/Restrições:</strong> {modalAula.lesoes}
                </p>
              )}
            </div>
            <div className="detalhes-alunos">
              <h3>Alunos Presentes</h3>
              <ul className="lista-alunos-presentes">
                {modalAula.alunos &&
                  modalAula.alunos.map((aluno) => (
                    <li key={aluno.id} className="aluno-item">
                      {aluno.nome} - {aluno.idade} anos
                    </li>
                  ))}
              </ul>
            </div>
            <div className="visualizacao-exercicios">
              <h3>Exercícios</h3>
              {modalAula.exercicios && modalAula.exercicios.length > 0 ? (
                <>
                  <div className="exercicios-count">
                    <p>
                      Total de exercícios:{" "}
                      <span className="exercicios-total">
                        {modalAula.exercicios.length}
                      </span>
                    </p>
                  </div>
                  <ul className="lista-alunos-presentes">
                    {modalAula.exercicios.map((exercicio, index) => (
                      <li key={exercicio.id || index} className="aluno-item">
                        <strong>{exercicio.nome}</strong>
                        <div>{exercicio.musculatura}</div>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p>Nenhum exercício registrado para esta aula.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoricoAlunos;

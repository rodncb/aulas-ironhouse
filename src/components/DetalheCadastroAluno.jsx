import React, { useState, useEffect } from "react";
import "../styles/DetalheAluno.css";
import { supabase } from "../services/supabase";
import aulasService from "../services/aulas.service"; // Importar serviço de aulas
import { formatarData as formatarDataUtil } from "../lib/utils"; // Corrigido: caminho para lib/utils.js

// Função auxiliar para interpretar horários de início/fim com base no status da aula
const interpretarHorarios = (aula) => {
  const hora = aula.hora;

  // Se não temos hora registrada (NULL ou undefined), retornar valores padrão
  if (!hora) {
    switch (aula.status) {
      case "realizada":
      case "finalizada":
        return {
          horaInicio: "Não registrado",
          horaFim: "Não registrado",
        };
      case "cancelada":
        return {
          horaInicio: "Cancelada",
          horaFim: "Cancelada",
        };
      default:
        return {
          horaInicio: "--:--",
          horaFim: "--:--",
        };
    }
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
      try {
        const [horas, minutos] = hora.split(":").map(Number);
        const inicioDate = new Date();
        inicioDate.setHours(horas, minutos);

        // Subtrair 1 hora para obter horário de início estimado
        inicioDate.setHours(inicioDate.getHours() - 1);

        const horaInicioFormatada = inicioDate.toTimeString().slice(0, 5);

        return {
          horaInicio: horaInicioFormatada,
          horaFim: hora, // A hora registrada é de fim
        };
      } catch (error) {
        return {
          horaInicio: "Não registrado",
          horaFim: "Não registrado",
        };
      }
    default:
      return {
        horaInicio: hora,
        horaFim: "--:--",
      };
  }
};

const DetalheCadastroAluno = ({ aluno, alunoId, onNavigateBack }) => {
  // Estado para armazenar os dados do aluno quando recebemos apenas o ID
  const [dadosAluno, setDadosAluno] = useState(null);
  const [carregandoAluno, setCarregandoAluno] = useState(false);
  const [erro, setErro] = useState(null);
  const [editandoObservacoes, setEditandoObservacoes] = useState(false);
  const [observacoes, setObservacoes] = useState("");
  const [salvandoObservacoes, setSalvandoObservacoes] = useState(false);
  const [sucessoSalvar, setSucessoSalvar] = useState(false);
  const [historicoAulas, setHistoricoAulas] = useState([]); // Estado para histórico de aulas
  const [carregandoHistorico, setCarregandoHistorico] = useState(false); // Estado para carregamento

  // Quando componente recebe alunoId em vez do objeto aluno completo
  useEffect(() => {
    const buscarDadosAluno = async () => {
      if (!alunoId) return;

      try {
        setCarregandoAluno(true);
        setErro(null);

        const { data, error } = await supabase
          .from("alunos")
          .select("*")
          .eq("id", alunoId)
          .single();

        if (error) {
          console.error("Erro ao buscar dados do aluno:", error);
          setErro(`Erro ao buscar dados do aluno: ${error.message}`);
          return;
        }

        if (!data) {
          setErro(`Aluno com ID ${alunoId} não encontrado`);
          return;
        }

        setDadosAluno(data);
        setObservacoes(data.observacoes || "");
      } catch (err) {
        console.error("Erro ao carregar dados do aluno:", err);
        setErro(`Erro ao carregar dados do aluno: ${err.message}`);
      } finally {
        setCarregandoAluno(false);
      }
    };

    if (alunoId && !aluno) {
      buscarDadosAluno();
    } else if (aluno) {
      setObservacoes(aluno.observacoes || "");
    }
  }, [alunoId, aluno]);

  // Usar o objeto aluno que foi passado diretamente, ou o que foi buscado pelo ID
  const alunoAtual = aluno || dadosAluno;

  // Efeito para carregar o histórico de aulas
  useEffect(() => {
    const carregarHistoricoAulas = async () => {
      if (!alunoAtual || !alunoAtual.id) return;

      try {
        setCarregandoHistorico(true);

        // Usar o método específico para buscar aulas por ID do aluno
        const aulasDoAluno = await aulasService.getAulasByAlunoId(
          alunoAtual.id
        );

        setHistoricoAulas(aulasDoAluno);
      } catch (err) {
        console.error("Erro ao buscar histórico de aulas:", err);
        setHistoricoAulas([]); // Garantir que é um array vazio em caso de erro
      } finally {
        setCarregandoHistorico(false);
      }
    };

    carregarHistoricoAulas();
  }, [alunoAtual]);

  // Função para obter o rótulo de status
  const getStatusLabel = (status, aulaData) => {
    // Verifica se a aula é antiga (data anterior à atual) mas ainda tem status "atual"
    if (status === "atual" || status === "em_andamento") {
      // Comparar apenas as datas no formato YYYY-MM-DD para evitar problemas de timezone
      const dataAulaString = aulaData.split("T")[0]; // Garantir formato YYYY-MM-DD
      const hoje = new Date();
      const hojeString =
        hoje.getFullYear() +
        "-" +
        String(hoje.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(hoje.getDate()).padStart(2, "0");

      // Se a data da aula for anterior à data atual, considerar como finalizada
      if (dataAulaString < hojeString) {
        return <span className="status-realizada">Finalizada</span>;
      }
    }

    // Tratamento normal para outros casos
    switch (status) {
      case "realizada":
      case "finalizada":
        return <span className="status-realizada">Realizada</span>;
      case "cancelada":
        return <span className="status-cancelada">Cancelada</span>;
      case "atual":
      case "em_andamento":
      default:
        return <span className="status-atual">Atual</span>;
    }
  };

  // Função para salvar as observações editadas
  const salvarObservacoes = async () => {
    if (!alunoAtual || !alunoAtual.id) return;

    try {
      setSalvandoObservacoes(true);
      setErro(null);
      setSucessoSalvar(false);

      const { error } = await supabase
        .from("alunos")
        .update({ observacoes })
        .eq("id", alunoAtual.id);

      if (error) throw error;

      // Atualizar o objeto local
      if (dadosAluno) {
        setDadosAluno({
          ...dadosAluno,
          observacoes,
        });
      }

      setSucessoSalvar(true);
      setEditandoObservacoes(false);

      // Esconder a mensagem de sucesso após alguns segundos
      setTimeout(() => {
        setSucessoSalvar(false);
      }, 3000);
    } catch (err) {
      console.error("Erro ao salvar observações:", err);
      setErro(`Erro ao salvar observações: ${err.message}`);
    } finally {
      setSalvandoObservacoes(false);
    }
  };

  // Função para formatar a data no padrão brasileiro
  const formatarData = (dataString) => {
    if (!dataString) return "Data não disponível";

    // Usar nossa função de formatação centralizada nas utils
    return formatarDataUtil(dataString);
  };

  const handleVoltar = () => {
    if (onNavigateBack) {
      onNavigateBack("alunos"); // Volta para a lista de alunos
    }
  };

  // Exibir mensagem de carregamento quando estiver buscando dados do aluno
  if (carregandoAluno) {
    return (
      <div className="loading-container">Carregando dados do aluno...</div>
    );
  }

  // Exibir mensagem de erro se ocorrer algum problema
  if (erro) {
    return (
      <div className="error-container">
        <p className="error-message">{erro}</p>
        <button className="btn-voltar" onClick={handleVoltar}>
          Voltar para Lista de Alunos
        </button>
      </div>
    );
  }

  // Se não tem aluno nem dados do aluno, mostrar mensagem
  if (!alunoAtual) {
    return (
      <div className="error-container">
        <p>Aluno não encontrado</p>
        <button className="btn-voltar" onClick={handleVoltar}>
          Voltar para Lista de Alunos
        </button>
      </div>
    );
  }

  return (
    <div className="detalhes-aluno">
      <h2>Detalhes do Cadastro: {alunoAtual.nome}</h2>

      {sucessoSalvar && (
        <div className="success-message">Observações salvas com sucesso!</div>
      )}

      <div className="detalhes-grid">
        {/* Dados Pessoais */}
        <div className="dados-aluno-card">
          <h3>Dados Pessoais</h3>
          <div className="info-container">
            <p>
              <strong>Nome Completo:</strong> {alunoAtual.nome}
            </p>
            <p>
              <strong>Telefone:</strong>{" "}
              {alunoAtual.telefone || "Não cadastrado"}
            </p>
            <p>
              <strong>Data de Nascimento:</strong>{" "}
              {alunoAtual.data_nascimento
                ? formatarData(alunoAtual.data_nascimento)
                : "Não cadastrada"}
            </p>
            <p>
              <strong>Idade:</strong> {alunoAtual.idade || "N/A"}
            </p>
            <p>
              <strong>Status da Matrícula:</strong>{" "}
              <span
                className={`status-${
                  alunoAtual.status === "ativo" ? "atual" : "cancelada"
                }`}
              >
                {alunoAtual.status === "ativo" ? "Ativo" : "Inativo"}
              </span>
            </p>
          </div>
        </div>

        {/* Informações de Treino */}
        <div className="dados-aluno-card">
          <h3>Informações de Treino</h3>
          <div className="info-container">
            <p>
              <strong>Plano:</strong> {alunoAtual.plano || "N/A"}
            </p>
            <p>
              <strong>Nível:</strong> {alunoAtual.nivel || "N/A"}
            </p>

            <div className="lesao-info">
              <p>
                <strong>Lesão:</strong>{" "}
                <span
                  className={`${
                    alunoAtual.lesao?.includes("Grave")
                      ? "lesao-grave"
                      : alunoAtual.lesao?.includes("Moderada")
                      ? "lesao-moderada"
                      : ""
                  }`}
                >
                  {alunoAtual.lesao || "Nenhuma"}
                </span>
              </p>

              {alunoAtual.lesao &&
                alunoAtual.lesao !== "Nao" &&
                alunoAtual.tipo_lesao && (
                  <div className="tipo-lesao">
                    <p>
                      <strong>Detalhes da lesão:</strong>
                    </p>
                    <p className="lesao-descricao">{alunoAtual.tipo_lesao}</p>
                  </div>
                )}
            </div>

            <div className="objetivo-treino">
              <p className="objetivo-treino-titulo">
                <strong>Objetivo de Treino:</strong>
              </p>
              <div className="objetivo-treino-texto">
                {alunoAtual.objetivo || "Não informado"}
              </div>
            </div>

            <div className="observacoes-section">
              <p className="titulo-observacoes">
                <strong>Observações:</strong>
                {!editandoObservacoes && (
                  <button
                    className="btn-editar-mini"
                    onClick={() => setEditandoObservacoes(true)}
                  >
                    Editar
                  </button>
                )}
              </p>

              {editandoObservacoes ? (
                <div className="observacoes-editor">
                  <textarea
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    rows={5}
                    placeholder="Digite observações sobre o aluno..."
                    className="observacoes-textarea"
                  />
                  <div className="observacoes-actions">
                    <button
                      className="btn-cancelar-mini"
                      onClick={() => {
                        setEditandoObservacoes(false);
                        setObservacoes(alunoAtual.observacoes || "");
                      }}
                      disabled={salvandoObservacoes}
                    >
                      Cancelar
                    </button>
                    <button
                      className="btn-salvar-observacao"
                      onClick={salvarObservacoes}
                      disabled={salvandoObservacoes}
                    >
                      {salvandoObservacoes ? "Salvando..." : "Salvar"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="observacoes-texto">
                  {observacoes || "Nenhuma observação cadastrada"}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Histórico de Aulas */}
        <div className="dados-aluno-card historico-aulas">
          <h3>Histórico de Aulas</h3>
          <div className="info-container">
            {carregandoHistorico ? (
              <div className="carregando-historico">
                <div className="spinner"></div>
                <p>Carregando histórico de aulas...</p>
              </div>
            ) : historicoAulas.length > 0 ? (
              <div className="historico-aulas-lista">
                {historicoAulas.map((aula) => (
                  <div
                    key={aula.id}
                    className={`aula-card aula-${aula.status}`}
                  >
                    <div className="aula-header">
                      <div className="aula-data-horario">
                        <div className="aula-data">
                          {formatarData(aula.data)}
                        </div>
                        <div className="aula-horario">
                          {(() => {
                            const horarios = interpretarHorarios(aula);
                            if (
                              aula.status === "realizada" ||
                              aula.status === "finalizada"
                            ) {
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
                        Status: {getStatusLabel(aula.status, aula.data)}
                      </div>
                    </div>
                    <div className="aula-detalhes">
                      <div className="aula-info-detalhada">
                        <h4>Informações</h4>
                        <p>
                          <strong>Data:</strong> {formatarData(aula.data)}
                        </p>
                        <div className="horario-container">
                          {(() => {
                            const horarios = interpretarHorarios(aula);

                            if (
                              aula.status === "finalizada" ||
                              aula.status === "realizada"
                            ) {
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
                            {aula.exercicios.map((exercicio, index) => (
                              <li key={exercicio.id || index}>
                                {exercicio.nome}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p>Nenhum exercício registrado.</p>
                        )}
                      </div>
                      <div className="aula-notas">
                        <h4>Anotações</h4>
                        <p>{aula.observacoes || "Nenhuma anotação."}</p>
                      </div>
                      {aula.lesoes && (
                        <div className="aula-lesoes">
                          <h4>Lesões/Restrições</h4>
                          <p>{aula.lesoes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="sem-registros">
                Nenhuma aula registrada para este aluno.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Botões de ação */}
      <div className="botoes-acao">
        <button className="btn-voltar" onClick={handleVoltar}>
          Voltar para Lista de Alunos
        </button>
        <button
          className="btn-editar"
          onClick={() => onNavigateBack(`editar-aluno/${alunoAtual.id}`)}
        >
          Editar Aluno
        </button>
      </div>
    </div>
  );
};

export default DetalheCadastroAluno;

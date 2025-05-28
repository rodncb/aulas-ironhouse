import React, { useState, useEffect } from "react";
import { supabase } from "../services/supabase";
import { formatarData, navegarPara } from "../lib/utils";
import "../styles/DetalheAluno.css";
import { useCadastroAluno } from "../contexts/CadastroAlunoContext"; // Importar o contexto
import aulasService from "../services/aulas.service"; // Importar serviço de aulas

// Função auxiliar para interpretar horários de início/fim com base no status da aula
const interpretarHorarios = (aula) => {
  const hora = aula.hora;

  // SEMPRE fazer log para debug
  console.log(`[interpretarHorarios] Aula ID: ${aula.id}, Status: ${aula.status}, Hora: "${hora}", Tipo: ${typeof hora}`);

  // Se não temos hora registrada (NULL ou undefined), retornar valores padrão
  if (!hora || hora === null || hora === undefined) {
    console.log(`[interpretarHorarios] Hora não definida para aula ${aula.id}`);
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
    console.log(`[interpretarHorarios] Aula cancelada com hora 00:00: ${aula.id}`);
    return {
      horaInicio: "Cancelada",
      horaFim: "Cancelada",
    };
  }

  // Com base no status da aula, interpretamos a hora
  console.log(`[interpretarHorarios] Processando aula ${aula.id} com status ${aula.status} e hora "${hora}"`);
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
        const [horas, minutos] = hora.split(':').map(Number);
        const inicioDate = new Date();
        inicioDate.setHours(horas, minutos);
        
        // Subtrair 1 hora para obter horário de início estimado
        inicioDate.setHours(inicioDate.getHours() - 1);
        
        const horaInicioFormatada = inicioDate.toTimeString().slice(0, 5);
        
        console.log(`[interpretarHorarios] Aula finalizada ${aula.id}: ${horaInicioFormatada} - ${hora}`);
        return {
          horaInicio: horaInicioFormatada,
          horaFim: hora, // A hora registrada é de fim
        };
      } catch (error) {
        console.log(`[interpretarHorarios] Erro ao processar hora "${hora}" para aula ${aula.id}:`, error);
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

const DetalheAluno = ({ alunoId, setActiveSection }) => {
  // Usar o contexto para gerenciar dados do aluno
  const {
    formData: dadosContexto,
    carregarAluno: carregarAlunoDoContexto,
    carregandoAluno: carregandoAlunoDoContexto,
    alunoId: alunoIdContexto,
    error: erroContexto,
    limparDadosCadastro,
  } = useCadastroAluno();

  // Estados locais
  const [aluno, setAluno] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [historicoAulas, setHistoricoAulas] = useState([]);
  const [carregandoHistorico, setCarregandoHistorico] = useState(false);
  const [aulaExpandida, setAulaExpandida] = useState(null);

  // Função para carregar dados do aluno
  useEffect(() => {
    const carregarDetalheAluno = async () => {
      try {
        setLoading(true);
        setError(null);

        // Se já temos os dados do aluno no contexto e o ID corresponde, usá-los
        if (
          alunoIdContexto === alunoId &&
          Object.keys(dadosContexto).length > 0
        ) {
          console.log(
            "[DetalheAluno] Usando dados do aluno já carregados no contexto"
          );
          setAluno(dadosContexto);
          setLoading(false);
          return;
        }

        // Se não temos os dados ou o ID é diferente, carregar do backend através do contexto
        console.log(
          `[DetalheAluno] Carregando dados do aluno via contexto: ${alunoId}`
        );
        await carregarAlunoDoContexto(alunoId);

        // Os dados serão atualizados na próxima renderização via efeito de dadosContexto
        if (!dadosContexto || Object.keys(dadosContexto).length === 0) {
          // Se não conseguir carregar via contexto, tentar carregar diretamente
          console.log(
            "[DetalheAluno] Tentando carregar dados diretamente do Supabase"
          );
          const { data, error } = await supabase
            .from("alunos")
            .select("*")
            .eq("id", alunoId)
            .single();

          if (error) {
            console.error("Erro ao carregar aluno:", error);
            setError(
              "Não foi possível carregar os dados do aluno. Por favor, tente novamente."
            );
          } else if (!data) {
            setError("Aluno não encontrado.");
          } else {
            console.log("[DetalheAluno] Aluno carregado diretamente:", data);
            setAluno(data);
          }
        }
      } catch (err) {
        console.error("Erro ao carregar aluno:", err);
        setError(
          "Erro ao carregar dados do aluno. Por favor, tente novamente."
        );
      } finally {
        setLoading(false);
      }
    };

    if (alunoId) {
      carregarDetalheAluno();
    } else {
      setError("ID do aluno não fornecido.");
      setLoading(false);
    }
  }, [alunoId, alunoIdContexto, carregarAlunoDoContexto, dadosContexto]);

  // Atualizar aluno quando os dados do contexto mudarem
  useEffect(() => {
    if (
      dadosContexto &&
      Object.keys(dadosContexto).length > 0 &&
      alunoIdContexto === alunoId
    ) {
      console.log("[DetalheAluno] Atualizando aluno com dados do contexto");
      setAluno(dadosContexto);
      setLoading(false);
    }
  }, [dadosContexto, alunoIdContexto, alunoId]);

  // Carregar histórico de aulas
  useEffect(() => {
    const carregarHistoricoAulas = async () => {
      if (!aluno) return;

      try {
        setCarregandoHistorico(true);

        // Buscar todas as aulas
        const todasAulas = await aulasService.getAll();

        // Adicionar log para depuração
        console.log(
          "[DetalheAluno] Todas as aulas recebidas:",
          todasAulas.slice(0, 2).map((aula) => ({
            id: aula.id,
            data: aula.data,
            hora: aula.hora, // Verificar se este campo está vindo preenchido
            status: aula.status,
          }))
        );

        // Filtrar apenas as aulas que este aluno participou
        const aulasDoAluno = todasAulas.filter(
          (aula) => aula.alunos && aula.alunos.some((a) => a.id === aluno.id)
        );

        // Log das aulas filtradas para o aluno
        if (aulasDoAluno.length > 0) {
          console.log(
            "[DetalheAluno] Aulas do aluno:",
            aulasDoAluno.slice(0, 3).map((aula) => ({
              id: aula.id,
              data: aula.data,
              hora: aula.hora, // Verificar se este campo está vindo preenchido
              status: aula.status,
              hora_type: typeof aula.hora, // Verificar o tipo do campo
              hora_value: JSON.stringify(aula.hora), // Verificar o valor exato
            }))
          );
          
          // Log adicional para verificar os dados da primeira aula
          console.log("[DetalheAluno] Primeira aula COMPLETA:", aulasDoAluno[0]);
        }

        setHistoricoAulas(aulasDoAluno);
        setError(null);
      } catch (err) {
        console.error("Erro ao buscar histórico de aulas:", err);
        setError("Não foi possível carregar o histórico de aulas.");
      } finally {
        setCarregandoHistorico(false);
      }
    };

    carregarHistoricoAulas();
  }, [aluno]);

  // Função para lidar com o clique no botão Editar
  const handleEditarClick = () => {
    // Não limpar dados do contexto ao editar
    if (setActiveSection) {
      setActiveSection(`editar-aluno/${alunoId}`);
    } else {
      navegarPara(`/editar-aluno/${alunoId}`);
    }
  };

  // Função para voltar para a lista de alunos
  const voltarParaLista = () => {
    limparDadosCadastro(); // Limpar dados ao voltar
    if (setActiveSection) {
      setActiveSection("alunos");
    } else {
      navegarPara("/alunos");
    }
  };

  // Função para expandir/recolher detalhes de uma aula
  const verDetalhesAula = (aula) => {
    setAulaExpandida(aula.id === aulaExpandida ? null : aula.id);
  };

  // Função para obter o rótulo de status
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

  // Mostrar indicador de carregamento
  if (loading || carregandoAlunoDoContexto) {
    return (
      <div className="detalhe-aluno-container">
        <div className="detalhe-header">
          <h2>Detalhes do Aluno</h2>
          <button className="btn-voltar" onClick={voltarParaLista}>
            ← Voltar para Lista de Alunos
          </button>
        </div>
        <div className="detalhe-loading">
          <div className="spinner"></div>
          <p>Carregando dados do aluno...</p>
        </div>
      </div>
    );
  }

  // Mostrar mensagem de erro
  if (error || erroContexto || !aluno) {
    return (
      <div className="detalhe-aluno-container">
        <div className="detalhe-header">
          <h2>Detalhes do Aluno</h2>
          <button className="btn-voltar" onClick={voltarParaLista}>
            ← Voltar para Lista de Alunos
          </button>
        </div>
        <div className="detalhe-error">
          <p>Aluno não encontrado</p>
          <button className="btn-voltar" onClick={voltarParaLista}>
            Voltar para Lista de Alunos
          </button>
        </div>
      </div>
    );
  }

  // Converter a data de nascimento para um formato legível
  const dataNascimento = aluno.data_nascimento
    ? formatarData(new Date(aluno.data_nascimento))
    : "Não informada";

  return (
    <div className="detalhe-aluno-container">
      <div className="detalhe-header">
        <h2>Detalhes do Aluno</h2>
        <div className="detalhe-acoes">
          <button className="btn-editar" onClick={handleEditarClick}>
            ✏️ Editar
          </button>
          <button className="btn-voltar" onClick={voltarParaLista}>
            ← Voltar
          </button>
        </div>
      </div>

      <div className="detalhe-card">
        <div className="detalhe-foto">
          <div className="foto-placeholder">
            {aluno.nome ? aluno.nome.charAt(0).toUpperCase() : "?"}
          </div>
        </div>

        <div className="detalhe-info">
          <h3>{aluno.nome}</h3>
          <p className="detalhe-status">
            Status:{" "}
            <span className={`status-${aluno.status.toLowerCase()}`}>
              {aluno.status === "ativo" ? "Ativo" : "Inativo"}
            </span>
          </p>
        </div>
      </div>

      <div className="detalhe-secoes">
        <div className="detalhe-secao">
          <h4>Dados Pessoais</h4>
          <div className="detalhe-item">
            <strong>Data de Nascimento:</strong>
            <span>{dataNascimento}</span>
          </div>
          <div className="detalhe-item">
            <strong>Idade:</strong>
            <span>{aluno.idade ? `${aluno.idade} anos` : "Não informada"}</span>
          </div>
          <div className="detalhe-item">
            <strong>Plano:</strong>
            <span>{aluno.plano || "Não informado"}</span>
          </div>
          <div className="detalhe-item">
            <strong>Nível:</strong>
            <span>{aluno.nivel || "Não informado"}</span>
          </div>
        </div>

        <div className="detalhe-secao">
          <h4>Informações Médicas</h4>
          <div className="detalhe-item">
            <strong>Lesão:</strong>
            <span>
              {aluno.lesao === "Sim - Lesao Moderada"
                ? "Sim - Lesão Moderada"
                : aluno.lesao === "Sim - Lesao Grave"
                ? "Sim - Lesão Grave"
                : "Não"}
            </span>
          </div>
          {(aluno.lesao === "Sim - Lesao Moderada" ||
            aluno.lesao === "Sim - Lesao Grave") && (
            <div className="detalhe-item">
              <strong>Tipo de Lesão:</strong>
              <span>{aluno.tipo_lesao || "Não especificado"}</span>
            </div>
          )}
        </div>

        <div className="detalhe-secao">
          <h4>Objetivo de Treino</h4>
          <div className="detalhe-texto">
            {aluno.objetivo || "Nenhum objetivo especificado."}
          </div>
        </div>

        <div className="detalhe-secao">
          <h4>Observações Adicionais</h4>
          <div className="detalhe-texto">
            {aluno.observacoes || "Nenhuma observação adicional."}
          </div>
        </div>

        {/* Nova seção: Histórico de Aulas */}
        <div className="detalhe-secao historico-aulas">
          <h4>Histórico de Aulas</h4>
          {carregandoHistorico ? (
            <div className="carregando-historico">
              <div className="spinner"></div>
              <p>Carregando histórico de aulas...</p>
            </div>
          ) : historicoAulas.length > 0 ? (
            <div className="resumo-historico">
              <div className="info-resumo">
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

              <div className="historico-aulas-lista">
                {historicoAulas.map((aula) => (
                  <div
                    key={aula.id}
                    className={`aula-card aula-${aula.status}`}
                  >
                    <div
                      className="aula-header"
                      onClick={() => verDetalhesAula(aula)}
                    >
                      <div className="aula-data-horario">
                        <div className="aula-data">
                          {formatarData(aula.data)}
                        </div>
                        <div className="aula-horario">
                          {(() => {
                            console.log(`[RENDER] Processando aula ${aula.id} - Status: ${aula.status}, Hora: "${aula.hora}"`);
                            const horarios = interpretarHorarios(aula);
                            console.log(`[RENDER] Horarios retornados:`, horarios);
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
                              console.log(`[RENDER-DETALHES] Processando aula expandida ${aula.id} - Status: ${aula.status}, Hora: "${aula.hora}"`);
                              const horarios = interpretarHorarios(aula);
                              console.log(`[RENDER-DETALHES] Horarios detalhados retornados:`, horarios);
                              
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
            </div>
          ) : (
            <div className="sem-registros">
              Nenhuma aula registrada para este aluno.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DetalheAluno;

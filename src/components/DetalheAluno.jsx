import React, { useState, useEffect } from "react";
import "../styles/DetalheAluno.css";
import aulasService from "../services/aulas.service";
import professoresService from "../services/professores.service";
import exerciciosService from "../services/exercicios.service";
import { supabase } from "../services/supabase";
import aulaAlunosService from "../services/AulaAlunosService";

const DetalheAluno = ({
  aluno,
  alunoId,
  onClose,
  onNavigateBack,
  onSaveObservacao = null,
  salvarJunto = true,
  aulaAtual = null,
  onFinalizarAluno = null,
}) => {
  // Estado para armazenar os dados do aluno quando recebemos apenas o ID
  const [dadosAluno, setDadosAluno] = useState(null);
  const [ultimoTreino, setUltimoTreino] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [carregandoHistorico, setCarregandoHistorico] = useState(false);
  const [carregandoAluno, setCarregandoAluno] = useState(false);
  const [exerciciosPorAula, setExerciciosPorAula] = useState({});
  const [observacao, setObservacao] = useState("");
  const [professorUltimoTreino, setProfessorUltimoTreino] = useState(null);
  const [erro, setErro] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [sucessoSalvar, setSucessoSalvar] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState("info"); // 'info' ou 'historico'

  // Quando componente recebe alunoId em vez do objeto aluno completo
  useEffect(() => {
    const buscarDadosAluno = async () => {
      if (!alunoId) return;

      try {
        setCarregandoAluno(true);
        setErro(null);

        console.log(`Buscando dados do aluno com ID: ${alunoId}`);

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

        console.log("Dados do aluno carregados:", data);
        setDadosAluno(data);
      } catch (err) {
        console.error("Erro ao carregar dados do aluno:", err);
        setErro(`Erro ao carregar dados do aluno: ${err.message}`);
      } finally {
        setCarregandoAluno(false);
      }
    };

    if (alunoId && !aluno) {
      buscarDadosAluno();
    }
  }, [alunoId, aluno]);

  // Usar o objeto aluno que foi passado diretamente, ou o que foi buscado pelo ID
  const alunoAtual = aluno || dadosAluno;

  useEffect(() => {
    // Inicializar o campo de observação com as observações existentes do aluno
    if (alunoAtual && alunoAtual.observacoes) {
      setObservacao(alunoAtual.observacoes);
    } else {
      setObservacao("");
    }
  }, [alunoAtual]);

  // Carregar o último treino e histórico do aluno ao montar o componente
  useEffect(() => {
    const buscarUltimoTreinoEHistorico = async () => {
      if (!alunoAtual || !alunoAtual.id) return;

      try {
        setCarregando(true);
        setCarregandoHistorico(true);

        // Buscar todas as aulas do aluno
        const aulas = await aulasService.getAulasByAlunoId(alunoAtual.id);

        // Filtrar apenas aulas finalizadas/realizadas e ordenar por data mais recente
        const aulasFinalizadas = aulas
          .filter(
            (aula) =>
              aula.status === "realizada" || aula.status === "finalizada"
          )
          .sort((a, b) => {
            // Converter as datas para objetos Date e comparar
            const dataA = new Date(a.data);
            const dataB = new Date(b.data);
            return dataB - dataA; // Ordem decrescente (mais recente primeiro)
          });

        // Definir o histórico completo
        setHistorico(aulasFinalizadas);

        // Buscar os exercícios para cada aula no histórico
        const exerciciosPorAulaTemp = {};
        for (const aula of aulasFinalizadas) {
          try {
            const exerciciosDaAula =
              await exerciciosService.getExerciciosByAulaId(aula.id);
            if (exerciciosDaAula && exerciciosDaAula.length > 0) {
              exerciciosPorAulaTemp[aula.id] = exerciciosDaAula;
            }
          } catch (err) {
            console.error(`Erro ao buscar exercícios da aula ${aula.id}:`, err);
          }
        }
        setExerciciosPorAula(exerciciosPorAulaTemp);

        // Se encontrou alguma aula, pegar a primeira (mais recente) como último treino
        if (aulasFinalizadas.length > 0) {
          const ultimaAula = aulasFinalizadas[0];
          setUltimoTreino(ultimaAula);
          console.log("Último treino encontrado:", ultimaAula);

          // Buscar detalhes do professor se tivermos um professor_id
          if (ultimaAula.professor_id) {
            try {
              const professor = await professoresService.getById(
                ultimaAula.professor_id
              );
              if (professor) {
                setProfessorUltimoTreino(professor);
              }
            } catch (profErr) {
              console.error("Erro ao buscar detalhes do professor:", profErr);
            }
          } else if (ultimaAula.professor) {
            // Se já temos os detalhes do professor no objeto da aula
            setProfessorUltimoTreino(ultimaAula.professor);
          }
        } else {
          setUltimoTreino(null);
          setProfessorUltimoTreino(null);
        }
      } catch (error) {
        console.error("Erro ao buscar último treino e histórico:", error);
      } finally {
        setCarregando(false);
        setCarregandoHistorico(false);
      }
    };

    if (alunoAtual) {
      buscarUltimoTreinoEHistorico();
    }
  }, [alunoAtual]);

  // Função para formatar a data no padrão brasileiro
  const formatarData = (dataString) => {
    if (!dataString) return "Data não disponível";

    const data = new Date(dataString);
    if (isNaN(data.getTime())) return dataString; // Se não conseguir converter, retorna como está

    return data.toLocaleDateString("pt-BR");
  };

  const handleVoltar = () => {
    if (onNavigateBack) {
      onNavigateBack("alunos"); // Volta para a lista de alunos
    } else if (onClose) {
      onClose();
    }
  };

  // Função para salvar observações no banco de dados
  const salvarObservacoes = async () => {
    if (!alunoAtual || !alunoAtual.id) return;

    try {
      setSalvando(true);
      setErro(null);

      // 1. Salvar observações na tabela de alunos (observações gerais)
      const { error: errorAluno } = await supabase
        .from("alunos")
        .update({ observacoes: observacao })
        .eq("id", alunoAtual.id);

      if (errorAluno) {
        throw new Error(
          `Erro ao salvar observações do aluno: ${errorAluno.message}`
        );
      }

      // 2. Se temos uma aula atual, salvar também na relação aula_alunos
      if (aulaAtual && aulaAtual.id) {
        // Atualizar observações específicas para esta aula
        await aulaAlunosService.atualizarObservacoes(
          aulaAtual.id,
          alunoAtual.id,
          observacao
        );
      }

      console.log("Observações do aluno salvas com sucesso!");
      setSucessoSalvar(true);

      // Chamar callback se existir
      if (onSaveObservacao) {
        onSaveObservacao(observacao);
      }

      // Esconder mensagem de sucesso após 3 segundos
      setTimeout(() => setSucessoSalvar(false), 3000);
    } catch (error) {
      console.error("Erro ao salvar observações:", error);
      setErro(`Erro ao salvar observações: ${error.message}`);
    } finally {
      setSalvando(false);
    }
  };

  const handleFinalizarAluno = async () => {
    // Salvar observações antes de finalizar
    await salvarObservacoes();

    // Se temos um callback de finalização, chamá-lo
    if (typeof onFinalizarAluno === "function") {
      onFinalizarAluno(alunoAtual.id, observacao);
    }

    // Fechar o modal
    if (onClose) {
      onClose();
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
    <div className="detalhes-aluno-container">
      <h2>Detalhes do Aluno: {alunoAtual.nome}</h2>

      {sucessoSalvar && (
        <div className="success-message">Observações salvas com sucesso!</div>
      )}

      {erro && <div className="error-message">{erro}</div>}

      <div className="abas-container">
        <div className="abas">
          <button
            className={`aba ${abaAtiva === "info" ? "ativa" : ""}`}
            onClick={() => setAbaAtiva("info")}
          >
            Informações Pessoais
          </button>
          <button
            className={`aba ${abaAtiva === "historico" ? "ativa" : ""}`}
            onClick={() => setAbaAtiva("historico")}
          >
            Histórico de Aulas
          </button>
        </div>

        <div className="conteudo-aba">
          {/* Conteúdo da aba "Informações Pessoais" */}
          {abaAtiva === "info" && (
            <div className="info-pessoal">
              <div className="info-section">
                <h3>Dados do Aluno</h3>
                <div className="info-container">
                  <p>
                    <strong>Nome:</strong> {alunoAtual.nome}
                  </p>
                  <p>
                    <strong>Idade:</strong> {alunoAtual.idade || "N/A"}
                  </p>
                  <p>
                    <strong>Lesão:</strong> {alunoAtual.lesao || "Nenhuma"}
                  </p>
                  {alunoAtual.lesao &&
                    alunoAtual.lesao !== "Nao" &&
                    alunoAtual.tipo_lesao && (
                      <p>
                        <strong>Detalhes da lesão:</strong>{" "}
                        {alunoAtual.tipo_lesao}
                      </p>
                    )}
                  <p>
                    <strong>Plano:</strong> {alunoAtual.plano || "N/A"}
                  </p>
                  <p>
                    <strong>Nível:</strong> {alunoAtual.nivel || "N/A"}
                  </p>

                  <div className="objetivo-treino">
                    <p className="objetivo-treino-titulo">
                      <strong>Objetivo de Treino:</strong>
                    </p>
                    <div className="objetivo-treino-texto">
                      {alunoAtual.objetivo || "Não informado"}
                    </div>
                  </div>

                  <div className="observacoes-section">
                    <h4>Observações</h4>
                    <textarea
                      value={observacao}
                      onChange={(e) => setObservacao(e.target.value)}
                      placeholder={`Adicione observações para ${alunoAtual.nome}...`}
                      rows={4}
                    ></textarea>
                    <button
                      className="btn-salvar-observacao"
                      onClick={salvarObservacoes}
                      disabled={salvando}
                    >
                      {salvando ? "Salvando..." : "Salvar Observação"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="info-section">
                <h3>Último Treino</h3>
                <div className="ultimo-treino-info">
                  {carregando ? (
                    <p>Carregando dados do último treino...</p>
                  ) : ultimoTreino ? (
                    <>
                      <p className="treino-data">
                        <strong>Data:</strong> {formatarData(ultimoTreino.data)}
                      </p>
                      <p className="treino-professor">
                        <strong>Professor:</strong>{" "}
                        {professorUltimoTreino?.nome ||
                          ultimoTreino.professor?.nome ||
                          "N/A"}
                      </p>
                      <div className="ultimo-treino-anotacoes">
                        <p>
                          <strong>Anotações do último treino:</strong>
                        </p>
                        <div className="anotacoes">
                          {ultimoTreino.observacoes_aluno ||
                            ultimoTreino.observacoes ||
                            "Nenhuma anotação registrada"}
                        </div>
                      </div>
                    </>
                  ) : (
                    <p>Este aluno não possui treinos anteriores</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Conteúdo da aba "Histórico de Aulas" */}
          {abaAtiva === "historico" && (
            <div className="historico-aulas">
              <h3>Histórico de Treinos</h3>
              {carregandoHistorico ? (
                <p>Carregando histórico de treinos...</p>
              ) : historico.length > 0 ? (
                <table className="historico-tabela">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Professor</th>
                      <th>Exercícios</th>
                      <th>Observações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historico.map((treino, index) => (
                      <tr key={`${treino.id}-${index}`}>
                        <td>{formatarData(treino.data)}</td>
                        <td>{treino.professor?.nome || "N/A"}</td>
                        <td>
                          {exerciciosPorAula[treino.id] &&
                          exerciciosPorAula[treino.id].length > 0 ? (
                            <ul className="exercicios-lista">
                              {exerciciosPorAula[treino.id].map(
                                (exercicio, i) => (
                                  <li key={`${exercicio.id}-${i}`}>
                                    {exercicio.nome}
                                    {exercicio.musculatura
                                      ? ` - ${exercicio.musculatura}`
                                      : ""}
                                    {exercicio.aparelho
                                      ? ` (${exercicio.aparelho})`
                                      : ""}
                                  </li>
                                )
                              )}
                            </ul>
                          ) : (
                            <span className="sem-exercicios">
                              Sem exercícios registrados
                            </span>
                          )}
                        </td>
                        <td>
                          {treino.observacoes_aluno ||
                            treino.observacoes ||
                            "Sem observações"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="sem-historico">
                  Nenhum treino encontrado no histórico.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Botões de ação */}
      <div className="botoes-acao">
        <button className="btn-voltar" onClick={handleVoltar}>
          Voltar para Lista de Alunos
        </button>
        {aulaAtual && (
          <button className="btn-finalizar" onClick={handleFinalizarAluno}>
            Finalizar Aluno
          </button>
        )}
      </div>
    </div>
  );
};

export default DetalheAluno;

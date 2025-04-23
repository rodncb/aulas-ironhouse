import React, { useState, useEffect } from "react";
// REMOVIDO: import { useNavigate } from 'react-router-dom';
import AlunosService from "../services/AlunosService";
import { formatarData } from "../lib/utils";
import "../styles/DetalheAluno.css";

// Adicionar onNavigateBack às props
const DetalheAluno = ({ alunoId, onNavigateBack }) => {
  // REMOVIDO: const navigate = useNavigate();
  const [aluno, setAluno] = useState(null);
  const [historicoAulas, setHistoricoAulas] = useState([]);
  const [tabAtiva, setTabAtiva] = useState("detalhes");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const carregarAluno = async () => {
      setLoading(true);
      try {
        // Carregar informações do aluno
        const infoAluno = await AlunosService.obterAlunoPorId(alunoId);
        setAluno(infoAluno);

        // Carregar histórico de aulas
        const historico = await AlunosService.obterHistoricoAulasPorAluno(
          alunoId
        );
        setHistoricoAulas(historico);
      } catch (err) {
        console.error("Erro ao carregar detalhes do aluno:", err);
        setError(
          "Não foi possível carregar os detalhes do aluno. Por favor, tente novamente."
        );
      } finally {
        setLoading(false);
      }
    };

    if (alunoId) {
      carregarAluno();
    }
  }, [alunoId]);

  // Função para obter a classe CSS baseada na lesão
  const obterClasseLesao = (lesao) => {
    if (lesao === "Sim - Lesao Grave" || lesao === "Sim - Grave")
      return "lesao-grave";
    if (lesao === "Sim - Lesao Moderada" || lesao === "Sim - Moderada")
      return "lesao-moderada";
    return "";
  };

  // Função para obter a classe do contêiner baseada na lesão
  const obterClasseContainerLesao = (lesao) => {
    if (lesao === "Sim - Lesao Grave" || lesao === "Sim - Grave")
      return "aluno-com-lesao-grave";
    if (lesao === "Sim - Lesao Moderada" || lesao === "Sim - Moderada")
      return "aluno-com-lesao-moderada";
    return "";
  };

  // Função para chamar onNavigateBack com a seção 'alunos'
  const handleVoltarParaAlunos = () => {
    if (onNavigateBack) {
      onNavigateBack('alunos');
    }
  };

  if (loading) {
    return (
      <div className="detalhe-aluno-container">
        <div className="detalhe-header">
          <h2>Detalhes do Aluno</h2>
          {/* Usar a nova função */}
          <button className="btn-voltar" onClick={handleVoltarParaAlunos}>
            Voltar
          </button>
        </div>
        <div className="detalhe-loading">
          <div className="spinner"></div>
          <p>Carregando detalhes do aluno...</p>
        </div>
      </div>
    );
  }

  if (error || !aluno) {
    return (
      <div className="detalhe-aluno-container">
        <div className="detalhe-header">
          <h2>Detalhes do Aluno</h2>
           {/* Usar a nova função */}
          <button className="btn-voltar" onClick={handleVoltarParaAlunos}>
            Voltar
          </button>
        </div>
        <div className="detalhe-error">
          <p>{error || "Aluno não encontrado"}</p>
           {/* Usar a nova função */}
          <button className="btn-voltar" onClick={handleVoltarParaAlunos}>
            Voltar para a lista
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`detalhe-aluno-container ${obterClasseContainerLesao(
        aluno.lesao
      )}`}
    >
      <div className="detalhe-header">
        <h2>Detalhes do Aluno</h2>
         {/* Usar a nova função */}
        <button className="btn-voltar" onClick={handleVoltarParaAlunos}>
          Voltar
        </button>
      </div>

      <div className="detalhe-card">
        <div className="detalhe-foto">
          <div className="foto-placeholder">
            {aluno.nome ? aluno.nome.charAt(0).toUpperCase() : "?"}
          </div>
        </div>
        <div className="detalhe-info">
          <h3>{aluno.nome}</h3>
          <div className="detalhe-info-row">
            <span
              className="status-badge"
              data-status={aluno.ativo ? "ativo" : "inativo"}
            >
              {aluno.ativo ? "Ativo" : "Inativo"}
            </span>
            {aluno.nivel && <span>Nível: {aluno.nivel}</span>}
            {aluno.lesao && aluno.lesao !== "Não" && (
              <span className={`lesao-badge ${obterClasseLesao(aluno.lesao)}`}>
                {aluno.lesao}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="detalhe-tabs">
        <button
          className={`tab-btn ${tabAtiva === "detalhes" ? "active" : ""}`}
          onClick={() => setTabAtiva("detalhes")}
        >
          Informações Pessoais
        </button>
        <button
          className={`tab-btn ${tabAtiva === "historico" ? "active" : ""}`}
          onClick={() => setTabAtiva("historico")}
        >
          Histórico de Aulas
        </button>
      </div>

      <div className="tab-content">
        {tabAtiva === "detalhes" && (
          <div className="detalhes-pessoais">
            <div className="info-group">
              <label>Nome Completo</label>
              <p>{aluno.nome || "Não informado"}</p>
            </div>
            <div className="info-group">
              <label>E-mail</label>
              <p>{aluno.email || "Não informado"}</p>
            </div>
            <div className="info-group">
              <label>Telefone</label>
              <p>{aluno.telefone || "Não informado"}</p>
            </div>
            <div className="info-group">
              <label>Status</label>
              <p>{aluno.ativo ? "Ativo" : "Inativo"}</p>
            </div>
            <div className="info-group">
              <label>Plano</label>
              <p>{aluno.plano || "Não informado"}</p>
            </div>
            <div className="info-group">
              <label>Nível</label>
              <p>{aluno.nivel || "Não informado"}</p>
            </div>
            <div className="info-group">
              <label>Lesão</label>
              <p>{aluno.lesao || "Não"}</p>
            </div>
            <div className="info-group">
              <label>Observações</label>
              <p>{aluno.observacoes || "Nenhuma observação"}</p>
            </div>
          </div>
        )}

        {tabAtiva === "historico" && (
          <div className="historico-aulas">
            {historicoAulas.length === 0 ? (
              <div className="sem-historico">
                <p>Este aluno ainda não participou de nenhuma aula.</p>
              </div>
            ) : (
              <div className="lista-aulas">
                {historicoAulas.map((aula) => (
                  <div key={aula.id} className="aula-card">
                    <div className="aula-header">
                      <div className="aula-data">{formatarData(aula.data)}</div>
                      <div className="aula-status">
                        {aula.status === "realizada"
                          ? "Concluída"
                          : aula.status === "cancelada"
                          ? "Cancelada"
                          : "Agendada"}
                      </div>
                    </div>
                    <div className="aula-info">
                      <div>
                        <label>Horário</label>
                        <p>{aula.horario}</p>
                      </div>
                      <div>
                        <label>Professor</label>
                        <p>{aula.professor?.nome || "Não informado"}</p>
                      </div>
                      <div>
                        <label>Tipo de Aula</label>
                        <p>{aula.tipo || "Não informado"}</p>
                      </div>
                    </div>
                    {aula.exercicios && aula.exercicios.length > 0 && (
                      <div className="aula-exercicios">
                        <label>Exercícios realizados</label>
                        <ul>
                          {aula.exercicios.map((ex, index) => (
                            <li key={index}>
                              {ex.nome}{" "}
                              {ex.series && ex.repeticoes
                                ? `(${ex.series}x${ex.repeticoes})`
                                : ""}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {aula.observacoes && (
                      <div className="aula-observacoes">
                        <label>Observações</label>
                        <p>{aula.observacoes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DetalheAluno;

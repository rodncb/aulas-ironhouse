import React, { useState, useEffect } from "react";
import "../styles/FormularioAula.css";

const FormularioAulaModal = ({ isOpen, onClose, aulaData, onSalvar }) => {
  const [observacoes, setObservacoes] = useState("");
  const [alunosAvaliacao, setAlunosAvaliacao] = useState([]);
  const [anotacoesAula, setAnotacoesAula] = useState("");

  useEffect(() => {
    if (aulaData && aulaData.alunos) {
      // Inicializar as avaliações dos alunos
      const avaliacoesIniciais = aulaData.alunos.map((aluno) => ({
        id: aluno.id,
        nome: aluno.nome,
        presenca: true,
        desempenho: 0,
        motivacao: 0,
        disciplina: 0,
        comentarios: "",
      }));
      setAlunosAvaliacao(avaliacoesIniciais);
    }

    // Inicializar as anotações da aula se existirem
    if (aulaData && aulaData.anotacoes) {
      setAnotacoesAula(aulaData.anotacoes);
    }
  }, [aulaData]);

  const handleRatingChange = (alunoIndex, campo, valor) => {
    const novosAlunos = [...alunosAvaliacao];
    novosAlunos[alunoIndex][campo] = valor;
    setAlunosAvaliacao(novosAlunos);
  };

  const handleComentarioChange = (alunoIndex, valor) => {
    const novosAlunos = [...alunosAvaliacao];
    novosAlunos[alunoIndex].comentarios = valor;
    setAlunosAvaliacao(novosAlunos);
  };

  const handlePresencaChange = (alunoIndex, valor) => {
    const novosAlunos = [...alunosAvaliacao];
    novosAlunos[alunoIndex].presenca = valor;
    setAlunosAvaliacao(novosAlunos);
  };

  const handleSalvar = () => {
    const dadosFormulario = {
      idAula: aulaData.id,
      data: aulaData.data,
      observacoes,
      anotacoesAula,
      alunosAvaliacao,
    };

    onSalvar(dadosFormulario);
    onClose();
  };

  if (!isOpen) return null;

  const formatarData = (dataString) => {
    if (!dataString) return "";
    const data = new Date(dataString);
    return data.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderEstrelas = (alunoIndex, campo, valorAtual) => {
    return (
      <div className="stars-container">
        {[1, 2, 3, 4, 5].map((estrela) => (
          <button
            key={estrela}
            type="button"
            className={`star-btn ${valorAtual >= estrela ? "active" : ""}`}
            onClick={() => handleRatingChange(alunoIndex, campo, estrela)}
          >
            ★
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="modal-formulario-aula">
      <div className="formulario-aula-content">
        <div className="formulario-aula-header">
          <h2>Relatório de Aula Realizada</h2>
          <button className="btn-fechar-form" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="formulario-aula-body">
          <div className="info-aula-realizada">
            <p className="data-hora">
              <strong>Data e Hora:</strong> {formatarData(aulaData?.data)}
            </p>
            <p>
              <strong>Treino:</strong>{" "}
              {aulaData?.nomeTreino || "Treino não especificado"}
            </p>
            <p>
              <strong>Total de Alunos:</strong> {aulaData?.alunos?.length || 0}
            </p>
          </div>

          <div className="form-group">
            <label htmlFor="anotacoesAula">Anotações da Aula:</label>
            <textarea
              id="anotacoesAula"
              value={anotacoesAula}
              onChange={(e) => setAnotacoesAula(e.target.value)}
              placeholder="Registre anotações importantes sobre a aula, progresso dos alunos, dificuldades encontradas, etc."
            />
          </div>

          <div className="form-group">
            <label htmlFor="observacoes">Observações Gerais da Aula:</label>
            <textarea
              id="observacoes"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Descreva como foi a aula, observações gerais, etc."
            />
          </div>

          {aulaData?.exercicios && aulaData.exercicios.length > 0 && (
            <div className="exercicios-realizados">
              <h3>Exercícios Realizados</h3>
              <div className="lista-exercicios-realizados">
                {aulaData.exercicios.map((exercicio, index) => (
                  <div key={index} className="exercicio-realizado-item">
                    <h4>{exercicio.nome}</h4>
                    <p>{exercicio.descricao}</p>
                    <div className="exercicio-realizacao-info">
                      <div className="info-series-repeticoes">
                        <span className="serie-info">
                          {exercicio.series} séries
                        </span>
                        <span className="repeticao-info">
                          {exercicio.repeticoes} repetições
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="formulario-alunos-section">
            <h3>Avaliação dos Alunos</h3>
            <div className="alunos-formularios">
              {alunosAvaliacao.map((aluno, index) => (
                <div key={aluno.id} className="aluno-formulario">
                  <div className="aluno-formulario-header">
                    <h4>{aluno.nome}</h4>
                  </div>

                  <div className="form-group">
                    <label>
                      <input
                        type="checkbox"
                        checked={aluno.presenca}
                        onChange={(e) =>
                          handlePresencaChange(index, e.target.checked)
                        }
                      />{" "}
                      Aluno presente na aula
                    </label>
                  </div>

                  {aluno.presenca && (
                    <div className="avaliacao-form">
                      <div className="rating-group">
                        <span className="rating-label">Desempenho:</span>
                        {renderEstrelas(index, "desempenho", aluno.desempenho)}
                      </div>

                      <div className="rating-group">
                        <span className="rating-label">Motivação:</span>
                        {renderEstrelas(index, "motivacao", aluno.motivacao)}
                      </div>

                      <div className="rating-group">
                        <span className="rating-label">Disciplina:</span>
                        {renderEstrelas(index, "disciplina", aluno.disciplina)}
                      </div>

                      <div className="form-group">
                        <label>Observações do aluno:</label>
                        <textarea
                          value={aluno.comentarios}
                          onChange={(e) =>
                            handleComentarioChange(index, e.target.value)
                          }
                          placeholder="Comentários específicos sobre o desempenho do aluno, evolução, pontos a melhorar, etc."
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="formulario-aula-footer">
          <button className="btn-cancelar-form" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn-salvar-form" onClick={handleSalvar}>
            Salvar Relatório
          </button>
        </div>
      </div>
    </div>
  );
};

export default FormularioAulaModal;

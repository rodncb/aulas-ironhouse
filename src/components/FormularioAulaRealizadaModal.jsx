import React, { useState, useEffect } from "react";
import "../styles/FormularioAulaRealizada.css";

const FormularioAulaRealizadaModal = ({ show, onClose, onSalvar, aula }) => {
  const [alunosAvaliacao, setAlunosAvaliacao] = useState([]);
  const [observacoes, setObservacoes] = useState("");
  const [anotacoesAula, setAnotacoesAula] = useState("");

  useEffect(() => {
    if (aula && aula.alunos) {
      // Inicializar o estado com os alunos da aula
      const alunosIniciais = aula.alunos.map((aluno) => ({
        id: aluno.id,
        nome: aluno.nome,
        avaliacao: "",
      }));
      setAlunosAvaliacao(alunosIniciais);

      // Inicializar observações e anotações se já existirem
      setObservacoes(aula.observacoes || "");
      setAnotacoesAula(aula.anotacoes || "");
    }
  }, [aula]);

  const handleAvaliacaoChange = (id, avaliacao) => {
    setAlunosAvaliacao(
      alunosAvaliacao.map((aluno) =>
        aluno.id === id ? { ...aluno, avaliacao } : aluno
      )
    );
  };

  const handleObservacoesChange = (e) => {
    setObservacoes(e.target.value);
  };

  const handleAnotacoesChange = (e) => {
    setAnotacoesAula(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSalvar({
      idAula: aula.id,
      alunosAvaliacao,
      observacoes,
      anotacoesAula,
    });
    onClose();
  };

  if (!show) return null;

  return (
    <div className="modal-backdrop">
      <div className="formulario-aula-realizada-modal">
        <div className="modal-header">
          <h2>Finalizar Aula</h2>
          <button className="btn-fechar" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Anotações da aula realizada */}
          <div className="form-group">
            <label htmlFor="anotacoesAula">Anotações da Aula:</label>
            <textarea
              id="anotacoesAula"
              value={anotacoesAula}
              onChange={handleAnotacoesChange}
              placeholder="Registre observações gerais sobre a aula, progressos, dificuldades..."
              className="campo-anotacoes"
            ></textarea>
          </div>

          <h3>Avaliação dos Alunos</h3>

          {alunosAvaliacao.map((aluno) => (
            <div key={aluno.id} className="avaliacao-aluno-item">
              <h4>{aluno.nome}</h4>
              <select
                value={aluno.avaliacao}
                onChange={(e) =>
                  handleAvaliacaoChange(aluno.id, e.target.value)
                }
                className="select-avaliacao"
              >
                <option value="">Selecione uma avaliação</option>
                <option value="Ótimo">Ótimo</option>
                <option value="Bom">Bom</option>
                <option value="Regular">Regular</option>
                <option value="Precisa melhorar">Precisa melhorar</option>
              </select>
            </div>
          ))}

          <div className="form-group">
            <label htmlFor="observacoes">Observações Adicionais:</label>
            <textarea
              id="observacoes"
              value={observacoes}
              onChange={handleObservacoesChange}
              placeholder="Observações adicionais sobre os alunos..."
              className="campo-observacoes"
            ></textarea>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-cancelar" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-salvar">
              Finalizar Aula
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormularioAulaRealizadaModal;

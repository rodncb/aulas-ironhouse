import React, { useState, useEffect } from "react";
import "../styles/AlunosEmAula.css";
import AdicionarAlunoModal from "./AdicionarAlunoModal";
import TreinosList from "./TreinosList";

const AlunosEmAula = ({ atualizarAlunosEmAula }) => {
  // Lista de alunos disponíveis para adicionar à aula
  const [todosAlunos, setTodosAlunos] = useState([
    { id: 1, nome: "Adriano Faria de Souza", idade: 43 },
    { id: 2, nome: "Adriano Laranjo", idade: 37 },
    { id: 3, nome: "Adriano Silva", idade: 39 },
    { id: 4, nome: "Agnella Massara", idade: 46 },
    { id: 5, nome: "Alessandra Cunha", idade: 46 },
    { id: 6, nome: "Alessandra Maria Sales", idade: 46 },
    { id: 7, nome: "Alexandre Buscher", idade: 36 },
    { id: 8, nome: "Alexandre Teixeira", idade: 36 },
    { id: 9, nome: "Vitor", idade: 25 },
  ]);

  // Alunos que estão atualmente na aula
  const [alunosEmAula, setAlunosEmAula] = useState([]);

  // Aluno selecionado no dropdown
  const [alunoSelecionado, setAlunoSelecionado] = useState("");

  // Estado para controlar a visibilidade do painel de seleção
  const [showSelecao, setShowSelecao] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [alunoSelecionadoModal, setAlunoSelecionadoModal] = useState(null);

  // Atualiza o componente pai sempre que a lista de alunos em aula muda
  useEffect(() => {
    if (atualizarAlunosEmAula) {
      atualizarAlunosEmAula(alunosEmAula);
    }
  }, [alunosEmAula, atualizarAlunosEmAula]);

  const adicionarAlunoAula = (alunoId) => {
    if (!alunoId) return;

    const aluno = todosAlunos.find((a) => a.id === parseInt(alunoId));
    if (aluno) {
      const novosAlunosEmAula = [...alunosEmAula, aluno];
      setAlunosEmAula(novosAlunosEmAula);
      setAlunoSelecionado("");
    }
  };

  const abrirSelecao = () => {
    setShowSelecao(true);
  };

  const salvarAula = () => {
    console.log("Alunos em aula salvos:", alunosEmAula);

    if (atualizarAlunosEmAula) {
      atualizarAlunosEmAula(alunosEmAula);
    }

    // Aqui poderia ter lógica adicional para salvar no backend

    setShowSelecao(false);
  };

  const adicionarAluno = (novoAluno) => {
    const novosAlunosEmAula = [...alunosEmAula, novoAluno];
    setAlunosEmAula(novosAlunosEmAula);
    setShowModal(false);
  };

  const verTreinos = (aluno) => {
    setAlunoSelecionadoModal(aluno);
  };

  return (
    <div className="alunos-container">
      <h2 className="page-title">Alunos em aula</h2>

      <div className="actions">
        <button className="btn-adicionar" onClick={abrirSelecao}>
          <i className="icon">👤</i> Adicionar Aluno
        </button>
      </div>

      <div className="alunos-content">
        {alunosEmAula.length === 0 ? (
          <div className="sem-alunos">
            <p>Nenhum aluno em aula encontrado.</p>
          </div>
        ) : (
          <div className="lista-alunos">
            {alunosEmAula.map((aluno, index) => (
              <div key={index} className="card-aluno">
                <div className="aluno-info">
                  <h3>{aluno.nome}</h3>
                  <div className="aluno-detalhes">
                    <p>Idade: {aluno.idade}</p>
                  </div>
                </div>
                <div className="aluno-actions">
                  <button
                    className="btn-treino"
                    onClick={() => verTreinos(aluno)}
                  >
                    Ver treinos
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showSelecao && (
        <div className="selecao-aluno-panel">
          <div className="selecao-aluno-content">
            <h2>Selecione um Aluno:</h2>

            <select
              value={alunoSelecionado}
              onChange={(e) => setAlunoSelecionado(e.target.value)}
              className="select-aluno"
            >
              <option value="">Selecionar aluno...</option>
              {todosAlunos.map((aluno) => (
                <option key={aluno.id} value={aluno.id}>
                  {aluno.nome}
                </option>
              ))}
            </select>

            <div className="selecao-actions">
              <button
                className="btn-adicionar-verde"
                onClick={() => adicionarAlunoAula(alunoSelecionado)}
              >
                <i className="icon-user">👤</i> Adicionar Aluno
              </button>

              <button className="btn-salvar" onClick={salvarAula}>
                Salvar Aula
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <AdicionarAlunoModal
          onClose={() => setShowModal(false)}
          onAdicionar={adicionarAluno}
        />
      )}

      {alunoSelecionadoModal && (
        <TreinosList
          aluno={alunoSelecionadoModal}
          onClose={() => setAlunoSelecionadoModal(null)}
        />
      )}
    </div>
  );
};

export default AlunosEmAula;

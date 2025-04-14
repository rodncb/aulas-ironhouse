import React, { useState, useEffect } from "react";
import "../styles/GerenciamentoAlunos.css";
import "../styles/Modal.css"; // Adicionando o CSS da modal
import { useAuth } from "../hooks/useAuth";
import Geral from "./Geral";

const HistoricoAlunos = () => {
  const [alunos, setAlunos] = useState([]);
  const [alunoSelecionado, setAlunoSelecionado] = useState(null);
  const [historicoAulas, setHistoricoAulas] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const { user } = useAuth();
  const [modalAula, setModalAula] = useState(null);

  useEffect(() => {
    // Carregar alunos do localStorage
    const alunosSalvos = localStorage.getItem("alunos");
    if (alunosSalvos) {
      setAlunos(JSON.parse(alunosSalvos));
    }
  }, []);

  const handleAlunoSelect = (aluno) => {
    setAlunoSelecionado(aluno);

    // Buscar histórico de aulas do aluno
    const historicoAulas = localStorage.getItem("historicoAulas");
    if (historicoAulas) {
      const todasAulas = JSON.parse(historicoAulas);
      // Filtrar apenas as aulas que este aluno participou
      const aulasDoAluno = todasAulas.filter(
        (aula) => aula.alunos && aula.alunos.some((a) => a.id === aluno.id)
      );
      setHistoricoAulas(aulasDoAluno);
      // Se houver pelo menos uma aula, abrir o modal da última aula automaticamente
      if (aulasDoAluno.length > 0) {
        setModalAula(aulasDoAluno[aulasDoAluno.length - 1]);
      }
    }
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

          {historicoAulas.length > 0 ? (
            <table className="data-table historico-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Professor</th>
                  <th>Status</th>
                  <th>Exercícios</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {historicoAulas.map((aula) => (
                  <tr key={aula.id} className={`aula-${aula.status}`}>
                    <td>{formatarData(aula.data)}</td>
                    <td>
                      {aula.professor ? aula.professor.nome : "Não definido"}
                    </td>
                    <td>{getStatusLabel(aula.status)}</td>
                    <td>
                      {aula.exercicios ? aula.exercicios.length : 0} exercícios
                    </td>
                    <td>
                      <button
                        className="btn-detalhes"
                        onClick={(e) => {
                          e.stopPropagation();
                          setModalAula(aula);
                        }}
                      >
                        Ver Detalhes
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="sem-historico">
              Nenhuma aula encontrada para este aluno.
            </p>
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

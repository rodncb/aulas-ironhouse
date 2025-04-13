import React, { useState, useEffect } from "react";
import "../styles/Cadastro.css";
import "../styles/CadastroAluno.css";
import "../styles/Modal.css";
import { voltarPagina, getStatusLabel } from "../lib/utils"; // Importar funções utilitárias

const CadastroAluno = () => {
  const [showModal, setShowModal] = useState(false);
  const [alunos, setAlunos] = useState([
    {
      id: 1,
      nome: "Adriano Faria de Souza 12 check",
      idade: 43,
      historicoAulas: [],
    },
    {
      id: 2,
      nome: "Adriano Laranjo 8 Checkins",
      idade: 37,
      historicoAulas: [],
    },
    { id: 3, nome: "Adriano Silva 8 check", idade: 39, historicoAulas: [] },
    { id: 4, nome: "Agnella Massara Premium", idade: 46, historicoAulas: [] },
    {
      id: 5,
      nome: "Alessandra Cunha 16 Checkins",
      idade: 46,
      historicoAulas: [],
    },
    {
      id: 6,
      nome: "Alessandra Maria Sales 16 check",
      idade: 46,
      historicoAulas: [],
    },
    {
      id: 7,
      nome: "Alexandre Buscher 12 Checkins",
      idade: 36,
      historicoAulas: [],
    },
    {
      id: 8,
      nome: "Alexandre Teixeira (drinho)",
      idade: 36,
      historicoAulas: [],
    },
  ]);

  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [novoAluno, setNovoAluno] = useState({
    nome: "",
    idade: "",
    lesao: "Não",
    objetivo: "",
    historicoAulas: [],
  });
  const [alunoHistorico, setAlunoHistorico] = useState(null);

  // Carregar alunos do localStorage ao montar o componente
  useEffect(() => {
    const alunosSalvos = localStorage.getItem("todosAlunos");
    if (alunosSalvos) {
      setAlunos(JSON.parse(alunosSalvos));
    }
  }, []);

  // Escutar por atualizações do histórico de aulas
  useEffect(() => {
    const handleHistoricoUpdate = (event) => {
      const { alunos: alunosAtualizados } = event.detail;
      setAlunos(alunosAtualizados);
    };

    window.addEventListener("atualizarHistoricoAlunos", handleHistoricoUpdate);

    return () => {
      window.removeEventListener(
        "atualizarHistoricoAlunos",
        handleHistoricoUpdate
      );
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNovoAluno({
      ...novoAluno,
      [name]: value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (novoAluno.nome.trim() === "" || !novoAluno.idade) return;

    const newId = Math.max(...alunos.map((a) => a.id), 0) + 1;
    const alunosAtualizados = [
      ...alunos,
      {
        id: newId,
        nome: novoAluno.nome,
        idade: parseInt(novoAluno.idade),
        lesao: novoAluno.lesao,
        objetivo: novoAluno.objetivo,
        historicoAulas: [],
      },
    ];

    setAlunos(alunosAtualizados);
    localStorage.setItem("todosAlunos", JSON.stringify(alunosAtualizados));

    // Disparar evento para atualizar outros componentes
    const event = new CustomEvent("atualizarHistoricoAlunos", {
      detail: { alunos: alunosAtualizados },
    });
    window.dispatchEvent(event);

    setNovoAluno({
      nome: "",
      idade: "",
      lesao: "Não",
      objetivo: "",
      historicoAulas: [],
    });

    setShowModal(false);
  };

  const handleDelete = (id) => {
    const alunosAtualizados = alunos.filter((a) => a.id !== id);
    setAlunos(alunosAtualizados);
    localStorage.setItem("todosAlunos", JSON.stringify(alunosAtualizados));

    // Disparar evento para atualizar outros componentes
    const event = new CustomEvent("atualizarHistoricoAlunos", {
      detail: { alunos: alunosAtualizados },
    });
    window.dispatchEvent(event);
  };

  const handleVerHistorico = (aluno) => {
    setAlunoHistorico(aluno);
  };

  const filteredItems = alunos.filter((item) =>
    item.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openModal = () => {
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  // Função para voltar à página anterior ou para o dashboard
  const voltarPagina = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      // Se não houver histórico, voltar para o dashboard
      const event = new CustomEvent("navegarPara", {
        detail: { secao: "geral" },
      });
      window.dispatchEvent(event);
    }
  };

  return (
    <div className="cadastro-container">
      <div className="voltar-container">
        <button className="btn-voltar" onClick={voltarPagina}>
          Voltar
        </button>
      </div>

      <h1>Aluno</h1>

      <div className="actions-container">
        <button className="btn-cadastrar" onClick={openModal}>
          Cadastrar
        </button>

        <div className="list-controls">
          <div className="show-entries">
            <span>Mostrar</span>
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
            >
              <option value={100}>100</option>
            </select>
          </div>

          <div className="search-box">
            <span>Buscar:</span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Idade</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {filteredItems.slice(0, itemsPerPage).map((item) => (
            <tr key={item.id}>
              <td>{item.nome}</td>
              <td>{item.idade}</td>
              <td className="actions">
                <div className="dropdown">
                  <button className="dropdown-btn">Ações ▼</button>
                  <div className="dropdown-content">
                    <button className="btn-editar">Editar</button>
                    <button
                      className="btn-excluir"
                      onClick={() => handleDelete(item.id)}
                    >
                      Excluir
                    </button>
                    <button
                      className="btn-historico"
                      onClick={() => handleVerHistorico(item)}
                    >
                      Ver Histórico
                    </button>
                  </div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-aluno">
            <div className="modal-header">
              <h2>Cadastrar Aluno</h2>
              <button className="close-btn" onClick={closeModal}>
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className="aluno-form">
              <div className="form-group">
                <label htmlFor="nome">Nome</label>
                <input
                  type="text"
                  id="nome"
                  name="nome"
                  value={novoAluno.nome}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="idade">Idade</label>
                <input
                  type="number"
                  id="idade"
                  name="idade"
                  value={novoAluno.idade}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="lesao">Tem alguma lesão?</label>
                <select
                  id="lesao"
                  name="lesao"
                  value={novoAluno.lesao}
                  onChange={handleChange}
                >
                  <option value="Não">Não</option>
                  <option value="Sim - Controlada">Sim - Controlada</option>
                  <option value="Sim - Em tratamento">
                    Sim - Em tratamento
                  </option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="objetivo">Objetivo</label>
                <textarea
                  id="objetivo"
                  name="objetivo"
                  value={novoAluno.objetivo}
                  onChange={handleChange}
                  rows="5"
                />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn-cancelar"
                  onClick={closeModal}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-salvar">
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de histórico */}
      {alunoHistorico && (
        <div className="modal-overlay">
          <div className="modal-aluno">
            <div className="modal-header">
              <h2>Histórico de Aulas - {alunoHistorico.nome}</h2>
              <button
                className="close-btn"
                onClick={() => setAlunoHistorico(null)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="aluno-info-resumo">
                <p>
                  <strong>Idade:</strong> {alunoHistorico.idade} anos
                </p>
                <p>
                  <strong>Total de aulas:</strong>{" "}
                  {alunoHistorico.historicoAulas?.length || 0}
                </p>
              </div>

              {alunoHistorico.historicoAulas?.length > 0 ? (
                <table className="tabela-historico">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...alunoHistorico.historicoAulas]
                      .sort((a, b) => {
                        // Ordenar por data (mais recente primeiro)
                        const dataA = new Date(
                          a.data.split("/").reverse().join("-")
                        );
                        const dataB = new Date(
                          b.data.split("/").reverse().join("-")
                        );
                        return dataB - dataA;
                      })
                      .map((aula) => (
                        <tr key={aula.id}>
                          <td>{aula.data}</td>
                          <td>{getStatusLabel(aula.status)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              ) : (
                <p className="sem-aulas">
                  Este aluno ainda não participou de nenhuma aula.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CadastroAluno;

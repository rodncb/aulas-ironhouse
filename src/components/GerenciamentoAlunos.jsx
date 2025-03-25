import React, { useState } from "react";
import "../styles/GerenciamentoAlunos.css";

const GerenciamentoAlunos = () => {
  const [showModal, setShowModal] = useState(false);
  const [alunos, setAlunos] = useState([
    { id: 1, nome: "Adriano Faria de Souza 12 check", idade: 43 },
    { id: 2, nome: "Adriano Laranjo 8 Checkins", idade: 37 },
    { id: 3, nome: "Adriano Silva 8 check", idade: 39 },
    { id: 4, nome: "Agnella Massara Premium", idade: 46 },
    { id: 5, nome: "Alessandra Cunha 16 Checkins", idade: 46 },
    { id: 6, nome: "Alessandra Maria Sales 16 check", idade: 46 },
    { id: 7, nome: "Alexandre Buscher 12 Checkins", idade: 36 },
    { id: 8, nome: "Alexandre Teixeira (drinho)", idade: 36 },
  ]);

  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [novoAluno, setNovoAluno] = useState({
    nome: "",
    idade: "",
    lesao: "Não",
    objetivo: "",
  });

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
    setAlunos([
      ...alunos,
      {
        id: newId,
        nome: novoAluno.nome,
        idade: parseInt(novoAluno.idade),
      },
    ]);

    setNovoAluno({
      nome: "",
      idade: "",
      lesao: "Não",
      objetivo: "",
    });

    setShowModal(false);
  };

  const handleDelete = (id) => {
    setAlunos(alunos.filter((a) => a.id !== id));
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

  return (
    <div className="alunos-principal-container">
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
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
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
    </div>
  );
};

export default GerenciamentoAlunos;

import React, { useState } from "react";
import "../styles/Cadastro.css";

const CadastroMusculatura = () => {
  const [musculaturas, setMusculaturas] = useState([
    { id: 1, nome: "Abdômen" },
    { id: 2, nome: "Anterior/ Posterior/ Glúteos" },
    { id: 3, nome: "Bíceps" },
    { id: 4, nome: "Cardio" },
    { id: 5, nome: "Corrida" },
    { id: 6, nome: "Costas" },
    { id: 7, nome: "Glúteos" },
    { id: 8, nome: "Glúteos/ Anterior/ Posterior/ Dorsal" },
    { id: 9, nome: "Glúteos/ Posterior" },
    { id: 10, nome: "Ombro" },
  ]);

  const [novaMusculatura, setNovaMusculatura] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [editando, setEditando] = useState(false);
  const [musculaturaEditando, setMusculaturaEditando] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (novaMusculatura.trim() === "") return;

    if (editando && musculaturaEditando) {
      const musculaturasAtualizadas = musculaturas.map((m) =>
        m.id === musculaturaEditando.id ? { ...m, nome: novaMusculatura } : m
      );
      setMusculaturas(musculaturasAtualizadas);
      setEditando(false);
      setMusculaturaEditando(null);
    } else {
      const newId = Math.max(...musculaturas.map((m) => m.id), 0) + 1;
      setMusculaturas([...musculaturas, { id: newId, nome: novaMusculatura }]);
    }

    setNovaMusculatura("");
  };

  const handleDelete = (id) => {
    setMusculaturas(musculaturas.filter((m) => m.id !== id));
  };

  const handleEdit = (item) => {
    setEditando(true);
    setMusculaturaEditando(item);
    setNovaMusculatura(item.nome);
  };

  const cancelarEdicao = () => {
    setEditando(false);
    setMusculaturaEditando(null);
    setNovaMusculatura("");
  };

  const filteredItems = musculaturas.filter((item) =>
    item.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="cadastro-container">
      <h1>Musculatura</h1>

      <form onSubmit={handleSubmit} className="cadastro-form">
        <div className="form-header">
          <button type="submit" className="btn-cadastrar">
            {editando ? "Salvar" : "Cadastrar"}
          </button>
          {editando && (
            <button
              type="button"
              className="btn-cancelar"
              onClick={cancelarEdicao}
            >
              Cancelar
            </button>
          )}
        </div>
        <input
          type="text"
          value={novaMusculatura}
          onChange={(e) => setNovaMusculatura(e.target.value)}
          placeholder="Nome da musculatura"
          required
        />
      </form>

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

      <table className="data-table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {filteredItems.slice(0, itemsPerPage).map((item) => (
            <tr key={item.id}>
              <td>{item.nome}</td>
              <td className="actions">
                <button
                  className="btn-excluir"
                  onClick={() => handleDelete(item.id)}
                >
                  Excluir
                </button>
                <button className="btn-editar" onClick={() => handleEdit(item)}>
                  Editar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CadastroMusculatura;

import React, { useState } from "react";
import "../styles/Cadastro.css";

const CadastroExercicio = () => {
  const [exercicios, setExercicios] = useState([
    { id: 1, nome: "AB Butterfly Sit up", musculatura: "Abdômen" },
    { id: 2, nome: "AB Remador", musculatura: "Abdômen" },
    { id: 3, nome: "Abdutora Elástico", musculatura: "Glúteos" },
    { id: 4, nome: "Abdução de ombro", musculatura: "Ombro" },
    { id: 5, nome: "Afundo", musculatura: "Perna Anterior" },
    {
      id: 6,
      nome: "Afundo c/ tronco inclinado",
      musculatura: "Perna Posterior",
    },
    { id: 7, nome: "Afundo Cruzado", musculatura: "Perna Anterior" },
    { id: 8, nome: "Agachamento", musculatura: "Perna Anterior" },
    { id: 9, nome: "Agachamento cruzado", musculatura: "Perna Anterior" },
    { id: 10, nome: "Arnold", musculatura: "Ombro" },
  ]);

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
    { id: 11, nome: "Perna Anterior" },
    { id: 12, nome: "Perna Posterior" },
  ]);

  const [novoExercicio, setNovoExercicio] = useState({
    nome: "",
    musculatura: "",
  });
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [editando, setEditando] = useState(false);
  const [exercicioEditando, setExercicioEditando] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNovoExercicio({
      ...novoExercicio,
      [name]: value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (novoExercicio.nome.trim() === "" || novoExercicio.musculatura === "")
      return;

    if (editando && exercicioEditando) {
      const exerciciosAtualizados = exercicios.map((ex) =>
        ex.id === exercicioEditando.id
          ? {
              ...ex,
              nome: novoExercicio.nome,
              musculatura: novoExercicio.musculatura,
            }
          : ex
      );
      setExercicios(exerciciosAtualizados);
      setEditando(false);
      setExercicioEditando(null);
    } else {
      const newId = Math.max(...exercicios.map((e) => e.id), 0) + 1;
      setExercicios([
        ...exercicios,
        {
          id: newId,
          nome: novoExercicio.nome,
          musculatura: novoExercicio.musculatura,
        },
      ]);
    }

    setNovoExercicio({
      nome: "",
      musculatura: "",
    });
  };

  const handleDelete = (id) => {
    setExercicios(exercicios.filter((e) => e.id !== id));
  };

  const handleEdit = (item) => {
    setEditando(true);
    setExercicioEditando(item);
    setNovoExercicio({
      nome: item.nome,
      musculatura: item.musculatura,
    });
  };

  const cancelarEdicao = () => {
    setEditando(false);
    setExercicioEditando(null);
    setNovoExercicio({
      nome: "",
      musculatura: "",
    });
  };

  const filteredItems = exercicios.filter((item) =>
    item.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="cadastro-container">
      <h1>Exercício</h1>

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
        <div className="form-fields">
          <input
            type="text"
            name="nome"
            value={novoExercicio.nome}
            onChange={handleChange}
            placeholder="Nome do exercício"
            required
          />
          <select
            name="musculatura"
            value={novoExercicio.musculatura}
            onChange={handleChange}
            required
          >
            <option value="">Selecione uma musculatura</option>
            {musculaturas.map((m) => (
              <option key={m.id} value={m.nome}>
                {m.nome}
              </option>
            ))}
          </select>
        </div>
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
            <th>Musculatura</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {filteredItems.slice(0, itemsPerPage).map((item) => (
            <tr key={item.id}>
              <td>{item.nome}</td>
              <td>{item.musculatura}</td>
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

export default CadastroExercicio;

import React, { useState, useEffect } from "react"; // Added useEffect
import exerciciosService from "../services/exercicios.service.js"; // Added service import
import "../styles/Cadastro.css";

const CadastroExercicio = () => {
  // Removed hardcoded exercicios, musculaturas, aparelhos initial state
  const [exercicios, setExercicios] = useState([]);
  const [musculaturas, setMusculaturas] = useState([]);
  // Kept aparelhos hardcoded for now, assuming they are static
  const [aparelhos] = useState([
    { id: 1, nome: "Livre" },
    { id: 2, nome: "Máquina" },
    { id: 3, nome: "Elástico" },
    { id: 4, nome: "Halter" },
    { id: 5, nome: "Barra" },
    { id: 6, nome: "Smith" },
    { id: 7, nome: "Corda" },
    { id: 8, nome: "TRX" },
  ]);

  const [novoExercicio, setNovoExercicio] = useState({
    nome: "",
    musculatura: "",
    aparelho: "", // Added aparelho field
  });
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [editando, setEditando] = useState(false);
  const [exercicioEditando, setExercicioEditando] = useState(null);
  const [loading, setLoading] = useState(false); // Added loading state
  const [error, setError] = useState(null); // Added error state

  // Fetch initial data from Supabase
  useEffect(() => {
    const carregarDados = async () => {
      setLoading(true);
      setError(null);
      try {
        // CORREÇÃO: Usar os nomes corretos das funções do serviço
        const [exerciciosData, musculaturasData] = await Promise.all([
          exerciciosService.getAll(), // Corrigido de getAllExercicios para getAll
          exerciciosService.getAllMusculaturas(), // Mantido, assumindo que existe e funciona
        ]);
        setExercicios(exerciciosData || []);
        // If musculaturasData is empty or function doesn't exist, derive from exercises
        if (musculaturasData && musculaturasData.length > 0) {
          // Assuming musculaturasData is an array of strings or objects with a 'nome' property
          // Adjust based on the actual structure returned by getAllMusculaturas
          if (typeof musculaturasData[0] === "string") {
            setMusculaturas(
              musculaturasData.map((m, index) => ({ id: index + 1, nome: m }))
            );
          } else {
            // Ensure unique IDs, fallback to index if needed
            const uniqueMusculaturas = musculaturasData.reduce((acc, m) => {
              if (!acc.find((existing) => existing.nome === m.nome)) {
                acc.push({
                  id: m.id || `${m.nome}-${acc.length}`,
                  nome: m.nome,
                }); // Use unique ID or generate one
              }
              return acc;
            }, []);
            setMusculaturas(uniqueMusculaturas);
          }
        } else if (exerciciosData) {
          const uniqueMusculaturas = [
            ...new Set(
              exerciciosData.map((ex) => ex.musculatura).filter(Boolean)
            ),
          ];
          setMusculaturas(
            uniqueMusculaturas.map((m, index) => ({ id: index + 1, nome: m }))
          );
        }
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
        setError("Falha ao carregar dados. Tente novamente.");
      } finally {
        setLoading(false);
      }
    };
    carregarDados();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNovoExercicio({
      ...novoExercicio,
      [name]: value,
    });
  };

  // handleSubmit needs to be updated to use exerciciosService.createExercicio
  // CORREÇÃO: Usar o nome correto da função do serviço (create)
  const handleSubmit = async (e) => {
    // Made async
    e.preventDefault();
    // Basic validation remains
    if (
      novoExercicio.nome.trim() === "" ||
      novoExercicio.musculatura === "" ||
      novoExercicio.aparelho === "" // Added aparelho validation
    ) {
      setError("Por favor, preencha todos os campos."); // Added user feedback
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Logic for creating a new exercise via service
      // CORREÇÃO: Usar o nome correto da função do serviço (create)
      const exercicioSalvo = await exerciciosService.create(novoExercicio);
      setExercicios([...exercicios, exercicioSalvo]); // Add the saved exercise to the list

      // Reset form after successful save/update
      setNovoExercicio({
        nome: "",
        musculatura: "",
        aparelho: "",
      });
    } catch (err) {
      console.error("Erro ao salvar exercício:", err);
      // More specific error handling based on potential service errors
      if (
        err.message &&
        err.message.includes("duplicate key value violates unique constraint")
      ) {
        setError(
          `Erro: Já existe um exercício com o nome "${novoExercicio.nome}".`
        );
      } else {
        setError(
          `Falha ao salvar exercício: ${err.message || "Erro desconhecido"}`
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // handleDelete needs to be updated to use exerciciosService.deleteExercicio
  // CORREÇÃO: Usar o nome correto da função do serviço (delete)
  const handleDelete = async (id) => {
    // Made async
    if (!window.confirm("Tem certeza que deseja excluir este exercício?")) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // CORREÇÃO: Usar o nome correto da função do serviço (delete)
      await exerciciosService.delete(id);
      setExercicios(exercicios.filter((e) => e.id !== id)); // Update UI after successful deletion
    } catch (err) {
      console.error("Erro ao excluir exercício:", err);
      setError(
        `Falha ao excluir exercício: ${err.message || "Erro desconhecido"}`
      );
    } finally {
      setLoading(false);
    }
  };

  // CORREÇÃO: Usar o nome correto da função do serviço (update)
  const handleSalvarEdicao = async (e) => {
    e.preventDefault();
    if (
      !exercicioEditando ||
      novoExercicio.nome.trim() === "" ||
      novoExercicio.musculatura === "" ||
      novoExercicio.aparelho === ""
    ) {
      setError("Por favor, preencha todos os campos.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const exercicioAtualizado = await exerciciosService.update(
        exercicioEditando.id,
        novoExercicio
      );
      setExercicios(
        exercicios.map((ex) =>
          ex.id === exercicioEditando.id ? exercicioAtualizado : ex
        )
      );
      cancelarEdicao(); // Resetar form e estado de edição
    } catch (err) {
      console.error("Erro ao atualizar exercício:", err);
      setError(
        `Falha ao atualizar exercício: ${err.message || "Erro desconhecido"}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setEditando(true);
    setExercicioEditando(item);
    // Ensure all fields, including 'aparelho', are populated for editing
    setNovoExercicio({
      nome: item.nome,
      musculatura: item.musculatura,
      aparelho: item.aparelho || "", // Populate aparelho field
    });
  };

  const cancelarEdicao = () => {
    setEditando(false);
    setExercicioEditando(null);
    // Reset all fields, including 'aparelho'
    setNovoExercicio({
      nome: "",
      musculatura: "",
      aparelho: "", // Reset aparelho field
    });
    setError(null); // Clear any previous errors
  };

  const filteredItems = exercicios.filter((item) =>
    item.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const [currentPage, setCurrentPage] = useState(1);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredItems.slice(startIndex, endIndex);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div className="cadastro-container">
      <h2>{editando ? "Editar Exercício" : "Cadastrar Novo Exercício"}</h2>

      {error && <div className="error-message">{error}</div>}
      {loading && <div className="loading-message">Carregando...</div>}

      <form
        // CORREÇÃO: Usar a função correta para salvar edição
        onSubmit={editando ? handleSalvarEdicao : handleSubmit}
        className="cadastro-form"
      >
        <div className="form-group">
          <label htmlFor="nome">Nome do Exercício:</label>
          <input
            type="text"
            id="nome"
            name="nome"
            value={novoExercicio.nome}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="musculatura">Musculatura:</label>
          <select
            id="musculatura"
            name="musculatura"
            value={novoExercicio.musculatura}
            onChange={handleChange}
            required
          >
            <option value="">Selecione a musculatura</option>
            {musculaturas.map((musc) => (
              <option key={musc.id || musc.nome} value={musc.nome}>
                {musc.nome}
              </option>
            ))}
          </select>
        </div>
        {/* Adicionar campo Aparelho */}
        <div className="form-group">
          <label htmlFor="aparelho">Aparelho:</label>
          <select
            id="aparelho"
            name="aparelho"
            value={novoExercicio.aparelho}
            onChange={handleChange}
            required
          >
            <option value="">Selecione o aparelho</option>
            {aparelhos.map((ap) => (
              <option key={ap.id} value={ap.nome}>
                {ap.nome}
              </option>
            ))}
          </select>
        </div>
        <div className="form-actions">
          <button type="submit" disabled={loading}>
            {editando ? "Salvar Alterações" : "Adicionar Exercício"}
          </button>
          {editando && (
            <button type="button" onClick={cancelarEdicao} disabled={loading}>
              Cancelar Edição
            </button>
          )}
        </div>
      </form>

      <div className="list-controls">
        <input
          type="text"
          placeholder="Buscar exercício..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <select
          value={itemsPerPage}
          onChange={(e) => setItemsPerPage(Number(e.target.value))}
          className="items-per-page-select"
        >
          <option value={5}>5 por página</option>
          <option value={10}>10 por página</option>
          <option value={20}>20 por página</option>
        </select>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Musculatura</th>
            <th>Aparelho</th> {/* Coluna Aparelho adicionada */}
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {currentItems.map((exercicio) => (
            <tr key={exercicio.id}>
              <td>{exercicio.nome}</td>
              <td>{exercicio.musculatura}</td>
              <td>{exercicio.aparelho || "N/A"}</td> {/* Exibir aparelho */}
              <td>
                <button
                  onClick={() => handleEdit(exercicio)}
                  className="btn-editar"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(exercicio.id)}
                  className="btn-excluir"
                >
                  Excluir
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Paginação */}
      <div className="pagination">
        {Array.from({ length: totalPages }, (_, index) => (
          <button
            key={index + 1}
            onClick={() => handlePageChange(index + 1)}
            className={currentPage === index + 1 ? "active" : ""}
          >
            {index + 1}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CadastroExercicio;

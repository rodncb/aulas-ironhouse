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
        const [exerciciosData, musculaturasData] = await Promise.all([
          exerciciosService.getAllExercicios(),
          // Assuming a function exists to get musculaturas, otherwise fetch from exercicios
          // If no dedicated function, might need to derive from exerciciosData
          exerciciosService.getAllMusculaturas ? exerciciosService.getAllMusculaturas() : [],
        ]);
        setExercicios(exerciciosData || []);
        // If musculaturasData is empty or function doesn't exist, derive from exercises
        if (musculaturasData && musculaturasData.length > 0) {
             // Assuming musculaturasData is an array of strings or objects with a 'nome' property
             // Adjust based on the actual structure returned by getAllMusculaturas
             if (typeof musculaturasData[0] === 'string') {
                setMusculaturas(musculaturasData.map((m, index) => ({ id: index + 1, nome: m })));
             } else {
                 // Ensure unique IDs, fallback to index if needed
                 const uniqueMusculaturas = musculaturasData.reduce((acc, m) => {
                    if (!acc.find(existing => existing.nome === m.nome)) {
                        acc.push({ id: m.id || `${m.nome}-${acc.length}`, nome: m.nome }); // Use unique ID or generate one
                    }
                    return acc;
                 }, []);
                 setMusculaturas(uniqueMusculaturas);
             }
        } else if (exerciciosData) {
             const uniqueMusculaturas = [...new Set(exerciciosData.map(ex => ex.musculatura).filter(Boolean))];
             setMusculaturas(uniqueMusculaturas.map((m, index) => ({ id: index + 1, nome: m })));
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
  const handleSubmit = async (e) => { // Made async
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
        let exercicioSalvo; // Declare outside the blocks
        if (editando && exercicioEditando) {
            // Logic for updating an existing exercise via service
            exercicioSalvo = await exerciciosService.updateExercicio(exercicioEditando.id, novoExercicio);
             setExercicios(exercicios.map((ex) =>
                ex.id === exercicioEditando.id ? exercicioSalvo : ex
             ));
             setEditando(false);
             setExercicioEditando(null);
             console.log("Exercício atualizado:", exercicioSalvo);
        } else {
            // Logic for creating a new exercise via service
            exercicioSalvo = await exerciciosService.createExercicio(novoExercicio);
            setExercicios([...exercicios, exercicioSalvo]); // Add the saved exercise to the list
            console.log("Exercício salvo:", exercicioSalvo);
        }
         // Reset form after successful save/update
         setNovoExercicio({
            nome: "",
            musculatura: "",
            aparelho: "",
         });
    } catch (err) {
        console.error("Erro ao salvar exercício:", err);
        // More specific error handling based on potential service errors
        if (err.message && err.message.includes("duplicate key value violates unique constraint")) {
             setError(`Erro: Já existe um exercício com o nome "${novoExercicio.nome}".`);
        } else {
             setError(`Falha ao salvar exercício: ${err.message || "Erro desconhecido"}`);
        }
    } finally {
        setLoading(false);
    }
  };


  // handleDelete needs to be updated to use exerciciosService.deleteExercicio
   const handleDelete = async (id) => { // Made async
     if (!window.confirm("Tem certeza que deseja excluir este exercício?")) {
       return;
     }
     setLoading(true);
     setError(null);
     try {
       await exerciciosService.deleteExercicio(id);
       setExercicios(exercicios.filter((e) => e.id !== id)); // Update UI after successful deletion
     } catch (err) {
       console.error("Erro ao excluir exercício:", err);
       setError(`Falha ao excluir exercício: ${err.message || "Erro desconhecido"}`);
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

  return (
    <div className="cadastro-container">
      <h1>Exercício</h1>

       {/* Display loading and error messages */}
       {loading && <div className="loading-indicator">Carregando/Salvando...</div>}
       {error && <div className="error-message">{error}</div>}


      <form onSubmit={handleSubmit} className="cadastro-form">
        <div className="form-header">
          {/* Disable button while loading */}
          <button type="submit" className="btn-cadastrar" disabled={loading}>
            {loading ? "Salvando..." : editando ? "Salvar" : "Cadastrar"}
          </button>
          {editando && (
            <button
              type="button"
              className="btn-cancelar"
              onClick={cancelarEdicao}
              disabled={loading} // Disable cancel while loading
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
            disabled={loading} // Disable input while loading
          />
          <select
            name="musculatura"
            value={novoExercicio.musculatura}
            onChange={handleChange}
            required
            disabled={loading} // Disable select while loading
          >
            <option value="">Selecione uma musculatura</option>
            {/* Ensure musculaturas are loaded before rendering options */}
            {musculaturas && musculaturas.map((m) => (
              // Use a unique and stable key, preferably m.id if available and unique
              <option key={m.id || m.nome} value={m.nome}>
                {m.nome}
              </option>
            ))}
          </select>
           {/* Added Aparelho select dropdown */}
           <select
             name="aparelho"
             value={novoExercicio.aparelho}
             onChange={handleChange}
             required
             disabled={loading} // Disable select while loading
           >
             <option value="">Selecione um aparelho</option>
             {aparelhos.map((a) => (
               <option key={a.id} value={a.nome}>
                 {a.nome}
               </option>
             ))}
           </select>

        </div>
      </form>

      {/* List controls remain the same */}
      <div className="list-controls">
        <div className="show-entries">
          <span>Mostrar</span>
          <select
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
          >
            <option value={10}>10</option>
            {/* Corrigido: 25 em vez de 25 */}
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

       {/* Display loading indicator for the table */}
       {loading && !exercicios.length && <div className="loading-indicator">Carregando exercícios...</div>}


      <table className="data-table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Musculatura</th>
            <th>Aparelho</th> {/* Added Aparelho column header */}
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
           {/* Display message if no exercises found */}
           {!loading && !filteredItems.length && (
             <tr>
               <td colSpan="4">Nenhum exercício encontrado.</td>
             </tr>
           )}
          {filteredItems.slice(0, itemsPerPage).map((item) => (
            <tr key={item.id}>
              <td>{item.nome}</td>
              <td>{item.musculatura}</td>
              <td>{item.aparelho || "-"}</td> {/* Added Aparelho data cell */}
              <td className="actions">
                {/* Disable buttons while loading */}
                <button
                  className="btn-excluir"
                  onClick={() => handleDelete(item.id)}
                  disabled={loading}
                >
                  Excluir
                </button>
                <button
                   className="btn-editar"
                   onClick={() => handleEdit(item)}
                   disabled={loading}
                 >
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

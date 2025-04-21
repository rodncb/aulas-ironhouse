import React, { useState, useEffect } from "react";
import "../styles/Cadastro.css";
import "../styles/CadastroAluno.css";
import "../styles/Modal.css";
import { voltarPagina, getStatusLabel } from "../lib/utils"; // Importar funções utilitárias
import alunosService from "../services/alunos.service"; // Importar serviço de alunos

const CadastroAluno = () => {
  const [showModal, setShowModal] = useState(false);
  const [alunos, setAlunos] = useState([]);
  const [loading, setLoading] = useState(true); // Estado para controlar carregamento
  const [error, setError] = useState(null); // Estado para controlar erros

  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [novoAluno, setNovoAluno] = useState({
    nome: "",
    idade: "",
    lesao: "Não",
    tipoLesao: "",
    objetivo: "",
    plano: "8 Check-in", // Valor padrão para o novo campo de plano
    nivel: "Iniciante", // Valor padrão para o novo campo de nível
    observacoes: "", // Campo adicionado para observações
  });
  const [alunoHistorico, setAlunoHistorico] = useState(null);

  // Carregar alunos do Supabase ao montar o componente
  useEffect(() => {
    const fetchAlunos = async () => {
      try {
        setLoading(true);
        const alunosData = await alunosService.getAll();
        setAlunos(alunosData);
        setError(null);
      } catch (err) {
        console.error("Erro ao carregar alunos:", err);
        setError("Não foi possível carregar os alunos. Tente novamente.");
      } finally {
        setLoading(false);
      }
    };

    fetchAlunos();

    // Código antigo usando localStorage
    // const alunosSalvos = localStorage.getItem("todosAlunos");
    // if (alunosSalvos) {
    //   setAlunos(JSON.parse(alunosSalvos));
    // }
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (novoAluno.nome.trim() === "" || !novoAluno.idade) return;

    try {
      setLoading(true);

      // Criar novo aluno no Supabase
      const novoAlunoData = {
        nome: novoAluno.nome,
        idade: parseInt(novoAluno.idade),
        lesao: novoAluno.lesao,
        tipoLesao: novoAluno.tipoLesao,
        objetivo: novoAluno.objetivo,
        plano: novoAluno.plano,
        nivel: novoAluno.nivel,
        observacoes: novoAluno.observacoes, // Incluir observações
      };

      const alunoSalvo = await alunosService.createAluno(novoAlunoData);

      // Atualizar o estado local com o novo aluno retornado pelo Supabase
      const alunosAtualizados = [...alunos, alunoSalvo];
      setAlunos(alunosAtualizados);

      // Código antigo usando localStorage
      // const newId = Math.max(...alunos.map((a) => a.id), 0) + 1;
      // const alunosAtualizados = [
      //   ...alunos,
      //   {
      //     id: newId,
      //     nome: novoAluno.nome,
      //     idade: parseInt(novoAluno.idade),
      //     lesao: novoAluno.lesao,
      //     tipoLesao: novoAluno.tipoLesao,
      //     objetivo: novoAluno.objetivo,
      //     plano: novoAluno.plano,
      //     nivel: novoAluno.nivel,
      //     historicoAulas: [],
      //   },
      // ];
      // setAlunos(alunosAtualizados);
      // localStorage.setItem("todosAlunos", JSON.stringify(alunosAtualizados));

      // Disparar evento para atualizar outros componentes
      const event = new CustomEvent("atualizarHistoricoAlunos", {
        detail: { alunos: alunosAtualizados },
      });
      window.dispatchEvent(event);

      setNovoAluno({
        nome: "",
        idade: "",
        lesao: "Não",
        tipoLesao: "",
        objetivo: "",
        plano: "8 Check-in",
        nivel: "Iniciante",
        observacoes: "", // Resetar observações
      });

      setShowModal(false);
      setError(null);
    } catch (err) {
      console.error("Erro ao adicionar aluno:", err);
      setError("Não foi possível adicionar o aluno. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);

      // Excluir aluno no Supabase
      await alunosService.deleteAluno(id);

      // Atualizar estado local
      const alunosAtualizados = alunos.filter((a) => a.id !== id);
      setAlunos(alunosAtualizados);

      // Código antigo usando localStorage
      // const alunosAtualizados = alunos.filter((a) => a.id !== id);
      // setAlunos(alunosAtualizados);
      // localStorage.setItem("todosAlunos", JSON.stringify(alunosAtualizados));

      // Disparar evento para atualizar outros componentes
      const event = new CustomEvent("atualizarHistoricoAlunos", {
        detail: { alunos: alunosAtualizados },
      });
      window.dispatchEvent(event);

      setError(null);
    } catch (err) {
      console.error("Erro ao excluir aluno:", err);
      setError("Não foi possível excluir o aluno. Tente novamente.");
    } finally {
      setLoading(false);
    }
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
      {/* Exibir mensagem de erro, se houver */}
      {error && <div className="error-message">{error}</div>}

      {/* Exibir indicador de carregamento */}
      {loading && <div className="loading-indicator">Carregando...</div>}

      <div className="voltar-container">
        <button className="btn-voltar" onClick={voltarPagina}>
          Voltar
        </button>
      </div>

      <h1>Aluno</h1>

      <div className="actions-container">
        <button
          className="btn-cadastrar"
          onClick={openModal}
          disabled={loading}
        >
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
                      disabled={loading}
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
                  <option value="Sim - Lesao Moderada">
                    Sim - Lesão Moderada
                  </option>
                  <option value="Sim - Lesao Grave">Sim - Lesão Grave</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="tipoLesao">Tipo de Lesão</label>
                <input
                  type="text"
                  id="tipoLesao"
                  name="tipoLesao"
                  value={novoAluno.tipoLesao}
                  onChange={handleChange}
                />
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

              <div className="form-group">
                <label htmlFor="plano">Plano</label>
                <select
                  id="plano"
                  name="plano"
                  value={novoAluno.plano}
                  onChange={handleChange}
                >
                  <option value="8 Check-in">8 Check-in</option>
                  <option value="12 Check-in">12 Check-in</option>
                  <option value="16 Check-in">16 Check-in</option>
                  <option value="Premium">Premium</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="nivel">Nível</label>
                <select
                  id="nivel"
                  name="nivel"
                  value={novoAluno.nivel}
                  onChange={handleChange}
                >
                  <option value="Iniciante">Iniciante</option>
                  <option value="Intermediário">Intermediário</option>
                  <option value="Avançado">Avançado</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="observacoes">Observações</label>
                <textarea
                  id="observacoes"
                  name="observacoes"
                  value={novoAluno.observacoes}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Observações adicionais sobre o aluno..."
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

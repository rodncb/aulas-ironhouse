import React, { useState, useEffect, useRef } from "react";
import "../styles/GerenciamentoProfessores.css";
import { voltarPagina, getStatusLabel } from "../lib/utils"; // Importar funções utilitárias
import professoresService from "../services/professores.service"; // Importação do serviço de professores
import { aulasService } from "../services/aulas.service"; // Importação do serviço de aulas

const GerenciamentoProfessores = (props) => {
  const [showModal, setShowModal] = useState(false);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [professorEditando, setProfessorEditando] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [professores, setProfessores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [itemsPerPage, setItemsPerPage] = useState(100);
  const [searchTerm, setSearchTerm] = useState("");
  const [novoProfessor, setNovoProfessor] = useState({
    nome: "",
    idade: "",
    especialidade: "",
    experiencia: "",
    formacao: "",
  });
  const [professorHistorico, setProfessorHistorico] = useState(null);

  // Estado para o modal de detalhes da aula
  const [aulaDetalhes, setAulaDetalhes] = useState(null);
  const [showAulaDetalhes, setShowAulaDetalhes] = useState(false);
  const [historicoAulas, setHistoricoAulas] = useState([]);

  // Referência para o dropdown
  const dropdownRef = useRef({});

  // Carregar professores do serviço ao montar o componente
  useEffect(() => {
    carregarProfessores();
  }, []);

  // Função para carregar os professores
  const carregarProfessores = async () => {
    try {
      setLoading(true);
      const data = await professoresService.getAll();
      setProfessores(data);
    } catch (err) {
      setError("Erro ao carregar professores: " + err.message);
      console.error("Erro ao carregar professores:", err);
    } finally {
      setLoading(false);
    }
  };

  // Carregar histórico de aulas
  useEffect(() => {
    carregarHistoricoAulas();
  }, []);

  // Função para carregar o histórico de aulas
  const carregarHistoricoAulas = async () => {
    try {
      const aulas = await aulasService.getAllAulas();
      setHistoricoAulas(aulas);
    } catch (err) {
      console.error("Erro ao carregar histórico de aulas:", err);
    }
  };

  // Adicionar useEffect para fechar o dropdown quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Se temos um dropdown ativo e o clique não foi dentro do dropdown atual ou no botão
      if (
        activeDropdown !== null &&
        dropdownRef.current[activeDropdown] &&
        !dropdownRef.current[activeDropdown].contains(event.target)
      ) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [activeDropdown]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNovoProfessor({
      ...novoProfessor,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (novoProfessor.nome.trim() === "" || !novoProfessor.idade) return;

    if (modoEdicao && professorEditando) {
      // Modo de edição - atualizar professor existente
      const professorAtualizado = {
        ...professorEditando,
        nome: novoProfessor.nome,
        idade: parseInt(novoProfessor.idade),
        especialidade: novoProfessor.especialidade,
        experiencia: novoProfessor.experiencia,
        formacao: novoProfessor.formacao,
      };

      try {
        await professoresService.update(
          professorEditando.id,
          professorAtualizado
        );
        const professoresAtualizados = professores.map((professor) =>
          professor.id === professorEditando.id
            ? professorAtualizado
            : professor
        );
        setProfessores(professoresAtualizados);
      } catch (err) {
        setError("Erro ao atualizar professor: " + err.message);
        console.error("Erro ao atualizar professor:", err);
      }
    } else {
      // Modo de cadastro - criar novo professor
      const novoProfessorCompleto = {
        nome: novoProfessor.nome,
        idade: parseInt(novoProfessor.idade),
        especialidade: novoProfessor.especialidade,
        experiencia: novoProfessor.experiencia,
        formacao: novoProfessor.formacao,
        historicoAulas: [],
      };

      try {
        const professorCriado = await professoresService.create(
          novoProfessorCompleto
        );
        const professoresAtualizados = [...professores, professorCriado];
        setProfessores(professoresAtualizados);
      } catch (err) {
        setError("Erro ao criar professor: " + err.message);
        console.error("Erro ao criar professor:", err);
      }
    }

    // Resetar formulário e fechar modal
    setNovoProfessor({
      nome: "",
      idade: "",
      especialidade: "",
      experiencia: "",
      formacao: "",
    });
    setModoEdicao(false);
    setProfessorEditando(null);
    setShowModal(false);
  };

  const handleDelete = async (id) => {
    try {
      await professoresService.remove(id);
      const professoresAtualizados = professores.filter((p) => p.id !== id);
      setProfessores(professoresAtualizados);
    } catch (err) {
      setError("Erro ao excluir professor: " + err.message);
      console.error("Erro ao excluir professor:", err);
    }

    setActiveDropdown(null); // Fecha o dropdown após excluir
  };

  const handleVerHistorico = (professor) => {
    setProfessorHistorico(professor);
    setActiveDropdown(null); // Fecha o dropdown ao abrir o modal
  };

  // Função para abrir o modal de detalhes da aula
  const verDetalhesAula = (aulaId) => {
    // Buscar a aula completa no histórico geral
    const aulaCompleta = historicoAulas.find((aula) => aula.id === aulaId);
    if (aulaCompleta) {
      setAulaDetalhes(aulaCompleta);
      setShowAulaDetalhes(true);
      setActiveDropdown(null); // Fecha o dropdown ao abrir o modal
    } else {
      alert("Detalhes da aula não encontrados.");
    }
  };

  // Função para fechar o modal de detalhes
  const fecharDetalhesAula = () => {
    setShowAulaDetalhes(false);
    setAulaDetalhes(null);
  };

  const filteredItems = professores.filter((item) =>
    item.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (professor) => {
    setNovoProfessor({
      nome: professor.nome,
      idade: professor.idade.toString(),
      especialidade: professor.especialidade || "",
      experiencia: professor.experiencia || "",
      formacao: professor.formacao || "",
    });
    setProfessorEditando(professor);
    setModoEdicao(true);
    setShowModal(true);
    setActiveDropdown(null); // Fecha o dropdown ao abrir o modal
  };

  const openModal = () => {
    setNovoProfessor({
      nome: "",
      idade: "",
      especialidade: "",
      experiencia: "",
      formacao: "",
    });
    setModoEdicao(false);
    setProfessorEditando(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModoEdicao(false);
    setProfessorEditando(null);
  };

  // Função para controlar o dropdown em dispositivos móveis
  const toggleDropdown = (id, event) => {
    // Impedir propagação para evitar que o documento receba o evento
    event.stopPropagation();

    if (activeDropdown === id) {
      setActiveDropdown(null);
    } else {
      // Se houver algum dropdown ativo, feche-o primeiro
      if (activeDropdown !== null) {
        setActiveDropdown(null);
      }
      // Depois de um pequeno intervalo, abra o novo
      setTimeout(() => {
        setActiveDropdown(id);
      }, 10);
    }
  };

  // Fechar dropdown quando clicar fora dele
  const closeDropdown = (e) => {
    if (e) e.stopPropagation();
    setActiveDropdown(null);
  };

  // Função para voltar para a página geral
  const voltarParaGeral = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      const event = new CustomEvent("navegarPara", {
        detail: { secao: "geral" },
      });
      window.dispatchEvent(event);
    }
  };

  return (
    <div className="professores-principal-container">
      {/* Botão voltar estilo Apple */}
      <div className="apple-back-button-container">
        <button className="apple-back-button" onClick={voltarParaGeral}>
          <span className="apple-back-arrow">←</span> Voltar
        </button>
      </div>

      <h1>Professores</h1>

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
            <th>Especialidade</th>
            <th>Experiência</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {filteredItems.slice(0, itemsPerPage).map((item) => (
            <tr key={item.id}>
              <td>{item.nome}</td>
              <td>{item.idade}</td>
              <td>{item.especialidade}</td>
              <td>{item.experiencia}</td>
              <td className="actions">
                <button className="btn-editar" onClick={() => handleEdit(item)}>
                  Editar
                </button>
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
                  Histórico
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Adicionar event listener para fechar dropdown quando clicar em qualquer lugar */}
      {activeDropdown !== null && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            zIndex: 999,
          }}
          onClick={closeDropdown}
        />
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-professor">
            <div className="modal-header">
              <h2>{modoEdicao ? "Editar Professor" : "Cadastrar Professor"}</h2>
              <button className="close-btn" onClick={closeModal}>
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className="professor-form">
              <div className="form-group">
                <label htmlFor="nome">Nome</label>
                <input
                  type="text"
                  id="nome"
                  name="nome"
                  value={novoProfessor.nome}
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
                  value={novoProfessor.idade}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="especialidade">Especialidade</label>
                <input
                  type="text"
                  id="especialidade"
                  name="especialidade"
                  value={novoProfessor.especialidade}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="experiencia">Experiência</label>
                <input
                  type="text"
                  id="experiencia"
                  name="experiencia"
                  value={novoProfessor.experiencia}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="formacao">Formação</label>
                <textarea
                  id="formacao"
                  name="formacao"
                  value={novoProfessor.formacao}
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
      {professorHistorico && (
        <div className="modal-overlay">
          <div className="modal-professor">
            <div className="modal-header">
              <h2>Histórico de Aulas - {professorHistorico.nome}</h2>
              <button
                className="close-btn"
                onClick={() => {
                  setProfessorHistorico(null);
                  setActiveDropdown(null); // Garantir que dropdown está fechado
                }}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="professor-info-resumo">
                <p>
                  <strong>Idade:</strong> {professorHistorico.idade} anos
                </p>
                <p>
                  <strong>Especialidade:</strong>{" "}
                  {professorHistorico.especialidade}
                </p>
                <p>
                  <strong>Experiência:</strong> {professorHistorico.experiencia}
                </p>
                <p>
                  <strong>Total de aulas:</strong>{" "}
                  {professorHistorico.historicoAulas?.length || 0}
                </p>
              </div>

              {professorHistorico.historicoAulas?.length > 0 ? (
                <table className="tabela-historico">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Status</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...professorHistorico.historicoAulas]
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
                          <td>
                            <button
                              className="btn-detalhes"
                              onClick={() => verDetalhesAula(aula.id)}
                            >
                              Ver
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              ) : (
                <p className="sem-aulas">
                  Este professor ainda não ministrou nenhuma aula.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de detalhes da aula */}
      {showAulaDetalhes && aulaDetalhes && (
        <div className="modal-overlay">
          <div className="modal-professor">
            <div className="modal-header">
              <h2>Detalhes da Aula</h2>
              <button
                className="close-btn"
                onClick={() => {
                  fecharDetalhesAula();
                  setActiveDropdown(null); // Garantir que dropdown está fechado
                }}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="aula-info-detalhes">
                <p>
                  <strong>Data:</strong> {aulaDetalhes.data}
                </p>
                <p>
                  <strong>Status:</strong>{" "}
                  {aulaDetalhes.status === "realizada"
                    ? "Aula Realizada"
                    : aulaDetalhes.status === "cancelada"
                    ? "Aula Cancelada"
                    : "Aula Atual"}
                </p>
                <p>
                  <strong>Total de alunos:</strong> {aulaDetalhes.totalAlunos}
                </p>

                <h3>Alunos Presentes:</h3>
                <ul className="lista-alunos-detalhes">
                  {aulaDetalhes.alunos.map((aluno) => (
                    <li key={aluno.id} className="aluno-detalhe-item">
                      <p className="aluno-detalhe-nome">{aluno.nome}</p>
                      <p className="aluno-detalhe-idade">
                        Idade: {aluno.idade}
                      </p>
                    </li>
                  ))}
                </ul>

                {aulaDetalhes.professor && (
                  <>
                    <h3>Professor Responsável:</h3>
                    <div className="professor-detalhe-item">
                      <p className="professor-detalhe-nome">
                        {aulaDetalhes.professor.nome}
                      </p>
                      <p className="professor-detalhe-especialidade">
                        Especialidade: {aulaDetalhes.professor.especialidade}
                      </p>
                    </div>
                  </>
                )}

                {/* Exibir exercícios realizados, se houver */}
                {aulaDetalhes.exercicios &&
                  aulaDetalhes.exercicios.length > 0 && (
                    <>
                      <h3>Exercícios Realizados:</h3>
                      <div className="exercicios-detalhes">
                        {aulaDetalhes.exercicios.map((exercicio) => (
                          <div
                            key={exercicio.id}
                            className="exercicio-detalhe-item"
                          >
                            <p className="exercicio-detalhe-nome">
                              {exercicio.nome}
                            </p>
                            <p className="exercicio-detalhe-musculatura">
                              Musculatura: {exercicio.musculatura}
                            </p>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GerenciamentoProfessores;

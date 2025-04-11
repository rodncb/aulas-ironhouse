import React, { useState, useEffect } from "react";
import "../styles/GerenciamentoAlunos.css";
import { FaEye, FaEdit, FaTrash } from "react-icons/fa";

const GerenciamentoAlunos = (props) => {
  const [showModal, setShowModal] = useState(false);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [alunoEditando, setAlunoEditando] = useState(null);
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

  const [itemsPerPage, setItemsPerPage] = useState(100);
  const [searchTerm, setSearchTerm] = useState("");
  const [novoAluno, setNovoAluno] = useState({
    nome: "",
    idade: "",
    lesao: "Não",
    objetivo: "",
  });
  const [alunoHistorico, setAlunoHistorico] = useState(null);

  // Estado para o modal de detalhes da aula
  const [aulaDetalhes, setAulaDetalhes] = useState(null);
  const [showAulaDetalhes, setShowAulaDetalhes] = useState(false);
  const [historicoAulas, setHistoricoAulas] = useState([]);

  // Carregar alunos do localStorage ao montar o componente
  useEffect(() => {
    // Recuperar dados do localStorage quando o componente for montado
    const alunosSalvos = localStorage.getItem("alunos");
    if (alunosSalvos) {
      try {
        const alunosRecuperados = JSON.parse(alunosSalvos);
        setAlunos(alunosRecuperados);
      } catch (error) {
        // Ignorar erro silenciosamente
      }
    } else {
      // Se não houver dados no localStorage, inicializar com valores padrão
      const alunosIniciais = [
        {
          id: 1,
          nome: "Adriano Faria de Souza",
          idade: 43,
          historicoAulas: [],
        },
        { id: 2, nome: "Adriano Laranjo", idade: 37, historicoAulas: [] },
        { id: 3, nome: "Adriano Silva", idade: 39, historicoAulas: [] },
        { id: 4, nome: "Agnella Massara", idade: 46, historicoAulas: [] },
        { id: 5, nome: "Alessandra Cunha", idade: 46, historicoAulas: [] },
        {
          id: 6,
          nome: "Alessandra Maria Sales",
          idade: 46,
          historicoAulas: [],
        },
        { id: 7, nome: "Alexandre Buscher", idade: 36, historicoAulas: [] },
        { id: 8, nome: "Alexandre Teixeira", idade: 36, historicoAulas: [] },
        { id: 9, nome: "Vitor", idade: 25, historicoAulas: [] },
      ];
      setAlunos(alunosIniciais);
      localStorage.setItem("alunos", JSON.stringify(alunosIniciais));
    }

    // Carregar histórico de aulas
    carregarHistoricoAulas();

    // Adicionar listener para atualizações do histórico de aulas
    const handleHistoricoAulasUpdate = (event) => {
      if (event.detail && event.detail.historicoAulas) {
        setHistoricoAulas(event.detail.historicoAulas);
        // Atualizar também os alunos com os dados atualizados do histórico
        const alunosSalvos = localStorage.getItem("alunos");
        if (alunosSalvos) {
          setAlunos(JSON.parse(alunosSalvos));
        }
      }
    };

    // Adicionar listener para atualizações da lista de alunos
    const handleAlunosUpdate = (event) => {
      if (event.detail && event.detail.alunos) {
        setAlunos(event.detail.alunos);
        // Recarregar histórico quando os alunos forem atualizados
        carregarHistoricoAulas();
      }
    };

    window.addEventListener(
      "atualizarHistoricoAulas",
      handleHistoricoAulasUpdate
    );
    window.addEventListener("atualizarHistoricoAlunos", handleAlunosUpdate);

    return () => {
      window.removeEventListener(
        "atualizarHistoricoAulas",
        handleHistoricoAulasUpdate
      );
      window.removeEventListener(
        "atualizarHistoricoAlunos",
        handleAlunosUpdate
      );
    };
  }, []);

  // Função para carregar histórico de aulas do localStorage
  const carregarHistoricoAulas = () => {
    const historicoSalvo = localStorage.getItem("historicoAulas");
    if (historicoSalvo) {
      const aulas = JSON.parse(historicoSalvo);
      setHistoricoAulas(aulas);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNovoAluno({
      ...novoAluno,
      [name]: value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (novoAluno.nome.trim() === "" || !novoAluno.idade) {
      alert("Preencha todos os campos obrigatórios");
      return;
    }

    if (modoEdicao && alunoEditando) {
      // Atualizar aluno existente
      const alunosAtualizados = alunos.map((a) =>
        a.id === alunoEditando.id
          ? {
              ...a,
              nome: novoAluno.nome,
              idade: parseInt(novoAluno.idade),
              lesao: novoAluno.lesao,
              objetivo: novoAluno.objetivo,
            }
          : a
      );

      setAlunos(alunosAtualizados);
      localStorage.setItem("alunos", JSON.stringify(alunosAtualizados));

      // Disparar evento para atualizar outros componentes
      const event = new CustomEvent("atualizarHistoricoAlunos", {
        detail: { alunos: alunosAtualizados },
      });
      window.dispatchEvent(event);

      // Limpar o estado de edição
      setModoEdicao(false);
      setAlunoEditando(null);
    } else {
      // Criar novo aluno
      const newId = Math.max(...alunos.map((a) => a.id), 0) + 1;
      const novoAlunoCompleto = {
        id: newId,
        nome: novoAluno.nome,
        idade: parseInt(novoAluno.idade),
        lesao: novoAluno.lesao || "Não",
        objetivo: novoAluno.objetivo || "",
        historicoAulas: [],
      };

      const alunosAtualizados = [...alunos, novoAlunoCompleto];
      setAlunos(alunosAtualizados);
      localStorage.setItem("alunos", JSON.stringify(alunosAtualizados));

      // Disparar evento para atualizar outros componentes
      const event = new CustomEvent("atualizarHistoricoAlunos", {
        detail: { alunos: alunosAtualizados },
      });
      window.dispatchEvent(event);
    }

    // Resetar formulário e fechar modal
    setNovoAluno({
      nome: "",
      idade: "",
      lesao: "Não",
      objetivo: "",
    });
    setModoEdicao(false);
    setAlunoEditando(null);
    setShowModal(false);
  };

  const handleDelete = (id) => {
    const alunosAtualizados = alunos.filter((a) => a.id !== id);
    setAlunos(alunosAtualizados);
    localStorage.setItem("alunos", JSON.stringify(alunosAtualizados));

    // Disparar evento para atualizar outros componentes
    const event = new CustomEvent("atualizarHistoricoAlunos", {
      detail: { alunos: alunosAtualizados },
    });
    window.dispatchEvent(event);
  };

  const handleVerHistorico = (aluno) => {
    // Buscar dados atualizados do aluno no localStorage e no estado atual
    const alunosSalvos = localStorage.getItem("alunos");
    let alunoAtualizado = { ...aluno };

    if (alunosSalvos) {
      const todosAlunosAtualizados = JSON.parse(alunosSalvos);
      const alunoEncontrado = todosAlunosAtualizados.find(
        (a) => a.id === aluno.id
      );
      if (alunoEncontrado) {
        alunoAtualizado = alunoEncontrado;
      }
    }

    // Buscar também o histórico específico do aluno em todas as aulas do histórico
    const historicoSalvo = localStorage.getItem("historicoAulas");
    if (historicoSalvo) {
      const todasAulas = JSON.parse(historicoSalvo);

      // Criar um array de historicoAulas específico para este aluno
      const historicoDoAluno = todasAulas
        .filter(
          (aula) => aula.alunos && aula.alunos.some((a) => a.id === aluno.id)
        )
        .map((aula) => ({
          id: aula.id,
          data: aula.data,
          status: aula.status,
        }));

      // Atualizar o histórico específico do aluno
      alunoAtualizado.historicoAulas = historicoDoAluno;
    }

    setAlunoHistorico(alunoAtualizado);
  };

  // Função para abrir o modal de detalhes da aula
  const verDetalhesAula = (aulaId) => {
    // Buscar os dados mais recentes do histórico de aulas
    const historicoSalvo = localStorage.getItem("historicoAulas");

    if (historicoSalvo) {
      const historicoAtualizado = JSON.parse(historicoSalvo);
      const aulaCompleta = historicoAtualizado.find(
        (aula) => aula.id === aulaId
      );

      if (aulaCompleta) {
        setAulaDetalhes(aulaCompleta);
        setShowAulaDetalhes(true);
      } else {
        // Tenta buscar no histórico local
        const aulaLocal = historicoAulas.find((aula) => aula.id === aulaId);
        if (aulaLocal) {
          setAulaDetalhes(aulaLocal);
          setShowAulaDetalhes(true);
        } else {
          alert("Detalhes da aula não encontrados.");
        }
      }
    } else {
      // Tenta buscar no histórico local
      const aulaLocal = historicoAulas.find((aula) => aula.id === aulaId);
      if (aulaLocal) {
        setAulaDetalhes(aulaLocal);
        setShowAulaDetalhes(true);
      } else {
        alert("Detalhes da aula não encontrados.");
      }
    }
  };

  // Função para fechar o modal de detalhes
  const fecharDetalhesAula = () => {
    setShowAulaDetalhes(false);
    setAulaDetalhes(null);
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

  const filteredItems = alunos.filter((item) =>
    item.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (aluno) => {
    setNovoAluno({
      nome: aluno.nome,
      idade: aluno.idade.toString(),
      lesao: aluno.lesao || "Não",
      objetivo: aluno.objetivo || "",
    });
    setAlunoEditando(aluno);
    setModoEdicao(true);
    setShowModal(true);
  };

  const openModal = () => {
    setNovoAluno({
      nome: "",
      idade: "",
      lesao: "Não",
      objetivo: "",
    });
    setModoEdicao(false);
    setAlunoEditando(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModoEdicao(false);
    setAlunoEditando(null);
  };

  // Função para voltar à página anterior
  const voltarPagina = (e) => {
    // Prevenir propagação do evento se for passado
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    try {
      // Verifica se há histórico para voltar
      if (window.history.length > 1) {
        window.history.back();
      } else {
        // Se não houver histórico, navegue para o dashboard
        const event = new CustomEvent("navegarPara", {
          detail: { secao: "geral" },
        });
        window.dispatchEvent(event);
      }
    } catch (error) {
      // Fallback - força navegação para o dashboard
      const event = new CustomEvent("navegarPara", {
        detail: { secao: "geral" },
      });
      window.dispatchEvent(event);
    }
  };

  return (
    <div className="alunos-principal-container">
      {/* Botão voltar estilo Apple */}
      <div className="apple-back-button-container">
        <button className="apple-back-button" onClick={voltarPagina}>
          <span className="apple-back-arrow">←</span> Voltar
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
          {filteredItems.slice(0, itemsPerPage).map((item, index) => (
            <tr key={item.id}>
              <td>{item.nome}</td>
              <td>{item.idade}</td>
              <td className="acoes">
                <button className="btn-editar" onClick={() => handleEdit(item)}>
                  <FaEdit /> Editar
                </button>
                <button
                  className="btn-excluir"
                  onClick={() => handleDelete(item.id)}
                >
                  <FaTrash /> Excluir
                </button>
                <button
                  className="btn-historico"
                  onClick={() => handleVerHistorico(item)}
                >
                  <FaEye /> Ver
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-aluno">
            <div className="modal-header">
              <h2>{modoEdicao ? "Editar Aluno" : "Cadastrar Aluno"}</h2>
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
                onClick={() => {
                  setAlunoHistorico(null);
                }}
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
                      <th>Professor</th>
                      <th>Ações</th>
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
                      .map((aula) => {
                        // Buscar dados completos da aula para obter informações do professor
                        const aulaCompleta = historicoAulas.find(
                          (a) => a.id === aula.id
                        );
                        return (
                          <tr key={aula.id}>
                            <td>{aula.data}</td>
                            <td>{getStatusLabel(aula.status)}</td>
                            <td>
                              {aulaCompleta && aulaCompleta.professor
                                ? aulaCompleta.professor.nome
                                : "-"}
                            </td>
                            <td>
                              <button
                                className="btn-detalhes"
                                onClick={() => verDetalhesAula(aula.id)}
                              >
                                Ver
                              </button>
                            </td>
                          </tr>
                        );
                      })}
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

      {/* Modal de detalhes da aula */}
      {showAulaDetalhes && aulaDetalhes && (
        <div className="modal-overlay">
          <div className="modal-aluno">
            <div className="modal-header">
              <h2>Detalhes da Aula</h2>
              <button
                className="close-btn"
                onClick={() => {
                  fecharDetalhesAula();
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

                {/* Exibir professor responsável, se houver */}
                {aulaDetalhes.professor && (
                  <p>
                    <strong>Professor Responsável:</strong>{" "}
                    {aulaDetalhes.professor.nome}
                    <span className="professor-especialidade">
                      ({aulaDetalhes.professor.especialidade})
                    </span>
                  </p>
                )}

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

export default GerenciamentoAlunos;

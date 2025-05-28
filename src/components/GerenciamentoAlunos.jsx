import React, { useState, useEffect } from "react";
import "../styles/GerenciamentoAlunos.css";
import supabase from "../config/supabaseConfig";
import { useNavigate, useParams } from "react-router-dom";

// Chave para armazenamento no localStorage
const FORM_STORAGE_KEY = "gerenciamento_alunos_form_data";

function GerenciamentoAlunos({ navigate }) {
  const [alunos, setAlunos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [showModal, setShowModal] = useState(false);
  const [atualizandoAluno, setAtualizandoAluno] = useState(null);
  const [activeTab, setActiveTab] = useState("ativos"); // Estado para controlar qual aba está ativa
  const [hasSavedForm, setHasSavedForm] = useState(false); // Estado para controlar se há formulário salvo
  const [novoAluno, setNovoAluno] = useState({
    nome: "",
    dataNascimento: "",
    lesao: "Não",
    tipo_lesao: "",
    objetivo: "",
    plano: "8 Check-in",
    nivel: "Iniciante",
    observacoes: "",
    status: "ativo",
  });

  // Usar React Router diretamente quando navigate não é passado como prop
  const routerNavigate = useNavigate();

  // Função de navegação que usa a prop navigate ou o hook useNavigate
  const handleNavigate = (path) => {
    if (typeof navigate === "function") {
      navigate(path);
    } else {
      routerNavigate(path);
    }
  };

  // Forçar atualização do cache do esquema na montagem
  useEffect(() => {
    async function inicializar() {
      try {
        await carregarAlunos();
      } catch (err) {
        setError("Erro ao inicializar a página. Tente recarregar.");
        setLoading(false);
      }
    }

    inicializar();
  }, []);

  // Verificar se existe formulário salvo ao carregar o componente
  useEffect(() => {
    try {
      const savedForm = localStorage.getItem(FORM_STORAGE_KEY);
      if (savedForm) {
        setHasSavedForm(true);
      }
    } catch (error) {
      // Erro ao verificar formulário salvo
    }
  }, []);

  const carregarAlunos = async () => {
    try {
      setLoading(true);

      // Primeiro, vamos verificar se o usuário está autenticado
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        // Usuário não está autenticado
        setError("Usuário não está autenticado");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("alunos")
        .select("*")
        .order("nome");

      if (error) {
        throw error;
      }

      setAlunos(data || []); // Garante que alunos seja sempre um array
      setError(null);
    } catch (err) {
      setError("Erro ao carregar alunos: " + err.message);
      setAlunos([]); // Define como array vazio em caso de erro
    } finally {
      setLoading(false);
    }
  };

  const atualizarStatusAluno = async (id, novoStatus) => {
    try {
      setAtualizandoAluno(id);
      setError(null);

      const { error } = await supabase
        .from("alunos")
        .update({ status: novoStatus })
        .eq("id", id);

      if (error) {
        throw error;
      }

      // Recarregar dados após atualização bem-sucedida
      await carregarAlunos();
    } catch (err) {
      setError(`Erro ao atualizar status: ${err.message}`);
    } finally {
      setAtualizandoAluno(null);
    }
  };

  const openModal = () => {
    // Verifica se existe formulário salvo
    try {
      const savedForm = localStorage.getItem(FORM_STORAGE_KEY);
      if (savedForm && hasSavedForm) {
        if (
          window.confirm(
            "Você tem um formulário salvo. Deseja continuar de onde parou?"
          )
        ) {
          const parsedForm = JSON.parse(savedForm);
          setNovoAluno(parsedForm);
        } else {
          // Se o usuário não quiser carregar, limpar os dados
          localStorage.removeItem(FORM_STORAGE_KEY);
          setHasSavedForm(false);
          // Inicializa com valores padrão
          setNovoAluno({
            nome: "",
            dataNascimento: "",
            lesao: "Não",
            tipo_lesao: "",
            objetivo: "",
            plano: "8 Check-in",
            nivel: "Iniciante",
            observacoes: "",
            status: "ativo",
          });
        }
      } else {
        // Não há dados salvos, inicia com valores padrão
        setNovoAluno({
          nome: "",
          dataNascimento: "",
          lesao: "Não",
          tipo_lesao: "",
          objetivo: "",
          plano: "8 Check-in",
          nivel: "Iniciante",
          observacoes: "",
          status: "ativo",
        });
      }
    } catch (error) {
      // Em caso de erro, iniciar com valores padrão
      setNovoAluno({
        nome: "",
        dataNascimento: "",
        lesao: "Não",
        tipo_lesao: "",
        objetivo: "",
        plano: "8 Check-in",
        nivel: "Iniciante",
        observacoes: "",
        status: "ativo",
      });
    }

    setShowModal(true);
  };

  const closeModal = () => {
    // Verificar se há dados no formulário que valem a pena salvar
    // (pelo menos nome preenchido ou qualquer outro campo significativo)
    const temDadosImportantes =
      novoAluno.nome ||
      novoAluno.tipo_lesao ||
      novoAluno.objetivo ||
      novoAluno.observacoes;

    if (temDadosImportantes) {
      if (
        window.confirm(
          "Deseja salvar o progresso do formulário para continuar depois?"
        )
      ) {
        try {
          localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(novoAluno));
          setHasSavedForm(true);
          alert(
            "Formulário salvo com sucesso! Você pode continuar mais tarde."
          );
        } catch (error) {
          alert("Erro ao salvar o formulário: " + error.message);
        }
      } else {
        // Se o usuário não quiser salvar, limpar os dados
        try {
          localStorage.removeItem(FORM_STORAGE_KEY);
          setHasSavedForm(false);
        } catch (error) {
          // Erro ao limpar localStorage
        }
      }
    }

    setShowModal(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNovoAluno((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Corrigir o valor de "lesao" para garantir que não contenha acentuação
      let lesaoCorrigida = novoAluno.lesao;
      if (lesaoCorrigida === "Não") {
        lesaoCorrigida = "Nao";
      }

      // Calcular a idade a partir da data de nascimento
      let idade = null;
      if (novoAluno.dataNascimento) {
        const hoje = new Date();
        const dataNasc = new Date(novoAluno.dataNascimento);
        idade = hoje.getFullYear() - dataNasc.getFullYear();
        const mesAtual = hoje.getMonth();
        const mesNasc = dataNasc.getMonth();

        // Ajuste da idade se ainda não fez aniversário este ano
        if (
          mesNasc > mesAtual ||
          (mesNasc === mesAtual && dataNasc.getDate() > hoje.getDate())
        ) {
          idade--;
        }
      }

      // Preparar dados para enviar ao Supabase com mapeamento correto de campos
      const alunoParaSalvar = {
        nome: novoAluno.nome,
        data_nascimento: novoAluno.dataNascimento || null, // Salvar data de nascimento
        idade: idade, // Idade calculada automaticamente
        status: novoAluno.status || "ativo",
        lesao: lesaoCorrigida, // Usar o valor corrigido
        tipo_lesao: lesaoCorrigida !== "Nao" ? novoAluno.tipo_lesao : null,
        objetivo: novoAluno.objetivo || null,
        plano: novoAluno.plano || "8 Check-in",
        nivel: novoAluno.nivel || "Iniciante",
        observacoes: novoAluno.observacoes || null,
      };

      const { error } = await supabase.from("alunos").insert([alunoParaSalvar]);

      if (error) throw error;

      // Limpar os dados do localStorage quando o formulário é enviado com sucesso
      try {
        localStorage.removeItem(FORM_STORAGE_KEY);
        setHasSavedForm(false);
      } catch (storageError) {
        // Erro ao limpar localStorage
      }

      closeModal();
      await carregarAlunos();
    } catch (err) {
      setError("Erro ao cadastrar aluno: " + err.message);
    }
  };

  const getLesaoClass = (lesao) => {
    switch (lesao) {
      case "Sim - Lesao Grave":
        return "lesao-grave";
      case "Sim - Lesao Moderada":
        return "lesao-moderada";
      default:
        return "";
    }
  };

  // Filtrar alunos por status (ativo/inativo) com base na aba selecionada
  const filtrarAlunosPorStatus = (alunos, status) => {
    return alunos.filter((aluno) => aluno.status === status);
  };

  // Filtrar alunos por termo de busca
  const filtrarAlunosPorBusca = (alunos, searchTerm) => {
    if (!searchTerm) return alunos;

    return alunos.filter(
      (aluno) =>
        aluno.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        aluno.telefone?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Aplicar ambos os filtros sequencialmente
  const alunosFiltrados = filtrarAlunosPorBusca(
    filtrarAlunosPorStatus(
      alunos,
      activeTab === "ativos" ? "ativo" : "inativo"
    ),
    searchTerm
  );

  if (loading && !atualizandoAluno)
    return <div className="loading-indicator">Carregando...</div>;
  if (error) return <div className="erro">{error}</div>;

  return (
    <div className="alunos-principal-container">
      <h1>Gerenciamento de Alunos</h1>

      {/* Sistema de abas para alternar entre alunos ativos e inativos */}
      <div className="alunos-tabs">
        <button
          className={`tab-button ${activeTab === "ativos" ? "active" : ""}`}
          onClick={() => setActiveTab("ativos")}
          data-count={alunos.filter((aluno) => aluno.status === "ativo").length}
        >
          Alunos Ativos
        </button>
        <button
          className={`tab-button ${activeTab === "inativos" ? "active" : ""}`}
          onClick={() => setActiveTab("inativos")}
          data-count={
            alunos.filter((aluno) => aluno.status === "inativo").length
          }
        >
          Alunos Inativos
        </button>
      </div>

      <div className="actions-container">
        <button className="btn-cadastrar" onClick={openModal}>
          <span>+</span> Cadastrar Aluno
        </button>

        <div className="list-controls">
          <div className="show-entries">
            <span>Mostrar</span>
            <select
              value={entriesPerPage}
              onChange={(e) => setEntriesPerPage(Number(e.target.value))}
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
              placeholder="Nome ou telefone"
            />
          </div>
        </div>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>NOME</th>
            <th>TELEFONE</th>
            <th>STATUS</th>
            <th>AÇÕES</th>
          </tr>
        </thead>
        <tbody>
          {alunosFiltrados.slice(0, entriesPerPage).map((aluno) => (
            <tr key={aluno.id} className={getLesaoClass(aluno.lesao)}>
              <td>{aluno.nome}</td>
              <td>{aluno.telefone || "-"}</td>
              <td>
                <span
                  className={`status-${
                    aluno.status === "ativo" ? "atual" : "cancelada"
                  }`}
                >
                  {aluno.status.toUpperCase() === "ATIVO" ? "ATIVO" : "INATIVO"}
                </span>
              </td>
              <td className="acoes">
                <button
                  className="btn-acao btn-detalhes"
                  onClick={() => {
                    try {
                      const path = `/detalhe-aluno/${aluno.id}`;
                      handleNavigate(path);
                    } catch (error) {
                      console.error(
                        "Erro ao navegar para detalhes do aluno:",
                        error
                      );
                      alert(
                        "Não foi possível abrir os detalhes do aluno. Por favor, tente novamente."
                      );
                    }
                  }}
                >
                  Ver Detalhes
                </button>
                <button
                  className="btn-acao btn-editar"
                  onClick={() => {
                    try {
                      const path = `/editar-aluno/${aluno.id}`;
                      handleNavigate(path);
                    } catch (error) {
                      console.error(
                        "Erro ao navegar para edição do aluno:",
                        error
                      );
                      alert(
                        "Não foi possível abrir a edição do aluno. Por favor, tente novamente."
                      );
                    }
                  }}
                >
                  Editar
                </button>
                {aluno.status === "ativo" ? (
                  <button
                    onClick={() => atualizarStatusAluno(aluno.id, "inativo")}
                    className="btn-acao btn-inativar"
                    disabled={atualizandoAluno === aluno.id}
                  >
                    {atualizandoAluno === aluno.id ? "..." : "Inativar"}
                  </button>
                ) : (
                  <button
                    onClick={() => atualizarStatusAluno(aluno.id, "ativo")}
                    className="btn-acao btn-ativar"
                    disabled={atualizandoAluno === aluno.id}
                  >
                    {atualizandoAluno === aluno.id ? "..." : "Ativar"}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {alunosFiltrados.length === 0 && (
        <p className="sem-registros">
          {activeTab === "ativos"
            ? "Nenhum aluno ativo encontrado."
            : "Nenhum aluno inativo encontrado."}
        </p>
      )}

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
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="nome">Nome Completo*</label>
                  <input
                    type="text"
                    id="nome"
                    name="nome"
                    value={novoAluno.nome}
                    onChange={handleChange}
                    required
                    placeholder="Nome do aluno"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="dataNascimento">Data de Nascimento</label>
                  <input
                    type="date"
                    id="dataNascimento"
                    name="dataNascimento"
                    value={novoAluno.dataNascimento}
                    onChange={handleChange}
                    placeholder="Data de nascimento do aluno"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="status">Status</label>
                  <select
                    id="status"
                    name="status"
                    value={novoAluno.status}
                    onChange={handleChange}
                  >
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Plano</label>
                  <div className="checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="plano"
                        checked={novoAluno.plano === "8 Check-in"}
                        onChange={() =>
                          setNovoAluno({ ...novoAluno, plano: "8 Check-in" })
                        }
                      />
                      8 Check-in
                    </label>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="plano"
                        checked={novoAluno.plano === "12 Check-in"}
                        onChange={() =>
                          setNovoAluno({ ...novoAluno, plano: "12 Check-in" })
                        }
                      />
                      12 Check-in
                    </label>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="plano"
                        checked={novoAluno.plano === "16 Check-in"}
                        onChange={() =>
                          setNovoAluno({ ...novoAluno, plano: "16 Check-in" })
                        }
                      />
                      16 Check-in
                    </label>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="plano"
                        checked={novoAluno.plano === "Premium"}
                        onChange={() =>
                          setNovoAluno({ ...novoAluno, plano: "Premium" })
                        }
                      />
                      Premium
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="nivel">Nível de experiência</label>
                  <select
                    id="nivel"
                    name="nivel"
                    value={novoAluno.nivel}
                    onChange={handleChange}
                  >
                    <option value="">Selecione um nível</option>
                    <option value="Iniciante">Iniciante</option>
                    <option value="Intermediário">Intermediário</option>
                    <option value="Avançado">Avançado</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
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
              </div>

              {novoAluno.lesao !== "Não" && (
                <div className="form-row">
                  <div className="form-group full-width">
                    <label htmlFor="tipo_lesao">Descrição da Lesão</label>
                    <textarea
                      id="tipo_lesao"
                      name="tipo_lesao"
                      value={novoAluno.tipo_lesao}
                      onChange={handleChange}
                      placeholder="Descreva detalhes sobre a lesão"
                      rows={3}
                    />
                  </div>
                </div>
              )}

              <div className="form-row">
                <div className="form-group full-width">
                  <label htmlFor="objetivo">Objetivo de Treino</label>
                  <textarea
                    id="objetivo"
                    name="objetivo"
                    value={novoAluno.objetivo}
                    onChange={handleChange}
                    placeholder="Qual o objetivo do aluno com o treino?"
                    rows={3}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group full-width">
                  <label htmlFor="observacoes">Observações</label>
                  <textarea
                    id="observacoes"
                    name="observacoes"
                    value={novoAluno.observacoes}
                    onChange={handleChange}
                    placeholder="Observações adicionais sobre o aluno..."
                    rows={3}
                  />
                </div>
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
                  Cadastrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default GerenciamentoAlunos;

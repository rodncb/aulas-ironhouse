import React, { useState, useEffect } from "react";
import "../styles/GerenciamentoAlunos.css";
import { supabase } from "../services/supabase";
import { reloadSupabaseSchemaCache } from "../services/supabase";
import { navegarPara } from "../lib/utils";

function GerenciamentoAlunos({ setActiveSection }) {
  const [alunos, setAlunos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [showModal, setShowModal] = useState(false);
  const [atualizandoAluno, setAtualizandoAluno] = useState(null);
  const [novoAluno, setNovoAluno] = useState({
    nome: "",
    idade: "",
    lesao: "Não",
    tipo_lesao: "",
    objetivo: "",
    status: "ativo",
  });

  // Forçar atualização do cache do esquema na montagem
  useEffect(() => {
    async function inicializar() {
      try {
        console.log("Forçando atualização do cache do esquema...");
        await reloadSupabaseSchemaCache();
        console.log("Cache do esquema atualizado com sucesso!");
        await carregarAlunos();
      } catch (err) {
        console.error("Erro ao inicializar:", err);
        setError("Erro ao inicializar a página. Tente recarregar.");
        setLoading(false);
      }
    }

    inicializar();
  }, []);

  const carregarAlunos = async () => {
    try {
      setLoading(true);
      console.log("Iniciando carregamento de alunos..."); // Log Adicionado

      // Forçar atualização do cache antes de carregar
      // await reloadSupabaseSchemaCache(); // Chamada removida temporariamente

      console.log("Buscando alunos no Supabase..."); // Log Adicionado
      const { data, error } = await supabase
        .from("alunos")
        .select("*")
        .order("nome");

      if (error) {
        console.error("Erro Supabase ao carregar alunos:", error); // Log de erro detalhado
        throw error;
      }

      console.log(`Alunos carregados com sucesso: ${data?.length} registros.`); // Log de sucesso
      setAlunos(data || []); // Garante que alunos seja sempre um array
      setError(null);
    } catch (err) {
      console.error("Erro geral ao carregar alunos:", err); // Log de erro geral
      setError("Erro ao carregar alunos: " + err.message);
      setAlunos([]); // Define como array vazio em caso de erro
    } finally {
      console.log("Finalizando carregamento de alunos."); // Log Adicionado
      setLoading(false);
    }
  };

  const atualizarStatusAluno = async (id, novoStatus) => {
    console.log(`Tentando atualizar aluno ID ${id} para status: ${novoStatus}`);

    try {
      setAtualizandoAluno(id);
      setError(null);

      // Forçar atualização do cache antes de atualizar
      await reloadSupabaseSchemaCache();

      // Atualização executada após o refresh do cache
      const { error } = await supabase
        .from("alunos")
        .update({ status: novoStatus })
        .eq("id", id);

      if (error) {
        console.error("ERRO SUPABASE:", error);
        // Se o erro for de cache, tentar recarregar novamente
        if (error.message.includes("schema cache")) {
          console.warn(
            "Erro de cache detectado novamente, tentando recarregar..."
          );
          await reloadSupabaseSchemaCache();
          // Opcionalmente, tentar a operação novamente aqui ou apenas recarregar os dados
        }
        throw error;
      }

      // Recarregar dados após atualização bem-sucedida
      await carregarAlunos();

      // Feedback de sucesso
      console.log(
        `Status do aluno ${id} atualizado com sucesso para ${novoStatus}!`
      );
    } catch (err) {
      console.error("Erro crítico ao atualizar status:", err);
      setError(`Erro ao atualizar status: ${err.message}`);
    } finally {
      setAtualizandoAluno(null);
    }
  };

  const openModal = () => {
    setShowModal(true);
    setNovoAluno({
      nome: "",
      idade: "",
      lesao: "Não",
      tipo_lesao: "",
      objetivo: "",
      status: "ativo",
    });
  };

  const closeModal = () => {
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
      // Forçar atualização do cache antes de cadastrar
      await reloadSupabaseSchemaCache();

      const alunoParaSalvar = {
        ...novoAluno,
        idade: novoAluno.idade ? parseInt(novoAluno.idade) : null,
        status: "ativo",
      };

      console.log("Dados para cadastro:", alunoParaSalvar);

      const { data, error } = await supabase
        .from("alunos")
        .insert([alunoParaSalvar])
        .select();

      if (error) throw error;

      console.log("Aluno cadastrado com sucesso:", data);

      closeModal();
      await carregarAlunos();
    } catch (err) {
      console.error("Erro ao cadastrar:", err);
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

  const alunosFiltrados = alunos.filter(
    (aluno) =>
      aluno.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      aluno.telefone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && !atualizandoAluno)
    return <div className="loading-indicator">Carregando...</div>;
  if (error) return <div className="erro">{error}</div>;

  return (
    <div className="alunos-principal-container">
      <h1>Gerenciamento de Alunos</h1>

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
            <th>Nome</th>
            <th>Telefone</th>
            <th>Status</th>
            <th>Ações</th>
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
                  {aluno.status === "ativo" ? "Ativo" : "Inativo"}
                </span>
              </td>
              <td className="acoes">
                <button
                  className="btn-acao btn-detalhes"
                  onClick={() => {
                    const secao = `detalhe-aluno/${aluno.id}`;
                    if (setActiveSection) {
                      setActiveSection(secao);
                    } else {
                      navegarPara(secao);
                    }
                  }}
                >
                  Ver Detalhes
                </button>
                <button
                  className="btn-acao btn-editar"
                  onClick={() => {
                    const secao = `editar-aluno/${aluno.id}`;
                    if (setActiveSection) {
                      setActiveSection(secao);
                    } else {
                      navegarPara(secao);
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
        <p className="sem-registros">Nenhum aluno encontrado.</p>
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
                <label htmlFor="tipo_lesao">Tipo de Lesão:</label>
                <textarea
                  id="tipo_lesao"
                  name="tipo_lesao"
                  value={novoAluno.tipo_lesao}
                  onChange={handleChange}
                  placeholder="Descreva o tipo de lesão"
                  disabled={novoAluno.lesao === "Não"}
                />
              </div>

              <div className="form-group">
                <label htmlFor="objetivo">Objetivo:</label>
                <textarea
                  id="objetivo"
                  name="objetivo"
                  value={novoAluno.objetivo}
                  onChange={handleChange}
                  placeholder="Descreva o objetivo do aluno"
                />
              </div>

              {/* Campo oculto para garantir que o status seja sempre 'ativo' */}
              <input type="hidden" name="status" value="ativo" />

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
}

export default GerenciamentoAlunos;

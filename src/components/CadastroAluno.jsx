import React, { useState, useEffect } from "react";
import "../styles/Cadastro.css";
import "../styles/CadastroAluno.css";
import "../styles/Modal.css";
import "../styles/EditarAluno.css"; // Importando os estilos do EditarAluno também
import alunosService from "../services/alunos.service";

const CadastroAluno = () => {
  const [showModal, setShowModal] = useState(false);
  const [alunos, setAlunos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [alunoHistorico, setAlunoHistorico] = useState(null);

  // Estado para o formulário de cadastro, no mesmo formato do EditarAluno
  const [formData, setFormData] = useState({
    nome: "",
    dataNascimento: "", // Data de nascimento ao invés de idade
    objetivo: "",
    lesao: "Nao", // Note: Sem acento, como no EditarAluno
    tipoLesao: "",
    status: "ativo",
    plano: "8 Check-in",
    nivel: "Iniciante",
    observacoes: "",
  });

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
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      if (formData.nome.trim() === "") {
        throw new Error("Nome do aluno é obrigatório");
      }

      // Garantir a conversão de "Não" para "Nao"
      let lesaoValor = formData.lesao === "Não" ? "Nao" : formData.lesao;

      // Verificar se o valor é um dos permitidos
      if (
        lesaoValor !== "Nao" &&
        lesaoValor !== "Sim - Lesao Grave" &&
        lesaoValor !== "Sim - Lesao Moderada"
      ) {
        console.warn(
          `Valor de lesão inválido detectado: ${lesaoValor}. Definindo como 'Nao'.`
        );
        lesaoValor = "Nao";
      }

      // Calcular a idade a partir da data de nascimento
      let idade = null;
      if (formData.dataNascimento) {
        const hoje = new Date();
        const dataNasc = new Date(formData.dataNascimento);
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

      // Criar novo aluno no Supabase
      const novoAlunoData = {
        nome: formData.nome,
        data_nascimento: formData.dataNascimento || null,
        idade: idade, // Idade calculada
        status: formData.status || "ativo",
        lesao: lesaoValor,
        tipo_lesao: lesaoValor !== "Nao" ? formData.tipoLesao : null,
        objetivo: formData.objetivo || null,
        plano: formData.plano || "8 Check-in",
        nivel: formData.nivel || "Iniciante",
        observacoes: formData.observacoes || null, // Garantir que observações sejam salvas
      };

      // Remover a chave tipoLesao se existir, pois já mapeamos para tipo_lesao
      delete novoAlunoData.tipoLesao;

      console.log("Dados FINAIS sendo enviados para o service:", novoAlunoData);

      // Usar a função createAluno do service
      const alunoSalvo = await alunosService.createAluno(novoAlunoData);

      // Atualizar o estado local com o novo aluno
      setAlunos((prev) => [...prev, alunoSalvo]);

      // Disparar evento para atualizar outros componentes
      const event = new CustomEvent("atualizarHistoricoAlunos", {
        detail: { alunos: [...alunos, alunoSalvo] },
      });
      window.dispatchEvent(event);

      // Resetar o formulário - garantir que todos os campos são resetados
      setFormData({
        nome: "",
        dataNascimento: "",
        objetivo: "",
        lesao: "Nao",
        tipoLesao: "",
        status: "ativo",
        plano: "8 Check-in",
        nivel: "Iniciante",
        observacoes: "", // Resetar também as observações
      });

      setSuccess(true);

      // Armazenar o ID do aluno para poder verificá-lo
      const alunoSalvoId = alunoSalvo.id;

      // Fechar o modal após um breve delay
      setTimeout(() => {
        // Verificar se ainda existe um aluno com esse ID
        if (alunos.some((a) => a.id === alunoSalvoId)) {
          setShowModal(false);
          setSuccess(false); // Limpa o sucesso ao fechar
        }
      }, 3000);
    } catch (err) {
      console.error("Erro detalhado ao adicionar aluno:", err); // Log do erro completo

      // Salvar o formulário no localStorage para recuperação em caso de erro
      try {
        localStorage.setItem("formDataBackup", JSON.stringify(formData));
      } catch (storageError) {
        console.warn(
          "Não foi possível salvar o backup do formulário:",
          storageError
        );
      }

      // Identificar tipos de erro específicos
      let userFriendlyError;

      if (
        err.message &&
        (err.message.toLowerCase().includes("network") ||
          err.message.toLowerCase().includes("failed to fetch") ||
          err.message.toLowerCase().includes("internet") ||
          err.message.toLowerCase().includes("connection"))
      ) {
        // Erro de conexão - muito comum em dispositivos móveis
        userFriendlyError =
          "Problema de conexão com a internet detectado. Verifique sua conexão Wi-Fi ou dados móveis e tente novamente. NÃO FECHE ESTA JANELA nem atualize a página, seus dados estão salvos.";
      } else if (err.code === "23505") {
        // Erro de violação de chave única
        userFriendlyError =
          "Já existe um aluno com estas informações no sistema.";
      } else {
        // Erro genérico
        const errorMsgDetail =
          err.details || err.message || "Erro desconhecido";
        userFriendlyError = `Falha ao adicionar aluno: ${errorMsgDetail}. Verifique sua conexão e tente novamente. NÃO ATUALIZE a página.`;
      }

      // Mensagem de erro mais informativa e persistente
      setError(userFriendlyError);
      // Não limpar o erro automaticamente
    } finally {
      setSaving(false);
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
    setFormData({
      nome: "",
      dataNascimento: "",
      objetivo: "",
      lesao: "Nao",
      tipoLesao: "",
      status: "ativo",
      plano: "8 Check-in",
      nivel: "Iniciante",
      observacoes: "",
    });
    setError(null);
    setSuccess(false);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  // Função para voltar à página anterior ou para o dashboard
  const voltarParaGeral = () => {
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
        <button className="btn-voltar" onClick={voltarParaGeral}>
          Voltar
        </button>
      </div>

      <h1>Alunos</h1>

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

      {/* Modal de cadastro com design baseado no EditarAluno.jsx */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-aluno">
            <div className="modal-header">
              <h2>Cadastrar Aluno</h2>
              <button className="close-btn" onClick={closeModal}>
                ×
              </button>
            </div>

            <div className="editar-aluno-form-container">
              {/* Mensagem de sucesso persistente até fechar o modal */}
              {success && (
                <div className="mensagem-sucesso">
                  <div className="sucesso-icon">✓</div>
                  Aluno cadastrado com sucesso!
                  <p className="sucesso-info">
                    Esta janela fechará automaticamente em 3 segundos...
                  </p>
                </div>
              )}

              {/* Mensagem de erro persistente e mais destacada */}
              {error && <div className="mensagem-erro">{error}</div>}

              {/* Overlay de carregamento durante o salvamento */}
              {saving && (
                <div className="salvando-overlay">
                  <div className="salvando-spinner"></div>
                  <p>Salvando dados do aluno...</p>
                  <p className="salvando-info">
                    Por favor, aguarde. Não feche esta janela.
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="editar-aluno-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="nome">Nome Completo*</label>
                    <input
                      type="text"
                      id="nome"
                      name="nome"
                      value={formData.nome}
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
                      value={formData.dataNascimento}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="status">Status</label>
                    <select
                      id="status"
                      name="status"
                      value={formData.status}
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
                          checked={formData.plano === "8 Check-in"}
                          onChange={() =>
                            setFormData({ ...formData, plano: "8 Check-in" })
                          }
                        />
                        8 Check-in
                      </label>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          name="plano"
                          checked={formData.plano === "12 Check-in"}
                          onChange={() =>
                            setFormData({ ...formData, plano: "12 Check-in" })
                          }
                        />
                        12 Check-in
                      </label>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          name="plano"
                          checked={formData.plano === "16 Check-in"}
                          onChange={() =>
                            setFormData({ ...formData, plano: "16 Check-in" })
                          }
                        />
                        16 Check-in
                      </label>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          name="plano"
                          checked={formData.plano === "Premium"}
                          onChange={() =>
                            setFormData({ ...formData, plano: "Premium" })
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
                      value={formData.nivel}
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
                      value={formData.lesao} // O valor aqui ainda pode ser "Não" com acento
                      onChange={handleChange}
                    >
                      {/* O valor da option "Não" deve ser "Nao" sem acento */}
                      <option value="Nao">Não</option>
                      <option value="Sim - Lesao Moderada">
                        Sim - Lesão Moderada
                      </option>
                      <option value="Sim - Lesao Grave">
                        Sim - Lesão Grave
                      </option>
                    </select>
                  </div>
                </div>

                {formData.lesao !== "Nao" && (
                  <div className="form-row">
                    <div className="form-group full-width">
                      <label htmlFor="tipoLesao">Descrição da Lesão</label>
                      <textarea
                        id="tipoLesao"
                        name="tipoLesao"
                        value={formData.tipoLesao}
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
                      value={formData.objetivo}
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
                      value={formData.observacoes}
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
                  <button
                    type="submit"
                    className="btn-salvar"
                    disabled={saving}
                  >
                    {saving ? "Salvando..." : "Cadastrar Aluno"}
                  </button>
                </div>
              </form>
            </div>
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
                          <td>
                            {aula.status === "realizada"
                              ? "Realizada"
                              : aula.status === "atual"
                              ? "Atual"
                              : aula.status === "cancelada"
                              ? "Cancelada"
                              : aula.status}
                          </td>
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

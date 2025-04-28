import React, { useState, useEffect } from "react";
import "../styles/Cadastro.css";
import "../styles/CadastroAluno.css";
import "../styles/Modal.css";
import "../styles/EditarAluno.css"; // Importando os estilos do EditarAluno também
import alunosService from "../services/alunos.service";

// Chave para armazenamento no localStorage
const FORM_STORAGE_KEY = "cadastro_aluno_form_data";

// Adicionar uma nova constante para armazenar o estado do modal
const FORM_STATE_KEY = "cadastro_aluno_form_state";

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

  // Estado para verificar se há dados salvos no formulário
  const [hasSavedForm, setHasSavedForm] = useState(false);

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

  // Verificar se há dados salvos no localStorage ao carregar o componente
  useEffect(() => {
    try {
      const savedForm = localStorage.getItem(FORM_STORAGE_KEY);
      if (savedForm) {
        const parsedForm = JSON.parse(savedForm);
        setHasSavedForm(true);

        // Não carregar automaticamente para não abrir o modal sem ação do usuário
        // Apenas guardar a informação de que há um formulário salvo
      }
    } catch (error) {
      console.warn("Erro ao verificar formulário salvo:", error);
    }
  }, []);

  // Adicionar listener para eventos de visibilidade da página
  useEffect(() => {
    // Função que será chamada quando a visibilidade da página mudar
    const handleVisibilityChange = () => {
      // Quando a página estiver escondida (tela bloqueada ou app em segundo plano)
      if (document.visibilityState === "hidden" && showModal) {
        console.log("Página escondida, salvando estado do formulário");
        try {
          // Salvar os dados do formulário e o estado (aberto)
          localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(formData));
          localStorage.setItem(FORM_STATE_KEY, "open");
          // Salvar a seção atual para poder restaurar a navegação depois
          localStorage.setItem("lastActiveSection", "cadastros");
          localStorage.setItem("modalWasOpen", "true");
        } catch (error) {
          console.warn("Erro ao salvar formulário:", error);
        }
      }
      // Quando a página voltar a ficar visível
      else if (document.visibilityState === "visible") {
        console.log("Página visível novamente");
        const modalWasOpen = localStorage.getItem("modalWasOpen");

        // Verificar se o modal estava aberto antes
        if (modalWasOpen === "true") {
          try {
            const savedForm = localStorage.getItem(FORM_STORAGE_KEY);
            if (savedForm) {
              // Se tinha dados salvos, preencher o formulário
              const parsedForm = JSON.parse(savedForm);
              setFormData(parsedForm);

              // E manter o modal aberto
              setShowModal(true);

              // Avisar o App que estamos na seção cadastros
              const event = new CustomEvent("navegarPara", {
                detail: { secao: "cadastros" },
              });
              window.dispatchEvent(event);

              // Limpar o flag
              localStorage.setItem("modalWasOpen", "false");
            }
          } catch (error) {
            console.warn("Erro ao recuperar formulário:", error);
          }
        }
      }
    };

    // Adicionar event listeners
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleVisibilityChange);

    // Também ajustar para quando o componente for montado
    if (document.visibilityState === "visible") {
      const modalWasOpen = localStorage.getItem("modalWasOpen");
      const savedForm = localStorage.getItem(FORM_STORAGE_KEY);
      const formState = localStorage.getItem(FORM_STATE_KEY);

      if (modalWasOpen === "true" && savedForm && formState === "open") {
        try {
          const parsedForm = JSON.parse(savedForm);
          setFormData(parsedForm);
          setShowModal(true);
        } catch (error) {
          console.warn("Erro ao recuperar formulário:", error);
        }
      }
    }

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleVisibilityChange);
    };
  }, [showModal, formData]);

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
    const updatedFormData = {
      ...formData,
      [name]: value,
    };

    setFormData(updatedFormData);

    // Salvar no localStorage a cada mudança
    try {
      localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(updatedFormData));
    } catch (error) {
      console.warn("Erro ao salvar formulário no localStorage:", error);
    }
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

      // Limpar dados do localStorage após salvamento bem-sucedido
      try {
        localStorage.removeItem(FORM_STORAGE_KEY);
        localStorage.removeItem(FORM_STATE_KEY); // Também remover o estado do modal
        setHasSavedForm(false);
      } catch (storageError) {
        console.warn("Erro ao limpar dados do formulário:", storageError);
      }

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
        localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(formData));
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

  // Modificar a função openModal para também salvar o estado do modal
  const openModal = () => {
    // Verificar se existem dados salvos anteriormente
    try {
      const savedForm = localStorage.getItem(FORM_STORAGE_KEY);
      if (savedForm) {
        const parsedForm = JSON.parse(savedForm);
        // Perguntar ao usuário se deseja continuar com o formulário anterior
        if (
          window.confirm(
            "Foi encontrado um formulário de cadastro não concluído. Deseja continuar preenchendo?"
          )
        ) {
          setFormData(parsedForm);
        } else {
          // Se o usuário não quiser continuar, limpar os dados salvos
          localStorage.removeItem(FORM_STORAGE_KEY);
          localStorage.removeItem(FORM_STATE_KEY); // Também remover o estado do modal
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
        }
      }
    } catch (error) {
      console.warn("Erro ao verificar formulário salvo:", error);
    }

    setError(null);
    setSuccess(false);
    setShowModal(true);

    // Salvar o estado do modal como aberto
    try {
      localStorage.setItem(FORM_STATE_KEY, "open");
    } catch (error) {
      console.warn("Erro ao salvar estado do modal:", error);
    }

    setHasSavedForm(false);
  };

  // Modificar a função closeModal para também salvar o estado do modal
  const closeModal = () => {
    console.log("FUNÇÃO CANCELAR EXECUTADA");

    // SEMPRE confirmar se deseja salvar, independente do conteúdo
    // Isso garante que a funcionalidade será testada
    if (
      window.confirm(
        "Deseja salvar o progresso do formulário para continuar depois?"
      )
    ) {
      try {
        console.log("SALVANDO FORMULÁRIO:", formData);
        localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(formData));
        localStorage.setItem(FORM_STATE_KEY, "saved"); // Estado: formulário salvo, modal fechado
        setHasSavedForm(true);
        alert(
          "Formulário salvo com sucesso! Feche esta mensagem para continuar."
        );
      } catch (error) {
        console.error("ERRO AO SALVAR:", error);
        alert("Erro ao salvar o formulário: " + error.message);
      }
    } else {
      // Se o usuário não quiser salvar, limpar os dados
      try {
        localStorage.removeItem(FORM_STORAGE_KEY);
        localStorage.removeItem(FORM_STATE_KEY); // Também remover o estado do modal
        setHasSavedForm(false);
        console.log("FORMULÁRIO DESCARTADO");
      } catch (error) {
        console.error("ERRO AO LIMPAR:", error);
      }
    }

    console.log("FECHANDO MODAL");
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

  // Adicionar um listener para o evento personalizado que abre o modal
  useEffect(() => {
    // Função para abrir modal quando o evento for disparado
    const handleAbrirModal = (event) => {
      if (event.detail && event.detail.form) {
        // Se recebeu dados do formulário, preencher
        setFormData(event.detail.form);
      }
      // Abrir o modal
      setShowModal(true);
    };

    // Adicionar o listener para o evento personalizado
    window.addEventListener("abrirModalCadastroAluno", handleAbrirModal);

    // Limpar o listener ao desmontar o componente
    return () => {
      window.removeEventListener("abrirModalCadastroAluno", handleAbrirModal);
    };
  }, []);

  // Adicionar tratamento para evento de atualização/fechamento da página
  useEffect(() => {
    const handleBeforeUnload = (event) => {
      // Se o modal estiver aberto, salva o estado
      if (showModal) {
        try {
          localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(formData));
          localStorage.setItem(FORM_STATE_KEY, "open");

          // Mensagem padrão para navegadores que suportam
          event.preventDefault();
          event.returnValue =
            "Você tem alterações não salvas. Tem certeza que deseja sair?";
          return event.returnValue;
        } catch (error) {
          console.warn("Erro ao salvar estado do formulário:", error);
        }
      }
    };

    // Adicionar evento para detectar atualização/fechamento da página
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [showModal, formData]);

  return (
    <div className="cadastro-container">
      {/* Exibir mensagem de erro, se houver */}
      {error && <div className="error-message">{error}</div>}

      {/* Exibir indicador de carregamento */}
      {loading && <div className="loading-indicator">Carregando...</div>}

      {/* Mostrar notificação de formulário salvo */}
      {hasSavedForm && !showModal && (
        <div className="form-saved-notification">
          <p>Você tem um formulário de cadastro em andamento.</p>
          <button className="btn-continue" onClick={openModal}>
            Continuar Cadastro
          </button>
          <button
            className="btn-discard"
            onClick={() => {
              try {
                localStorage.removeItem(FORM_STORAGE_KEY);
                setHasSavedForm(false);
              } catch (error) {
                console.warn("Erro ao descartar formulário:", error);
              }
            }}
          >
            Descartar
          </button>
        </div>
      )}

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

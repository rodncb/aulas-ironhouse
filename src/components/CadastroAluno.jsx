import React, { useState, useEffect, useCallback } from "react";
import "../styles/Cadastro.css";
import "../styles/CadastroAluno.css";
import "../styles/Modal.css";
import "../styles/EditarAluno.css";
import alunosService from "../services/alunos.service";
import { useCadastroAluno } from "../contexts/CadastroAlunoContext"; // Importar o hook do contexto

const CadastroAluno = () => {
  const {
    formData, // Obter do contexto
    formState, // Obter do contexto
    updateField, // Obter do contexto
    limparDadosCadastro, // Obter do contexto
    // setFormData, // Não precisamos mais de setFormData diretamente aqui
    // setFormState, // Não precisamos mais de setFormState diretamente aqui
  } = useCadastroAluno(); // Usar o hook do contexto

  const [showModal, setShowModal] = useState(false);
  const [showRecoveryNotification, setShowRecoveryNotification] =
    useState(false);
  const [alunos, setAlunos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  const [itemsPerPage, setItemsPerPage] = useState(100); // Default to 100
  const [searchTerm, setSearchTerm] = useState("");
  const [alunoHistorico, setAlunoHistorico] = useState(null);

  // Verificar se há dados no contexto ao montar e abrir o modal se necessário
  useEffect(() => {
    // Verifica se o estado do formulário no contexto é 'editing'
    if (formState === "editing") {
        "[CadastroAluno] Estado 'editing' detectado no contexto, abrindo modal."
      );
      setShowModal(true);
      setShowRecoveryNotification(true);

      // Ocultar notificação automaticamente após 5 segundos
      const timer = setTimeout(() => {
        setShowRecoveryNotification(false);
      }, 5000);
      return () => clearTimeout(timer); // Limpar timer ao desmontar ou re-executar
    } else {
        "[CadastroAluno] Estado 'idle' detectado no contexto, modal fechado."
      );
      setShowModal(false); // Garantir que o modal esteja fechado se não estiver editando
      setShowRecoveryNotification(false); // Esconder notificação se não estiver editando
    }
  }, [formState]); // Depende do formState do contexto

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

  // Escutar por atualizações do histórico de aulas (se necessário)
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

  // Usar updateField do contexto no handleChange
  const handleChange = (e) => {
    const { name, value } = e.target;
    updateField(name, value); // Usa a função do contexto
  };

  // Ajustar handlePlanoChange para usar updateField do contexto
  const handlePlanoChange = (plano) => {
    updateField("plano", plano); // Usa a função do contexto
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      if (!formData.nome || formData.nome.trim() === "") {
        throw new Error("Nome do aluno é obrigatório");
      }

      // ... (lógica de validação e cálculo de idade permanece a mesma)
      let lesaoValor = formData.lesao === "Não" ? "Nao" : formData.lesao;
      if (
        lesaoValor !== "Nao" &&
        lesaoValor !== "Sim - Lesao Grave" &&
        lesaoValor !== "Sim - Lesao Moderada"
      ) {
        lesaoValor = "Nao"; // Default para 'Nao' se valor inválido
      }

      let idade = null;
      if (formData.dataNascimento) {
        const hoje = new Date();
        const dataNasc = new Date(formData.dataNascimento);
        if (!isNaN(dataNasc.getTime())) {
          // Verifica se a data é válida
          idade = hoje.getFullYear() - dataNasc.getFullYear();
          const mesAtual = hoje.getMonth();
          const mesNasc = dataNasc.getMonth();
          if (
            mesNasc > mesAtual ||
            (mesNasc === mesAtual && dataNasc.getDate() > hoje.getDate())
          ) {
            idade--;
          }
        } else {
          console.warn("Data de nascimento inválida:", formData.dataNascimento);
        }
      }

      const novoAlunoData = {
        nome: formData.nome,
        data_nascimento: formData.dataNascimento || null,
        idade: idade,
        status: formData.status || "ativo",
        lesao: lesaoValor,
        tipo_lesao: lesaoValor !== "Nao" ? formData.tipoLesao : null,
        objetivo: formData.objetivo || null,
        plano: formData.plano || "8 Check-in", // Default se não selecionado
        nivel: formData.nivel || "Iniciante", // Default se não selecionado
        observacoes: formData.observacoes || null,
        telefone: formData.telefone || null, // Adicionado campo telefone
      };

      const alunoSalvo = await alunosService.createAluno(novoAlunoData);
      setAlunos((prev) => [...prev, alunoSalvo]);

      const event = new CustomEvent("atualizarHistoricoAlunos", {
        detail: { alunos: [...alunos, alunoSalvo] },
      });
      window.dispatchEvent(event);

      // Limpar dados do contexto e localStorage usando a função do contexto
      limparDadosCadastro();

      setSuccess(true);
      setShowModal(false); // Fechar o modal após sucesso
      setShowRecoveryNotification(false); // Garantir que a notificação de recuperação seja fechada
    } catch (err) {
      console.error("Erro ao salvar aluno:", err);
      setError(err.message || "Erro ao salvar aluno. Verifique os dados.");
    } finally {
      setSaving(false);
    }
  };

  // Função para abrir o modal
  const handleOpenModal = () => {
    // Não precisamos mais inicializar formData aqui, o contexto já carrega
    setShowModal(true);
    // A notificação de recuperação será mostrada pelo useEffect se formState for 'editing'
  };

  // Função para fechar o modal e limpar o contexto se não salvou
  const handleCloseModal = () => {
    setShowModal(false);
    setShowRecoveryNotification(false); // Esconder notificação ao fechar manualmente
    // Limpar o contexto apenas se o estado for 'editing', indicando que havia dados não salvos
    if (formState === "editing") {
        "[CadastroAluno] Fechando modal e limpando dados do contexto."
      );
      limparDadosCadastro(); // Limpa o estado e o localStorage
    } else {
        "[CadastroAluno] Fechando modal sem limpar dados (estado idle)."
      );
    }
  };

  // Filtrar alunos com base no termo de pesquisa
  const filteredAlunos = alunos.filter((aluno) =>
    aluno.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Paginação (se necessário, pode ser reativada)
  // const indexOfLastItem = currentPage * itemsPerPage;
  // const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  // const currentItems = filteredAlunos.slice(indexOfFirstItem, indexOfLastItem);
  // const totalPages = Math.ceil(filteredAlunos.length / itemsPerPage);
  // const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="cadastro-container">
      <h2>Cadastro de Alunos</h2>

      {/* Botão para abrir o modal de cadastro */}
      <button onClick={handleOpenModal} className="add-button">
        Adicionar Novo Aluno
      </button>

      {/* Notificação de recuperação de dados */}
      {showRecoveryNotification && (
        <div className="recovery-notification">
          <p>Dados de cadastro não salvos foram recuperados.</p>
          <button onClick={() => setShowRecoveryNotification(false)}>
            Fechar
          </button>
        </div>
      )}

      {/* Modal de Cadastro */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content cadastro-modal">
            <button className="close-button" onClick={handleCloseModal}>
              &times;
            </button>
            <h3>{formData.id ? "Editar Aluno" : "Cadastrar Novo Aluno"}</h3>
            {error && <p className="error-message">{error}</p>}
            {success && (
              <p className="success-message">Aluno salvo com sucesso!</p>
            )}
            <form onSubmit={handleSubmit} className="cadastro-form">
              {/* Campos do formulário usando formData do contexto */}
              <div className="form-group">
                <label htmlFor="nome">Nome Completo*</label>
                <input
                  type="text"
                  id="nome"
                  name="nome"
                  value={formData.nome || ""}
                  onChange={handleChange}
                  required
                  disabled={saving}
                />
              </div>

              <div className="form-group">
                <label htmlFor="dataNascimento">Data de Nascimento</label>
                <input
                  type="date"
                  id="dataNascimento"
                  name="dataNascimento"
                  value={formData.dataNascimento || ""}
                  onChange={handleChange}
                  disabled={saving}
                />
              </div>

              <div className="form-group">
                <label htmlFor="telefone">Telefone</label>
                <input
                  type="tel" // Usar type="tel" para semântica e potencial formatação/validação
                  id="telefone"
                  name="telefone"
                  value={formData.telefone || ""}
                  onChange={handleChange}
                  placeholder="(XX) XXXXX-XXXX" // Adicionar placeholder
                  disabled={saving}
                />
              </div>

              <div className="form-group">
                <label>Plano*</label>
                <div className="radio-group">
                  {["8 Check-in", "12 Check-in", "16 Check-in", "Livre"].map(
                    (plano) => (
                      <label key={plano}>
                        <input
                          type="radio"
                          name="plano"
                          value={plano}
                          checked={formData.plano === plano}
                          onChange={() => handlePlanoChange(plano)} // Usar handlePlanoChange
                          required
                          disabled={saving}
                        />
                        {plano}
                      </label>
                    )
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>Nível*</label>
                <div className="radio-group">
                  {["Iniciante", "Intermediário", "Avançado"].map((nivel) => (
                    <label key={nivel}>
                      <input
                        type="radio"
                        name="nivel"
                        value={nivel}
                        checked={formData.nivel === nivel}
                        onChange={handleChange} // Pode usar handleChange normal
                        required
                        disabled={saving}
                      />
                      {nivel}
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Possui Lesão?*</label>
                <div className="radio-group">
                  {["Não", "Sim - Lesao Moderada", "Sim - Lesao Grave"].map(
                    (opcao) => (
                      <label key={opcao}>
                        <input
                          type="radio"
                          name="lesao"
                          value={opcao}
                          checked={formData.lesao === opcao}
                          onChange={handleChange}
                          required
                          disabled={saving}
                        />
                        {opcao
                          .replace("Não", "Não")
                          .replace("Sim - ", "Sim - ")}
                      </label>
                    )
                  )}
                </div>
              </div>

              {/* Campo Tipo de Lesão aparece se Lesão for Sim */}
              {formData.lesao && formData.lesao !== "Não" && (
                <div className="form-group">
                  <label htmlFor="tipoLesao">Qual Lesão?</label>
                  <input
                    type="text"
                    id="tipoLesao"
                    name="tipoLesao"
                    value={formData.tipoLesao || ""}
                    onChange={handleChange}
                    disabled={saving}
                  />
                </div>
              )}

              <div className="form-group">
                <label htmlFor="objetivo">Objetivo</label>
                <input
                  type="text"
                  id="objetivo"
                  name="objetivo"
                  value={formData.objetivo || ""}
                  onChange={handleChange}
                  disabled={saving}
                />
              </div>

              <div className="form-group">
                <label htmlFor="observacoes">Observações</label>
                <textarea
                  id="observacoes"
                  name="observacoes"
                  value={formData.observacoes || ""}
                  onChange={handleChange}
                  rows="3"
                  disabled={saving}
                ></textarea>
              </div>

              <button type="submit" className="save-button" disabled={saving}>
                {saving ? "Salvando..." : "Salvar Aluno"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Seção de Gerenciamento/Listagem (pode ser movida para outro componente) */}
      {/* ... (código da lista de alunos permanece o mesmo por enquanto) ... */}
      {/* Input de busca */}
      <div className="search-container">
        <input
          type="text"
          placeholder="Buscar aluno por nome..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Tabela de Alunos */}
      {loading && <p>Carregando alunos...</p>}
      {!loading && error && <p className="error-message">{error}</p>}
      {!loading && !error && filteredAlunos.length === 0 && (
        <p>Nenhum aluno encontrado.</p>
      )}
      {!loading && !error && filteredAlunos.length > 0 && (
        <div className="table-container">
          <table className="alunos-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Idade</th>
                <th>Plano</th>
                <th>Nível</th>
                <th>Status</th>
                <th>Lesão</th>
                <th>Tipo Lesão</th>
                <th>Objetivo</th>
                <th>Observações</th>
                <th>Telefone</th> {/* Coluna Telefone adicionada */}
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredAlunos.map((aluno) => (
                <tr key={aluno.id}>
                  <td>{aluno.nome}</td>
                  <td>{aluno.idade ?? "N/A"}</td>
                  <td>{aluno.plano}</td>
                  <td>{aluno.nivel}</td>
                  <td>{aluno.status}</td>
                  <td>{aluno.lesao}</td>
                  <td>{aluno.tipo_lesao ?? "-"}</td>
                  <td>{aluno.objetivo ?? "-"}</td>
                  <td>{aluno.observacoes ?? "-"}</td>
                  <td>{aluno.telefone ?? "-"}</td> {/* Exibir telefone */}
                  <td>
                    {/* Botões de ação (Editar, Histórico, etc.) */}
                    {/* <button onClick={() => handleEdit(aluno)}>Editar</button> */}
                    {/* <button onClick={() => handleViewHistorico(aluno.id)}>Histórico</button> */}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* Paginação (se necessário) */}
      {/* {totalPages > 1 && (
        <div className="pagination">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
            <button key={number} onClick={() => paginate(number)} className={currentPage === number ? 'active' : ''}>
              {number}
            </button>
          ))}
        </div>
      )} */}
    </div>
  );
};

export default CadastroAluno;

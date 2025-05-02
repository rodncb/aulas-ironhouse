import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import alunosService from "../services/alunos.service";

// Chaves para o localStorage
const STORAGE_KEY_DATA = "ironhouse_cadastroAlunoData";
const STORAGE_KEY_STATE = "ironhouse_cadastroAlunoState"; // 'idle' ou 'editing'
const STORAGE_KEY_ALUNO_ID = "ironhouse_cadastroAlunoId"; // Para salvar o ID do aluno em edição

// Criar o contexto
const CadastroAlunoContext = createContext();

// Provider do contexto
export const CadastroAlunoProvider = ({ children }) => {
  const [formData, setFormData] = useState({});
  const [formState, setFormState] = useState("idle"); // Estado inicial: ocioso
  const [alunoId, setAlunoId] = useState(null); // ID do aluno sendo editado/visualizado
  const [carregandoAluno, setCarregandoAluno] = useState(false); // Flag para carregamento

  // Carregar dados do localStorage ao iniciar
  useEffect(() => {
    console.log(
      "[CadastroAlunoContext] Tentando carregar dados do localStorage..."
    );
    try {
      const savedData = localStorage.getItem(STORAGE_KEY_DATA);
      const savedState = localStorage.getItem(STORAGE_KEY_STATE);
      const savedAlunoId = localStorage.getItem(STORAGE_KEY_ALUNO_ID);

      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setFormData(parsedData);
        console.log(
          "[CadastroAlunoContext] Dados do formulário carregados:",
          parsedData
        );
      } else {
        setFormData({}); // Garante estado inicial limpo se nada for encontrado
        console.log(
          "[CadastroAlunoContext] Nenhum dado de formulário encontrado."
        );
      }

      if (savedState) {
        setFormState(savedState);
        console.log(
          "[CadastroAlunoContext] Estado do formulário carregado:",
          savedState
        );
      } else {
        setFormState("idle"); // Estado padrão
        console.log(
          "[CadastroAlunoContext] Nenhum estado de formulário encontrado, definindo como idle."
        );
      }

      if (savedAlunoId) {
        setAlunoId(savedAlunoId);
        console.log(
          "[CadastroAlunoContext] ID do aluno carregado:",
          savedAlunoId
        );
      } else {
        setAlunoId(null); // Sem aluno para edição/visualização
      }
    } catch (error) {
      console.error(
        "Erro ao carregar dados do localStorage para CadastroAluno:",
        error
      );
      setFormData({}); // Reseta em caso de erro
      setFormState("idle");
      setAlunoId(null);
      // Limpar localStorage se houver erro de parse para evitar loops
      localStorage.removeItem(STORAGE_KEY_DATA);
      localStorage.removeItem(STORAGE_KEY_STATE);
      localStorage.removeItem(STORAGE_KEY_ALUNO_ID);
    }
  }, []); // Executa apenas na montagem inicial

  // Salvar dados no localStorage sempre que formData mudar E o estado for 'editing' ou 'viewing'
  useEffect(() => {
    if (formState === "editing" || formState === "viewing") {
      try {
        console.log(
          "[CadastroAlunoContext] Salvando dados do formulário no localStorage:",
          formData
        );
        localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(formData));
      } catch (error) {
        console.error(
          "Erro ao salvar dados do formulário no localStorage:",
          error
        );
      }
    }
    // Não salvar se o estado for 'idle' (ex: após limpar)
  }, [formData, formState]);

  // Salvar estado no localStorage sempre que formState mudar
  useEffect(() => {
    try {
      console.log(
        "[CadastroAlunoContext] Salvando estado do formulário no localStorage:",
        formState
      );
      localStorage.setItem(STORAGE_KEY_STATE, formState);
    } catch (error) {
      console.error(
        "Erro ao salvar estado do formulário no localStorage:",
        error
      );
    }
  }, [formState]);

  // Salvar ID do aluno no localStorage sempre que alunoId mudar
  useEffect(() => {
    try {
      if (alunoId) {
        console.log(
          "[CadastroAlunoContext] Salvando ID do aluno no localStorage:",
          alunoId
        );
        localStorage.setItem(STORAGE_KEY_ALUNO_ID, alunoId);
      } else {
        localStorage.removeItem(STORAGE_KEY_ALUNO_ID);
      }
    } catch (error) {
      console.error("Erro ao salvar ID do aluno no localStorage:", error);
    }
  }, [alunoId]);

  // Função para atualizar um campo específico do formulário
  const updateField = useCallback(
    (name, value) => {
      setFormData((prev) => {
        const updatedData = { ...prev, [name]: value };
        // Garante que o estado seja 'editing' ao modificar qualquer campo se já não estiver
        if (formState !== "editing") {
          setFormState("editing");
        }
        return updatedData;
      });
    },
    [formState]
  ); // Adiciona formState como dependência

  // Função para carregar um aluno específico pelo ID
  const carregarAluno = useCallback(async (id) => {
    if (!id) return;

    setCarregandoAluno(true);
    console.log(`[CadastroAlunoContext] Carregando aluno com ID: ${id}`);

    try {
      const aluno = await alunosService.getById(id);
      if (aluno) {
        console.log(
          "[CadastroAlunoContext] Aluno carregado com sucesso:",
          aluno
        );
        // Formatar os dados conforme esperado pelos campos do formulário
        const dadosAluno = {
          id: aluno.id,
          nome: aluno.nome || "",
          dataNascimento: aluno.data_nascimento || "",
          idade: aluno.idade || "",
          status: aluno.status || "ativo",
          lesao: aluno.lesao || "Nao",
          tipoLesao: aluno.tipo_lesao || "",
          objetivo: aluno.objetivo || "",
          plano: aluno.plano || "8 Check-in",
          nivel: aluno.nivel || "Iniciante",
          observacoes: aluno.observacoes || "",
          telefone: aluno.telefone || "",
        };

        setFormData(dadosAluno);
        setAlunoId(id);
        setFormState("viewing"); // Começa em modo visualização, não edição
      } else {
        console.error(
          `[CadastroAlunoContext] Aluno com ID ${id} não encontrado.`
        );
        // Se o aluno não existe, limpar os dados e ir para estado ocioso
        limparDadosCadastro();
      }
    } catch (error) {
      console.error(
        `[CadastroAlunoContext] Erro ao carregar aluno: ${error.message}`
      );
      // Manter os dados salvos anteriormente em caso de erro de conexão
    } finally {
      setCarregandoAluno(false);
    }
  }, []);

  // Função para iniciar a edição de um aluno já carregado
  const iniciarEdicaoAluno = useCallback(() => {
    if (formState === "viewing" && alunoId) {
      console.log(
        `[CadastroAlunoContext] Iniciando edição do aluno ${alunoId}`
      );
      setFormState("editing");
    }
  }, [formState, alunoId]);

  // Função para limpar os dados do formulário e o localStorage
  const limparDadosCadastro = useCallback(() => {
    console.log(
      "[CadastroAlunoContext] Limpando dados do formulário e localStorage."
    );
    setFormData({});
    setFormState("idle"); // Volta ao estado ocioso
    setAlunoId(null); // Limpa o ID do aluno
    localStorage.removeItem(STORAGE_KEY_DATA);
    localStorage.removeItem(STORAGE_KEY_STATE);
    localStorage.removeItem(STORAGE_KEY_ALUNO_ID);
  }, []);

  // Função para salvar as alterações de um aluno (atualização)
  const salvarEdicaoAluno = useCallback(async () => {
    if (!alunoId || formState !== "editing") {
      console.warn(
        "[CadastroAlunoContext] Tentativa de salvar sem ID ou não está em modo edição"
      );
      return { success: false, error: "Dados inválidos para atualização" };
    }

    console.log(
      `[CadastroAlunoContext] Salvando alterações do aluno ${alunoId}`
    );

    try {
      // Preparar o objeto para enviar ao backend
      const alunoAtualizado = {
        id: alunoId,
        nome: formData.nome,
        data_nascimento: formData.dataNascimento || null,
        idade: formData.idade || null,
        status: formData.status || "ativo",
        lesao: formData.lesao || "Nao",
        tipo_lesao: formData.lesao !== "Nao" ? formData.tipoLesao : null,
        objetivo: formData.objetivo || null,
        plano: formData.plano || "8 Check-in",
        nivel: formData.nivel || "Iniciante",
        observacoes: formData.observacoes || null,
        telefone: formData.telefone || null,
      };

      // Enviar para o serviço
      await alunosService.updateAluno(alunoId, alunoAtualizado);

      // Após salvo com sucesso, voltar para modo visualização
      setFormState("viewing");

      return { success: true };
    } catch (error) {
      console.error(
        `[CadastroAlunoContext] Erro ao atualizar aluno: ${error.message}`
      );
      // Manter em modo edição em caso de erro
      return { success: false, error: error.message };
    }
  }, [alunoId, formData, formState]);

  // Valores expostos pelo contexto
  const contextValue = {
    formData,
    formState,
    alunoId,
    carregandoAluno,
    updateField,
    limparDadosCadastro,
    setFormData,
    setFormState,
    carregarAluno,
    iniciarEdicaoAluno,
    salvarEdicaoAluno,
    setAlunoId,
  };

  return (
    <CadastroAlunoContext.Provider value={contextValue}>
      {children}
    </CadastroAlunoContext.Provider>
  );
};

// Hook customizado para usar o contexto
export const useCadastroAluno = () => {
  const context = useContext(CadastroAlunoContext);
  if (!context) {
    throw new Error(
      "useCadastroAluno deve ser usado dentro de um CadastroAlunoProvider"
    );
  }
  return context;
};

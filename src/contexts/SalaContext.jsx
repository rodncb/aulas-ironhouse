import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";

// Criando o contexto da Sala
const SalaContext = createContext();

// Nome das chaves no localStorage
const STORAGE_KEYS = {
  observacoes: "ironhouse_alunoObservacoes",
  exercicios: "ironhouse_exerciciosPorAluno",
  aulaAtual: "ironhouse_aulaAtual",
};

// Provider do contexto
export const SalaProvider = ({ children }) => {
  // Estados para acompanhar observações e exercícios
  const [alunoObservacoes, setAlunoObservacoes] = useState({});
  const [exerciciosPorAluno, setExerciciosPorAluno] = useState({});
  const [aulaAtual, setAulaAtual] = useState(null);
  const initialLoadDone = useRef(false); // Ref para controlar o carregamento inicial

  // Carregar dados do localStorage ao iniciar
  useEffect(() => {
    // Executar apenas uma vez, mesmo com StrictMode ou múltiplas montagens
    if (initialLoadDone.current) {
      console.log("[SalaContext] Carregamento inicial já realizado, pulando.");
      return;
    }
    initialLoadDone.current = true; // Marcar que o carregamento foi feito

    console.log("[SalaContext] Iniciando carregamento do localStorage...");
    let loadedObservacoes = {};
    try {
      // Carregar observações
      const savedObservacoes = localStorage.getItem(STORAGE_KEYS.observacoes);
      if (savedObservacoes) {
        console.log(
          "[SalaContext] Observações encontradas no localStorage:",
          savedObservacoes
        );
        loadedObservacoes = JSON.parse(savedObservacoes);
        setAlunoObservacoes(loadedObservacoes);
        console.log(
          "[SalaContext] Estado alunoObservacoes definido com:",
          loadedObservacoes
        );
      } else {
        console.log(
          "[SalaContext] Nenhuma observação encontrada no localStorage"
        );
        setAlunoObservacoes({}); // Garante que começa vazio se não houver nada salvo
      }

      // Carregar exercícios
      const savedExercicios = localStorage.getItem(STORAGE_KEYS.exercicios);
      if (savedExercicios) {
        console.log(
          "[SalaContext] Carregando exercícios do localStorage:",
          savedExercicios
        );
        setExerciciosPorAluno(JSON.parse(savedExercicios));
      } else {
        console.log(
          "[SalaContext] Nenhum exercício encontrado no localStorage"
        );
      }

      // Carregar aula atual
      const savedAulaAtual = localStorage.getItem(STORAGE_KEYS.aulaAtual);
      if (savedAulaAtual) {
        console.log(
          "[SalaContext] Carregando aula atual do localStorage:",
          savedAulaAtual
        );
        setAulaAtual(JSON.parse(savedAulaAtual));
      } else {
        console.log(
          "[SalaContext] Nenhuma aula atual encontrada no localStorage"
        );
      }
    } catch (error) {
      console.error("Erro ao carregar dados do localStorage:", error);
      setAlunoObservacoes({}); // Reseta em caso de erro de parse
    }
    console.log(
      "[SalaContext] Carregamento inicial do localStorage concluído."
    );
  }, []); // Dependência vazia para rodar apenas na montagem inicial

  // Salvar observações no localStorage sempre que mudarem
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEYS.observacoes,
        JSON.stringify(alunoObservacoes)
      );
    } catch (error) {
      console.error("Erro ao salvar observações no localStorage:", error);
    }
  }, [alunoObservacoes]);

  // Salvar exercícios no localStorage sempre que mudarem
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEYS.exercicios,
        JSON.stringify(exerciciosPorAluno)
      );
    } catch (error) {
      console.error("Erro ao salvar exercícios no localStorage:", error);
    }
  }, [exerciciosPorAluno]);

  // Salvar aula atual no localStorage sempre que mudar
  useEffect(() => {
    try {
      if (aulaAtual) {
        localStorage.setItem(STORAGE_KEYS.aulaAtual, JSON.stringify(aulaAtual));
      }
    } catch (error) {
      console.error("Erro ao salvar aula atual no localStorage:", error);
    }
  }, [aulaAtual]);

  // Atualizar observação de um aluno específico
  const updateAlunoObservacao = (alunoId, observacao) => {
    console.log(
      `[SalaContext] Atualizando observação para aluno ${alunoId}:`,
      observacao
    );

    setAlunoObservacoes((prev) => {
      const novasObservacoes = {
        ...prev,
        [alunoId]: observacao,
      };

      // Salvar imediatamente no localStorage para garantir persistência
      try {
        localStorage.setItem(
          STORAGE_KEYS.observacoes,
          JSON.stringify(novasObservacoes)
        );
        console.log(
          "[SalaContext] Observações salvas no localStorage com sucesso"
        );
      } catch (error) {
        console.error(
          "[SalaContext] Erro ao salvar observações no localStorage:",
          error
        );
      }

      return novasObservacoes;
    });
  };

  // Atualizar exercícios de um aluno específico
  const updateExerciciosPorAluno = (alunoId, exercicios) => {
    setExerciciosPorAluno((prev) => ({
      ...prev,
      [alunoId]: exercicios,
    }));
  };

  // Adicionar um exercício para um aluno
  const adicionarExercicio = (alunoId, exercicioId = null) => {
    setExerciciosPorAluno((prev) => {
      const alunoExercicios = [...(prev[alunoId] || [])];
      alunoExercicios.push({ id: exercicioId, exercicio_id: exercicioId });
      return { ...prev, [alunoId]: alunoExercicios };
    });
  };

  // Atualizar um exercício específico
  const atualizarExercicio = (alunoId, index, exercicioId) => {
    setExerciciosPorAluno((prev) => {
      const exerciciosDoAluno = [...(prev[alunoId] || [])];
      exerciciosDoAluno[index] = { id: exercicioId, exercicio_id: exercicioId };
      return { ...prev, [alunoId]: exerciciosDoAluno };
    });
  };

  // Remover um exercício
  const removerExercicio = (alunoId, index) => {
    setExerciciosPorAluno((prev) => {
      const exerciciosDoAluno = [...(prev[alunoId] || [])];
      exerciciosDoAluno.splice(index, 1);
      return { ...prev, [alunoId]: exerciciosDoAluno };
    });
  };

  // Limpar todos os dados salvos quando a aula for finalizada ou cancelada
  const limparDadosSala = () => {
    // Limpar estados
    setAlunoObservacoes({});
    setExerciciosPorAluno({});
    setAulaAtual(null);

    // Limpar localStorage
    localStorage.removeItem(STORAGE_KEYS.observacoes);
    localStorage.removeItem(STORAGE_KEYS.exercicios);
    localStorage.removeItem(STORAGE_KEYS.aulaAtual);
  };

  // Remover dados de um aluno específico (quando finaliza ou cancela individualmente)
  const removerDadosAluno = (alunoId) => {
    // Remover observações do aluno
    setAlunoObservacoes((prev) => {
      const newObservacoes = { ...prev };
      delete newObservacoes[alunoId];
      return newObservacoes;
    });

    // Remover exercícios do aluno
    setExerciciosPorAluno((prev) => {
      const newExercicios = { ...prev };
      delete newExercicios[alunoId];
      return newExercicios;
    });
  };

  // Valores e funções expostos pelo contexto
  const contextValue = {
    // Estados
    alunoObservacoes,
    exerciciosPorAluno,
    aulaAtual,

    // Setters
    setAlunoObservacoes,
    setExerciciosPorAluno,
    setAulaAtual,

    // Funções auxiliares
    updateAlunoObservacao,
    updateExerciciosPorAluno,
    adicionarExercicio,
    atualizarExercicio,
    removerExercicio,
    limparDadosSala,
    removerDadosAluno,
  };

  return (
    <SalaContext.Provider value={contextValue}>{children}</SalaContext.Provider>
  );
};

// Hook customizado para acessar o contexto
export const useSala = () => {
  const context = useContext(SalaContext);
  if (!context) {
    throw new Error("useSala deve ser usado dentro de um SalaProvider");
  }
  return context;
};

export default SalaContext;

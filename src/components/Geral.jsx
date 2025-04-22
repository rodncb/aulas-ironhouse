// Importações
import React, { useState, useEffect, useCallback, useRef } from "react";
import "../styles/Geral.css";
import {
  voltarPagina,
  getStatusLabel,
  formatarData,
  navegarPara,
} from "../lib/utils";
// Importar serviços da API
import aulasService from "../services/aulas.service";
import alunosService from "../services/alunos.service";
import exerciciosService from "../services/exercicios.service";
import professoresService from "../services/professores.service";
import AlertasBox from "./AlertasBox"; // Importando componente de alertas
import AlunosService from "../services/AlunosService"; // Adicionar importação do service completo

const Geral = ({ alunosEmAula, atualizarAlunosEmAula }) => {
  // Estados
  const [historicoAulas, setHistoricoAulas] = useState([]);
  const [todosAlunos, setTodosAlunos] = useState([]);
  const [todosProfessores, setTodosProfessores] = useState([]);
  const [todosExercicios, setTodosExercicios] = useState([]);
  const [showSelecao, setShowSelecao] = useState(false);
  const [alunoSelecionado, setAlunoSelecionado] = useState("");
  const [professorSelecionado, setProfessorSelecionado] = useState("");
  const [exerciciosSelecionados, setExerciciosSelecionados] = useState([]);
  const [pesquisaExercicio, setPesquisaExercicio] = useState("");
  const [alunosNaAula, setAlunosNaAula] = useState([]);
  const [showDetalhesAula, setShowDetalhesAula] = useState(false);
  const [aulaAtual, setAulaAtual] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 100;
  const [showConfirmCancelar, setShowConfirmCancelar] = useState(false);
  const [aulaCancelar, setAulaCancelar] = useState(null);
  const [aulaEditando, setAulaEditando] = useState(null);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [anotacoes, setAnotacoes] = useState("");
  const [showAulaFinalizadaModal, setShowAulaFinalizadaModal] = useState(false);
  const [aulaParaFinalizar, setAulaParaFinalizar] = useState(null);
  // Adicionando os estados que estavam faltando
  const [showErroModal, setShowErroModal] = useState(false);
  const [erroMsg, setErroMsg] = useState("");
  const [showSchemaCacheError, setShowSchemaCacheError] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [aulas, setAulas] = useState([]);
  const [loading, setLoading] = useState(false); // Alterado de true para false para garantir que fetchDados() seja chamado
  const [savingData, setSavingData] = useState(false); // Estado para controlar salvamento de dados
  const [error, setError] = useState(null); // Estado para erros gerais
  // Estado para controlar alertas
  const [alertas, setAlertas] = useState([]);

  // Refs para controle de atualizações cíclicas
  const sincronizacaoRef = useRef(false);
  const dadosCarregadosRef = useRef(false);
  const novaAulaRef = useRef(false); // Nova ref para controlar quando estamos criando uma nova aula

  // Funções auxiliares para regras de negócio
  const getLimitePlano = (plano) => {
    switch (plano) {
      case "8 Check-in":
        return 8;
      case "12 Check-in":
        return 12;
      case "16 Check-in":
        return 16;
      case "Premium":
        return Infinity; // Ou um número muito grande
      default:
        return 0;
    }
  };

  const isDataNosUltimos7Dias = (dataAula) => {
    const hoje = new Date();
    const dataLimite = new Date();
    dataLimite.setDate(hoje.getDate() - 7);

    try {
      // Tentar parsear a data no formato DD/MM/YYYY
      let data;
      if (typeof dataAula === "string" && dataAula.includes("/")) {
        const partes = dataAula.split("/");
        if (partes.length === 3) {
          data = new Date(partes[2], partes[1] - 1, partes[0]);
        } else {
          data = new Date(dataAula); // Tentar outro formato
        }
      } else {
        data = new Date(dataAula); // Assume que é objeto Date ou formato ISO
      }

      return data >= dataLimite && data <= hoje;
    } catch (e) {
      return false;
    }
  };

  // Função para atualizar o histórico de aulas dos alunos
  const atualizarHistoricoAlunos = async (aula) => {
    try {
      // Apenas atualizar o estado local sem tentar fazer alterações no banco
      const alunosAtualizados = todosAlunos.map((aluno) => {
        if (
          aula.alunos &&
          aula.alunos.some((alunoAula) => alunoAula.id === aluno.id)
        ) {
          const historicoExistente = aluno.historicoAulas || [];
          const aulaJaExiste = historicoExistente.some((h) => h.id === aula.id);
          if (!aulaJaExiste) {
            return {
              ...aluno,
              historicoAulas: [
                ...historicoExistente,
                {
                  id: aula.id,
                  data: aula.data,
                  status: aula.status,
                },
              ],
            };
          }
        }
        return aluno;
      });

      // Atualizar apenas o estado local
      setTodosAlunos(alunosAtualizados);

      // Removido a atualização no Supabase pois historicoAulas não existe como coluna na tabela alunos

      // Disparar evento para comunicação entre componentes
      window.dispatchEvent(
        new CustomEvent("atualizarHistoricoAlunos", {
          detail: { alunos: alunosAtualizados },
        })
      );
    } catch (error) {
      // Em vez de exibir um erro, apenas registrar no console
    }
  };

  // Função para atualizar o histórico de aulas dos professores
  const atualizarHistoricoProfessores = (aula) => {
    if (!aula.professor) return; // Se não tiver professor, não faz nada

    const professoresAtualizados = todosProfessores.map((professor) => {
      if (professor.id === aula.professor.id) {
        const historicoExistente = professor.historicoAulas || [];
        const aulaJaExiste = historicoExistente.some((h) => h.id === aula.id);

        if (!aulaJaExiste) {
          return {
            ...professor,
            historicoAulas: [
              ...historicoExistente,
              {
                id: aula.id,
                data: aula.data,
                status: aula.status,
              },
            ],
          };
        }
      }
      return professor;
    });

    // Atualiza no estado local
    setTodosProfessores(professoresAtualizados);

    // Dispara um evento personalizado para notificar outros componentes
    window.dispatchEvent(
      new CustomEvent("atualizarHistoricoProfessores", {
        detail: { professores: professoresAtualizados },
      })
    );
  };

  // Inicializar dados do Supabase ao montar o componente
  useEffect(() => {
    // Flag para controlar se o componente ainda está montado
    let isMounted = true;

    // Função para buscar dados apenas quando necessário
    const fetchDados = async () => {
      // Se estiver carregando, não faça nada
      if (loading) return;

      try {
        setLoading(true);

        // Buscar dados do servidor
        const alunosData = await alunosService.getAll();

        const professoresData = await professoresService.getAll();

        const aulasData = await aulasService.getAll();

        const exerciciosData = await exerciciosService.getAll();

        // Se o componente foi desmontado durante a busca, não atualize o estado
        if (!isMounted) return;

        // Processar dados de aulas para incluir informações de professor
        const aulasProcessadas = aulasData.map((aula) => {
          // A estrutura de professor já deve estar correta do serviço
          const professorInfo = aula.professor;

          return {
            ...aula,
            professor: professorInfo,
          };
        });

        // Atualizar estados com dados recebidos
        setTodosAlunos(alunosData);
        setTodosProfessores(professoresData);
        setTodosExercicios(exerciciosData);
        setHistoricoAulas(aulasProcessadas);

        // Encontrar todas as aulas com status "atual" ou "ativa"
        const aulasAtivas = aulasProcessadas.filter(
          (aula) => aula.status === "atual" || aula.status === "ativa"
        );

        // Se há pelo menos uma aula ativa
        if (aulasAtivas.length > 0) {
          // Definir a primeira aula ativa como a atual
          setAulaAtual(aulasAtivas[0]);

          // Coletar todos os alunos de todas as aulas ativas
          const todosAlunosAulas = [];
          const alunosIds = new Set();

          // Para cada aula ativa
          aulasAtivas.forEach((aula) => {
            // Se a aula tem alunos
            if (aula.alunos && Array.isArray(aula.alunos)) {
              // Para cada aluno na aula
              aula.alunos.forEach((aluno) => {
                // Se ainda não processamos este aluno e ele tem um ID válido
                if (aluno && aluno.id && !alunosIds.has(aluno.id)) {
                  // Buscar dados completos do aluno
                  const alunoCompleto =
                    alunosData.find((a) => a.id === aluno.id) || aluno;

                  // Adicionar à lista de alunos
                  todosAlunosAulas.push({
                    ...alunoCompleto,
                    plano: alunoCompleto.plano || "N/A",
                    nivel: alunoCompleto.nivel || "N/A",
                    lesao: alunoCompleto.lesao || "Não",
                    objetivo: alunoCompleto.objetivo || "",
                  });

                  // Marcar ID como processado
                  alunosIds.add(aluno.id);
                }
              });
            }
          });

          // Atualizar estado local
          setAlunosNaAula(todosAlunosAulas);

          // Atualizar estado global apenas se a função existir
          if (typeof atualizarAlunosEmAula === "function") {
            atualizarAlunosEmAula(todosAlunosAulas);
          }
        } else {
          // Se não há aulas ativas
          setAulaAtual(null);
          setAlunosNaAula([]);

          // Atualizar estado global apenas se a função existir
          if (typeof atualizarAlunosEmAula === "function") {
            atualizarAlunosEmAula([]);
          }
        }

        // Finalizar carregamento
        setLoading(false);
        setInitialized(true);
        dadosCarregadosRef.current = true;
      } catch (error) {
        // Se o componente foi desmontado, não atualize o estado
        if (!isMounted) return;

        setError(`Erro ao carregar dados: ${error.message}`);
        setLoading(false);
      }
    };

    // Executar a busca de dados
    fetchDados();

    // Limpar função quando o componente for desmontado
    return () => {
      isMounted = false;
    };
  }, []); // Sem dependências para evitar loops

  // Sincronizar aulaAtual com historicoAulas para manter a contagem consistente
  useEffect(() => {
    // Se não estamos inicializados ou já estamos atualizando, não fazer nada
    if (!initialized || sincronizacaoRef.current) {
      return;
    }

    // Evitar loops definindo flag de sincronização
    sincronizacaoRef.current = true;
    const sincronizarAlunos = () => {
      try {
        // IMPORTANTE: Se estamos criando uma nova aula, não sincronizar, pois queremos começar com lista vazia
        if (novaAulaRef.current) {
          sincronizacaoRef.current = false;
          return;
        }

        // Buscar todas as aulas ativas - Assegurar que pegamos tanto "atual" quanto "ativa"
        const aulasAtivas = historicoAulas.filter(
          (aula) => aula.status === "atual" || aula.status === "ativa"
        );

        // Se não há aulas ativas, limpar os alunos e encerrar
        if (aulasAtivas.length === 0) {
          // Limpar estado local apenas se não estiver vazio
          if (alunosNaAula.length > 0) {
            setAlunosNaAula([]);

            // Atualizar também o estado global
            if (typeof atualizarAlunosEmAula === "function") {
              atualizarAlunosEmAula([]);
            }
          }
          sincronizacaoRef.current = false;
          return;
        }

        // IMPORTANTE: Se tivermos uma aula atual selecionada e estamos no modo de edição ou criação,
        // não sincronizar automaticamente os alunos de todas as aulas
        if (modoEdicao || showSelecao) {
          sincronizacaoRef.current = false;
          return;
        }

        // SOLUÇÃO CORRIGIDA: Sempre mostrar TODOS os alunos de TODAS as aulas ativas
        // Coletar todos os alunos das aulas ativas em um único array
        const todosAlunosAtivos = [];
        const alunoIdsProcessados = new Set(); // Usar Set para evitar duplicatas

        // Para cada aula ativa, acessar seus alunos
        aulasAtivas.forEach((aula) => {
          // Se a aula tem alunos
          if (aula.alunos && Array.isArray(aula.alunos)) {
            // Para cada aluno na aula
            aula.alunos.forEach((aluno) => {
              // Se o aluno é válido e ainda não foi processado
              if (aluno && aluno.id && !alunoIdsProcessados.has(aluno.id)) {
                // Buscar informações completas do aluno
                const alunoCompleto =
                  todosAlunos.find((a) => a.id === aluno.id) || aluno;

                // Adicionar à lista de alunos ativos
                todosAlunosAtivos.push({
                  ...alunoCompleto,
                  plano: alunoCompleto.plano || "N/A",
                  nivel: alunoCompleto.nivel || "N/A",
                  lesao: alunoCompleto.lesao || "Não",
                  objetivo: alunoCompleto.objetivo || "",
                });

                // Marcar como processado
                alunoIdsProcessados.add(aluno.id);
              }
            });
          }
        });

        // Verificar se há diferença entre os alunos atuais e os novos
        const alunosAtuaisIDs = new Set(alunosNaAula.map((a) => a.id));
        const novosAlunosIDs = new Set(todosAlunosAtivos.map((a) => a.id));

        // Verificar se os conjuntos são diferentes
        let precisaAtualizar = alunosAtuaisIDs.size !== novosAlunosIDs.size;

        if (!precisaAtualizar) {
          // Verificar se todos os IDs atuais estão nos novos IDs
          for (const id of alunosAtuaisIDs) {
            if (!novosAlunosIDs.has(id)) {
              precisaAtualizar = true;
              break;
            }
          }
        }

        // Se há diferença, atualizar o estado
        if (precisaAtualizar) {
          setAlunosNaAula(todosAlunosAtivos);

          // Atualizar também o estado global
          if (typeof atualizarAlunosEmAula === "function") {
            atualizarAlunosEmAula(todosAlunosAtivos);
          }
        }
      } catch (error) {
      } finally {
        // Garantir que a flag de sincronização seja resetada
        sincronizacaoRef.current = false;
      }
    };

    // Executar a sincronização
    sincronizarAlunos();
  }, [
    initialized,
    historicoAulas,
    todosAlunos,
    aulaAtual,
    alunosNaAula,
    modoEdicao,
    showSelecao,
  ]);

  // Ajuste do handleResize para melhor responsividade
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width <= 768) {
        // Ajustes para mobile
        setShowSelecao(false);
        if (document.querySelector(".historico-aulas")) {
          document.querySelector(".historico-aulas").style.maxHeight = "none";
        }
      } else {
        // Ajustes para desktop
        if (document.querySelector(".historico-aulas")) {
          document.querySelector(".historico-aulas").style.maxHeight = "800px";
        }
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Executa ao montar o componente

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Funções
  const abrirSelecao = () => {
    setShowSelecao(true);
  };

  const adicionarAlunoAula = async () => {
    if (!alunoSelecionado) {
      setErroMsg("Selecione um aluno para adicionar.");
      setShowErroModal(true);
      return;
    }

    try {
      setLoading(true);

      // Encontrar o aluno completo
      const alunoCompleto = todosAlunos.find(
        (a) => String(a.id) === String(alunoSelecionado)
      );

      if (!alunoCompleto) {
        setErroMsg("Aluno não encontrado na lista.");
        setShowErroModal(true);
        setLoading(false);
        return;
      }

      // Verificar se o aluno já está na aula
      if (alunosNaAula.some((a) => String(a.id) === String(alunoCompleto.id))) {
        setErroMsg("Este aluno já está na aula!");
        setShowErroModal(true);
        setLoading(false);
        return;
      }

      // Obter todas as aulas com status "atual"
      const aulasAtivas = historicoAulas.filter(
        (aula) => aula.status === "atual"
      );

      // Se não houver aulas ativas, mostrar erro
      if (aulasAtivas.length === 0) {
        setErroMsg(
          "Não há aula ativa disponível. Crie uma nova aula primeiro."
        );
        setShowErroModal(true);
        setLoading(false);
        return;
      }

      // Verificar se a primeira aula ativa já possui 4 alunos
      const primeiraAulaAtiva = aulasAtivas[0];
      const alunosAtuais = primeiraAulaAtiva.alunos || [];

      if (alunosAtuais.length >= 4) {
        setErroMsg("Esta aula já atingiu o limite máximo de 4 alunos.");
        setShowErroModal(true);
        setLoading(false);
        return;
      }

      // Preparar o aluno para adicionar
      const alunoParaAdicionar = {
        id: alunoCompleto.id,
        nome: alunoCompleto.nome,
        idade: alunoCompleto.idade || "N/A",
        plano: alunoCompleto.plano || "N/A",
        nivel: alunoCompleto.nivel || "N/A",
        lesao: alunoCompleto.lesao || "Não",
        objetivo: alunoCompleto.objetivo || "",
      };

      try {
        // Adicionar o novo aluno
        const aulaAtualizada = await aulasService.update(primeiraAulaAtiva.id, {
          ...primeiraAulaAtiva,
          alunos: [...alunosAtuais, alunoParaAdicionar],
          total_alunos: (alunosAtuais.length || 0) + 1,
        });

        // Atualizar o estado local
        const historicoAtualizado = historicoAulas.map((aula) =>
          aula.id === primeiraAulaAtiva.id ? aulaAtualizada : aula
        );

        setHistoricoAulas(historicoAtualizado);

        // Atualizar a aula atual se estivermos modificando a aula atual
        if (aulaAtual && aulaAtual.id === primeiraAulaAtiva.id) {
          setAulaAtual(aulaAtualizada);
        }

        // Atualizar a lista de alunos na aula
        const novosAlunosNaAula = [...alunosNaAula, alunoParaAdicionar];
        setAlunosNaAula(novosAlunosNaAula);

        // Atualizar no App.js
        if (typeof atualizarAlunosEmAula === "function") {
          atualizarAlunosEmAula(novosAlunosNaAula);
        }
      } catch (error) {
        setErroMsg(`Erro ao atualizar aula: ${error.message}`);
        setShowErroModal(true);
      }

      // Resetar seleção
      setAlunoSelecionado("");
    } catch (error) {
      setErroMsg(`Erro ao adicionar aluno: ${error.message}`);
      setShowErroModal(true);
    } finally {
      setLoading(false);
    }
  };

  const toggleExercicio = (exercicio) => {
    const jaExiste = exerciciosSelecionados.some((e) => e.id === exercicio.id);

    if (jaExiste) {
      // Remove o exercício
      setExerciciosSelecionados(
        exerciciosSelecionados.filter((e) => e.id !== exercicio.id)
      );
    } else {
      // Adiciona o exercício
      setExerciciosSelecionados([...exerciciosSelecionados, exercicio]);
    }
  };

  const isExercicioSelecionado = (id) => {
    return exerciciosSelecionados.some((e) => e.id === id);
  };

  const salvarAulaSemFinalizar = async () => {
    if (alunosNaAula.length === 0) {
      alert("Adicione pelo menos um aluno à aula antes de salvar.");
      return;
    }

    try {
      // Buscar o objeto completo do professor selecionado
      const professor = professorSelecionado
        ? todosProfessores.find(
            (p) => p.id.toString() === professorSelecionado.toString()
          )
        : null;

      // Garantir que o professor seja um objeto completo com id e nome
      const professorFormatado = professor
        ? {
            id: professor.id,
            nome: professor.nome,
          }
        : null;

      let aulaData;

      if (modoEdicao && aulaEditando) {
        // Atualizar aula existente
        aulaData = {
          ...aulaEditando,
          alunos: alunosNaAula,
          professor: professorFormatado,
          exercicios: exerciciosSelecionados,
          anotacoes: anotacoes || aulaEditando.anotacoes || "",
          status: "atual",
          updated_at: new Date().toISOString(),
        };

        aulaData = await aulasService.update(aulaData.id, aulaData);
      } else if (aulaAtual) {
        // Atualizar aula atual
        aulaData = {
          ...aulaAtual,
          alunos: alunosNaAula,
          professor: professorFormatado,
          exercicios: exerciciosSelecionados,
          anotacoes: anotacoes || aulaAtual.anotacoes || "",
          status: "atual",
          updated_at: new Date().toISOString(),
        };

        aulaData = await aulasService.update(aulaData.id, aulaData);
      } else {
        // Criar uma nova aula
        const hoje = new Date();
        const dataFormatada = hoje.toISOString().split("T")[0];
        aulaData = {
          data: dataFormatada,
          alunos: alunosNaAula,
          professor: professorFormatado,
          exercicios: exerciciosSelecionados,
          anotacoes: anotacoes || "",
          status: "atual",
          created_at: new Date().toISOString(),
        };

        aulaData = await aulasService.create(aulaData);
      }

      // Atualizar o estado local
      setAulaAtual(aulaData);

      // Atualizar o histórico de aulas no estado local
      const historicoAtualizado = historicoAulas.filter(
        (aula) => aula.id !== aulaData.id
      );
      const novoHistorico = [...historicoAtualizado, aulaData];
      setHistoricoAulas(novoHistorico);

      // Resetar formulário
      setShowSelecao(false);
      setModoEdicao(false);
      setAulaEditando(null);
      setAlunoSelecionado("");
      setProfessorSelecionado("");
      setExerciciosSelecionados([]);
      setAnotacoes("");

      // Manter os alunos na aula para continuar trabalhando
      if (atualizarAlunosEmAula) atualizarAlunosEmAula(aulaData.alunos);

      alert("Aula salva com sucesso!");
    } catch (error) {
      alert("Erro ao salvar aula: " + error.message);
    }
  };

  const salvarAula = async (finalizar = false) => {
    try {
      setSavingData(true);

      // Validar se há alunos na aula
      if (alunosNaAula.length === 0) {
        alert("Adicione pelo menos um aluno à aula antes de salvar.");
        return;
      }

      const professor = professorSelecionado
        ? todosProfessores.find((p) => p.id === parseInt(professorSelecionado))
        : null;

      let aulaAtualizada;

      if (aulaAtual) {
        // Atualizar aula atual existente
        aulaAtualizada = {
          ...aulaAtual,
          alunos: [...alunosNaAula],
          professor: professor || aulaAtual.professor || null,
          exercicios: [...exerciciosSelecionados],
          anotacoes: anotacoes || aulaAtual.anotacoes || "",
          status: finalizar ? "realizada" : "atual",
          total_alunos: alunosNaAula.length, // Garantir que o contador esteja correto
        };

        // Atualizar no Supabase
        aulaAtualizada = await aulasService.update(
          aulaAtual.id,
          aulaAtualizada
        );
      } else {
        // Criar uma nova aula se não existir aula atual
        const hoje = new Date();
        const dataFormatada = hoje.toISOString().split("T")[0];
        aulaAtualizada = {
          data: dataFormatada,
          alunos: [...alunosNaAula],
          professor: professor || null,
          exercicios: [...exerciciosSelecionados],
          anotacoes: anotacoes || "",
          status: finalizar ? "realizada" : "atual",
          dataCriacao: new Date().toISOString(),
          total_alunos: alunosNaAula.length, // Garantir que o contador esteja correto
        };

        // Criar no Supabase
        aulaAtualizada = await aulasService.create(aulaAtualizada);
      }

      // Atualizar estado local
      if (finalizar) {
        // Buscar aulas atualizadas do Supabase após a operação
        const aulasAtualizadas = await aulasService.getAll();
        setHistoricoAulas(aulasAtualizadas);

        setAulaAtual(null);
        setShowSuccessModal(true);
      } else {
        setAulaAtual(aulaAtualizada);

        // Garantir que temos os dados de alunos sincronizados
        if (aulaAtualizada.alunos && aulaAtualizada.alunos.length > 0) {
          setAlunosNaAula(aulaAtualizada.alunos);

          // Atualizar no App.js (se necessário)
          if (atualizarAlunosEmAula) {
            atualizarAlunosEmAula(aulaAtualizada.alunos);
          }
        }

        // Buscar aulas atualizadas do Supabase após a operação
        const aulasAtualizadas = await aulasService.getAll();
        setHistoricoAulas(aulasAtualizadas);
      }

      // Resetar estados após salvar
      if (finalizar) {
        setAlunoSelecionado("");
        setProfessorSelecionado("");
        setExerciciosSelecionados([]);
        setAlunosNaAula([]);
        setModoEdicao(false);
        setAulaEditando(null);

        // Atualizar no App.js
        if (atualizarAlunosEmAula) {
          atualizarAlunosEmAula([]);
        }
      }

      // Reiniciar tela
      setTimeout(() => {
        setShowSuccessModal(false);
        setShowSelecao(false);
      }, 2000);

      setSavingData(false);
    } catch (error) {
      setShowErroModal(true);
      setErroMsg(`Erro ao salvar aula: ${error.message}`);
      setSavingData(false);
    }
  };

  const iniciarNovaAula = async () => {
    try {
      // Ativar o modo "nova aula" para bloquear a sincronização automática
      novaAulaRef.current = true;

      // Mostrar o painel de seleção logo no início, para garantir uma resposta visual imediata
      setShowSelecao(true);
      setSavingData(true);

      // Reset completo dos estados
      setAulaAtual(null);
      setAlunoSelecionado("");
      setProfessorSelecionado("");
      setExerciciosSelecionados([]);

      // IMPORTANTE: Limpar a lista de alunos local para não trazer alunos de outras aulas
      // Quando iniciamos uma nova aula, não devemos ter nenhum aluno selecionado
      setAlunosNaAula([]);

      // Garantir que o estado global também seja limpo
      if (typeof atualizarAlunosEmAula === "function") {
        atualizarAlunosEmAula([]);
      }

      setModoEdicao(false);
      setAulaEditando(null);
      setActiveDropdown(null);
      setAnotacoes("");

      // Selecionar o primeiro professor disponível (para garantir que sempre tenha um professor)
      const primeiroProfessor =
        todosProfessores.length > 0
          ? {
              id: todosProfessores[0].id,
              nome: todosProfessores[0].nome,
            }
          : null;

      // Se temos um professor, vamos definir o professorSelecionado
      if (primeiroProfessor) {
        setProfessorSelecionado(primeiroProfessor.id.toString());
      }

      // Criar nova aula com o professor incluído
      const hoje = new Date();
      // Formatando a data no formato ISO 8601 (YYYY-MM-DD) para o Supabase
      const dataFormatada = hoje.toISOString().split("T")[0];

      const novaAulaVazia = {
        data: dataFormatada,
        alunos: [], // Garantir que a nova aula começa sem alunos
        total_alunos: 0,
        exercicios: [],
        status: "atual",
        professor: primeiroProfessor,
      };

      // Buscar aulas atuais apenas para fins de logging
      const todasAulas = await aulasService.getAll();

      const aulasAtuais = todasAulas.filter((aula) => aula.status === "atual");

      // Criar a nova aula no backend

      const aulaResponse = await aulasService.create(novaAulaVazia);

      // Definir como aula atual
      setAulaAtual({
        ...aulaResponse,
        alunos: [], // Garantir que não há alunos nesta nova aula
      });

      // IMPORTANTE: NÃO atualizar o estado global de alunosEmAula aqui com alunos de outras aulas
      if (typeof atualizarAlunosEmAula === "function") {
        // Passar array vazio para a nova aula
        atualizarAlunosEmAula([]);
      }

      // Atualizar o histórico de aulas para incluir a nova aula
      setHistoricoAulas((prev) => [
        { ...aulaResponse, alunos: [] }, // Garantir que não há alunos ao adicionar no histórico
        ...prev.filter((a) => a.id !== aulaResponse.id),
      ]);

      // Resetar paginação
      setPaginaAtual(1);
      setSavingData(false);

      // Scroll suave até o formulário de nova aula
      setTimeout(() => {
        const selecaoElement = document.querySelector(
          ".selecao-aluno-panel-embedded"
        );
        if (selecaoElement) {
          // Rolar até o formulário de nova aula
          selecaoElement.scrollIntoView({ behavior: "smooth", block: "start" });

          // Focar no primeiro campo do formulário (select do professor) para melhor experiência
          const selectProfessor =
            selecaoElement.querySelector(".select-professor");
          if (selectProfessor) {
            selectProfessor.focus();
          }
        }
      }, 100);
    } catch (error) {
      // Manter o formulário aberto mesmo se houver erro
      setShowErroModal(true);
      setErroMsg("Erro ao iniciar nova aula no Supabase: " + error.message);
      setSavingData(false);
    }
  };

  const editarAula = (aula) => {
    // Primeiro, configurar o modo de edição e a aula sendo editada
    setModoEdicao(true);

    // IMPORTANTE: Fazer uma cópia profunda da aula para evitar referências compartilhadas
    const aulaParaEditar = JSON.parse(JSON.stringify(aula));

    // Definir a aula sendo editada
    setAulaEditando(aulaParaEditar);

    // CRUCIAL: Definir esta aula como a atual para evitar que sincronização mude para outra aula
    setAulaAtual(aulaParaEditar);

    // Depois, carregar os dados nos estados correspondentes
    setAlunosNaAula(aulaParaEditar.alunos ? [...aulaParaEditar.alunos] : []);
    setProfessorSelecionado(
      aulaParaEditar.professor ? aulaParaEditar.professor.id.toString() : ""
    );
    setExerciciosSelecionados(
      aulaParaEditar.exercicios ? [...aulaParaEditar.exercicios] : []
    );
    setAnotacoes(aulaParaEditar.anotacoes || "");

    // Limpar estados temporários
    setAlunoSelecionado("");
    setPesquisaExercicio("");

    // Por último, mostrar o painel de seleção
    setShowSelecao(true);

    // Adicionar um pequeno atraso para garantir que o formulário seja renderizado antes de rolar
    setTimeout(() => {
      // Rolar até o formulário de edição de aula
      const formularioElement = document.querySelector(
        ".selecao-aluno-panel-embedded"
      );
      if (formularioElement) {
        formularioElement.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });

        // Focar no primeiro campo do formulário para melhor experiência do usuário
        const selectProfessor =
          formularioElement.querySelector(".select-professor");
        if (selectProfessor) {
          selectProfessor.focus();
        }
      }
    }, 100);
  };

  const prepararCancelarAula = (aula) => {
    setAulaCancelar(aula);
    setShowConfirmCancelar(true);
    setActiveDropdown(null); // Fecha o dropdown quando abrir o modal de confirmação
  };

  const confirmarCancelarAula = async () => {
    if (!aulaCancelar) return;

    try {
      // Atualizar o status da aula para "cancelada" no Supabase

      await aulasService.updateStatus(aulaCancelar.id, "cancelada");

      // Buscar a aula atualizada do Supabase
      const aulaAtualizada = await aulasService.getById(aulaCancelar.id);

      // Atualizar o histórico de aulas no estado local
      const aulasCanceladas = historicoAulas.map((aula) =>
        aula.id === aulaCancelar.id ? { ...aula, status: "cancelada" } : aula
      );
      setHistoricoAulas(aulasCanceladas);

      // Se a aula cancelada for a atual, atualizar também
      if (aulaAtual && aulaAtual.id === aulaCancelar.id) {
        const aulaAtualCancelada = { ...aulaAtual, status: "cancelada" };
        setAulaAtual(aulaAtualCancelada);

        // Atualizar histórico dos alunos quando a aula é cancelada
        atualizarHistoricoAlunos(aulaAtualCancelada);
      } else {
        // Se não for a aula atual, busca a aula cancelada no histórico
        const aulaCancelada = aulasCanceladas.find(
          (a) => a.id === aulaCancelar.id
        );
        if (aulaCancelada) {
          atualizarHistoricoAlunos(aulaCancelada);
        }
      }

      setShowConfirmCancelar(false);
      setAulaCancelar(null);
      setActiveDropdown(null); // Fecha o dropdown ao fechar o modal

      alert("Aula cancelada com sucesso!");
    } catch (error) {
      alert("Erro ao cancelar a aula: " + error.message);
    }
  };

  const exibirDetalhesAula = (aula) => {
    setAulaAtual(aula);
    setShowDetalhesAula(true);
    setModalAberto(true);
  };

  const renderizarModalDetalhes = () => {
    if (!aulaAtual) return null;

    return (
      <div className="modal-detalhes-overlay">
        <div className="modal-detalhes-content">
          <div className="modal-detalhes-header">
            <h2>Detalhes da Aula</h2>
            <button
              className="btn-fechar"
              onClick={() => setShowDetalhesAula(false)}
            >
              ×
            </button>
          </div>
          <div className="modal-detalhes-body">
            <div className="detalhes-data">
              <p>
                <strong>Data:</strong> {aulaAtual.data}
              </p>
              <p>
                <strong>Professor:</strong>{" "}
                {aulaAtual.professor
                  ? aulaAtual.professor.nome
                  : "Não definido"}
              </p>
              <p>
                <strong>Status:</strong> {getStatusLabel(aulaAtual.status)}
              </p>
            </div>

            {/* Lesões da aula */}
            {aulaAtual.lesoes && (
              <div className="detalhes-secao">
                <h3>Lesões/Restrições</h3>
                <div className="detalhes-texto">{aulaAtual.lesoes}</div>
              </div>
            )}

            {/* Anotações da aula */}
            <div className="detalhes-secao">
              <h3>Anotações da Aula</h3>
              <div className="detalhes-texto">
                {aulaAtual.anotacoes
                  ? aulaAtual.anotacoes
                  : "Nenhuma anotação registrada"}
              </div>
            </div>

            <div className="detalhes-alunos">
              <h3>Alunos Presentes</h3>
              <ul className="lista-alunos-presentes">
                {aulaAtual.alunos &&
                  aulaAtual.alunos.map((aluno) => {
                    // Buscar informações completas do aluno no estado
                    const alunoCompleto =
                      todosAlunos.find((a) => a.id === aluno.id) || aluno;

                    return (
                      <li key={aluno.id} className="aluno-item">
                        <div className="aluno-nome-idade">
                          <strong>{aluno.nome}</strong> - {aluno.idade} anos
                        </div>
                        {alunoCompleto.objetivo && (
                          <div className="aluno-objetivo">
                            <strong>Objetivo:</strong> {alunoCompleto.objetivo}
                          </div>
                        )}
                        {alunoCompleto.lesao &&
                          alunoCompleto.lesao !== "Não" && (
                            <div className="aluno-lesao">
                              <strong>Lesão/Restrição:</strong>{" "}
                              {alunoCompleto.lesao}
                            </div>
                          )}
                      </li>
                    );
                  })}
              </ul>
            </div>

            <div className="visualizacao-exercicios">
              <h3>Exercícios</h3>
              {aulaAtual.exercicios && aulaAtual.exercicios.length > 0 ? (
                <>
                  <div className="exercicios-count">
                    <p>
                      Total de exercícios:{" "}
                      <span className="exercicios-total">
                        {aulaAtual.exercicios.length}
                      </span>
                    </p>
                  </div>
                  <ul className="lista-exercicios-modal">
                    {aulaAtual.exercicios.map((exercicio, index) => (
                      <li
                        key={exercicio.id || index}
                        className="exercicio-item-modal"
                      >
                        <strong>{exercicio.nome}</strong>
                        <div>{exercicio.musculatura}</div>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p>Nenhum exercício registrado para esta aula.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const todasAulas = () => {
    return historicoAulas.slice(0, 1000);
  };

  const aulasOrdenadas = () => {
    const aulasParaExibir = todasAulas();

    // Ordenar por data mais recente e status
    return [...aulasParaExibir].sort((a, b) => {
      // Coloca aulas com status "atual" no topo
      if (a.status === "atual" && b.status !== "atual") return -1;
      if (a.status !== "atual" && b.status === "atual") return 1;

      // Para aulas com o mesmo status, ordena por data
      const dataA = new Date(a.data.split("/").reverse().join("-"));
      const dataB = new Date(b.data.split("/").reverse().join("-"));
      return dataB - dataA;
    });
  };

  const marcarComoRealizada = async (aula) => {
    try {
      setSavingData(true);

      // Definir a aula que será finalizada
      setAulaParaFinalizar(aula);

      // Mostrar o modal para finalizar a aula
      setShowAulaFinalizadaModal(true);

      setSavingData(false);
    } catch (error) {
      setShowErroModal(true);
      setErroMsg(`Erro ao preparar finalização da aula: ${error.message}`);
      setSavingData(false);
    }
  };

  const handleSalvarAulaRealizada = async (dadosAulaRealizada) => {
    try {
      setSavingData(true);

      // Fechar o modal
      setShowAulaFinalizadaModal(false);

      // Obter a aula a ser finalizada
      const aula = aulaParaFinalizar;

      if (!aula) {
        return;
      }

      // Criar objeto com os dados atualizados - removendo avaliacoes que não existe no schema
      const aulaAtualizada = {
        ...aula,
        status: "realizada",
        anotacoes: dadosAulaRealizada.anotacoes || aula.anotacoes || "",
        // Não incluir o campo avaliacoes pois ele não existe no schema do banco
      };

      // Atualizar no Supabase
      await aulasService.update(aula.id, aulaAtualizada);

      // Atualizar o histórico local
      const historicoAtualizado = historicoAulas.map((a) =>
        a.id === aula.id ? aulaAtualizada : a
      );

      setHistoricoAulas(historicoAtualizado);

      // Se a aula finalizada for a aula atual, limpar o estado
      if (aulaAtual && aulaAtual.id === aula.id) {
        setAulaAtual(null);
      }

      // Limpar o estado da aula para finalizar
      setAulaParaFinalizar(null);

      // Mostrar mensagem de sucesso
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 2000);

      setSavingData(false);
    } catch (error) {
      setShowErroModal(true);
      setErroMsg(`Erro ao finalizar aula: ${error.message}`);
      setSavingData(false);
    }
  };

  const contarAulasAtuais = () => {
    return historicoAulas.filter(
      (aula) => aula.status === "atual" || aula.status === "ativa"
    ).length;
  };

  const totalAulasAtuais = contarAulasAtuais();

  const removerAlunoDaAula = async (alunoId) => {
    try {
      setSavingData(true);

      // Remover aluno do estado local primeiro para feedback imediato
      const alunosAtualizados = alunosNaAula.filter((a) => a.id !== alunoId);
      setAlunosNaAula(alunosAtualizados);

      // Atualizar App.js para sincronização imediata
      if (typeof atualizarAlunosEmAula === "function") {
        atualizarAlunosEmAula(alunosAtualizados);
      }

      // Obter todas as aulas ativas
      const aulasAtivas = historicoAulas.filter(
        (aula) => aula.status === "atual"
      );

      // Para cada aula ativa
      for (const aula of aulasAtivas) {
        // Verificar se o aluno está nesta aula
        if (aula.alunos && aula.alunos.some((a) => a.id === alunoId)) {
          try {
            // Remover o aluno da aula
            const novosAlunosAula = aula.alunos.filter((a) => a.id !== alunoId);

            // Atualizar a aula no servidor
            const aulaAtualizada = await aulasService.update(aula.id, {
              ...aula,
              alunos: novosAlunosAula,
              total_alunos: novosAlunosAula.length,
            });

            // Atualizar o histórico local
            setHistoricoAulas((prev) =>
              prev.map((a) => (a.id === aula.id ? aulaAtualizada : a))
            );

            // Se esta for a aula atual, atualizar também
            if (aulaAtual && aulaAtual.id === aula.id) {
              setAulaAtual(aulaAtualizada);
            }
          } catch (error) {
            // Continuar tentando remover das outras aulas
          }
        }
      }

      setSavingData(false);
    } catch (error) {
      setShowErroModal(true);
      setErroMsg(`Erro ao remover aluno: ${error.message}`);
      setSavingData(false);
    }
  };

  // Função para renderizar a seção de Alunos Atuais
  const renderizarAlunosAtuais = () => {
    // Verificar se há aulas ativas
    const aulasAtuais = historicoAulas.filter(
      (aula) => aula.status === "atual" || aula.status === "ativa"
    );

    // Aplicar classes de lesão
    const getLesaoClassGeral = (lesao) => {
      switch (lesao) {
        case "Sim - Lesao Grave":
        case "Sim - Grave":
          return "lesao-grave";
        case "Sim - Lesao Moderada":
        case "Sim - Moderada":
          return "lesao-moderada";
        default:
          return "";
      }
    };

    // Limitar a 8 alunos para a exibição
    const alunosParaExibir = alunosNaAula.slice(0, 8);

    return (
      <div className="alunos-atuais">
        <h2>Alunos em Aula</h2>

        {loading ? (
          <p className="carregando">Carregando alunos...</p>
        ) : aulasAtuais.length === 0 ? (
          <p className="sem-registros">Nenhuma aula atual registrada.</p>
        ) : alunosParaExibir.length === 0 ? (
          <p className="sem-registros">
            Nenhum aluno adicionado às aulas atuais.
          </p>
        ) : (
          <div className="alunos-atuais-grid">
            {alunosParaExibir.map((aluno) => (
              <div
                key={aluno.id}
                className={`card-aluno-atual ${getLesaoClassGeral(
                  aluno.lesao
                )}`}
              >
                <div className="card-header">
                  <h3>{aluno.nome}</h3>
                  <span
                    className={`nivel-badge nivel-${(
                      aluno.nivel || "iniciante"
                    ).toLowerCase()}`}
                  >
                    {aluno.nivel || "N/A"}
                  </span>
                </div>
                <div className="card-body">
                  <p className="aluno-plano">Plano: {aluno.plano || "N/A"}</p>
                  <p>Idade: {aluno.idade || "N/A"} anos</p>
                  <p>Objetivo: {aluno.objetivo || "N/A"}</p>
                  <p>Lesão: {aluno.lesao !== "Nao" ? aluno.lesao : "Não"}</p>
                </div>
                <div className="card-footer">
                  {renderizarUltimoTreino(aluno)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Renderizar o painel de informações do último treino e do aluno atual
  const renderizarUltimoTreino = (aluno) => {
    // Buscar informações adicionais do aluno no estado atual
    const alunoCompleto = todosAlunos.find((a) => a.id === aluno.id) || aluno;

    const ultimoTreino =
      alunoCompleto.historicoAulas && alunoCompleto.historicoAulas.length > 0
        ? alunoCompleto.historicoAulas[alunoCompleto.historicoAulas.length - 1]
        : null;

    if (!ultimoTreino) {
      return <p>Nenhum treino registrado.</p>;
    }

    return (
      <div className="ultimo-treino-container">
        <p>
          <strong>Data:</strong> {formatarData(ultimoTreino.data)}
        </p>
        <p>
          <strong>Status:</strong> {getStatusLabel(ultimoTreino.status)}
        </p>
      </div>
    );
  };

  // Ajuste do containerStyle para garantir layout responsivo
  const containerStyle = {
    maxWidth: "100%",
    overflow: "hidden",
    position: "relative",
    minHeight: "100vh",
  };

  // Adicionar após o useEffect para sincronizar alunosNaAula com aulaAtual
  useEffect(() => {
    // Verificar alunos inativos por mais de 7 dias
    const verificarAlunosInativos = () => {
      if (!todosAlunos.length) return;

      const hoje = new Date();
      const seteDiasAtras = new Date();
      seteDiasAtras.setDate(hoje.getDate() - 7);

      const alunosInativos = todosAlunos.filter((aluno) => {
        // Se aluno não estiver ativo, ignorar
        if (aluno.status === "inativo") return false;

        // Se não tiver histórico de aulas, considerar inativo
        if (!aluno.historicoAulas || aluno.historicoAulas.length === 0) {
          return true;
        }

        // Verificar a data da última aula
        const ultimaAula = aluno.historicoAulas
          .filter((aula) => aula.status === "realizada") // Considerar apenas aulas realizadas
          .sort((a, b) => {
            // Converter datas para objetos Date
            const dataA = new Date(a.data.split("/").reverse().join("-"));
            const dataB = new Date(b.data.split("/").reverse().join("-"));
            return dataB - dataA; // Ordenar da mais recente para a mais antiga
          })[0]; // Pegar a primeira (mais recente)

        // Se não tiver aulas realizadas, considerar inativo
        if (!ultimaAula) return true;

        // Converter a data da última aula para objeto Date
        const partes = ultimaAula.data.split("/");
        const dataUltimaAula = new Date(
          partes[2], // ano
          partes[1] - 1, // mês (0-11)
          partes[0] // dia
        );

        // Verificar se a última aula foi há mais de 7 dias
        return dataUltimaAula < seteDiasAtras;
      });

      if (alunosInativos.length > 0) {
        // Adicionar alertas para cada aluno inativo
        const novosAlertas = alunosInativos.map((aluno) => ({
          id: `inativo-${aluno.id}-${Date.now()}`,
          tipo: "aviso",
          mensagem: `${
            aluno.nome
          } não comparece há mais de 7 dias. Último treino: ${
            aluno.historicoAulas && aluno.historicoAulas.length > 0
              ? aluno.historicoAulas[aluno.historicoAulas.length - 1].data
              : "Nunca treinou"
          }.`,
        }));

        // Atualizar o estado de alertas
        setAlertas((alertasAnteriores) => [
          ...alertasAnteriores,
          ...novosAlertas,
        ]);
      }
    };

    // Executar a verificação quando os dados dos alunos forem carregados
    if (initialized && todosAlunos.length > 0) {
      verificarAlunosInativos();
    }
  }, [initialized, todosAlunos]);

  return (
    <div className="geral-container" style={containerStyle}>
      {/* Adicionar indicador de carregamento */}
      {loading && <div className="loading-indicator">Carregando dados...</div>}

      {/* Adicionar indicador de salvamento */}
      {savingData && <div className="saving-indicator">Salvando...</div>}

      <div className="geral-header">
        <h1>Dashboard</h1>
        <div className="header-buttons">
          <button
            className="btn-nova-aula"
            onClick={iniciarNovaAula}
            disabled={savingData}
          >
            + Nova Aula
          </button>
        </div>
      </div>

      {/* Cards do Dashboard */}
      <div className="dashboard-cards">
        <div className="card total-alunos">
          <h2>Total de Alunos</h2>
          <p className="numero-destaque">{todosAlunos.length}</p>
        </div>
        <div className="card aulas-atuais">
          <h2>Aulas Atuais</h2>
          <p className="numero-destaque">
            {historicoAulas
              ? historicoAulas.filter(
                  (aula) => aula.status === "atual" || aula.status === "ativa"
                ).length
              : 0}
          </p>
        </div>
        <div className="card aulas-hoje">
          <h2>Aulas Realizadas</h2>
          <p className="numero-destaque">
            {
              historicoAulas.filter((aula) => aula.status === "realizada")
                .length
            }
          </p>
        </div>
      </div>

      {/* Componente de alertas */}
      <AlertasBox />

      {/* Modal de seleção de alunos/prof para a aula - agora posicionado abaixo do dashboard */}
      {showSelecao && (
        <div className="selecao-aluno-panel-embedded">
          <div className="selecao-aluno-content">
            <h2>{modoEdicao ? "Editar Aula" : "Nova Aula"}</h2>

            {/* Seleção de professor */}
            <div className="selecao-professor">
              <h3>Selecione o Professor</h3>
              <select
                className="select-professor"
                value={professorSelecionado}
                onChange={(e) => setProfessorSelecionado(e.target.value)}
              >
                <option value="">Selecione um professor</option>
                {todosProfessores.map((professor) => (
                  <option key={professor.id} value={professor.id}>
                    {professor.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="selecao-contador">
              Alunos adicionados: {alunosNaAula.length}
              {alunosNaAula.length >= 4 && " (Máximo atingido)"}
            </div>

            <select
              className="select-aluno"
              value={alunoSelecionado}
              onChange={(e) => setAlunoSelecionado(e.target.value)}
              disabled={alunosNaAula.length >= 4}
            >
              <option value="">Selecione um aluno</option>
              {todosAlunos
                .filter(
                  (aluno) =>
                    !alunosNaAula.some((alunoAula) => alunoAula.id === aluno.id)
                )
                .map((aluno) => (
                  <option key={aluno.id} value={aluno.id}>
                    {aluno.nome}
                  </option>
                ))}
            </select>

            <button
              className="btn-adicionar-verde"
              onClick={adicionarAlunoAula}
              disabled={!alunoSelecionado || alunosNaAula.length >= 4}
            >
              Adicionar Aluno
            </button>

            {/* Exibição de alunos selecionados para a aula */}
            {alunosNaAula.length > 0 && (
              <div className="alunos-selecionados">
                <h3>Alunos na aula:</h3>
                <div className="lista-alunos-selecionados">
                  {alunosNaAula.map((aluno) => (
                    <div key={aluno.id} className="aluno-selecionado-item">
                      {aluno.nome}
                      <button
                        className="btn-remover-aluno"
                        onClick={() => removerAlunoDaAula(aluno.id)}
                        title="Remover aluno"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Seleção de exercícios */}
            <div className="selecao-exercicios">
              <h3>Selecione os Exercícios</h3>
              <div className="pesquisa-exercicios">
                <input
                  type="text"
                  placeholder="Buscar por nome ou musculatura..."
                  value={pesquisaExercicio}
                  onChange={(e) => setPesquisaExercicio(e.target.value)}
                  className="input-pesquisa"
                />
              </div>

              <div className="contador-exercicios">
                Exercícios selecionados: {exerciciosSelecionados.length}
              </div>

              <div className="lista-exercicios">
                {todosExercicios
                  .filter(
                    (exercicio) =>
                      exercicio.nome
                        .toLowerCase()
                        .includes(pesquisaExercicio.toLowerCase()) ||
                      exercicio.musculatura
                        .toLowerCase()
                        .includes(pesquisaExercicio.toLowerCase())
                  )
                  .map((exercicio) => (
                    <div
                      key={exercicio.id}
                      className={`exercicio-item ${
                        exerciciosSelecionados.some(
                          (ex) => ex.id === exercicio.id
                        )
                          ? "selecionado"
                          : ""
                      }`}
                      onClick={() => toggleExercicio(exercicio)}
                    >
                      <div className="exercicio-nome">{exercicio.nome}</div>
                      <div className="exercicio-musculatura">
                        {exercicio.musculatura}
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Anotações sobre a aula */}
            <div className="selecao-anotacoes">
              <h3>Anotações sobre a Aula</h3>
              <textarea
                className="input-anotacoes"
                placeholder="Registre observações, evolução de alunos, ou notas importantes sobre a aula..."
                value={anotacoes}
                onChange={(e) => setAnotacoes(e.target.value)}
                rows={3}
              ></textarea>
            </div>

            <div className="selecao-actions">
              <button
                className="btn-cancelar"
                onClick={() => {
                  setShowSelecao(false);
                  setAlunosNaAula([]);
                  setAlunoSelecionado("");
                  setProfessorSelecionado("");
                  setExerciciosSelecionados([]);
                  setAnotacoes("");
                  setModoEdicao(false);
                  setAulaEditando(null);
                }}
              >
                Cancelar
              </button>
              <button
                className="btn-salvar"
                onClick={() => {
                  if (modoEdicao) {
                    salvarAulaSemFinalizar();
                  } else {
                    salvarAula();
                  }
                }}
                disabled={modoEdicao ? false : alunosNaAula.length === 0}
              >
                {modoEdicao ? "Salvar Alterações" : "Salvar Aula"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exibição de alunos na aula atual */}
      {renderizarAlunosAtuais()}

      {/* Histórico de Aulas */}
      <div
        className="historico-aulas"
        style={{ maxHeight: "70vh", overflowY: "auto" }}
      >
        <h2>Histórico de Aulas</h2>
        {historicoAulas.length > 0 ? (
          <table className="tabela-historico">
            <thead>
              <tr>
                <th>Data</th>
                <th>Professor</th>
                <th>Alunos</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {aulasOrdenadas().map((aula) => {
                // Calcular o número de alunos a partir de várias fontes possíveis
                const numAlunos = aula.alunos
                  ? aula.alunos.length
                  : aula.total_alunos || aula.totalAlunos || 0;

                return (
                  <tr key={aula.id} className={`aula-${aula.status}`}>
                    <td>{formatarData(aula.data)}</td>
                    <td>
                      {aula.professor ? aula.professor.nome : "Sem professor"}
                    </td>
                    <td>{numAlunos}</td>
                    <td>{getStatusLabel(aula.status)}</td>
                    <td className="acoes-aula">
                      <button
                        className="btn-detalhes"
                        onClick={() => exibirDetalhesAula(aula)}
                      >
                        Ver Detalhes
                      </button>
                      {aula.status === "atual" && (
                        <>
                          <button
                            className="btn-editar"
                            onClick={() => editarAula(aula)}
                          >
                            Editar Aula
                          </button>
                          <button
                            className="btn-realizar"
                            onClick={() => marcarComoRealizada(aula)}
                          >
                            Marcar Realizada
                          </button>
                          <button
                            className="btn-cancelar"
                            onClick={() => prepararCancelarAula(aula)}
                          >
                            Cancelar
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p>Nenhum registro encontrado no histórico.</p>
        )}
      </div>

      {/* Modal de detalhes da aula */}
      {showDetalhesAula && renderizarModalDetalhes()}

      {/* Modal de erro */}
      {showErroModal && (
        <div className="modal-overlay">
          <div className="modal-content erro-modal">
            <div className="modal-header">
              <h3>Erro</h3>
              <button
                className="btn-fechar"
                onClick={() => setShowErroModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>{erroMsg}</p>
            </div>
            <div className="modal-footer">
              <button
                className="btn-ok"
                onClick={() => setShowErroModal(false)}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de sucesso */}
      {showSuccessModal && (
        <div className="modal-overlay">
          <div className="modal-content success-modal">
            <div className="modal-header">
              <h3>Sucesso</h3>
            </div>
            <div className="modal-body">
              <p>Operação realizada com sucesso!</p>
            </div>
          </div>
        </div>
      )}

      {/* Modal para confirmar cancelamento da aula */}
      {showConfirmCancelar && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Cancelar Aula</h3>
              <button
                className="btn-fechar"
                onClick={() => setShowConfirmCancelar(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>Tem certeza que deseja cancelar esta aula?</p>
              <p>Data: {aulaCancelar && formatarData(aulaCancelar.data)}</p>
              <p>
                Professor:{" "}
                {aulaCancelar && aulaCancelar.professor
                  ? aulaCancelar.professor.nome
                  : "Sem professor"}
              </p>
              <p>
                Alunos:{" "}
                {aulaCancelar && aulaCancelar.alunos
                  ? aulaCancelar.alunos.length
                  : 0}
              </p>
            </div>
            <div className="modal-footer">
              <button
                className="btn-cancelar"
                onClick={() => setShowConfirmCancelar(false)}
              >
                Não
              </button>
              <button className="btn-confirmar" onClick={confirmarCancelarAula}>
                Sim, Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para finalizar aula (Marcar como Realizada) */}
      {showAulaFinalizadaModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Finalizar Aula</h3>
              <button
                className="btn-fechar"
                onClick={() => setShowAulaFinalizadaModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>Finalizar a aula e marcar como realizada?</p>
              <p>
                Data:{" "}
                {aulaParaFinalizar && formatarData(aulaParaFinalizar.data)}
              </p>
              <p>
                Professor:{" "}
                {aulaParaFinalizar && aulaParaFinalizar.professor
                  ? aulaParaFinalizar.professor.nome
                  : "Sem professor"}
              </p>
              <p>
                Alunos:{" "}
                {aulaParaFinalizar && aulaParaFinalizar.alunos
                  ? aulaParaFinalizar.alunos.length
                  : 0}
              </p>

              <div className="form-group">
                <label>Anotações adicionais:</label>
                <textarea
                  className="input-anotacoes"
                  placeholder="Adicione observações sobre como foi a aula..."
                  value={anotacoes}
                  onChange={(e) => setAnotacoes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn-cancelar"
                onClick={() => setShowAulaFinalizadaModal(false)}
              >
                Não
              </button>
              <button
                className="btn-confirmar"
                onClick={() => handleSalvarAulaRealizada({ anotacoes })}
              >
                Finalizar Aula
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Geral;

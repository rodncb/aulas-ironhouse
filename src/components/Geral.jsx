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
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState("");
  const [aulas, setAulas] = useState([]);
  const [loading, setLoading] = useState(false); // Alterado de true para false para garantir que fetchDados() seja chamado
  const [savingData, setSavingData] = useState(false); // Estado para controlar salvamento de dados
  const [error, setError] = useState(null); // Estado para erros gerais
  // Estado para controlar alertas
  const [alertas, setAlertas] = useState([]);
  // Novo estado para armazenar os últimos treinos dos alunos em aula
  const [ultimosTreinosMap, setUltimosTreinosMap] = useState({});

  // Refs para controle de atualizações cíclicas
  const sincronizacaoRef = useRef(false);
  const dadosCarregadosRef = useRef(false); // Definindo a ref que estava faltando
  const novaAulaRef = useRef(false); // Definindo a ref que estava faltando

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

  const adicionarAluno = async () => {
    if (!alunoSelecionado) return;

    setLoading(true);
    try {
      const alunoCompleto = todosAlunos.find(
        (a) => String(a.id) === String(alunoSelecionado)
      );

      if (!alunoCompleto) {
        setErroMsg("Aluno não encontrado na lista.");
        setShowErroModal(true);
        setLoading(false);
        return;
      }

      // --- NOVA VERIFICAÇÃO ---
      // Verificar se o aluno já está em ALGUMA aula ativa ou atual
      const aulasAtivasGeral = historicoAulas.filter(
        (aula) => aula.status === "atual" || aula.status === "ativa"
      );
      const alunoJaEmAulaAtiva = aulasAtivasGeral.some(
        (aula) =>
          aula.alunos &&
          aula.alunos.some((a) => String(a.id) === String(alunoCompleto.id))
      );

      // Permitir adicionar se estiver editando a mesma aula onde o aluno já está
      const editandoAulaDoAluno =
        modoEdicao &&
        aulaEditando &&
        aulaEditando.alunos &&
        aulaEditando.alunos.some(
          (a) => String(a.id) === String(alunoCompleto.id)
        );

      if (alunoJaEmAulaAtiva && !editandoAulaDoAluno) {
        setErroMsg(
          `O aluno ${alunoCompleto.nome} já está em uma aula ativa. Finalize ou cancele a aula anterior antes de adicioná-lo a uma nova.`
        );
        setShowErroModal(true);
        setLoading(false);
        return;
      }
      // --- FIM DA NOVA VERIFICAÇÃO ---

      // Determinar a aula alvo para adicionar o aluno
      let aulaAlvo = null;
      if (modoEdicao && aulaEditando) {
        aulaAlvo = aulaEditando;
      } else if (aulaAtual) {
        aulaAlvo = aulaAtual;
      }

      // --- REMOVIDA CRIAÇÃO AUTOMÁTICA DE AULA ---
      // A aula agora DEVE existir (criada em iniciarNovaAula)
      if (!aulaAlvo) {
        setErroMsg(
          "Nenhuma aula ativa encontrada para adicionar o aluno. Tente iniciar uma nova aula primeiro."
        );
        setShowErroModal(true);
        setLoading(false);
        return;
      }
      // --- FIM DA REMOÇÃO ---

      // Verificar limite de alunos na aula alvo
      const limiteAlunos = 10; // Definir limite
      if (aulaAlvo.alunos && aulaAlvo.alunos.length >= limiteAlunos) {
        setErroMsg(`A aula já atingiu o limite de ${limiteAlunos} alunos.`);
        setShowErroModal(true);
        setLoading(false);
        return;
      }

      // Verificar se o aluno já está na aula alvo (redundante com a verificação global, mas seguro)
      const alunoJaNaAulaAlvo =
        aulaAlvo.alunos &&
        aulaAlvo.alunos.some((a) => String(a.id) === String(alunoCompleto.id));

      if (alunoJaNaAulaAlvo) {
        setErroMsg(`O aluno ${alunoCompleto.nome} já está nesta aula.`);
        setShowErroModal(true);
        setLoading(false);
        return;
      }

      // Adicionar aluno à aula no backend
      const aulaAtualizadaBackend = await aulasService.adicionarAluno(
        aulaAlvo.id,
        alunoCompleto.id
      );

      // Atualizar estado local APÓS sucesso no backend
      const historicoAtualizado = historicoAulas.map((aula) =>
        aula.id === aulaAlvo.id ? aulaAtualizadaBackend : aula
      );
      setHistoricoAulas(historicoAtualizado);

      // Atualizar a aula atual ou editando, se for o caso
      if (aulaAtual && aulaAtual.id === aulaAlvo.id) {
        setAulaAtual(aulaAtualizadaBackend);
      }
      if (aulaEditando && aulaEditando.id === aulaAlvo.id) {
        setAulaEditando(aulaAtualizadaBackend);
      }

      // Atualizar a lista de alunos na aula (usando dados do backend)
      // Garantir que alunosNaAula reflita a aula que está sendo mostrada/editada
      setAlunosNaAula(aulaAtualizadaBackend.alunos || []);

      // Atualizar no App.js
      if (typeof atualizarAlunosEmAula === "function") {
        atualizarAlunosEmAula(aulaAtualizadaBackend.alunos || []);
      }
    } catch (error) {
      // Se o erro for de aluno duplicado (tratado no serviço), mostrar mensagem específica
      if (
        error.message.includes("Este aluno já está na aula") || // Mensagem do serviço
        (error.details && error.isDuplicate) // Flag do serviço
      ) {
        setErroMsg("Este aluno já está nesta aula!");
      } else {
        setErroMsg(`Erro ao adicionar aluno à aula: ${error.message}`);
      }
      setShowErroModal(true);
    }

    setAlunoSelecionado(""); // Limpar seleção após adicionar
    setLoading(false);
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
      setSavingData(true); // Adicionado para indicar salvamento
      const professor = professorSelecionado
        ? todosProfessores.find(
            (p) => p.id.toString() === professorSelecionado.toString()
          )
        : null;
      const professorFormatado = professor
        ? { id: professor.id, nome: professor.nome }
        : null;

      let aulaData;
      let foiCriado = false; // Flag para saber se criamos ou atualizamos

      if (modoEdicao && aulaEditando) {
        // Atualizar aula existente em modo de edição
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
        // Atualizar aula atual (que pode ter sido criada em iniciarNovaAula ou carregada)
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
        // Criar uma nova aula (caso iniciarNovaAula não tenha criado ou aulaAtual seja null)
        foiCriado = true;
        const hoje = new Date();
        const dataFormatada = hoje.toISOString().split("T")[0];
        aulaData = {
          data: dataFormatada,
          alunos: alunosNaAula,
          professor: professorFormatado, // Usa o professor selecionado no form
          exercicios: exerciciosSelecionados,
          anotacoes: anotacoes || "",
          status: "atual", // Nova aula sempre começa como 'atual'
          created_at: new Date().toISOString(),
        };
        aulaData = await aulasService.create(aulaData);
      }

      // Atualizar o estado local
      setAulaAtual(aulaData); // Define a aula salva (criada ou atualizada) como a atual

      // Atualizar o histórico de aulas
      setHistoricoAulas((prevHistorico) => {
        // Remover a aula atual (se existir) para evitar duplicidade
        const historicoFiltrado = prevHistorico.filter(
          (a) => a.id !== aulaData.id
        );
        return [aulaData, ...historicoFiltrado]; // Adiciona ou atualiza no início
      });

      // Resetar formulário e modo
      setShowSelecao(false);
      setModoEdicao(false);
      setAulaEditando(null);
      setAlunoSelecionado("");
      // Não resetar professorSelecionado aqui, pode ser útil manter
      setExerciciosSelecionados([]);
      setAnotacoes("");

      // Atualizar alunos em aula globalmente
      if (atualizarAlunosEmAula) atualizarAlunosEmAula(aulaData.alunos || []);

      alert("Aula salva com sucesso!");
    } catch (error) {
      alert("Erro ao salvar aula: " + error.message);
    } finally {
      setSavingData(false); // Finaliza o indicador de salvamento
    }
  };

  const salvarAula = async () => {
    setSavingData(true);
    novaAulaRef.current = false; // Resetar flag ao salvar

    try {
      // Validar se há alunos (exceto se estiver editando)
      if (!modoEdicao && alunosNaAula.length === 0) {
        setErroMsg("Adicione pelo menos um aluno à aula.");
        setShowErroModal(true);
        setSavingData(false);
        return;
      }

      // Formatar professor para salvar apenas ID e nome (se existir)
      const professor = todosProfessores.find(
        (p) => p.id.toString() === professorSelecionado.toString()
      );
      const professorFormatado = professor
        ? { id: professor.id, nome: professor.nome }
        : null;

      let aulaData;
      let foiCriado = false; // Flag para saber se criamos ou atualizamos

      // --- LÓGICA AJUSTADA ---
      // Se temos uma aulaAtual (criada por iniciarNovaAula ou carregada), atualizamos ela.
      if (aulaAtual) {
        console.log("Atualizando aula existente (aulaAtual):", aulaAtual.id);
        aulaData = {
          ...aulaAtual, // Usar dados da aula atual como base
          alunos: alunosNaAula,
          professor: professorFormatado,
          professor_id: professorFormatado ? professorFormatado.id : null, // Garantir professor_id
          exercicios: exerciciosSelecionados,
          anotacoes: anotacoes || aulaAtual.anotacoes || "",
          status: "atual", // Manter como 'atual' até ser finalizada
          updated_at: new Date().toISOString(),
          total_alunos: alunosNaAula.length, // Atualizar contagem
        };
        // Remover campos que não devem ser enviados no update se não foram modificados
        // delete aulaData.created_at; // Exemplo, ajuste conforme necessário

        aulaData = await aulasService.update(aulaData.id, aulaData);
      } else {
        // Este bloco agora é menos provável de ser atingido se iniciarNovaAula funcionar
        // Mas mantido como fallback ou para cenários de edição onde aulaAtual pode ser null
        console.warn(
          "Tentando salvar sem aulaAtual definida. Criando nova aula."
        );
        foiCriado = true;
        const hoje = new Date();
        const dataFormatada = hoje.toISOString().split("T")[0];
        aulaData = {
          data: dataFormatada,
          alunos: alunosNaAula,
          professor: professorFormatado,
          professor_id: professorFormatado ? professorFormatado.id : null,
          exercicios: exerciciosSelecionados,
          anotacoes: anotacoes || "",
          status: "atual",
          created_at: new Date().toISOString(),
          total_alunos: alunosNaAula.length,
        };
        aulaData = await aulasService.create(aulaData);
      }
      // --- FIM DO AJUSTE ---

      console.log("Aula salva/atualizada:", aulaData);

      // Atualizar o estado local
      setAulaAtual(aulaData); // Define a aula salva (criada ou atualizada) como a atual

      // Atualizar o histórico de aulas
      setHistoricoAulas((prevHistorico) => {
        // Remover a aula atual (se existir) para evitar duplicidade
        const historicoFiltrado = prevHistorico.filter(
          (a) => a.id !== aulaData.id
        );
        return [aulaData, ...historicoFiltrado]; // Adiciona ou atualiza no início
      });

      // Resetar formulário e modo
      setShowSelecao(false);
      setModoEdicao(false);
      setAulaEditando(null);
      setAlunoSelecionado("");
      // Não resetar professorSelecionado aqui, pode ser útil manter
      setExerciciosSelecionados([]);
      setAnotacoes("");

      // Atualizar alunos em aula globalmente
      if (atualizarAlunosEmAula) atualizarAlunosEmAula(aulaData.alunos || []);

      // Atualizar históricos associados
      atualizarHistoricoAlunos(aulaData);
      atualizarHistoricoProfessores(aulaData);

      // Mostrar mensagem de sucesso
      setMensagemSucesso(
        foiCriado ? "Aula criada com sucesso!" : "Aula atualizada com sucesso!"
      );
      setTimeout(() => setMensagemSucesso(""), 3000); // Limpar mensagem após 3 segundos
    } catch (error) {
      console.error("Erro ao salvar aula:", error);
      setErroMsg(`Erro ao salvar aula: ${error.message}`);
      setShowErroModal(true);
    } finally {
      setSavingData(false);
    }
  };

  const iniciarNovaAula = async () => {
    // Verificar se já existe uma aula ativa (opcional, dependendo da regra de negócio)
    // const aulasAtivas = historicoAulas.filter(
    //   (aula) => aula.status === "atual" || aula.status === "ativa"
    // );
    // if (aulasAtivas.length > 0 && !modoEdicao) {
    //   setErroMsg(
    //     "Já existe uma aula em andamento. Finalize ou cancele a aula atual antes de iniciar uma nova."
    //   );
    //   setShowErroModal(true);
    //   return;
    // }

    setLoading(true); // Indicar carregamento
    novaAulaRef.current = true; // Indicar que estamos no processo de criar uma nova aula

    try {
      // Limpar estados ANTES de criar a aula placeholder e mostrar o painel
      setAlunosNaAula([]);
      setAlunoSelecionado("");
      // Manter professor selecionado se já houver um? Ou limpar? Decidi limpar por enquanto.
      setProfessorSelecionado("");
      setExerciciosSelecionados([]);
      setAnotacoes("");
      setModoEdicao(false);
      setAulaEditando(null);
      setAulaAtual(null); // Limpar aula atual existente

      // Criar aula placeholder no backend
      const hoje = new Date();
      const dataFormatada = hoje.toISOString().split("T")[0]; // Formato YYYY-MM-DD

      // Tentar obter o professor logado ou um professor padrão, se aplicável
      // Aqui, vamos criar sem professor inicialmente, ele será adicionado ao salvar.
      const novaAulaData = {
        data: dataFormatada,
        status: "atual", // Status inicial
        professor_id: null, // Professor será definido ao salvar
        alunos: [],
        exercicios: [],
        anotacoes: "",
        total_alunos: 0,
      };

      console.log("Criando aula placeholder...");
      const aulaCriada = await aulasService.create(novaAulaData);
      console.log("Aula placeholder criada:", aulaCriada);

      // Definir a aula recém-criada como a aula atual
      setAulaAtual(aulaCriada);

      // Adicionar a nova aula ao histórico local imediatamente
      setHistoricoAulas((prevHistorico) => [aulaCriada, ...prevHistorico]);

      // Mostrar o painel de seleção
      setShowSelecao(true);

      // Rolar para o painel de seleção
      setTimeout(() => {
        const panel = document.querySelector(".selecao-aluno-panel-embedded");
        if (panel) {
          panel.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    } catch (error) {
      console.error("Erro ao iniciar nova aula:", error);
      setError(`Erro ao iniciar nova aula: ${error.message}`);
      setShowErroModal(true);
      novaAulaRef.current = false; // Resetar flag em caso de erro
    } finally {
      setLoading(false); // Finalizar carregamento
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

      // Determinar a aula alvo da qual remover o aluno
      let aulaAlvo = null;
      if (modoEdicao && aulaEditando) {
        aulaAlvo = aulaEditando;
      } else if (aulaAtual) {
        // Se estamos visualizando a aula atual, remover dela
        aulaAlvo = aulaAtual;
      } else {
        // Fallback: Se não estamos editando nem visualizando uma aula específica,
        // encontrar a aula 'atual' ou 'ativa' que contém o aluno.
        // Priorizar a aula 'atual' mais recente que contém o aluno.
        const aulasComAluno = historicoAulas
          .filter(
            (aula) =>
              (aula.status === "atual" || aula.status === "ativa") &&
              aula.alunos &&
              aula.alunos.some((a) => a.id === alunoId)
          )
          .sort((a, b) => {
            // Prioriza 'atual' e depois a mais recente
            if (a.status === "atual" && b.status !== "atual") return -1;
            if (a.status !== "atual" && b.status === "atual") return 1;
            return new Date(b.created_at) - new Date(a.created_at);
          });

        if (aulasComAluno.length > 0) {
          aulaAlvo = aulasComAluno[0]; // Remover da aula prioritária encontrada
        }
      }

      if (!aulaAlvo) {
        // Se mesmo assim não encontrar, pode ser um aluno órfão ou erro de estado
        setErroMsg(
          "Não foi possível determinar a aula para remover o aluno. Verifique se o aluno realmente está em uma aula ativa."
        );
        setShowErroModal(true);
        setSavingData(false);
        return;
      }

      // Remover aluno da aula alvo no backend usando o serviço dedicado
      const aulaAtualizadaBackend = await aulasService.removerAluno(
        aulaAlvo.id,
        alunoId
      );

      // Atualizar estado local APÓS sucesso no backend
      const historicoAtualizado = historicoAulas.map((a) =>
        a.id === aulaAlvo.id ? aulaAtualizadaBackend : a
      );
      setHistoricoAulas(historicoAtualizado);

      // Atualizar aulaAtual ou aulaEditando se a aula modificada for uma delas
      if (aulaAtual && aulaAtual.id === aulaAlvo.id) {
        setAulaAtual(aulaAtualizadaBackend);
      }
      if (aulaEditando && aulaEditando.id === aulaAlvo.id) {
        setAulaEditando(aulaAtualizadaBackend);
      }

      // Atualizar alunosNaAula para refletir a aula mostrada/editada
      // Se a aula modificada é a que está sendo exibida/editada, atualiza a lista
      if (
        (aulaAtual && aulaAtual.id === aulaAlvo.id) ||
        (aulaEditando && aulaEditando.id === aulaAlvo.id)
      ) {
        setAlunosNaAula(aulaAtualizadaBackend.alunos || []);
      } else {
        // Se a aula modificada não é a que está ativa na UI,
        // talvez seja melhor buscar os alunos da aula ativa novamente
        // ou simplesmente não atualizar alunosNaAula aqui, deixando o useEffect de sincronização cuidar disso.
        // Por segurança, vamos atualizar com base na aula modificada,
        // mas isso pode causar um "flash" se o usuário estiver vendo outra aula.
        // Uma abordagem mais segura seria verificar se aulaAlvo.id corresponde à aula visível.
        setAlunosNaAula(aulaAtualizadaBackend.alunos || []); // Atualiza mesmo assim, pode precisar de ajuste fino
      }

      // Atualizar App.js (passando os alunos da aula modificada)
      if (typeof atualizarAlunosEmAula === "function") {
        atualizarAlunosEmAula(aulaAtualizadaBackend.alunos || []);
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

  // Efeito para buscar o último treino dos alunos que estão em aula
  useEffect(() => {
    const fetchUltimosTreinos = async () => {
      if (alunosNaAula.length > 0) {
        const newUltimosTreinosMap = { ...ultimosTreinosMap };
        let updated = false;

        for (const aluno of alunosNaAula) {
          // Verificação robusta para garantir que temos um ID válido
          if (!aluno) {
            console.warn("Encontrado aluno inválido em alunosNaAula");
            continue; // Pula para o próximo aluno
          }

          // Verificar se o ID é uma string UUID válida (não nula e não undefined)
          if (!aluno.id || aluno.id === "null" || aluno.id === "undefined") {
            console.warn(
              `Aluno com ID inválido: ${aluno.nome || "Nome desconhecido"}`
            );
            // Armazenar um valor específico para indicar ID inválido
            newUltimosTreinosMap[aluno.id || "unknown"] = "id_invalido";
            updated = true;
            continue; // Pula para o próximo aluno
          }

          try {
            // Usar a função do serviço alunos.service.js com o ID validado
            const ultimoTreino = await alunosService.getUltimaAulaRealizada(
              aluno.id
            );
            newUltimosTreinosMap[aluno.id] = ultimoTreino || "nenhum"; // Armazena o treino ou 'nenhum'
            updated = true;
          } catch (error) {
            console.error(
              `Erro ao buscar último treino para ${
                aluno.nome || "ID desconhecido"
              }:`,
              error
            );
            newUltimosTreinosMap[aluno.id] = "erro"; // Indica um erro na busca
            updated = true;
          }
        }

        // Atualiza o estado apenas se houve alguma mudança
        if (updated) {
          setUltimosTreinosMap(newUltimosTreinosMap);
        }
      } else {
        // Limpar o mapa se não houver alunos na aula
        if (Object.keys(ultimosTreinosMap).length > 0) {
          setUltimosTreinosMap({});
        }
      }
    };

    fetchUltimosTreinos();
    // Dependência: Executa sempre que a lista de alunos na aula mudar
  }, [alunosNaAula]);

  // Renderizar o painel de informações do último treino e do aluno atual
  const renderizarUltimoTreino = (aluno) => {
    // Verificar se o aluno tem ID válido
    if (!aluno || !aluno.id) {
      return <p>Erro: ID de aluno inválido</p>;
    }

    const ultimoTreinoInfo = ultimosTreinosMap[aluno.id];

    // Se ainda não buscou ou está buscando
    if (ultimoTreinoInfo === undefined) {
      return <p>Carregando último treino...</p>;
    }

    // Se o ID do aluno for inválido
    if (ultimoTreinoInfo === "id_invalido") {
      return <p>Erro: ID de aluno inválido</p>;
    }

    // Se não encontrou treino realizado
    if (ultimoTreinoInfo === "nenhum") {
      return <p>Nenhum treino registrado.</p>;
    }

    // Se ocorreu erro na busca
    if (ultimoTreinoInfo === "erro") {
      return <p>Erro ao buscar treino.</p>;
    }

    // Se encontrou o treino (objeto com data e status)
    return (
      <div className="ultimo-treino-container">
        <p>
          <strong>Último Treino:</strong> {formatarData(ultimoTreinoInfo.data)}
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
    </div>
  );
};

export default Geral;

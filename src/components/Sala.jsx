import React, { useState, useEffect } from "react";
import "../styles/Sala.css";
import aulasService from "../services/aulas.service";
import alunosService from "../services/alunos.service";
import exerciciosService from "../services/exercicios.service"; // Adicionando import para o serviço de exercícios
import { useAuth } from "../hooks/useAuth";
import professoresService from "../services/professores.service";
import { supabase } from "../services/supabase";
import { toast } from "react-toastify";
import AulaAlunosService from "../services/AulaAlunosService";

function Sala() {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const [salaLoading, setSalaLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados do professor
  const [professorAtual, setProfessorAtual] = useState(null);

  // Estados da aula
  const [aulaAtiva, setAulaAtiva] = useState(false);
  const [aulaAtual, setAulaAtual] = useState(null);
  const [alunosEmAula, setAlunosEmAula] = useState([]);

  // Estados do aluno
  const [todosAlunos, setTodosAlunos] = useState([]);
  const [alunoSelecionado, setAlunoSelecionado] = useState(null);
  const [ultimosTreinos, setUltimosTreinos] = useState({});
  // Observações do cadastro do aluno (não editáveis)
  const [alunoObservacoesCadastro, setAlunoObservacoesCadastro] = useState({});
  // Observações editáveis no campo "Adicionar Observação"
  const [alunoObservacoes, setAlunoObservacoes] = useState({});
  // Estados para gerenciar exercícios
  const [todosExercicios, setTodosExercicios] = useState([]);
  const [exerciciosPorAluno, setExerciciosPorAluno] = useState({});

  // Estados para gerenciar feedback e processamento
  const [processandoFinalizacao, setProcessandoFinalizacao] = useState(false);
  const [mensagem, setMensagem] = useState(null);

  // Estados da interface
  const [modoSelecaoAluno, setModoSelecaoAluno] = useState(true);
  const [alunosDropdownAberto, setAlunosDropdownAberto] = useState(false);
  const [termoBusca, setTermoBusca] = useState("");

  // Identificar o professor logado
  useEffect(() => {
    const identificarProfessor = async () => {
      if (authLoading) return;
      setSalaLoading(true);
      setError(null);

      try {
        let profIdParaBuscar = null;

        if (user?.id) {
          profIdParaBuscar = user.id;
        }

        if (profIdParaBuscar) {
          try {
            const professor = await professoresService.getById(
              profIdParaBuscar
            );
            if (professor) {
              setProfessorAtual(professor);
            } else if (isAdmin) {
              // Se é admin e não encontrou como professor, criar objeto professor para o admin
              const adminComoProfessor = {
                id: user.id,
                nome: user.nome || user.email?.split("@")[0] || "Administrador",
                email: user.email || "",
                role: "admin",
                isAdmin: true,
              };
              setProfessorAtual(adminComoProfessor);
            } else {
              // Para usuários não-admin, tentar buscar pelo email como fallback
              if (user?.email) {
                const todosProfessores = await professoresService.getAll();
                const professorLogado = todosProfessores.find(
                  (prof) =>
                    prof.email?.toLowerCase() === user.email.toLowerCase()
                );
                if (professorLogado) {
                  setProfessorAtual(professorLogado);
                } else {
                  setError("Seu usuário não está registrado como professor.");
                  setProfessorAtual(null);
                }
              }
            }
          } catch (err) {
            if (isAdmin) {
              // Se é admin e deu erro na busca, criar objeto professor para o admin
              const adminComoProfessor = {
                id: user.id,
                nome: user.nome || user.email?.split("@")[0] || "Administrador",
                email: user.email || "",
                role: "admin",
                isAdmin: true,
              };
              setProfessorAtual(adminComoProfessor);
            } else {
              console.error("Erro ao buscar perfil de professor:", err);
              setError(`Professor com ID ${profIdParaBuscar} não encontrado.`);
              setProfessorAtual(null);
            }
          }
        } else {
          setError("Usuário não identificado.");
          setProfessorAtual(null);
        }
      } catch (err) {
        console.error("Erro ao identificar professor:", err);
        setError("Falha ao identificar o professor.");
        setProfessorAtual(null);
      } finally {
        setSalaLoading(false);
      }
    };

    identificarProfessor();
  }, [authLoading, user, isAdmin]);

  // Verificar se o professor tem aula em andamento
  useEffect(() => {
    const verificarAulaEmAndamento = async () => {
      if (!professorAtual) {
        setAulaAtiva(false);
        setAulaAtual(null);
        setAlunosEmAula([]);
        return;
      }

      setSalaLoading(true);
      setError(null);

      try {
        console.log(
          "Buscando aula em andamento para o professor:",
          professorAtual.id
        );

        const { data: aulasBasicas, error: aulasBasicasError } = await supabase
          .from("aulas")
          .select("id, status, data, professor_id, observacoes")
          .eq("professor_id", professorAtual.id)
          .eq("status", "em_andamento")
          .order("created_at", { ascending: false });

        if (aulasBasicasError) {
          console.error("Erro ao buscar aulas básicas:", aulasBasicasError);
          throw aulasBasicasError;
        }

        // Se não encontrou aulas, criar uma automaticamente
        if (!aulasBasicas || aulasBasicas.length === 0) {
          console.log(
            "Nenhuma aula em andamento encontrada. Criando uma nova aula automaticamente."
          );

          // Criar objeto de aula para salvar no banco de dados
          const novaAula = {
            professor_id: professorAtual.id,
            status: "em_andamento",
            data: new Date().toISOString().split("T")[0],
            observacoes: "",
            alunos: [],
          };

          // Salvar a aula no banco de dados imediatamente
          const aulaSalva = await aulasService.create(novaAula);

          // Atualizar os estados com a aula criada
          setAulaAtual(aulaSalva);
          setAulaAtiva(true);
          setAlunosEmAula([]);
          setModoSelecaoAluno(true);
          setAlunosDropdownAberto(false); // Manter dropdown fechado inicialmente

          console.log(
            "Aula iniciada automaticamente e salva no banco de dados:",
            aulaSalva
          );
          setSalaLoading(false);
          return;
        }

        // Usar a aula mais recente (já ordenada por created_at desc)
        const aulaBasica = aulasBasicas[0];
        console.log(`Aula em andamento encontrada com ID ${aulaBasica.id}`);

        // Carregar os alunos associados a esta aula
        try {
          const { data: alunosIds, error: alunosIdsError } = await supabase
            .from("aula_alunos")
            .select("aluno_id")
            .eq("aula_id", aulaBasica.id);

          if (alunosIdsError) {
            console.error(
              "Erro ao buscar IDs dos alunos da aula:",
              alunosIdsError
            );
            throw alunosIdsError;
          }

          let alunosDaAula = [];

          // Se encontrou alunos relacionados, buscar os detalhes completos
          if (alunosIds && alunosIds.length > 0) {
            // Extrair os IDs dos alunos
            const ids = alunosIds.map((record) => record.aluno_id);

            // Buscar os detalhes dos alunos pelo ID
            const { data: alunos, error: alunosError } = await supabase
              .from("alunos")
              .select("*")
              .in("id", ids);

            if (alunosError) {
              console.error("Erro ao buscar detalhes dos alunos:", alunosError);
              throw alunosError;
            }

            alunosDaAula = alunos || [];
          }

          // Montar o objeto completo da aula com os dados que temos
          const aulaCompleta = {
            ...aulaBasica,
            alunos: alunosDaAula,
          };

          console.log("Aula completa montada com sucesso:", aulaCompleta);

          // Atualizar os estados com a aula carregada
          setAulaAtual(aulaCompleta);
          setAulaAtiva(true);
          setAlunosEmAula(alunosDaAula);
          setModoSelecaoAluno(alunosDaAula.length === 0);

          // Manter dropdown fechado inicialmente em todos os casos
          setAlunosDropdownAberto(false);
        } catch (alunosError) {
          console.error("Erro ao buscar alunos da aula:", alunosError);
          // Mesmo com erro nos alunos, ainda carregamos a aula básica
          setAulaAtual(aulaBasica);
          setAulaAtiva(true);
          setAlunosEmAula([]);
          setModoSelecaoAluno(true);
          setAlunosDropdownAberto(false); // Manter dropdown fechado inicialmente
        }
      } catch (err) {
        console.error("Erro ao verificar aula em andamento:", err);
        setAulaAtual(null);
        setAulaAtiva(false);
        setAlunosEmAula([]);
      } finally {
        setSalaLoading(false);
      }
    };

    verificarAulaEmAndamento();
  }, [professorAtual]);

  // Carregar todos os alunos quando o professor é identificado
  useEffect(() => {
    const carregarAlunos = async () => {
      if (!professorAtual) return;

      try {
        setSalaLoading(true);
        const alunos = await alunosService.getAll();
        setTodosAlunos(alunos);
        setSalaLoading(false);
      } catch (err) {
        console.error("Erro ao carregar alunos:", err);
        setError("Falha ao carregar a lista de alunos.");
        setSalaLoading(false);
      }
    };

    carregarAlunos();
  }, [professorAtual]);

  // Buscar último treino para alunos visíveis
  useEffect(() => {
    const buscarUltimosTreinosParaAlunosVisiveis = async () => {
      // Garantir que alunosEmAula é um array
      if (!Array.isArray(alunosEmAula)) {
        console.warn(
          "[WARN] alunosEmAula não é um array, pulando busca de treinos. Valor:",
          alunosEmAula
        );
        setUltimosTreinos({});
        setAlunoObservacoes({});
        setAlunoObservacoesCadastro({});
        return;
      }

      if (alunosEmAula.length === 0) {
        console.log(
          "[INFO] alunosEmAula está vazio, limpando treinos e observações."
        );
        setUltimosTreinos({});
        setAlunoObservacoes({});
        setAlunoObservacoesCadastro({});
        return;
      }

      console.log(
        `[INFO] Iniciando busca de últimos treinos para ${alunosEmAula.length} alunos visíveis.`
      );

      // Criar um novo objeto para armazenar os dados
      const novosUltimosTreinos = {};
      const novasObservacoesCadastro = {}; // Para as observações do cadastro

      // Para cada aluno, buscar separadamente para evitar problemas
      for (const aluno of alunosEmAula) {
        if (!aluno || !aluno.id) {
          console.warn(`[WARN] Aluno inválido encontrado:`, aluno);
          continue;
        }

        console.log(
          `[DB_FETCH_START] Buscando dados para aluno ID: ${aluno.id} (${aluno.nome})`
        );

        try {
          // 1. Buscar os dados cadastrais do aluno diretamente
          console.log(`[FETCH] Buscando dados cadastrais do aluno ${aluno.id}`);
          const { data: dadosAluno, error: alunoError } = await supabase
            .from("alunos")
            .select("*")
            .eq("id", aluno.id)
            .single();

          if (alunoError) {
            console.error(`[ERROR] Erro ao buscar dados do aluno:`, alunoError);
            continue;
          }

          console.log(`[SUCCESS] Dados do aluno carregados:`, {
            id: dadosAluno.id,
            nome: dadosAluno.nome,
            observacoes: dadosAluno.observacoes,
          });

          // Armazenar as observações do cadastro do aluno
          // (estas serão mostradas na seção "Observações do Aluno")
          novasObservacoesCadastro[aluno.id] = dadosAluno.observacoes || "";

          // 2. Buscar último treino finalizado do aluno usando abordagem simplificada
          console.log(`[FETCH] Buscando último treino para aluno ${aluno.id}`);

          try {
            // Primeiro buscar todas as aulas em que este aluno participou
            const { data: aulasAlunoData, error: aulasAlunoError } =
              await supabase
                .from("aula_alunos")
                .select("aula_id, observacoes")
                .eq("aluno_id", aluno.id);

            if (aulasAlunoError) {
              console.error(
                `[ERROR] Erro ao buscar aulas do aluno:`,
                aulasAlunoError
              );
              continue;
            }

            if (!aulasAlunoData || aulasAlunoData.length === 0) {
              console.log(
                `[INFO] Nenhum registro de aula encontrado para aluno ${aluno.id}`
              );
              continue;
            }

            // Obter IDs das aulas do aluno
            const aulaIds = aulasAlunoData.map((registro) => registro.aula_id);

            // Mapear observações por ID de aula para uso posterior
            const observacoesPorAula = {};
            aulasAlunoData.forEach((registro) => {
              if (registro.observacoes) {
                observacoesPorAula[registro.aula_id] = registro.observacoes;
              }
            });

            // Buscar as aulas finalizadas
            const { data: aulasFinalizadas, error: aulasFinalizadasError } =
              await supabase
                .from("aulas")
                .select(
                  `
                id, 
                data,
                status,
                observacoes,
                created_at,
                professor:professor_id(id, nome)
              `
                )
                .in("id", aulaIds)
                .eq("status", "finalizada")
                .order("created_at", { ascending: false }) // Ordenar por created_at em vez de data
                .limit(1);

            if (aulasFinalizadasError) {
              console.error(
                `[ERROR] Erro ao buscar aulas finalizadas:`,
                aulasFinalizadasError
              );
              continue;
            }

            if (aulasFinalizadas && aulasFinalizadas.length > 0) {
              console.log(
                `[SUCCESS] Último treino encontrado para aluno ${aluno.id}`
              );

              // Pegar o primeiro (mais recente) treino
              const ultimoTreino = aulasFinalizadas[0];

              // Adicionar as observações específicas do aluno ao objeto do treino
              if (observacoesPorAula[ultimoTreino.id]) {
                ultimoTreino.observacoes_aluno =
                  observacoesPorAula[ultimoTreino.id];
              }

              // Salvar no map de últimos treinos
              novosUltimosTreinos[aluno.id] = ultimoTreino;

              console.log(`[INFO] Último treino do aluno ${aluno.id}:`, {
                id: ultimoTreino.id,
                data: ultimoTreino.data,
                observacoes: ultimoTreino.observacoes,
                observacoes_aluno: ultimoTreino.observacoes_aluno,
              });
            } else {
              console.log(
                `[INFO] Nenhum treino finalizado encontrado para aluno ${aluno.id}`
              );
            }
          } catch (trenoErr) {
            console.error(`[ERROR] Erro ao buscar último treino:`, trenoErr);
          }
        } catch (err) {
          console.error(
            `[ERROR] Erro processando dados para ${aluno.nome}:`,
            err
          );
        }
      }

      // Inicializar o campo "Adicionar Observação" em branco para todos os alunos
      // Como solicitado, este campo deve estar vazio e não vir preenchido
      const novasCaixasObservacao = {};
      alunosEmAula.forEach((aluno) => {
        if (aluno && aluno.id) {
          novasCaixasObservacao[aluno.id] = "";
        }
      });

      // Atualizar os estados com todos os dados coletados
      console.log(
        `[UPDATE] Atualizando dados para ${
          Object.keys(novasObservacoesCadastro).length
        } alunos`
      );
      setUltimosTreinos(novosUltimosTreinos);
      setAlunoObservacoesCadastro(novasObservacoesCadastro); // Observações do cadastro
      setAlunoObservacoes(novasCaixasObservacao); // Campo editável sempre inicia vazio
    };

    buscarUltimosTreinosParaAlunosVisiveis();
  }, [alunosEmAula, aulaAtual?.id]);

  // Iniciar nova aula
  const handleIniciarNovaAula = async () => {
    if (!professorAtual) {
      setError("Professor não identificado. Não é possível criar a aula.");
      return;
    }

    try {
      setSalaLoading(true);

      // Criar objeto de aula para salvar no banco de dados
      const novaAula = {
        professor_id: professorAtual.id,
        status: "em_andamento",
        data: new Date().toISOString().split("T")[0],
        observacoes: "",
        alunos: [],
      };

      // Salvar a aula no banco de dados imediatamente
      const aulaSalva = await aulasService.create(novaAula);

      // Atualizar os estados com a aula criada
      setAulaAtual(aulaSalva);
      setAulaAtiva(true);
      setAlunosEmAula([]);
      setModoSelecaoAluno(true);

      console.log("Aula iniciada e salva no banco de dados:", aulaSalva);
    } catch (err) {
      console.error("Erro ao iniciar nova aula:", err);
      setError("Falha ao iniciar aula. " + (err.message || "Tente novamente."));
    } finally {
      setSalaLoading(false);
    }
  };

  // Finalizar aula
  const handleFinalizarAula = async () => {
    if (!professorAtual || !professorAtual.id) {
      setError("Professor não identificado. Não é possível finalizar aulas.");
      return;
    }

    try {
      setSalaLoading(true);
      setError(null);

      console.log(
        `Iniciando processo de finalização de aulas do professor ${professorAtual.nome} (ID: ${professorAtual.id})`
      );

      // Buscar TODAS as aulas em andamento para este professor
      const { data: aulasEmAndamento, error: fetchError } = await supabase
        .from("aulas")
        .select("id")
        .eq("professor_id", professorAtual.id)
        .eq("status", "em_andamento");

      if (fetchError) {
        console.error("ERRO NA BUSCA DE AULAS:", fetchError);
        throw new Error(
          `Erro ao buscar aulas em andamento: ${fetchError.message}`
        );
      }

      if (!aulasEmAndamento || aulasEmAndamento.length === 0) {
        console.log("Nenhuma aula em andamento encontrada para finalizar");
        setError("Não há aulas em andamento para finalizar.");
        setSalaLoading(false);
        return;
      }

      // Garantir que a data seja a atual para todas as aulas finalizadas
      const hoje = new Date();
      const ano = hoje.getFullYear();
      const mes = String(hoje.getMonth() + 1).padStart(2, "0");
      const dia = String(hoje.getDate()).padStart(2, "0");
      const dataFormatada = `${ano}-${mes}-${dia}`; // Formato YYYY-MM-DD

      console.log(`Data atual para finalização da sala: ${dataFormatada}`);

      // Para cada aula, realizar a finalização
      for (const aula of aulasEmAndamento) {
        console.log(`Processando aula ${aula.id}`);

        // Antes de limpar os relacionamentos, salvar as observações de cada aluno
        // em aulas finalizadas individuais para preservar o histórico
        try {
          // Buscar alunos e observações desta aula
          const { data: alunosDaAula, error: alunosError } = await supabase
            .from("aula_alunos")
            .select("aluno_id, observacoes")
            .eq("aula_id", aula.id);

          // Buscar também as observações que estão no state local, não apenas no banco
          // Isso garante que observações não salvas ainda sejam preservadas
          if (!alunosError && alunosDaAula && alunosDaAula.length > 0) {
            console.log(
              `Salvando histórico para ${alunosDaAula.length} alunos da aula ${aula.id}`
            );

            // Para cada aluno, criar uma aula finalizada individual
            for (const alunoRegistro of alunosDaAula) {
              const { aluno_id } = alunoRegistro;

              // Buscar observações do state - prioridade para o que está no textarea
              // Se não estiver no state, usar o que foi recuperado do banco
              let observacoes =
                alunoObservacoes[aluno_id] || alunoRegistro.observacoes || "";
              console.log(`Observações para o aluno ${aluno_id}:`, observacoes);

              const aulaFinalizadaIndividual = {
                professor_id: professorAtual.id,
                data: dataFormatada,
                status: "finalizada",
                observacoes: observacoes, // Usar observações específicas do aluno
              };

              console.log(
                "Criando registro de treino finalizado:",
                aulaFinalizadaIndividual
              );

              // Inserir a aula finalizada
              const { data: aulaFinalizada, error: aulaError } = await supabase
                .from("aulas")
                .insert(aulaFinalizadaIndividual)
                .select()
                .single();

              if (aulaError) {
                console.error(
                  "Erro ao criar registro de treino finalizado:",
                  aulaError
                );
                throw aulaError;
              }

              console.log(
                "Aula finalizada criada com sucesso:",
                aulaFinalizada
              );

              // 2. Relacionar o aluno com esta aula finalizada
              if (aulaFinalizada) {
                const { error: relError } = await supabase
                  .from("aula_alunos")
                  .insert({
                    aula_id: aulaFinalizada.id,
                    aluno_id: aluno_id,
                    observacoes: observacoes,
                  });

                if (relError) {
                  console.error(
                    "Erro ao relacionar aluno com aula finalizada:",
                    relError
                  );
                  throw relError;
                }

                console.log(
                  `Aluno ${aluno_id} relacionado com sucesso à aula finalizada`
                );
              }
            }
          }
        } catch (histErr) {
          console.error("Erro ao salvar histórico dos alunos:", histErr);
        }

        // Agora limpar a junction table para eliminar relacionamentos
        const { error: relError } = await supabase
          .from("aula_alunos")
          .delete()
          .eq("aula_id", aula.id);

        if (relError) {
          console.error(`ERRO AO REMOVER RELACIONAMENTOS: ${relError.message}`);
        }

        // Finalizar a aula
        await supabase
          .from("aulas")
          .update({
            status: "finalizada",
            data: dataFormatada, // Atualizar para a data de hoje
            alunos: [],
          })
          .eq("id", aula.id);
      }

      // Limpar o estado local
      setAulaAtiva(false);
      setAulaAtual(null);
      setAlunosEmAula([]);
      setAlunoSelecionado(null);
      setModoSelecaoAluno(true);

      alert("Aula finalizada com sucesso!");

      // Forçar recarga da página após pequeno delay
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      console.error("ERRO AO FINALIZAR AULAS:", err);
      setError(`Falha ao finalizar aulas: ${err.message}`);
    } finally {
      setSalaLoading(false);
    }
  };

  // Cancelar aula inteira
  const handleCancelarAula = async () => {
    if (!professorAtual || !professorAtual.id) {
      setError("Professor não identificado. Não é possível cancelar aulas.");
      return;
    }

    try {
      setSalaLoading(true);
      setError(null);

      console.log(
        `Iniciando processo de cancelamento da aula do professor ${professorAtual.nome} (ID: ${professorAtual.id})`
      );

      if (!aulaAtual || !aulaAtual.id) {
        setError("Aula não identificada. Não é possível cancelar.");
        setSalaLoading(false);
        return;
      }

      // Remover todos os relacionamentos com alunos (registros em aula_alunos)
      const { error: relError } = await supabase
        .from("aula_alunos")
        .delete()
        .eq("aula_id", aulaAtual.id);

      if (relError) {
        console.error(`ERRO AO REMOVER RELACIONAMENTOS: ${relError.message}`);
        throw relError;
      }

      // Atualizar o status da aula para "cancelada"
      const { error: aulaError } = await supabase
        .from("aulas")
        .update({ status: "cancelada" })
        .eq("id", aulaAtual.id);

      if (aulaError) {
        console.error(`ERRO AO CANCELAR AULA: ${aulaError.message}`);
        throw aulaError;
      }

      // Limpar o estado local
      setAulaAtiva(false);
      setAulaAtual(null);
      setAlunosEmAula([]);
      setAlunoSelecionado(null);
      setModoSelecaoAluno(true);

      toast.success("Aula cancelada com sucesso!");

      // Forçar recarga da página após pequeno delay
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      console.error("ERRO AO CANCELAR AULA:", err);
      setError(`Falha ao cancelar aula: ${err.message}`);
    } finally {
      setSalaLoading(false);
    }
  };

  // Função para cancelar a participação do aluno na aula sem salvar treino
  const handleCancelarAlunoIndividual = async (alunoId) => {
    try {
      setProcessandoFinalizacao(true);
      const alunoParaCancelar = alunosEmAula.find(
        (aluno) => aluno.id === alunoId
      );

      if (!alunoParaCancelar) {
        console.error("Aluno não encontrado para cancelar");
        return;
      }

      if (
        window.confirm(
          `Deseja realmente cancelar a participação de ${alunoParaCancelar.nome} na aula? Esta ação não registrará um treino finalizado.`
        )
      ) {
        console.log(
          `Cancelando participação do aluno ${alunoParaCancelar.nome} na aula atual`
        );

        // Remover aluno da aula atual sem criar registro de aula finalizada
        if (aulaAtual) {
          await AulaAlunosService.removerAluno(aulaAtual.id, alunoId);
          console.log(`Aluno ${alunoParaCancelar.nome} removido da aula atual`);
        }

        // Atualizar a lista de alunos em aula
        const novosAlunosEmAula = alunosEmAula.filter(
          (aluno) => aluno.id !== alunoId
        );
        setAlunosEmAula(novosAlunosEmAula);

        // Limpar as observações deste aluno
        const novasObservacoes = { ...alunoObservacoes };
        delete novasObservacoes[alunoId];
        setAlunoObservacoes(novasObservacoes);

        toast.success(`${alunoParaCancelar.nome} removido da aula.`);
      }
    } catch (error) {
      console.error("Erro ao cancelar participação do aluno:", error);
      toast.error(`Erro ao cancelar aluno: ${error.message}`);
    } finally {
      setProcessandoFinalizacao(false);
    }
  };

  // Toggle para abrir/fechar o dropdown de alunos
  const toggleAlunosDropdown = () => {
    setAlunosDropdownAberto(!alunosDropdownAberto);
    if (!alunosDropdownAberto) {
      setTermoBusca("");
    }
  };

  // Filtrar alunos baseado no termo de busca
  const alunosFiltrados = todosAlunos.filter((aluno) =>
    aluno.nome.toLowerCase().includes(termoBusca.toLowerCase())
  );

  // Selecionar aluno para exibir detalhes
  const handleSelecionarAluno = async (aluno) => {
    console.log("Aluno selecionado:", aluno);
    if (!aulaAtual || !aulaAtual.id) {
      setError("Erro: Aula atual não está definida para adicionar aluno.");
      return;
    }

    try {
      // Atualizar a UI imediatamente para feedback rápido
      setAlunoSelecionado(aluno);
      setAlunosDropdownAberto(false);
      setModoSelecaoAluno(false);

      // Verificar se o aluno já está na lista local
      const alunoJaNaLista = alunosEmAula.some((a) => a.id === aluno.id);

      // Se o aluno não estiver na lista, buscar dados completos do banco antes de adicionar
      let alunoCompleto = aluno;
      if (!alunoJaNaLista) {
        try {
          // Buscar dados completos do aluno do banco de dados
          console.log(`Buscando dados completos do aluno ${aluno.id}`);
          const { data: dadosCompletos, error: dadosError } = await supabase
            .from("alunos")
            .select("*")
            .eq("id", aluno.id)
            .single();
            
          if (!dadosError && dadosCompletos) {
            console.log("Dados completos do aluno obtidos:", dadosCompletos);
            alunoCompleto = dadosCompletos;
          } else {
            console.error("Erro ao buscar dados completos do aluno:", dadosError);
          }
        } catch (dataError) {
          console.error("Erro ao buscar dados do aluno:", dataError);
        }
      }

      // Adicionar aluno completo ao estado local se não estiver já na lista
      if (!alunoJaNaLista) {
        console.log(`Adicionando aluno ${alunoCompleto.nome} localmente`);
        setAlunosEmAula((prev) => [...prev, alunoCompleto]);
      }

      // Atualizamos o backend se o aluno não estiver já na lista
      if (!alunoJaNaLista) {
        console.log(`Atualizando aula com novo aluno ${alunoCompleto.id}`);
        try {
          // Chamada ao serviço para adicionar o aluno
          const aulaAtualizada = await aulasService.adicionarAluno(
            aulaAtual.id,
            alunoCompleto.id
          );

          console.log("Resultado da atualização:", aulaAtualizada);

          // Se a chamada for bem-sucedida, atualizamos o estado da aula
          if (aulaAtualizada) {
            console.log("Atualizando estado da aula com dados do backend");
            setAulaAtual(aulaAtualizada);

            // Se a aula tem um campo alunos com dados, usá-lo para atualizar o estado
            if (aulaAtualizada.alunos && Array.isArray(aulaAtualizada.alunos)) {
              // Mapear os dados atuais para preservar os dados completos dos alunos já adicionados
              const alunosAtualizados = aulaAtualizada.alunos.map(alunoAula => {
                // Verificar se o aluno é o que acabamos de adicionar
                if (alunoAula.id === alunoCompleto.id) {
                  return alunoCompleto; // Usar a versão completa que buscamos
                }
                
                // Para os outros alunos, manter os dados existentes de alunosEmAula
                const alunoExistente = alunosEmAula.find(a => a.id === alunoAula.id);
                return alunoExistente || alunoAula;
              });
              
              setAlunosEmAula(alunosAtualizados);
            }
          }
        } catch (err) {
          console.error("Erro ao adicionar aluno via service:", err);
          setError(
            "Aviso: Houve um problema na comunicação com o banco de dados, mas o aluno foi adicionado localmente."
          );
        }
      }
    } catch (err) {
      console.error("Erro geral ao selecionar aluno:", err);
      setError("Falha ao selecionar aluno. Por favor, tente novamente.");

      // Restaurar estado anterior em caso de erro grave
      if (alunoSelecionado?.id !== aluno.id) {
        setModoSelecaoAluno(true);
      }
    }
  };

  const handleFinalizarAlunoIndividual = async (alunoId) => {
    try {
      setProcessandoFinalizacao(true);
      const alunoParaFinalizar = alunosEmAula.find(
        (aluno) => aluno.id === alunoId
      );

      if (!alunoParaFinalizar) {
        console.error("Aluno não encontrado para finalizar");
        return;
      }

      console.log(`Finalizando aluno ${alunoParaFinalizar.nome} da aula atual`);

      // Salvar observações do aluno
      const observacoesAluno = alunoObservacoes[alunoId] || "";

      if (aulaAtual) {
        // 1. Primeiro, criar uma cópia da aula atual como finalizada para este aluno
        // Garantir que a data seja a atual, considerando o fuso horário local
        const hoje = new Date();
        // Obter a data de hoje formatada diretamente como string no formato DD/MM/YYYY
        const dataHoje =
          hoje.getDate().toString().padStart(2, "0") +
          "/" +
          (hoje.getMonth() + 1).toString().padStart(2, "0") +
          "/" +
          hoje.getFullYear();
        console.log(`Data de hoje para interface: ${dataHoje}`);

        // Para armazenamento no banco, usar formato ISO
        const dataFormatadaISO = hoje.toISOString().slice(0, 10); // YYYY-MM-DD

        console.log(
          `Data atual formatada para banco de dados: ${dataFormatadaISO}`
        );

        const aulaIndividualFinalizada = {
          professor_id: aulaAtual.professor_id,
          data: dataFormatadaISO,
          status: "finalizada",
          observacoes: observacoesAluno, // Usar observações específicas do aluno
        };

        console.log(
          "Criando registro de treino finalizado:",
          aulaIndividualFinalizada
        );

        // Inserir a aula finalizada
        const { data: aulaFinalizada, error: aulaError } = await supabase
          .from("aulas")
          .insert(aulaIndividualFinalizada)
          .select()
          .single();

        if (aulaError) {
          console.error(
            "Erro ao criar registro de treino finalizado:",
            aulaError
          );
          throw aulaError;
        }

        console.log("Aula finalizada criada com sucesso:", aulaFinalizada);

        // 2. Relacionar o aluno com esta aula finalizada
        if (aulaFinalizada) {
          const { error: relError } = await supabase
            .from("aula_alunos")
            .insert({
              aula_id: aulaFinalizada.id,
              aluno_id: alunoId,
              observacoes: observacoesAluno,
            });

          if (relError) {
            console.error(
              "Erro ao relacionar aluno com aula finalizada:",
              relError
            );
            throw relError;
          }

          console.log(
            `Aluno ${alunoParaFinalizar.nome} relacionado com sucesso à aula finalizada`
          );

          // 3. Salvar os exercícios selecionados para este aluno
          const exerciciosDoAluno = exerciciosPorAluno[alunoId] || [];
          if (exerciciosDoAluno.length > 0) {
            console.log(
              `Salvando ${exerciciosDoAluno.length} exercícios para o aluno ${alunoId} na aula ${aulaFinalizada.id}`
            );

            // Criar registros na tabela aula_exercicios para cada exercício
            for (const exercicio of exerciciosDoAluno) {
              if (exercicio.exercicio_id) {
                try {
                  const { error: exError } = await supabase
                    .from("aula_exercicios")
                    .insert({
                      aula_id: aulaFinalizada.id,
                      exercicio_id: exercicio.exercicio_id,
                      aluno_id: alunoId,
                    });

                  if (exError) {
                    console.error(
                      `Erro ao salvar exercício ${exercicio.exercicio_id}:`,
                      exError
                    );
                  } else {
                    console.log(
                      `Exercício ${exercicio.exercicio_id} salvo com sucesso para aula ${aulaFinalizada.id}`
                    );
                  }
                } catch (exErr) {
                  console.error("Erro ao inserir exercício:", exErr);
                }
              }
            }
          }
        }
      }

      // 4. Remover aluno da aula atual
      if (aulaAtual) {
        await AulaAlunosService.removerAluno(aulaAtual.id, alunoId);
        console.log(`Aluno ${alunoParaFinalizar.nome} removido da aula atual`);
      }

      // Atualizar a lista de alunos em aula
      const novosAlunosEmAula = alunosEmAula.filter(
        (aluno) => aluno.id !== alunoId
      );
      setAlunosEmAula(novosAlunosEmAula);

      // Limpar as observações deste aluno
      const novasObservacoes = { ...alunoObservacoes };
      delete novasObservacoes[alunoId];
      setAlunoObservacoes(novasObservacoes);

      toast.success(`${alunoParaFinalizar.nome} finalizado com sucesso!`);
    } catch (error) {
      console.error("Erro ao finalizar aluno:", error);
      toast.error(`Erro ao finalizar aluno: ${error.message}`);
    } finally {
      setProcessandoFinalizacao(false);
    }
  };

  // Array para mostrar na interface
  const alunosContainers = alunosEmAula;

  // Função para determinar a classe de CSS com base na gravidade da lesão
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

  // Carregar todos os exercícios disponíveis
  useEffect(() => {
    const carregarExercicios = async () => {
      try {
        const exercicios = await exerciciosService.getAll();
        setTodosExercicios(exercicios);
        console.log("Exercícios carregados:", exercicios.length);
      } catch (err) {
        console.error("Erro ao carregar exercícios:", err);
      }
    };

    carregarExercicios();
  }, []);

  // Função para adicionar um novo exercício para um aluno específico
  const adicionarExercicio = (alunoId, exercicioId = null) => {
    // Inicializar a estrutura para este aluno se ainda não existir
    if (!exerciciosPorAluno[alunoId]) {
      setExerciciosPorAluno((prev) => ({
        ...prev,
        [alunoId]: [],
      }));
    }

    // Adicionar um novo item vazio à lista de exercícios deste aluno
    setExerciciosPorAluno((prev) => ({
      ...prev,
      [alunoId]: [
        ...(prev[alunoId] || []),
        { id: exercicioId, exercicio_id: exercicioId },
      ],
    }));
  };

  // Função para atualizar um exercício selecionado
  const atualizarExercicio = (alunoId, index, exercicioId) => {
    setExerciciosPorAluno((prev) => {
      const exerciciosDoAluno = [...(prev[alunoId] || [])];
      exerciciosDoAluno[index] = { id: exercicioId, exercicio_id: exercicioId };
      return { ...prev, [alunoId]: exerciciosDoAluno };
    });
  };

  // Função para remover um exercício
  const removerExercicio = (alunoId, index) => {
    setExerciciosPorAluno((prev) => {
      const exerciciosDoAluno = [...(prev[alunoId] || [])];
      exerciciosDoAluno.splice(index, 1);
      return { ...prev, [alunoId]: exerciciosDoAluno };
    });
  };

  return (
    <div className="sala">
      <h1>
        Sala de Aula - {professorAtual ? professorAtual.nome : "Carregando..."}
      </h1>
      <div className="data-atual">
        {new Date().toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })}
      </div>

      {/* Área de mensagens de erro e carregamento */}
      {(salaLoading || authLoading) && (
        <div className="loading-container">Carregando dados...</div>
      )}
      {error && <div className="error-message">{error}</div>}

      {/* Mostrar a interface principal apenas depois de carregar */}
      {!salaLoading && !authLoading && professorAtual && (
        <div className="sala-container">
          {/* Sempre mostrar o dropdown de seleção de alunos, independente de haver alunos em aula ou não */}
          {aulaAtiva && (
            <div className="selecao-aluno">
              <div className="selecionar-aluno-container">
                <h3>Selecionar Aluno</h3>
                <div className="selecionar-aluno-dropdown">
                  <div
                    className="dropdown-header"
                    onClick={toggleAlunosDropdown}
                  >
                    <span>Selecione um aluno</span>
                    <span
                      className={`dropdown-icon ${
                        alunosDropdownAberto ? "up" : "down"
                      }`}
                    >
                      ▼
                    </span>
                  </div>

                  {alunosDropdownAberto && (
                    <div className="dropdown-options">
                      <div className="dropdown-search">
                        <input
                          type="text"
                          placeholder="Buscar aluno..."
                          value={termoBusca}
                          onChange={(e) => setTermoBusca(e.target.value)}
                        />
                      </div>

                      <div>
                        {alunosFiltrados.length > 0 ? (
                          alunosFiltrados.map((aluno) => (
                            <div
                              key={aluno.id}
                              className={`dropdown-option ${
                                alunosEmAula.some((a) => a.id === aluno.id)
                                  ? "ja-adicionado"
                                  : ""
                              }`}
                              onClick={() => handleSelecionarAluno(aluno)}
                            >
                              {aluno.nome}
                              {alunosEmAula.some((a) => a.id === aluno.id) && (
                                <span className="ja-adicionado-badge">
                                  Já na aula
                                </span>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="dropdown-option nenhum-resultado">
                            Nenhum aluno encontrado
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Lista de todos os alunos em aula com seus detalhes sempre visíveis */}
          {aulaAtiva && alunosEmAula.length > 0 && (
            <div className="detalhes-alunos-container">
              <h2>Alunos em Aula</h2>
              <div className="detalhes-aluno-grid">
                {alunosEmAula.map((aluno) => (
                  <div key={aluno.id} className="aluno-card-completo">
                    <div className="card-header">
                      <h3>{aluno.nome}</h3>
                    </div>
                    <div className="card-body">
                      {/* Painel de dados do aluno */}
                      <div className="painel-dados-aluno">
                        <div
                          className={`card-container ${getLesaoClass(
                            aluno.lesao
                          )}`}
                        >
                          <h4>Dados do Aluno</h4>
                          <div className="dados-aluno">
                            <p>
                              <strong>Nome:</strong> {aluno.nome}
                            </p>
                            <p>
                              <strong>Idade:</strong>{" "}
                              {aluno.idade || "Não informado"}
                            </p>
                            <p>
                              <strong>Lesão:</strong>{" "}
                              {aluno.tipo_lesao || "Não"}
                            </p>
                            <p>
                              <strong>Plano:</strong>{" "}
                              {aluno.plano || "Não informado"}
                            </p>
                            <p>
                              <strong>Nível:</strong>{" "}
                              {aluno.nivel || "Iniciante"}
                            </p>
                          </div>

                          {/* Observações cadastradas */}
                          <div className="observacoes-aluno">
                            <h4>Observações do Aluno:</h4>
                            <div className="observacoes-texto">
                              {alunoObservacoesCadastro[aluno.id] ||
                                "Sem observações cadastradas."}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Último treino do aluno */}
                      <div className="painel-ultimo-treino">
                        <div className="card-container">
                          <h4>Último Treino</h4>
                          <div className="ultimo-treino-content">
                            {ultimosTreinos[aluno.id] ? (
                              <div className="ultimo-treino-info">
                                <p>
                                  <strong>Data:</strong>{" "}
                                  {ultimosTreinos[aluno.id].data
                                    ? new Date(
                                        ultimosTreinos[aluno.id].data +
                                          "T00:00:00"
                                      ).toLocaleDateString("pt-BR")
                                    : "Data não disponível"}
                                </p>
                                <p>
                                  <strong>Professor:</strong>{" "}
                                  {ultimosTreinos[aluno.id].professor?.nome ||
                                    "Não informado"}
                                </p>
                                {ultimosTreinos[aluno.id].observacoes && (
                                  <div className="ultimo-treino-observacoes">
                                    <p className="observacoes-titulo">
                                      <strong>Observações:</strong>
                                    </p>
                                    <div className="observacoes-conteudo">
                                      {ultimosTreinos[aluno.id].observacoes}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <p className="sem-treino">
                                Este aluno não possui treinos anteriores
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Seleção de exercícios */}
                      <div className="painel-exercicios">
                        <div className="card-container">
                          <h4>Exercícios</h4>
                          <div className="exercicios-container">
                            {/* Lista de exercícios adicionados */}
                            {exerciciosPorAluno[aluno.id]?.map(
                              (exercicioItem, idx) => (
                                <div key={idx} className="exercicio-row">
                                  <select
                                    value={exercicioItem.exercicio_id || ""}
                                    onChange={(e) =>
                                      atualizarExercicio(
                                        aluno.id,
                                        idx,
                                        e.target.value
                                      )
                                    }
                                    className="exercicio-dropdown"
                                  >
                                    <option value="">
                                      Selecione um exercício
                                    </option>
                                    {todosExercicios.map((ex) => (
                                      <option key={ex.id} value={ex.id}>
                                        {ex.nome} - {ex.musculatura} (
                                        {ex.aparelho || "N/A"})
                                      </option>
                                    ))}
                                  </select>
                                  <button
                                    className="btn-remover-exercicio"
                                    onClick={() =>
                                      removerExercicio(aluno.id, idx)
                                    }
                                  >
                                    x
                                  </button>
                                </div>
                              )
                            )}

                            {/* Botão para adicionar novo exercício */}
                            <button
                              className="btn-adicionar-exercicio"
                              onClick={() => adicionarExercicio(aluno.id)}
                            >
                              + Adicionar exercício
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Adicionar observação */}
                      <div className="painel-adicionar-observacao">
                        <div className="card-container">
                          <h4>Adicionar Observação</h4>
                          <div className="adicionar-observacao-content">
                            <textarea
                              className="observacao-textarea"
                              value={alunoObservacoes[aluno.id] || ""}
                              onChange={(e) =>
                                setAlunoObservacoes({
                                  ...alunoObservacoes,
                                  [aluno.id]: e.target.value,
                                })
                              }
                              placeholder={`Adicione observações para ${aluno.nome} ...`}
                              rows={5}
                            ></textarea>

                            <div className="observacao-actions">
                              <button
                                className="btn-cancelar-aluno"
                                onClick={() =>
                                  handleCancelarAlunoIndividual(aluno.id)
                                }
                              >
                                Cancelar
                              </button>
                              <button
                                className="btn-finalizar-aluno"
                                onClick={() =>
                                  handleFinalizarAlunoIndividual(aluno.id)
                                }
                              >
                                Finalizar Aluno
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Botão para finalizar aula na parte inferior */}
          {aulaAtiva && (
            <div className="finalizar-aula-container">
              <button
                className="btn-finalizar-aula"
                onClick={handleFinalizarAula}
                disabled={salaLoading}
              >
                Finalizar Sala
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Sala;

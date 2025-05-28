import React, { useState, useEffect } from "react";
import "../styles/Sala.css";
import aulasService, { getDataAtual } from "../services/aulas.service"; // Importar a função getDataAtual
import alunosService from "../services/alunos.service";
import exerciciosService from "../services/exercicios.service";
import { useAuth } from "../hooks/useAuth";
import professoresService from "../services/professores.service";
import supabase from "../config/supabaseConfig.js";
import { toast } from "react-toastify";
import AulaAlunosService from "../services/AulaAlunosService";
import { useSala } from "../contexts/SalaContext";

function Sala() {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const [salaLoading, setSalaLoading] = useState(true);
  const [error, setError] = useState(null);

  // Usando o contexto SalaContext para acessar os estados persistentes
  const {
    alunoObservacoes,
    exerciciosPorAluno,
    updateAlunoObservacao,
    adicionarExercicio: addExercicio,
    atualizarExercicio: updateExercicio,
    removerExercicio: removeExercicio,
    limparDadosSala,
  } = useSala();

  // Estados do professor
  const [professorAtual, setProfessorAtual] = useState(null);

  // Estados da aula
  const [aulaAtiva, setAulaAtiva] = useState(false);
  const [aulaAtual, setAulaAtual] = useState(null);
  const [alunosEmAula, setAlunosEmAula] = useState([]);

  // Estados do aluno
  const [todosAlunos, setTodosAlunos] = useState([]);
  const [, setTodosExercicios] = useState([]);
  const [alunoSelecionado, setAlunoSelecionado] = useState(null);
  const [ultimosTreinos, setUltimosTreinos] = useState({});
  // Observações do cadastro do aluno (não editáveis)
  const [alunoObservacoesCadastro, setAlunoObservacoesCadastro] = useState({});
  // Mantenha setAlunoObservacoes como uma função que usa updateAlunoObservacao
  const setAlunoObservacoes = (newObservacoes) => {
    // Se receber um objeto, assumimos que é um conjunto de observações
    if (typeof newObservacoes === "object") {
      // Para cada par chave-valor no objeto, atualizar a observação daquele aluno
      Object.entries(newObservacoes).forEach(([alunoId, observacao]) => {
        updateAlunoObservacao(alunoId, observacao);
      });
    }
  };

  // Estados para gerenciar feedback e processamento
  const [, setProcessandoFinalizacao] = useState(false);

  // Estados da interface
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
          const agora = new Date();
          const horas = String(agora.getHours()).padStart(2, "0");
          const minutos = String(agora.getMinutes()).padStart(2, "0");

          const novaAula = {
            professor_id: professorAtual.id,
            status: "em_andamento",
            data: agora.toISOString().split("T")[0],
            hora: `${horas}:${minutos}`,
            observacoes: "",
            alunos: [],
          };

          // Salvar a aula no banco de dados imediatamente
          const aulaSalva = await aulasService.create(novaAula);

          // Atualizar os estados com a aula criada
          setAulaAtual(aulaSalva);
          setAulaAtiva(true);
          setAlunosEmAula([]);
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

          // Manter dropdown fechado inicialmente em todos os casos
          setAlunosDropdownAberto(false);
        } catch (alunosError) {
          console.error("Erro ao buscar alunos da aula:", alunosError);
          // Mesmo com erro nos alunos, ainda carregamos a aula básica
          setAulaAtual(aulaBasica);
          setAulaAtiva(true);
          setAlunosEmAula([]);
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
      console.log(
        "[SALA] Iniciando busca de treinos, observações atuais do contexto:",
        alunoObservacoes
      );

      // Garantir que alunosEmAula é um array
      if (!Array.isArray(alunosEmAula)) {
        console.warn(
          "[WARN] alunosEmAula não é um array, pulando busca de treinos. Valor:",
          alunosEmAula
        );
        setUltimosTreinos({});
        setAlunoObservacoesCadastro({});
        return;
      }

      if (alunosEmAula.length === 0) {
        console.log(
          "[INFO] alunosEmAula está vazio, limpando treinos e observações."
        );
        setUltimosTreinos({});
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

        // Verificar se já existe uma observação no contexto para este aluno
        if (alunoObservacoes[aluno.id]) {
          console.log(
            `[INFO] Observação encontrada no contexto para aluno ${aluno.id}:`,
            alunoObservacoes[aluno.id]
          );
        }

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

      // Atualizar os estados com todos os dados coletados
      console.log(
        `[UPDATE] Atualizando dados para ${
          Object.keys(novasObservacoesCadastro).length
        } alunos`
      );
      setUltimosTreinos(novosUltimosTreinos);
      setAlunoObservacoesCadastro(novasObservacoesCadastro); // Observações do cadastro

      // NÃO inicialize as observações vazias aqui!
      // O Context API já deve ter carregado as observações salvas do localStorage
      // Apenas inicialize observações para novos alunos que não têm observações ainda
      console.log("[INFO] Preservando observações salvas no localStorage");
    };

    buscarUltimosTreinosParaAlunosVisiveis();
  }, [alunosEmAula, aulaAtual?.id, alunoObservacoes]);

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

      // Garantir que a data seja a atual (UTC) para todas as aulas finalizadas
      const hoje = new Date();
      const ano = hoje.getUTCFullYear(); // Usar UTC
      const mes = String(hoje.getUTCMonth() + 1).padStart(2, "0"); // Usar UTC (mês é 0-11)
      const dia = String(hoje.getUTCDate()).padStart(2, "0"); // Usar UTC
      const dataFormatadaISO = `${ano}-${mes}-${dia}`; // Formato YYYY-MM-DD com data UTC

      // Capturar o horário atual para registrar quando a aula foi finalizada
      const horas = String(hoje.getHours()).padStart(2, "0");
      const minutos = String(hoje.getMinutes()).padStart(2, "0");
      const horaAtual = `${horas}:${minutos}`;

      // LOG DETALHADO DA DATA (mantido para verificação)
      console.log(`[handleFinalizarAula] Data Crua Local: ${hoje.toString()}`);
      console.log(
        `[handleFinalizarAula] Ano UTC: ${ano}, Mês UTC: ${mes}, Dia UTC: ${dia}`
      );
      console.log(
        `[handleFinalizarAula] Data Formatada (UTC) para BD: ${dataFormatadaISO}`
      );
      console.log(`[handleFinalizarAula] Hora de finalização: ${horaAtual}`);

      console.log(`Data UTC para finalização da sala: ${dataFormatadaISO}`);

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
                data: dataFormatadaISO, // CORRIGIDO: Usar data calculada
                status: "finalizada",
                observacoes: observacoes, // Usar observações específicas do aluno
                hora: horaAtual, // Adicionar o horário de finalização
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
            data: dataFormatadaISO, // CORRIGIDO: Usar data calculada
            hora: horaAtual, // Adicionar hora de finalização
            alunos: [],
          })
          .eq("id", aula.id);
      }

      // Limpar os dados do localStorage ao finalizar a aula
      limparDadosSala();

      // Limpar o estado local
      setAulaAtiva(false);
      setAulaAtual(null);
      setAlunosEmAula([]);
      setAlunoSelecionado(null);

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
            console.error(
              "Erro ao buscar dados completos do aluno:",
              dadosError
            );
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
              const alunosAtualizados = aulaAtualizada.alunos.map(
                (alunoAula) => {
                  // Verificar se o aluno é o que acabamos de adicionar
                  if (alunoAula.id === alunoCompleto.id) {
                    return alunoCompleto; // Usar a versão completa que buscamos
                  }

                  // Para os outros alunos, manter os dados existentes de alunosEmAula
                  const alunoExistente = alunosEmAula.find(
                    (a) => a.id === alunoAula.id
                  );
                  return alunoExistente || alunoAula;
                }
              );

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
        setAlunosDropdownAberto(true);
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
        // Para armazenamento no banco, usar a função auxiliar do serviço de aulas
        // que garante a data correta (agora usando UTC)
        const hoje = new Date();
        const ano = hoje.getUTCFullYear(); // Usar UTC
        const mes = String(hoje.getUTCMonth() + 1).padStart(2, "0"); // Usar UTC (mês é 0-11)
        const dia = String(hoje.getUTCDate()).padStart(2, "0"); // Usar UTC
        const dataFormatadaISO = `${ano}-${mes}-${dia}`; // Formato YYYY-MM-DD com data UTC

        // Capturar horário atual para registrar o momento da finalização
        const horas = String(hoje.getHours()).padStart(2, "0");
        const minutos = String(hoje.getMinutes()).padStart(2, "0");
        const horaAtual = `${horas}:${minutos}`;

        console.log(
          `[handleFinalizarAlunoIndividual] Data Crua Local: ${hoje.toString()}`
        );
        console.log(
          `[handleFinalizarAlunoIndividual] Ano UTC: ${ano}, Mês UTC: ${mes}, Dia UTC: ${dia}`
        );
        console.log(
          `[handleFinalizarAlunoIndividual] Data Formatada (UTC) para BD: ${dataFormatadaISO}`
        );
        console.log(
          `[handleFinalizarAlunoIndividual] Hora de finalização: ${horaAtual}`
        );

        const aulaIndividualFinalizada = {
          professor_id: aulaAtual.professor_id,
          data: dataFormatadaISO, // Usar data UTC calculada
          status: "finalizada",
          observacoes: observacoesAluno, // Usar observações específicas do aluno
          hora: horaAtual, // Registrar o horário em que o aluno foi finalizado
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

  // Função para navegar para o histórico de aulas do aluno
  const navegarParaHistoricoAluno = (alunoId) => {
    // Usar window.location.href para garantir a navegação com URL completa
    const baseUrl = window.location.origin; // Obtém http://localhost:3000 em desenvolvimento ou o domínio em produção
    window.location.href = `${baseUrl}/detalhe-aluno/${alunoId}`;
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
                      <div className="aluno-nome-container">
                        <h3>{aluno.nome}</h3>
                        <button
                          onClick={() => navegarParaHistoricoAluno(aluno.id)}
                          className="btn-historico-mini"
                          title="Ver histórico de aulas"
                        >
                          Histórico
                        </button>
                      </div>
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

                      {/* Adicionar observação */}
                      <div className="painel-adicionar-observacao">
                        <div className="card-container">
                          <h4>Adicionar Observação</h4>
                          <div className="adicionar-observacao-content">
                            {(() => {
                              // Log para depurar o valor passado para o textarea
                              const observacaoAtual =
                                alunoObservacoes[aluno.id] || "";
                              console.log(
                                `[SALA RENDER] Aluno ${aluno.id} (${aluno.nome}) - Valor da observação para textarea:`,
                                observacaoAtual
                              );
                              return (
                                <textarea
                                  className="observacao-textarea"
                                  value={observacaoAtual}
                                  onChange={(e) => {
                                    // Usar a função do contexto para atualizar a observação do aluno
                                    // e persistir no localStorage
                                    updateAlunoObservacao(
                                      aluno.id,
                                      e.target.value
                                    );
                                  }}
                                  placeholder={`Adicione observações para ${aluno.nome} ...`}
                                  rows={5}
                                ></textarea>
                              );
                            })()}
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

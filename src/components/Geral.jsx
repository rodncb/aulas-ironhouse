// Importações
import React, { useState, useEffect } from "react";
import "../styles/Geral.css";
import {
  voltarPagina,
  getStatusLabel,
  formatarData,
  navegarPara,
} from "../lib/utils";

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

  // Função para atualizar o histórico de aulas dos alunos
  const atualizarHistoricoAlunos = (aula) => {
    const alunosAtualizados = todosAlunos.map((aluno) => {
      if (aula.alunos.some((alunoAula) => alunoAula.id === aluno.id)) {
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
    setTodosAlunos(alunosAtualizados);
    localStorage.setItem("alunos", JSON.stringify(alunosAtualizados));
    window.dispatchEvent(
      new CustomEvent("atualizarHistoricoAlunos", {
        detail: { alunos: alunosAtualizados },
      })
    );
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

    // Atualiza no estado local e no localStorage
    setTodosProfessores(professoresAtualizados);
    localStorage.setItem(
      "todosProfessores",
      JSON.stringify(professoresAtualizados)
    );

    // Dispara um evento personalizado para notificar outros componentes
    window.dispatchEvent(
      new CustomEvent("atualizarHistoricoProfessores", {
        detail: { professores: professoresAtualizados },
      })
    );
  };

  // Inicializar dados do localStorage ao montar o componente
  useEffect(() => {
    try {
      // Carregar histórico de aulas do localStorage
      const historicoSalvo = localStorage.getItem("historicoAulas");
      let historicoAulasCarregado = [];

      if (historicoSalvo) {
        const aulas = JSON.parse(historicoSalvo);

        // Remover possíveis duplicatas (aulas com o mesmo ID)
        const aulasUnicas = [];
        const idsProcessados = new Set();

        aulas.forEach((aula) => {
          if (!idsProcessados.has(aula.id)) {
            aulasUnicas.push(aula);
            idsProcessados.add(aula.id);
          }
        });

        historicoAulasCarregado = aulasUnicas;
        setHistoricoAulas(aulasUnicas);
        localStorage.setItem("historicoAulas", JSON.stringify(aulasUnicas));
      }

      // Recupera todos os alunos do localStorage
      const alunosSalvos = localStorage.getItem("alunos");
      if (alunosSalvos) {
        const alunos = JSON.parse(alunosSalvos);
        setTodosAlunos(alunos);
      } else {
        // Se não existir, salva a lista inicial
        localStorage.setItem("alunos", JSON.stringify(todosAlunos));
      }

      // Carregar professores do localStorage
      const professoresSalvos = localStorage.getItem("todosProfessores");
      if (professoresSalvos) {
        const professores = JSON.parse(professoresSalvos);
        setTodosProfessores(professores);
      } else {
        // Se não existir, salva a lista inicial
        localStorage.setItem(
          "todosProfessores",
          JSON.stringify(todosProfessores)
        );
      }

      // Carregar exercícios do localStorage
      const exerciciosSalvos = localStorage.getItem("exercicios");
      if (exerciciosSalvos) {
        const exercicios = JSON.parse(exerciciosSalvos);
        setTodosExercicios(exercicios);
      } else {
        // Se não existir, salva a lista inicial
        localStorage.setItem("exercicios", JSON.stringify(todosExercicios));
      }

      // Carregar aula atual do localStorage
      const aulaAtualSalva = JSON.parse(
        localStorage.getItem("aulaAtual") || "null"
      );

      if (aulaAtualSalva) {
        // Importante: verificar se a aula atual já está no histórico e com status diferente
        const aulaNoHistorico = historicoAulasCarregado.find(
          (aula) => aula.id === aulaAtualSalva.id
        );
        if (aulaNoHistorico && aulaNoHistorico.status !== "atual") {
          // Usar os dados da aula do histórico para manter consistência
          setAulaAtual(aulaNoHistorico);
          localStorage.setItem("aulaAtual", JSON.stringify(aulaNoHistorico));

          // Garantir que alunosNaAula esteja sincronizado
          if (aulaNoHistorico.alunos && aulaNoHistorico.alunos.length > 0) {
            setAlunosNaAula(aulaNoHistorico.alunos);
            if (atualizarAlunosEmAula) {
              atualizarAlunosEmAula(aulaNoHistorico.alunos);
            }
          }
        } else {
          // Não foi encontrada ou está consistente, usar normalmente
          setAulaAtual(aulaAtualSalva);

          // Se houver aula atual salva, atualiza os alunos na aula
          if (aulaAtualSalva.alunos && aulaAtualSalva.alunos.length > 0) {
            setAlunosNaAula(aulaAtualSalva.alunos);

            if (atualizarAlunosEmAula) {
              atualizarAlunosEmAula(aulaAtualSalva.alunos);
            }
          }

          // Verifica se a aula atual está no histórico
          if (historicoAulasCarregado.length > 0) {
            const aulaAtualNoHistorico = historicoAulasCarregado.some(
              (aula) => aula.id === aulaAtualSalva.id
            );

            // Adiciona a aula atual ao histórico se não existir
            if (!aulaAtualNoHistorico) {
              const historicoAtualizado = [
                ...historicoAulasCarregado,
                aulaAtualSalva,
              ];
              setHistoricoAulas(historicoAtualizado);
              localStorage.setItem(
                "historicoAulas",
                JSON.stringify(historicoAtualizado)
              );
            }
          } else {
            // Se não houver histórico, cria um com a aula atual
            setHistoricoAulas([aulaAtualSalva]);
            localStorage.setItem(
              "historicoAulas",
              JSON.stringify([aulaAtualSalva])
            );
          }
        }
      }

      setInitialized(true);
    } catch (error) {
      // Manter o catch vazio para tratar silenciosamente os erros
    }
  }, []);

  // Atualizar localStorage quando o histórico muda
  useEffect(() => {
    if (!initialized) return;

    try {
      localStorage.setItem("historicoAulas", JSON.stringify(historicoAulas));
    } catch (error) {
      // Tratar erro silenciosamente
    }
  }, [historicoAulas, initialized]);

  // Atualizar localStorage quando a aula atual muda
  useEffect(() => {
    if (!initialized || !aulaAtual) return;

    try {
      localStorage.setItem("aulaAtual", JSON.stringify(aulaAtual));
    } catch (error) {
      // Manter o catch vazio para tratar silenciosamente os erros
    }
  }, [aulaAtual, initialized]);

  // Sincronizar aulaAtual com historicoAulas para manter a contagem consistente
  useEffect(() => {
    if (!initialized || !aulaAtual) return;

    // Verificar se aulaAtual está no historicoAulas com o mesmo status
    const aulaNoHistorico = historicoAulas.find(
      (aula) => aula.id === aulaAtual.id
    );

    if (aulaNoHistorico) {
      // Se o status no histórico for diferente da aulaAtual, usar o status do histórico
      if (aulaNoHistorico.status !== aulaAtual.status) {
        setAulaAtual(aulaNoHistorico);
      }

      // Se os alunos no histórico forem diferentes da aulaAtual, sincronizar
      if (
        JSON.stringify(aulaNoHistorico.alunos) !==
        JSON.stringify(aulaAtual.alunos)
      ) {
        // Se o histórico tem alunos e aulaAtual não, usar alunos do histórico
        if (
          aulaNoHistorico.alunos &&
          aulaNoHistorico.alunos.length > 0 &&
          (!aulaAtual.alunos || aulaAtual.alunos.length === 0)
        ) {
          setAlunosNaAula(aulaNoHistorico.alunos);

          const aulaAtualAtualizada = {
            ...aulaAtual,
            alunos: aulaNoHistorico.alunos,
            totalAlunos: aulaNoHistorico.alunos.length,
          };

          setAulaAtual(aulaAtualAtualizada);
          localStorage.setItem(
            "aulaAtual",
            JSON.stringify(aulaAtualAtualizada)
          );

          if (atualizarAlunosEmAula) {
            atualizarAlunosEmAula(aulaNoHistorico.alunos);
          }
        }
      }
    }
  }, [initialized, aulaAtual, historicoAulas, atualizarAlunosEmAula]);

  // No início do componente, após os outros useEffects
  useEffect(() => {
    // Sincronizar a lista de alunosNaAula com a aulaAtual
    if (aulaAtual && aulaAtual.alunos) {
      setAlunosNaAula(aulaAtual.alunos);

      // Atualizar também no App.js se necessário
      if (atualizarAlunosEmAula) {
        atualizarAlunosEmAula(aulaAtual.alunos);
      }
    } else {
      // Se não há aula atual ou não há alunos, limpar a lista
      setAlunosNaAula([]);
      if (atualizarAlunosEmAula) {
        atualizarAlunosEmAula([]);
      }
    }
  }, [aulaAtual, atualizarAlunosEmAula]);

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

  const adicionarAlunoAula = () => {
    if (!alunoSelecionado) {
      alert("Por favor, selecione um aluno para adicionar.");
      return;
    }

    if (alunosNaAula.length >= 4) {
      alert("Não é possível adicionar mais de 4 alunos na mesma aula.");
      return;
    }

    const alunoId = parseInt(alunoSelecionado);
    if (alunosNaAula.some((aluno) => aluno.id === alunoId)) {
      alert("Este aluno já está nesta aula.");
      return;
    }

    const aluno = todosAlunos.find((a) => a.id === alunoId);
    if (!aluno) {
      alert("Aluno não encontrado.");
      return;
    }

    const novosAlunosEmAula = [...alunosNaAula, aluno];
    setAlunosNaAula(novosAlunosEmAula);

    // Atualizar a aula atual
    if (aulaAtual) {
      const aulaAtualizada = {
        ...aulaAtual,
        alunos: novosAlunosEmAula,
        totalAlunos: novosAlunosEmAula.length,
      };
      setAulaAtual(aulaAtualizada);
      localStorage.setItem("aulaAtual", JSON.stringify(aulaAtualizada));

      // Atualizar no histórico
      const historicoAtualizado = historicoAulas.map((aula) =>
        aula.id === aulaAtual.id ? aulaAtualizada : aula
      );
      setHistoricoAulas(historicoAtualizado);
      localStorage.setItem(
        "historicoAulas",
        JSON.stringify(historicoAtualizado)
      );
    }

    // Atualizar no App.js
    if (atualizarAlunosEmAula) {
      atualizarAlunosEmAula(novosAlunosEmAula);
    }

    // Limpar seleção
    setAlunoSelecionado("");
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

  const salvarAulaSemFinalizar = () => {
    if (alunosNaAula.length === 0) {
      alert("Adicione pelo menos um aluno à aula antes de salvar.");
      return;
    }
    const professor = professorSelecionado
      ? todosProfessores.find((p) => p.id === parseInt(professorSelecionado))
      : null;
    let historicoAulasAtual = JSON.parse(
      localStorage.getItem("historicoAulas") || "[]"
    );
    let novaAula;
    if (modoEdicao && aulaEditando) {
      novaAula = {
        ...aulaEditando,
        alunos: alunosNaAula,
        totalAlunos: alunosNaAula.length,
        professor: professor || aulaEditando.professor || null,
        exercicios: exerciciosSelecionados,
        status: "atual",
        ultimaAtualizacao: new Date().toISOString(),
      };
      historicoAulasAtual = historicoAulasAtual.map((aula) =>
        aula.id === aulaEditando.id ? novaAula : aula
      );
    } else {
      novaAula = {
        id: Date.now(),
        data: new Date().toLocaleDateString("pt-BR"),
        alunos: alunosNaAula,
        totalAlunos: alunosNaAula.length,
        professor: professor || null,
        exercicios: exerciciosSelecionados,
        status: "atual",
        dataCriacao: new Date().toISOString(),
      };
      historicoAulasAtual = [...historicoAulasAtual, novaAula];
    }
    setHistoricoAulas(historicoAulasAtual);
    localStorage.setItem("historicoAulas", JSON.stringify(historicoAulasAtual));
    setAulaAtual(novaAula);
    localStorage.setItem("aulaAtual", JSON.stringify(novaAula));
    setShowSelecao(false);
    setModoEdicao(false);
    setAulaEditando(null);
    setAlunoSelecionado("");
    setProfessorSelecionado("");
    setExerciciosSelecionados([]);
    setAlunosNaAula([]);
    if (atualizarAlunosEmAula) atualizarAlunosEmAula([]);
    alert("Aula salva com sucesso!");
  };

  const salvarAula = () => {
    if (alunosNaAula.length === 0) {
      alert("Adicione pelo menos um aluno à aula");
      return;
    }
    const dataAtual = new Date();
    const dataFormatada = `${String(dataAtual.getDate()).padStart(
      2,
      "0"
    )}/${String(dataAtual.getMonth() + 1).padStart(
      2,
      "0"
    )}/${dataAtual.getFullYear()}`;
    const professorObj = todosProfessores.find(
      (p) => p.id === parseInt(professorSelecionado)
    );
    let historicoAulasAtual = JSON.parse(
      localStorage.getItem("historicoAulas") || "[]"
    );
    let novaAula;
    if (modoEdicao && aulaEditando) {
      novaAula = {
        ...aulaEditando,
        data: aulaEditando.data || dataFormatada,
        alunos: alunosNaAula,
        totalAlunos: alunosNaAula.length,
        professor: professorObj || aulaEditando.professor || null,
        exercicios: exerciciosSelecionados,
        ultimaAtualizacao: new Date().toISOString(),
      };
      historicoAulasAtual = historicoAulasAtual.map((aula) =>
        aula.id === aulaEditando.id ? novaAula : aula
      );
    } else {
      novaAula = {
        id: Date.now(),
        data: dataFormatada,
        alunos: alunosNaAula,
        totalAlunos: alunosNaAula.length,
        professor: professorObj || null,
        exercicios: exerciciosSelecionados,
        status: "atual",
        dataCriacao: new Date().toISOString(),
      };
      historicoAulasAtual = [...historicoAulasAtual, novaAula];
    }
    setHistoricoAulas(historicoAulasAtual);
    localStorage.setItem("historicoAulas", JSON.stringify(historicoAulasAtual));
    setAulaAtual(novaAula);
    localStorage.setItem("aulaAtual", JSON.stringify(novaAula));
    setShowSelecao(false);
    setModoEdicao(false);
    setAulaEditando(null);
    setAlunoSelecionado("");
    setProfessorSelecionado("");
    setExerciciosSelecionados([]);
    setAlunosNaAula([]);
    if (atualizarAlunosEmAula) atualizarAlunosEmAula([]);
    alert("Aula salva com sucesso!");
  };

  const iniciarNovaAula = () => {
    // Limpar localStorage e estados relacionados à aula atual
    localStorage.removeItem("aulaAtual");
    setAulaAtual(null);

    // Reset completo dos estados
    setAlunoSelecionado("");
    setProfessorSelecionado("");
    setExerciciosSelecionados([]);
    setAlunosNaAula([]);
    setModoEdicao(false);
    setAulaEditando(null);
    setActiveDropdown(null);

    // Limpar aulas "atuais" existentes sem alunos do histórico
    const aulasLimpas = historicoAulas.filter((aula) => {
      return aula.status !== "atual" || (aula.alunos && aula.alunos.length > 0);
    });

    // Atualizar histórico com as aulas limpas
    setHistoricoAulas(aulasLimpas);
    localStorage.setItem("historicoAulas", JSON.stringify(aulasLimpas));

    // Criar nova aula
    const hoje = new Date().toLocaleDateString("pt-BR");
    const novaAulaVazia = {
      id: Date.now(),
      data: hoje,
      alunos: [],
      totalAlunos: 0,
      exercicios: [],
      status: "atual",
    };

    // Adicionar nova aula ao histórico
    const historicoAtualizado = [...aulasLimpas, novaAulaVazia];
    setHistoricoAulas(historicoAtualizado);
    localStorage.setItem("historicoAulas", JSON.stringify(historicoAtualizado));

    // Definir a nova aula como atual
    setAulaAtual(novaAulaVazia);
    localStorage.setItem("aulaAtual", JSON.stringify(novaAulaVazia));

    // Atualizar no App.js
    if (atualizarAlunosEmAula) {
      atualizarAlunosEmAula([]);
    }

    // Resetar paginação
    setPaginaAtual(1);

    // Mostrar painel de seleção
    setShowSelecao(true);

    // Scroll suave até o formulário de nova aula (não mais ao histórico)
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
  };

  const editarAula = (aula) => {
    // Primeiro, configurar o modo de edição e a aula sendo editada
    setModoEdicao(true);
    setAulaEditando({ ...aula });

    // Depois, carregar os dados nos estados correspondentes
    setAlunosNaAula(aula.alunos ? [...aula.alunos] : []);
    setProfessorSelecionado(aula.professor ? aula.professor.id.toString() : "");
    setExerciciosSelecionados(aula.exercicios ? [...aula.exercicios] : []);

    // Limpar estados temporários
    setAlunoSelecionado("");
    setPesquisaExercicio("");

    // Por último, mostrar o painel de seleção
    setShowSelecao(true);
  };

  const prepararCancelarAula = (aula) => {
    setAulaCancelar(aula);
    setShowConfirmCancelar(true);
    setActiveDropdown(null); // Fecha o dropdown quando abrir o modal de confirmação
  };

  const confirmarCancelarAula = () => {
    if (!aulaCancelar) return;

    // Atualiza o status da aula para "cancelada" no histórico
    const aulasCanceladas = historicoAulas.map((aula) =>
      aula.id === aulaCancelar.id ? { ...aula, status: "cancelada" } : aula
    );

    setHistoricoAulas(aulasCanceladas);
    localStorage.setItem("historicoAulas", JSON.stringify(aulasCanceladas));

    // Se a aula cancelada for a atual, atualiza também
    if (aulaAtual && aulaAtual.id === aulaCancelar.id) {
      const aulaAtualCancelada = { ...aulaAtual, status: "cancelada" };
      setAulaAtual(aulaAtualCancelada);
      localStorage.setItem("aulaAtual", JSON.stringify(aulaAtualCancelada));

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
  };

  const exibirDetalhesAula = (aula) => {
    setAulaAtual(aula);
    setShowDetalhesAula(true);
    setModalAberto(true);
  };

  const renderizarModalDetalhes = () => {
    if (!modalAberto || !aulaAtual) return null;

    return (
      <div
        className="modal-backdrop"
        onClick={() => {
          setModalAberto(false);
          setShowDetalhesAula(false);
        }}
      >
        <div className="detalhes-modal" onClick={(e) => e.stopPropagation()}>
          <button
            className="btn-fechar"
            onClick={() => {
              setModalAberto(false);
              setShowDetalhesAula(false);
            }}
          >
            ×
          </button>
          <h2>Detalhes da Aula</h2>

          <div className="detalhes-data">
            <p>
              <strong>Data:</strong> {aulaAtual.data}
            </p>
            <p>
              <strong>Status:</strong> {getStatusLabel(aulaAtual.status)}
            </p>
            <p>
              <strong>Professor:</strong>{" "}
              {aulaAtual.professor ? aulaAtual.professor.nome : "Não definido"}
            </p>
          </div>

          <div className="detalhes-alunos">
            <h3>Alunos Presentes</h3>
            <ul className="lista-alunos-presentes">
              {aulaAtual.alunos.map((aluno) => (
                <li key={aluno.id} className="aluno-item">
                  {aluno.nome} - {aluno.idade} anos
                </li>
              ))}
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
                <ul className="lista-alunos-presentes">
                  {aulaAtual.exercicios.map((exercicio, index) => (
                    <li key={exercicio.id || index} className="aluno-item">
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

  const marcarComoRealizada = (aula) => {
    // Atualizar o status da aula para "realizada" no histórico de aulas
    const aulasAtualizadas = historicoAulas.map((a) =>
      a.id === aula.id ? { ...a, status: "realizada" } : a
    );

    setHistoricoAulas(aulasAtualizadas);
    localStorage.setItem("historicoAulas", JSON.stringify(aulasAtualizadas));

    // Se a aula que está sendo marcada como realizada for a aula atual,
    // atualizar também o estado da aula atual
    if (aulaAtual && aulaAtual.id === aula.id) {
      const aulaAtualRealizada = { ...aulaAtual, status: "realizada" };
      setAulaAtual(aulaAtualRealizada);
      localStorage.setItem("aulaAtual", JSON.stringify(aulaAtualRealizada));

      // Atualizar o histórico dos alunos
      atualizarHistoricoAlunos(aulaAtualRealizada);
    } else {
      // Se não for a aula atual, procurar a aula no histórico
      const aulaRealizada = aulasAtualizadas.find((a) => a.id === aula.id);
      if (aulaRealizada) {
        atualizarHistoricoAlunos(aulaRealizada);
      }
    }

    setActiveDropdown(null); // Fechar dropdown se estiver aberto
  };

  const contarAulasAtuais = () => {
    return historicoAulas.filter((aula) => aula.status === "atual").length;
  };

  const totalAulasAtuais = contarAulasAtuais();

  const removerAlunoDaAula = (alunoId) => {
    // Remove o aluno da lista
    const novosAlunosEmAula = alunosNaAula.filter(
      (aluno) => aluno.id !== alunoId
    );
    setAlunosNaAula(novosAlunosEmAula);

    // Atualiza a aula atual (estado e localStorage)
    if (aulaAtual) {
      const aulaAtualizada = {
        ...aulaAtual,
        alunos: novosAlunosEmAula,
        totalAlunos: novosAlunosEmAula.length,
      };
      setAulaAtual(aulaAtualizada);
      localStorage.setItem("aulaAtual", JSON.stringify(aulaAtualizada));

      // Atualiza o histórico de aulas (mantendo consistência)
      const historicoAulasSalvo = JSON.parse(
        localStorage.getItem("historicoAulas") || "[]"
      );
      const historicoAtualizado = historicoAulasSalvo.map((aula) =>
        aula.id === aulaAtualizada.id ? aulaAtualizada : aula
      );
      setHistoricoAulas(historicoAtualizado);
      localStorage.setItem(
        "historicoAulas",
        JSON.stringify(historicoAtualizado)
      );
    }

    // Atualiza também no App.js
    if (atualizarAlunosEmAula) {
      atualizarAlunosEmAula(novosAlunosEmAula);
    }
  };

  const renderizarAlunosAtuais = () => {
    // Obter todas as aulas com status "atual"
    const aulasAtuais = todasAulas().filter((aula) => aula.status === "atual");

    // Array para armazenar todos os alunos das aulas atuais
    let todosAlunosAtuais = [];

    // Combinar alunos de todas as aulas atuais
    aulasAtuais.forEach((aula) => {
      if (aula.alunos && aula.alunos.length > 0) {
        // Usar um Map para evitar alunos duplicados (usando ID como chave)
        aula.alunos.forEach((aluno) => {
          if (!todosAlunosAtuais.some((a) => a.id === aluno.id)) {
            todosAlunosAtuais.push(aluno);
          }
        });
      }
    });

    // Limitar a 8 alunos
    todosAlunosAtuais = todosAlunosAtuais.slice(0, 8);

    return (
      <div className="alunos-atuais">
        <h2>Alunos em Aula</h2>

        {aulasAtuais.length === 0 ? (
          <p className="sem-registros">Nenhuma aula atual registrada.</p>
        ) : todosAlunosAtuais.length > 0 ? (
          <div className="lista-alunos-atuais">
            {todosAlunosAtuais.map((aluno) => (
              <div key={aluno.id} className="card-aluno-atual">
                <h3>{aluno.nome}</h3>
                <p>Idade: {aluno.idade} anos</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="sem-registros">
            Nenhum aluno adicionado às aulas atuais.
          </p>
        )}
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

  return (
    <div className="geral-container" style={containerStyle}>
      <div className="geral-header">
        <h1>Dashboard</h1>
        <div className="header-buttons">
          <button
            className="btn-nova-aula"
            onClick={iniciarNovaAula}
            aria-label="Iniciar Nova Aula"
          >
            <span>+</span> Nova Aula
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
            {historicoAulas.filter((aula) => aula.status === "atual").length}
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

            <div className="selecao-actions">
              <button
                className="btn-cancelar"
                onClick={() => {
                  setShowSelecao(false);
                  setAlunosNaAula([]);
                  setAlunoSelecionado("");
                  setProfessorSelecionado("");
                  setExerciciosSelecionados([]);
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
                disabled={alunosNaAula.length === 0}
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
              {aulasOrdenadas().map((aula) => (
                <tr key={aula.id} className={`aula-${aula.status}`}>
                  <td>{formatarData(aula.data)}</td>
                  <td>
                    {aula.professor ? aula.professor.nome : "Sem professor"}
                  </td>
                  <td>{aula.totalAlunos}</td>
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
              ))}
            </tbody>
          </table>
        ) : (
          <p>Nenhum registro encontrado no histórico.</p>
        )}
      </div>

      {/* Modal de detalhes da aula */}
      {showDetalhesAula && renderizarModalDetalhes()}
    </div>
  );
};

export default Geral;

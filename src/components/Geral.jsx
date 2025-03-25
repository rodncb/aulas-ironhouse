import React, { useState, useEffect } from "react";
import "../styles/Geral.css";

const Geral = ({ alunosEmAula, atualizarAlunosEmAula }) => {
  const [historicoAulas, setHistoricoAulas] = useState([]);
  const [todosAlunos, setTodosAlunos] = useState([
    { id: 1, nome: "Adriano Faria de Souza", idade: 43 },
    { id: 2, nome: "Adriano Laranjo", idade: 37 },
    { id: 3, nome: "Adriano Silva", idade: 39 },
    { id: 4, nome: "Agnella Massara", idade: 46 },
    { id: 5, nome: "Alessandra Cunha", idade: 46 },
    { id: 6, nome: "Alessandra Maria Sales", idade: 46 },
    { id: 7, nome: "Alexandre Buscher", idade: 36 },
    { id: 8, nome: "Alexandre Teixeira", idade: 36 },
    { id: 9, nome: "Vitor", idade: 25 },
  ]);
  const [showSelecao, setShowSelecao] = useState(false);
  const [alunoSelecionado, setAlunoSelecionado] = useState("");
  const [alunosNaAula, setAlunosNaAula] = useState([]);
  // Estado para controlar o modal de detalhes da aula
  const [showDetalhesAula, setShowDetalhesAula] = useState(false);
  const [aulaDetalhes, setAulaDetalhes] = useState(null);
  // Estado para a aula atual
  const [aulaAtual, setAulaAtual] = useState(null);
  // Flag para controlar se a inicialização já foi feita
  const [initialized, setInitialized] = useState(false);

  // Estados para paginação
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(5);

  // Estado para confirmação de cancelamento
  const [showConfirmCancelar, setShowConfirmCancelar] = useState(false);
  const [aulaCancelar, setAulaCancelar] = useState(null);

  // Estado para edição de aula
  const [aulaEditando, setAulaEditando] = useState(null);
  const [modoEdicao, setModoEdicao] = useState(false);

  // Inicializar dados do localStorage ao montar o componente
  useEffect(() => {
    // Evita duplicação de carregamento
    if (initialized) return;

    try {
      console.log("Inicializando dados do localStorage");

      // Recupera histórico de aulas do localStorage
      const historicoSalvo = localStorage.getItem("historicoAulas");
      if (historicoSalvo) {
        const aulas = JSON.parse(historicoSalvo);
        console.log("Histórico carregado:", aulas);
        setHistoricoAulas(aulas);
      } else {
        console.log("Nenhum histórico encontrado no localStorage");
      }

      // Recupera aula atual do localStorage
      const aulaSalva = localStorage.getItem("aulaAtual");
      if (aulaSalva) {
        const aulaAtualSalva = JSON.parse(aulaSalva);
        console.log("Aula atual carregada:", aulaAtualSalva);
        setAulaAtual(aulaAtualSalva);

        // Se houver aula atual salva, atualiza os alunos na aula
        if (aulaAtualSalva.alunos && aulaAtualSalva.alunos.length > 0) {
          setAlunosNaAula(aulaAtualSalva.alunos);
          if (atualizarAlunosEmAula) {
            atualizarAlunosEmAula(aulaAtualSalva.alunos);
          }
        }
      } else if (alunosEmAula && alunosEmAula.length > 0) {
        // Se não tiver aula no localStorage, mas tiver alunos em aula vindos do App.js
        console.log("Usando alunos do App.js:", alunosEmAula);
        setAlunosNaAula(alunosEmAula);
        const novaAulaAtual = {
          id: Date.now(),
          data: new Date().toLocaleDateString("pt-BR"),
          alunos: [...alunosEmAula],
          totalAlunos: alunosEmAula.length,
          atual: true,
          status: "atual",
        };
        setAulaAtual(novaAulaAtual);
        localStorage.setItem("aulaAtual", JSON.stringify(novaAulaAtual));
      }

      setInitialized(true);
    } catch (error) {
      console.error("Erro ao carregar dados do localStorage:", error);
    }
  }, []);

  // Atualizar localStorage quando o histórico muda
  useEffect(() => {
    if (!initialized) return;

    try {
      console.log("Salvando histórico no localStorage:", historicoAulas);
      localStorage.setItem("historicoAulas", JSON.stringify(historicoAulas));
    } catch (error) {
      console.error("Erro ao salvar histórico no localStorage:", error);
    }
  }, [historicoAulas, initialized]);

  // Atualizar localStorage quando a aula atual muda
  useEffect(() => {
    if (!initialized || !aulaAtual) return;

    try {
      console.log("Salvando aula atual no localStorage:", aulaAtual);
      localStorage.setItem("aulaAtual", JSON.stringify(aulaAtual));
    } catch (error) {
      console.error("Erro ao salvar aula atual no localStorage:", error);
    }
  }, [aulaAtual, initialized]);

  const abrirSelecao = () => {
    setShowSelecao(true);
  };

  const adicionarAlunoAula = (alunoId) => {
    if (!alunoId) return;

    // Verifica se já temos 4 alunos na aula
    if (alunosNaAula.length >= 4) {
      alert("Não é possível adicionar mais de 4 alunos na mesma aula.");
      return;
    }

    // Verifica se o aluno já está na aula
    if (alunosNaAula.some((aluno) => aluno.id === parseInt(alunoId))) {
      alert("Este aluno já está nesta aula.");
      return;
    }

    const aluno = todosAlunos.find((a) => a.id === parseInt(alunoId));
    if (aluno) {
      const novosAlunosEmAula = [...alunosNaAula, aluno];
      setAlunosNaAula(novosAlunosEmAula);

      // Atualiza a aula atual
      if (modoEdicao && aulaEditando) {
        // Estamos editando uma aula existente
        const aulaAtualizada = {
          ...aulaEditando,
          alunos: novosAlunosEmAula,
          totalAlunos: novosAlunosEmAula.length,
        };
        setAulaEditando(aulaAtualizada);
      } else if (aulaAtual) {
        // Atualizando a aula atual normal
        const aulaAtualizada = {
          ...aulaAtual,
          alunos: novosAlunosEmAula,
          totalAlunos: novosAlunosEmAula.length,
          atual: true,
          status: "atual",
        };
        setAulaAtual(aulaAtualizada);
      } else {
        // Criando uma nova aula
        const novaAulaAtual = {
          id: Date.now(),
          data: new Date().toLocaleDateString("pt-BR"),
          alunos: novosAlunosEmAula,
          totalAlunos: novosAlunosEmAula.length,
          atual: true,
          status: "atual",
        };
        setAulaAtual(novaAulaAtual);
      }

      setAlunoSelecionado("");
    }
  };

  // Função para salvar a aula sem finalizar (mantém status "atual")
  const salvarAulaSemFinalizar = () => {
    // Verifica se há alunos na aula antes de salvar
    if (alunosNaAula.length === 0) {
      alert("Adicione pelo menos um aluno à aula antes de salvar.");
      return;
    }

    // Atualiza no App.js
    if (atualizarAlunosEmAula) {
      atualizarAlunosEmAula(alunosNaAula);
    }

    if (modoEdicao && aulaEditando) {
      // Salvando uma aula que estava sendo editada, mantendo seu status atual
      const statusOriginal = aulaEditando.status;
      const historicoAtualizado = historicoAulas.map((aula) =>
        aula.id === aulaEditando.id
          ? {
              ...aulaEditando,
              alunos: [...alunosNaAula],
              totalAlunos: alunosNaAula.length,
              status: statusOriginal, // Mantém o status original
            }
          : aula
      );

      setHistoricoAulas(historicoAtualizado);
      localStorage.setItem(
        "historicoAulas",
        JSON.stringify(historicoAtualizado)
      );

      // Limpa o modo de edição
      setModoEdicao(false);
      setAulaEditando(null);

      // Se a aula editada era a atual, atualiza aulaAtual para a próxima edição
      if (aulaAtual && aulaAtual.id === aulaEditando.id) {
        const aulaAtualAtualizada = {
          ...aulaAtual,
          alunos: [...alunosNaAula],
          totalAlunos: alunosNaAula.length,
        };
        setAulaAtual(aulaAtualAtualizada);
        localStorage.setItem("aulaAtual", JSON.stringify(aulaAtualAtualizada));
      }
    } else {
      // Salvando uma aula nova ou atualizando a aula atual
      const novaAula = {
        ...(aulaAtual || {}),
        id: aulaAtual ? aulaAtual.id : Date.now(),
        data: new Date().toLocaleDateString("pt-BR"),
        alunos: [...alunosNaAula],
        totalAlunos: alunosNaAula.length,
        atual: true,
        status: "atual", // Mantém o status como "atual"
      };

      // Verifica se a aula já existe no histórico
      const aulaExistente = historicoAulas.find(
        (aula) => aula.id === novaAula.id
      );

      let historicoAtualizado;
      if (aulaExistente) {
        // Atualiza a aula existente
        historicoAtualizado = historicoAulas.map((aula) =>
          aula.id === novaAula.id ? novaAula : aula
        );
      } else {
        // Adiciona a nova aula ao histórico
        historicoAtualizado = [...historicoAulas, novaAula];
      }

      setHistoricoAulas(historicoAtualizado);
      localStorage.setItem(
        "historicoAulas",
        JSON.stringify(historicoAtualizado)
      );

      // Atualiza a aula atual para a próxima edição
      setAulaAtual(novaAula);
      localStorage.setItem("aulaAtual", JSON.stringify(novaAula));
    }

    setShowSelecao(false);
    alert("Aula salva com sucesso!");
  };

  const salvarAula = () => {
    // Verifica se há alunos na aula antes de salvar
    if (alunosNaAula.length === 0) {
      alert("Adicione pelo menos um aluno à aula antes de salvar.");
      return;
    }

    // Atualiza no App.js
    if (atualizarAlunosEmAula) {
      atualizarAlunosEmAula(alunosNaAula);
    }

    if (modoEdicao && aulaEditando) {
      // Salvando uma aula que estava sendo editada
      const historicoAtualizado = historicoAulas.map((aula) =>
        aula.id === aulaEditando.id
          ? {
              ...aulaEditando,
              alunos: [...alunosNaAula],
              totalAlunos: alunosNaAula.length,
              status: "realizada",
            }
          : aula
      );

      setHistoricoAulas(historicoAtualizado);
      localStorage.setItem(
        "historicoAulas",
        JSON.stringify(historicoAtualizado)
      );

      // Limpa o modo de edição
      setModoEdicao(false);
      setAulaEditando(null);

      // Cria uma nova aula vazia para a próxima edição
      const novaAulaVazia = {
        id: Date.now(),
        data: new Date().toLocaleDateString("pt-BR"),
        alunos: [],
        totalAlunos: 0,
        atual: true,
        status: "atual",
      };

      // Limpar os alunos na aula atual
      setAlunosNaAula([]);

      // Atualizar no App.js
      if (atualizarAlunosEmAula) {
        atualizarAlunosEmAula([]);
      }

      // Definir a nova aula vazia como atual para próxima edição
      setAulaAtual(novaAulaVazia);
      localStorage.setItem("aulaAtual", JSON.stringify(novaAulaVazia));
    } else {
      // Salvando uma aula como realizada
      const novaAula = {
        ...(aulaAtual || {}),
        id: aulaAtual ? aulaAtual.id : Date.now(),
        data: new Date().toLocaleDateString("pt-BR"),
        alunos: [...alunosNaAula],
        totalAlunos: alunosNaAula.length,
        atual: false,
        status: "realizada",
      };

      // Verifica se a aula já existe no histórico
      const aulaExistente = historicoAulas.find(
        (aula) => aula.id === novaAula.id
      );

      let historicoAtualizado;
      if (aulaExistente) {
        // Atualiza a aula existente
        historicoAtualizado = historicoAulas.map((aula) =>
          aula.id === novaAula.id ? novaAula : aula
        );
      } else {
        // Adiciona a nova aula ao histórico
        historicoAtualizado = [...historicoAulas, novaAula];
      }

      setHistoricoAulas(historicoAtualizado);
      localStorage.setItem(
        "historicoAulas",
        JSON.stringify(historicoAtualizado)
      );

      // Cria uma nova aula vazia para a próxima edição
      const novaAulaVazia = {
        id: Date.now(),
        data: new Date().toLocaleDateString("pt-BR"),
        alunos: [],
        totalAlunos: 0,
        atual: true,
        status: "atual",
      };

      // Limpar os alunos na aula atual
      setAlunosNaAula([]);

      // Atualizar no App.js
      if (atualizarAlunosEmAula) {
        atualizarAlunosEmAula([]);
      }

      // Definir a nova aula vazia como atual para próxima edição
      setAulaAtual(novaAulaVazia);
      localStorage.setItem("aulaAtual", JSON.stringify(novaAulaVazia));
    }

    setShowSelecao(false);
  };

  // Iniciar uma nova aula (sem limpar aulas atuais existentes)
  const iniciarNovaAula = () => {
    // Se estiver no modo de edição, sai do modo de edição
    if (modoEdicao) {
      if (
        window.confirm(
          "Você está editando uma aula. Deseja descartar as alterações?"
        )
      ) {
        setModoEdicao(false);
        setAulaEditando(null);
        setAlunosNaAula([]);
      } else {
        return;
      }
    }

    // Cria uma nova aula vazia
    const novaAulaVazia = {
      id: Date.now(),
      data: new Date().toLocaleDateString("pt-BR"),
      alunos: [],
      totalAlunos: 0,
      atual: true,
      status: "atual",
    };

    // Adiciona a nova aula sem substituir a aula atual existente
    setAulaAtual(novaAulaVazia);
    localStorage.setItem("aulaAtual", JSON.stringify(novaAulaVazia));

    setAlunosNaAula([]);

    // Atualiza no App.js
    if (atualizarAlunosEmAula) {
      atualizarAlunosEmAula([]);
    }
  };

  // Editar uma aula
  const editarAula = (aula) => {
    // Se estiver no modo de edição ou tiver aula atual com alunos não salvos
    if (
      modoEdicao ||
      (aulaAtual && aulaAtual.status === "atual" && alunosNaAula.length > 0)
    ) {
      if (
        !window.confirm(
          "Há alterações não salvas. Deseja descartar e editar outra aula?"
        )
      ) {
        return;
      }
    }

    // Se a aula a ser editada tem status "atual", primeiro atualiza para "realizada"
    if (aula.status === "atual") {
      // Atualiza o status da aula para "realizada" no histórico
      const historicoAtualizado = historicoAulas.map((a) =>
        a.id === aula.id ? { ...a, status: "realizada" } : a
      );

      setHistoricoAulas(historicoAtualizado);
      localStorage.setItem(
        "historicoAulas",
        JSON.stringify(historicoAtualizado)
      );

      // Se a aula a ser editada for a aula atual, limpa a aula atual
      if (aulaAtual && aulaAtual.id === aula.id) {
        // Criar uma nova aula vazia para substituir a atual após a edição
        const novaAulaVazia = {
          id: Date.now(),
          data: new Date().toLocaleDateString("pt-BR"),
          alunos: [],
          totalAlunos: 0,
          atual: true,
          status: "atual",
        };

        // Salvar a nova aula vazia (será usada depois que a edição for concluída)
        localStorage.setItem("aulaAtual", JSON.stringify(novaAulaVazia));

        // Busca a aula atualizada do histórico
        aula = historicoAtualizado.find((a) => a.id === aula.id);
      }
    }

    setModoEdicao(true);
    setAulaEditando(aula);
    setAlunosNaAula([...aula.alunos]);
    setShowSelecao(true);
  };

  // Realizar e editar aula
  const realizarEEditarAula = (aula) => {
    // Primeiro marca a aula como realizada
    const historicoAtualizado = historicoAulas.map((a) =>
      a.id === aula.id ? { ...a, status: "realizada" } : a
    );

    setHistoricoAulas(historicoAtualizado);
    localStorage.setItem("historicoAulas", JSON.stringify(historicoAtualizado));

    // Se a aula marcada como realizada for a atual, limpa a aula atual
    if (aulaAtual && aulaAtual.id === aula.id) {
      // Criar uma nova aula vazia para substituir a atual após a edição
      const novaAulaVazia = {
        id: Date.now(),
        data: new Date().toLocaleDateString("pt-BR"),
        alunos: [],
        totalAlunos: 0,
        atual: true,
        status: "atual",
      };

      // Salvar a nova aula vazia (será usada depois que a edição for concluída)
      localStorage.setItem("aulaAtual", JSON.stringify(novaAulaVazia));
    }

    // Depois abre para edição
    const aulaRealizada = historicoAtualizado.find((a) => a.id === aula.id);
    editarAula(aulaRealizada);
  };

  // Cancelar uma aula
  const prepararCancelarAula = (aula) => {
    setAulaCancelar(aula);
    setShowConfirmCancelar(true);
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
    }

    setShowConfirmCancelar(false);
    setAulaCancelar(null);
  };

  // Função para abrir o modal de detalhes da aula
  const verDetalhesAula = (aula) => {
    setAulaDetalhes(aula);
    setShowDetalhesAula(true);
  };

  // Função para fechar o modal de detalhes
  const fecharDetalhesAula = () => {
    setShowDetalhesAula(false);
    setAulaDetalhes(null);
  };

  // Função para obter todas as aulas para exibição
  const todasAulas = () => {
    // Retorna todas as aulas do histórico, incluindo as atuais
    return historicoAulas;
  };

  // Paginação
  const totalPaginas = Math.ceil(todasAulas().length / itensPorPagina);

  const aulasPaginadas = () => {
    const aulasParaExibir = todasAulas();
    const indiceInicial = (paginaAtual - 1) * itensPorPagina;
    return aulasParaExibir.slice(indiceInicial, indiceInicial + itensPorPagina);
  };

  const irParaPagina = (numPagina) => {
    if (numPagina > 0 && numPagina <= totalPaginas) {
      setPaginaAtual(numPagina);
    }
  };

  // Obter o status formatado
  const getStatusLabel = (status) => {
    switch (status) {
      case "realizada":
        return <span className="status-realizada">Realizada</span>;
      case "cancelada":
        return <span className="status-cancelada">Cancelada</span>;
      case "atual":
      default:
        return <span className="status-atual">Atual</span>;
    }
  };

  // Marcar aula como realizada sem editar
  const marcarComoRealizada = (aula) => {
    // Atualiza o status da aula para "realizada" no histórico
    const historicoAtualizado = historicoAulas.map((a) =>
      a.id === aula.id ? { ...a, status: "realizada" } : a
    );

    setHistoricoAulas(historicoAtualizado);
    localStorage.setItem("historicoAulas", JSON.stringify(historicoAtualizado));

    // Se a aula marcada como realizada for a atual, limpa os alunos e cria uma nova aula vazia
    if (aulaAtual && aulaAtual.id === aula.id) {
      // Criar uma nova aula vazia
      const novaAulaVazia = {
        id: Date.now(),
        data: new Date().toLocaleDateString("pt-BR"),
        alunos: [],
        totalAlunos: 0,
        atual: true,
        status: "atual",
      };

      // Limpar os alunos na aula atual
      setAlunosNaAula([]);

      // Atualizar no App.js
      if (atualizarAlunosEmAula) {
        atualizarAlunosEmAula([]);
      }

      // Definir a nova aula vazia como atual
      setAulaAtual(novaAulaVazia);
      localStorage.setItem("aulaAtual", JSON.stringify(novaAulaVazia));
    }

    alert("Aula marcada como realizada com sucesso!");
  };

  // Função para verificar quantas aulas atuais existem
  const contarAulasAtuais = () => {
    return historicoAulas.filter((aula) => aula.status === "atual").length;
  };

  // Obter o contador de aulas atuais
  const totalAulasAtuais = contarAulasAtuais();

  // Se ainda está inicializando, mostra um indicador de carregamento
  if (!initialized) {
    return (
      <div className="geral-loading">
        <p>Carregando dados...</p>
      </div>
    );
  }

  return (
    <div className="geral-container">
      <div className="geral-header">
        <h1>Visão Geral</h1>
        <div className="header-buttons">
          <button className="btn-nova-aula" onClick={iniciarNovaAula}>
            <i className="icon-plus">➕</i> Nova Aula
          </button>
          <button className="btn-adicionar-aluno" onClick={abrirSelecao}>
            <i className="icon-user">👤</i>{" "}
            {modoEdicao ? "Editar Aula" : "Adicionar Aluno em Aula"}
          </button>
        </div>
      </div>

      <div className="dashboard-cards">
        <div className="card total-alunos">
          <h2>Total de Alunos</h2>
          <p className="numero-destaque">
            {alunosNaAula.length > 0 ? alunosNaAula.length : 0}
          </p>
        </div>

        <div className="card aulas-hoje">
          <h2>Aulas Hoje</h2>
          <p className="numero-destaque">{todasAulas().length}</p>
        </div>

        <div className="card aulas-atuais">
          <h2>Aulas Atuais</h2>
          <p className="numero-destaque">{totalAulasAtuais}</p>
        </div>
      </div>

      {alunosNaAula && alunosNaAula.length > 0 && (
        <div className="alunos-atuais">
          <h2>
            {modoEdicao ? "Alunos na Aula em Edição" : "Alunos na Aula Atual"}
          </h2>
          <div className="lista-alunos-atuais">
            {alunosNaAula.map((aluno) => (
              <div key={aluno.id} className="card-aluno-atual">
                <h3>{aluno.nome}</h3>
                <p>Idade: {aluno.idade}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="historico-aulas">
        <h2>Histórico de Aulas</h2>

        {todasAulas().length === 0 ? (
          <p className="sem-registros">Nenhuma aula registrada</p>
        ) : (
          <>
            <table className="tabela-historico">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Total de Alunos</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {aulasPaginadas().map((aula) => (
                  <tr
                    key={aula.id}
                    className={
                      aula.status === "atual"
                        ? "aula-atual-row"
                        : aula.status === "cancelada"
                        ? "aula-cancelada-row"
                        : ""
                    }
                  >
                    <td>{aula.data}</td>
                    <td>{aula.totalAlunos}</td>
                    <td>{getStatusLabel(aula.status)}</td>
                    <td className="acoes-aula">
                      <button
                        className="btn-detalhes"
                        onClick={() => verDetalhesAula(aula)}
                      >
                        Ver
                      </button>

                      {aula.status !== "cancelada" && (
                        <>
                          <button
                            className="btn-cancelar"
                            onClick={() => prepararCancelarAula(aula)}
                          >
                            Cancelar
                          </button>

                          {aula.status === "atual" && (
                            <button
                              className="btn-realizar"
                              onClick={() => marcarComoRealizada(aula)}
                            >
                              Marcar Realizada
                            </button>
                          )}

                          {(aula.status === "atual" ||
                            aula.status === "realizada") && (
                            <button
                              className="btn-editar"
                              onClick={() => editarAula(aula)}
                            >
                              Editar
                            </button>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Paginação */}
            {totalPaginas > 1 && (
              <div className="paginacao">
                <button
                  className="btn-pagina"
                  onClick={() => irParaPagina(paginaAtual - 1)}
                  disabled={paginaAtual === 1}
                >
                  &laquo; Anterior
                </button>

                <div className="numeros-pagina">
                  {[...Array(totalPaginas).keys()].map((num) => (
                    <button
                      key={num + 1}
                      className={`btn-numero-pagina ${
                        paginaAtual === num + 1 ? "ativo" : ""
                      }`}
                      onClick={() => irParaPagina(num + 1)}
                    >
                      {num + 1}
                    </button>
                  ))}
                </div>

                <button
                  className="btn-pagina"
                  onClick={() => irParaPagina(paginaAtual + 1)}
                  disabled={paginaAtual === totalPaginas}
                >
                  Próxima &raquo;
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {showSelecao && (
        <div className="selecao-aluno-panel">
          <div className="selecao-aluno-content">
            <h2>
              {modoEdicao
                ? `Editando Aula do dia ${aulaEditando.data}`
                : "Selecione um Aluno:"}
            </h2>

            <div className="selecao-contador">
              <p>Alunos adicionados: {alunosNaAula.length}/4</p>
            </div>

            <select
              value={alunoSelecionado}
              onChange={(e) => setAlunoSelecionado(e.target.value)}
              className="select-aluno"
            >
              <option value="">Selecionar aluno...</option>
              {todosAlunos.map((aluno) => (
                <option key={aluno.id} value={aluno.id}>
                  {aluno.nome}
                </option>
              ))}
            </select>

            <div className="selecao-actions">
              <button
                className="btn-adicionar-verde"
                onClick={() => adicionarAlunoAula(alunoSelecionado)}
                disabled={alunosNaAula.length >= 4}
              >
                <i className="icon-user">👤</i> Adicionar Aluno
              </button>

              <div className="acoes-finais">
                {modoEdicao && (
                  <button
                    className="btn-cancelar-edicao"
                    onClick={() => {
                      if (
                        window.confirm(
                          "Deseja cancelar a edição? As alterações serão perdidas."
                        )
                      ) {
                        setModoEdicao(false);
                        setAulaEditando(null);
                        setShowSelecao(false);
                        setAlunosNaAula(aulaAtual?.alunos || []);
                      }
                    }}
                  >
                    Cancelar Edição
                  </button>
                )}

                <button
                  className="btn-salvar-sem-finalizar"
                  onClick={salvarAulaSemFinalizar}
                >
                  Salvar Aula
                </button>

                <button className="btn-salvar" onClick={salvarAula}>
                  {modoEdicao ? "Salvar e Finalizar" : "Finalizar Aula"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para exibir os detalhes da aula */}
      {showDetalhesAula && aulaDetalhes && (
        <div className="modal-detalhes-overlay">
          <div className="modal-detalhes-content">
            <div className="modal-detalhes-header">
              <h2>Detalhes da Aula</h2>
              <button className="btn-fechar" onClick={fecharDetalhesAula}>
                ×
              </button>
            </div>
            <div className="modal-detalhes-body">
              <p>
                <strong>Data:</strong> {aulaDetalhes.data}
              </p>
              <p>
                <strong>Total de alunos:</strong> {aulaDetalhes.totalAlunos}
              </p>
              <p>
                <strong>Status:</strong>{" "}
                {aulaDetalhes.status === "realizada"
                  ? "Aula Realizada"
                  : aulaDetalhes.status === "cancelada"
                  ? "Aula Cancelada"
                  : "Aula Atual"}
              </p>

              <h3>Alunos Presentes:</h3>
              <ul className="lista-alunos-detalhes">
                {aulaDetalhes.alunos.map((aluno) => (
                  <li key={aluno.id} className="aluno-detalhe-item">
                    <div className="aluno-detalhe-info">
                      <p className="aluno-detalhe-nome">{aluno.nome}</p>
                      <p className="aluno-detalhe-idade">
                        Idade: {aluno.idade}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmação de cancelamento */}
      {showConfirmCancelar && (
        <div className="modal-confirmacao-overlay">
          <div className="modal-confirmacao-content">
            <h3>Cancelar Aula</h3>
            <p>Tem certeza que deseja cancelar esta aula?</p>
            <p>Esta ação não pode ser desfeita.</p>

            <div className="acoes-confirmacao">
              <button
                className="btn-confirmar-cancelar"
                onClick={confirmarCancelarAula}
              >
                Sim, Cancelar
              </button>
              <button
                className="btn-nao-cancelar"
                onClick={() => {
                  setShowConfirmCancelar(false);
                  setAulaCancelar(null);
                }}
              >
                Não, Voltar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Geral;

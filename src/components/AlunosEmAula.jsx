import React, { useEffect, useState } from "react";
import "../styles/AlunosEmAula.css";
import alunosService from "../services/alunos.service";
import aulasService from "../services/aulas.service";

// Componente que exibe e gerencia alunos em aula
const AlunosEmAula = ({ alunosNaAula = [], onAlunosChange }) => {
  const [alunoSelecionado, setAlunoSelecionado] = useState("");
  const [todosAlunos, setTodosAlunos] = useState([]);
  const [aulasAtivas, setAulasAtivas] = useState([]);
  const [loading, setLoading] = useState(false);

  // Carregar os dados iniciais
  useEffect(() => {
    const carregarDados = async () => {
      try {
        setLoading(true);
        console.log("[AlunosEmAula.jsx] Carregando dados...");

        // Carregar todos os alunos e aulas
        const [alunos, aulas] = await Promise.all([
          alunosService.getAll(),
          aulasService.getAll(),
        ]);

        setTodosAlunos(alunos);

        // Filtrar apenas aulas ativas
        const aulasAtivasList = aulas.filter(
          (aula) => aula.status === "atual" || aula.status === "ativa"
        );
        setAulasAtivas(aulasAtivasList);

        console.log(
          `[AlunosEmAula.jsx] Dados carregados: ${alunos.length} alunos, ${aulasAtivasList.length} aulas ativas`
        );
        setLoading(false);
      } catch (error) {
        console.error("[AlunosEmAula.jsx] Erro ao carregar dados:", error);
        setLoading(false);
      }
    };

    carregarDados();
  }, []);

  // Adicionar um aluno à aula
  const handleAdicionarAluno = async () => {
    if (!alunoSelecionado) return;

    try {
      setLoading(true);

      // Encontrar o aluno selecionado
      const alunoParaAdicionar = todosAlunos.find(
        (a) => a.id === parseInt(alunoSelecionado)
      );

      if (!alunoParaAdicionar) {
        console.error("[AlunosEmAula.jsx] Aluno não encontrado");
        setLoading(false);
        return;
      }

      // Verificar se o aluno já está em alguma aula ativa
      if (alunosNaAula.some((a) => a.id === alunoParaAdicionar.id)) {
        alert("Este aluno já está na aula!");
        setLoading(false);
        return;
      }

      console.log(
        `[AlunosEmAula.jsx] Adicionando aluno: ${alunoParaAdicionar.nome}`
      );

      // Adicionar o aluno à lista local e notificar o componente pai
      const novosAlunos = [...alunosNaAula, alunoParaAdicionar];
      onAlunosChange(novosAlunos);

      // Se temos aulas ativas, adicionar o aluno à primeira aula ativa disponível
      if (aulasAtivas.length > 0) {
        try {
          const primeiraAulaAtiva = aulasAtivas[0];

          // Verificar se a aula já tem uma lista de alunos
          const alunosAtuais = primeiraAulaAtiva.alunos || [];

          // Adicionar o novo aluno à aula
          const aulaAtualizada = await aulasService.update(
            primeiraAulaAtiva.id,
            {
              ...primeiraAulaAtiva,
              alunos: [...alunosAtuais, alunoParaAdicionar],
            }
          );

          // Atualizar a lista de aulas ativas com a aula atualizada
          const aulasAtualizadas = aulasAtivas.map((aula) =>
            aula.id === primeiraAulaAtiva.id ? aulaAtualizada : aula
          );
          setAulasAtivas(aulasAtualizadas);

          console.log(
            `[AlunosEmAula.jsx] Aluno adicionado à aula ID ${primeiraAulaAtiva.id}`
          );
        } catch (error) {
          console.error("[AlunosEmAula.jsx] Erro ao atualizar aula:", error);
        }
      } else {
        console.log(
          "[AlunosEmAula.jsx] Nenhuma aula ativa disponível para adicionar o aluno"
        );
      }

      setAlunoSelecionado("");
      setLoading(false);
    } catch (error) {
      console.error("[AlunosEmAula.jsx] Erro ao adicionar aluno:", error);
      setLoading(false);
    }
  };

  // Remover um aluno da aula
  const handleRemoverAluno = async (alunoId) => {
    try {
      setLoading(true);
      console.log(`[AlunosEmAula.jsx] Removendo aluno ID ${alunoId}`);

      // Remover o aluno da lista local e notificar o componente pai
      const novosAlunos = alunosNaAula.filter((a) => a.id !== alunoId);
      onAlunosChange(novosAlunos);

      // Remover o aluno de todas as aulas ativas
      for (const aula of aulasAtivas) {
        if (aula.alunos && aula.alunos.some((a) => a.id === alunoId)) {
          try {
            // Filtrar o aluno da lista de alunos da aula
            const novosAlunosAula = aula.alunos.filter((a) => a.id !== alunoId);

            // Atualizar a aula sem o aluno
            const aulaAtualizada = await aulasService.update(aula.id, {
              ...aula,
              alunos: novosAlunosAula,
            });

            console.log(
              `[AlunosEmAula.jsx] Aluno removido da aula ID ${aula.id}`
            );

            // Atualizar a lista de aulas ativas
            setAulasAtivas((prev) =>
              prev.map((a) => (a.id === aula.id ? aulaAtualizada : a))
            );
          } catch (error) {
            console.error(
              `[AlunosEmAula.jsx] Erro ao remover aluno da aula ${aula.id}:`,
              error
            );
          }
        }
      }

      setLoading(false);
    } catch (error) {
      console.error("[AlunosEmAula.jsx] Erro ao remover aluno:", error);
      setLoading(false);
    }
  };

  // Filtrar alunos disponíveis (que não estão em nenhuma aula ativa)
  const alunosDisponiveis = todosAlunos.filter(
    (aluno) => !alunosNaAula.some((a) => a.id === aluno.id)
  );

  return (
    <div className="alunos-em-aula">
      {loading && <div className="loading-indicator">Processando...</div>}

      <div className="adicionar-aluno">
        <select
          value={alunoSelecionado}
          onChange={(e) => setAlunoSelecionado(e.target.value)}
          disabled={loading}
        >
          <option value="">Selecione um aluno</option>
          {alunosDisponiveis.map((aluno) => (
            <option key={aluno.id} value={aluno.id}>
              {aluno.nome}
            </option>
          ))}
        </select>
        <button
          onClick={handleAdicionarAluno}
          disabled={!alunoSelecionado || loading}
        >
          Adicionar
        </button>
      </div>

      <div className="lista-alunos">
        {alunosNaAula && alunosNaAula.length > 0 ? (
          alunosNaAula.map((aluno) => (
            <div key={aluno.id} className="aluno-item">
              <span>{aluno.nome}</span>
              <button
                onClick={() => handleRemoverAluno(aluno.id)}
                disabled={loading}
              >
                Remover
              </button>
            </div>
          ))
        ) : (
          <p className="sem-alunos">Nenhum aluno na aula atual</p>
        )}
      </div>
    </div>
  );
};

export default AlunosEmAula;

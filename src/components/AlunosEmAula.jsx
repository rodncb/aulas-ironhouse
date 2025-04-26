import React, { useEffect, useState } from "react";
import "../styles/AlunosEmAula.css";
import alunosService from "../services/alunos.service";
import aulasService from "../services/aulas.service";

// Componente que exibe e gerencia alunos em aula
const AlunosEmAula = ({ alunosNaAula = [], aulaId, onAlunoSelect }) => {
  const [alunoSelecionado, setAlunoSelecionado] = useState("");
  const [todosAlunos, setTodosAlunos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Carregar todos os alunos disponíveis
  useEffect(() => {
    const carregarDados = async () => {
      try {
        setLoading(true);
        setError(null);

        // Carregar todos os alunos
        const alunos = await alunosService.getAll();
        setTodosAlunos(alunos);

        console.log(
          `[AlunosEmAula.jsx] Dados carregados: ${alunos.length} alunos`
        );
        setLoading(false);
      } catch (error) {
        console.error("[AlunosEmAula.jsx] Erro ao carregar dados:", error);
        setError("Erro ao carregar alunos. Tente novamente.");
        setLoading(false);
      }
    };

    carregarDados();
  }, []);

  // Adicionar um aluno à aula
  const handleAdicionarAluno = async () => {
    if (!alunoSelecionado || !aulaId) return;

    try {
      setLoading(true);
      setError(null);

      // Encontrar o aluno selecionado
      const alunoParaAdicionar = todosAlunos.find(
        (a) => a.id === parseInt(alunoSelecionado)
      );

      if (!alunoParaAdicionar) {
        console.error("[AlunosEmAula.jsx] Aluno não encontrado");
        setError("Aluno não encontrado no sistema.");
        setLoading(false);
        return;
      }

      // Verificar se o aluno já está nesta aula
      if (alunosNaAula.some((a) => a.id === alunoParaAdicionar.id)) {
        setError("Este aluno já está na aula!");
        setLoading(false);
        return;
      }

      // Buscar a aula atual com seus alunos
      const aulaAtual = await aulasService.getById(aulaId);

      if (!aulaAtual) {
        setError("Aula não encontrada. Recarregue a página.");
        setLoading(false);
        return;
      }

      // Preparar a lista de alunos atualizada para a aula
      const alunosAtuais = aulaAtual.alunos || [];
      const novosAlunos = [...alunosAtuais, alunoParaAdicionar];

      // Atualizar a aula com o novo aluno
      await aulasService.update(aulaId, {
        ...aulaAtual,
        alunos: novosAlunos,
      });

      // Notificar o componente pai sobre a atualização
      // Em vez de tentar atualizar alunosNaAula localmente, isso deve ser gerenciado pelo componente pai
      window.location.reload(); // Recarregar a página para refletir as alterações

      setAlunoSelecionado("");
      setLoading(false);
    } catch (error) {
      console.error("[AlunosEmAula.jsx] Erro ao adicionar aluno:", error);
      setError("Erro ao adicionar aluno à aula. Tente novamente.");
      setLoading(false);
    }
  };

  // Remover um aluno da aula
  const handleRemoverAluno = async (alunoId) => {
    if (!aulaId) return;

    try {
      setLoading(true);
      setError(null);

      // Buscar a aula atual
      const aulaAtual = await aulasService.getById(aulaId);

      if (!aulaAtual) {
        setError("Aula não encontrada. Recarregue a página.");
        setLoading(false);
        return;
      }

      // Filtrar o aluno da lista de alunos da aula
      const alunosAtualizados = (aulaAtual.alunos || []).filter(
        (aluno) => aluno.id !== alunoId
      );

      // Atualizar a aula sem o aluno
      await aulasService.update(aulaId, {
        ...aulaAtual,
        alunos: alunosAtualizados,
      });

      // Recarregar a página para refletir as alterações
      window.location.reload();

      setLoading(false);
    } catch (error) {
      console.error("[AlunosEmAula.jsx] Erro ao remover aluno:", error);
      setError("Erro ao remover aluno da aula. Tente novamente.");
      setLoading(false);
    }
  };

  // Selecionar um aluno para ver detalhes
  const handleSelecionarAluno = (aluno) => {
    if (onAlunoSelect) {
      onAlunoSelect(aluno);
    }
  };

  // Filtrar alunos disponíveis (que não estão na aula atual)
  const alunosDisponiveis = todosAlunos.filter(
    (aluno) => !alunosNaAula.some((a) => a.id === aluno.id)
  );

  return (
    <div className="alunos-em-aula">
      {loading && <div className="loading-indicator">Processando...</div>}
      {error && <div className="error-message">{error}</div>}

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
          className="btn-adicionar"
        >
          Adicionar
        </button>
      </div>

      <div className="lista-alunos">
        {alunosNaAula && alunosNaAula.length > 0 ? (
          alunosNaAula.map((aluno) => (
            <div
              key={aluno.id}
              className="aluno-item"
              onClick={() => handleSelecionarAluno(aluno)}
            >
              <span className="nome-aluno">{aluno.nome}</span>
              <div className="acoes-aluno">
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Evita acionar o onClick do div pai
                    handleSelecionarAluno(aluno);
                  }}
                  className="btn-detalhes"
                >
                  Detalhes
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Evita acionar o onClick do div pai
                    handleRemoverAluno(aluno.id);
                  }}
                  disabled={loading}
                  className="btn-remover"
                >
                  Remover
                </button>
              </div>
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

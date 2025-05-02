import React, { useState, useEffect } from "react";
import { supabase } from "../services/supabase";
import { formatarData, navegarPara } from "../lib/utils";
import "../styles/DetalheAluno.css";
import { useCadastroAluno } from "../contexts/CadastroAlunoContext"; // Importar o contexto

const DetalheAluno = ({ alunoId, setActiveSection }) => {
  // Usar o contexto para gerenciar dados do aluno
  const {
    formData: dadosContexto,
    carregarAluno: carregarAlunoDoContexto,
    carregandoAluno: carregandoAlunoDoContexto,
    alunoId: alunoIdContexto,
    error: erroContexto,
    limparDadosCadastro,
  } = useCadastroAluno();

  // Estados locais
  const [aluno, setAluno] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [historicoAulas, setHistoricoAulas] = useState([]);
  const [carregandoHistorico, setCarregandoHistorico] = useState(false);

  // Função para carregar dados do aluno
  useEffect(() => {
    const carregarDetalheAluno = async () => {
      try {
        setLoading(true);
        setError(null);

        // Se já temos os dados do aluno no contexto e o ID corresponde, usá-los
        if (
          alunoIdContexto === alunoId &&
          Object.keys(dadosContexto).length > 0
        ) {
          console.log(
            "[DetalheAluno] Usando dados do aluno já carregados no contexto"
          );
          setAluno(dadosContexto);
          setLoading(false);
          return;
        }

        // Se não temos os dados ou o ID é diferente, carregar do backend através do contexto
        console.log(
          `[DetalheAluno] Carregando dados do aluno via contexto: ${alunoId}`
        );
        await carregarAlunoDoContexto(alunoId);

        // Os dados serão atualizados na próxima renderização via efeito de dadosContexto
        if (!dadosContexto || Object.keys(dadosContexto).length === 0) {
          // Se não conseguir carregar via contexto, tentar carregar diretamente
          console.log(
            "[DetalheAluno] Tentando carregar dados diretamente do Supabase"
          );
          const { data, error } = await supabase
            .from("alunos")
            .select("*")
            .eq("id", alunoId)
            .single();

          if (error) {
            console.error("Erro ao carregar aluno:", error);
            setError(
              "Não foi possível carregar os dados do aluno. Por favor, tente novamente."
            );
          } else if (!data) {
            setError("Aluno não encontrado.");
          } else {
            console.log("[DetalheAluno] Aluno carregado diretamente:", data);
            setAluno(data);
          }
        }
      } catch (err) {
        console.error("Erro ao carregar aluno:", err);
        setError(
          "Erro ao carregar dados do aluno. Por favor, tente novamente."
        );
      } finally {
        setLoading(false);
      }
    };

    if (alunoId) {
      carregarDetalheAluno();
    } else {
      setError("ID do aluno não fornecido.");
      setLoading(false);
    }
  }, [alunoId, alunoIdContexto, carregarAlunoDoContexto, dadosContexto]);

  // Atualizar aluno quando os dados do contexto mudarem
  useEffect(() => {
    if (
      dadosContexto &&
      Object.keys(dadosContexto).length > 0 &&
      alunoIdContexto === alunoId
    ) {
      console.log("[DetalheAluno] Atualizando aluno com dados do contexto");
      setAluno(dadosContexto);
      setLoading(false);
    }
  }, [dadosContexto, alunoIdContexto, alunoId]);

  // Função para lidar com o clique no botão Editar
  const handleEditarClick = () => {
    // Não limpar dados do contexto ao editar
    if (setActiveSection) {
      setActiveSection(`editar-aluno/${alunoId}`);
    } else {
      navegarPara(`/editar-aluno/${alunoId}`);
    }
  };

  // Função para voltar para a lista de alunos
  const voltarParaLista = () => {
    limparDadosCadastro(); // Limpar dados ao voltar
    if (setActiveSection) {
      setActiveSection("alunos");
    } else {
      navegarPara("/alunos");
    }
  };

  // Mostrar indicador de carregamento
  if (loading || carregandoAlunoDoContexto) {
    return (
      <div className="detalhe-aluno-container">
        <div className="detalhe-header">
          <h2>Detalhes do Aluno</h2>
          <button className="btn-voltar" onClick={voltarParaLista}>
            ← Voltar para Lista de Alunos
          </button>
        </div>
        <div className="detalhe-loading">
          <div className="spinner"></div>
          <p>Carregando dados do aluno...</p>
        </div>
      </div>
    );
  }

  // Mostrar mensagem de erro
  if (error || erroContexto || !aluno) {
    return (
      <div className="detalhe-aluno-container">
        <div className="detalhe-header">
          <h2>Detalhes do Aluno</h2>
          <button className="btn-voltar" onClick={voltarParaLista}>
            ← Voltar para Lista de Alunos
          </button>
        </div>
        <div className="detalhe-error">
          <p>Aluno não encontrado</p>
          <button className="btn-voltar" onClick={voltarParaLista}>
            Voltar para Lista de Alunos
          </button>
        </div>
      </div>
    );
  }

  // Converter a data de nascimento para um formato legível
  const dataNascimento = aluno.data_nascimento
    ? formatarData(new Date(aluno.data_nascimento))
    : "Não informada";

  return (
    <div className="detalhe-aluno-container">
      <div className="detalhe-header">
        <h2>Detalhes do Aluno</h2>
        <div className="detalhe-acoes">
          <button className="btn-editar" onClick={handleEditarClick}>
            ✏️ Editar
          </button>
          <button className="btn-voltar" onClick={voltarParaLista}>
            ← Voltar
          </button>
        </div>
      </div>

      <div className="detalhe-card">
        <div className="detalhe-foto">
          <div className="foto-placeholder">
            {aluno.nome ? aluno.nome.charAt(0).toUpperCase() : "?"}
          </div>
        </div>

        <div className="detalhe-info">
          <h3>{aluno.nome}</h3>
          <p className="detalhe-status">
            Status:{" "}
            <span className={`status-${aluno.status.toLowerCase()}`}>
              {aluno.status === "ativo" ? "Ativo" : "Inativo"}
            </span>
          </p>
        </div>
      </div>

      <div className="detalhe-secoes">
        <div className="detalhe-secao">
          <h4>Dados Pessoais</h4>
          <div className="detalhe-item">
            <strong>Data de Nascimento:</strong>
            <span>{dataNascimento}</span>
          </div>
          <div className="detalhe-item">
            <strong>Idade:</strong>
            <span>{aluno.idade ? `${aluno.idade} anos` : "Não informada"}</span>
          </div>
          <div className="detalhe-item">
            <strong>Plano:</strong>
            <span>{aluno.plano || "Não informado"}</span>
          </div>
          <div className="detalhe-item">
            <strong>Nível:</strong>
            <span>{aluno.nivel || "Não informado"}</span>
          </div>
        </div>

        <div className="detalhe-secao">
          <h4>Informações Médicas</h4>
          <div className="detalhe-item">
            <strong>Lesão:</strong>
            <span>
              {aluno.lesao === "Sim - Lesao Moderada"
                ? "Sim - Lesão Moderada"
                : aluno.lesao === "Sim - Lesao Grave"
                ? "Sim - Lesão Grave"
                : "Não"}
            </span>
          </div>
          {(aluno.lesao === "Sim - Lesao Moderada" ||
            aluno.lesao === "Sim - Lesao Grave") && (
            <div className="detalhe-item">
              <strong>Tipo de Lesão:</strong>
              <span>{aluno.tipo_lesao || "Não especificado"}</span>
            </div>
          )}
        </div>

        <div className="detalhe-secao">
          <h4>Objetivo de Treino</h4>
          <div className="detalhe-texto">
            {aluno.objetivo || "Nenhum objetivo especificado."}
          </div>
        </div>

        <div className="detalhe-secao">
          <h4>Observações Adicionais</h4>
          <div className="detalhe-texto">
            {aluno.observacoes || "Nenhuma observação adicional."}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetalheAluno;

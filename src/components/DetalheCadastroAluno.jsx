import React, { useState, useEffect } from "react";
import "../styles/DetalheAluno.css";
import { supabase } from "../services/supabase";

const DetalheCadastroAluno = ({ aluno, alunoId, onNavigateBack }) => {
  // Estado para armazenar os dados do aluno quando recebemos apenas o ID
  const [dadosAluno, setDadosAluno] = useState(null);
  const [carregandoAluno, setCarregandoAluno] = useState(false);
  const [erro, setErro] = useState(null);

  // Quando componente recebe alunoId em vez do objeto aluno completo
  useEffect(() => {
    const buscarDadosAluno = async () => {
      if (!alunoId) return;

      try {
        setCarregandoAluno(true);
        setErro(null);

        console.log(`Buscando dados do aluno com ID: ${alunoId}`);

        const { data, error } = await supabase
          .from("alunos")
          .select("*")
          .eq("id", alunoId)
          .single();

        if (error) {
          console.error("Erro ao buscar dados do aluno:", error);
          setErro(`Erro ao buscar dados do aluno: ${error.message}`);
          return;
        }

        if (!data) {
          setErro(`Aluno com ID ${alunoId} não encontrado`);
          return;
        }

        console.log("Dados do aluno carregados:", data);
        setDadosAluno(data);
      } catch (err) {
        console.error("Erro ao carregar dados do aluno:", err);
        setErro(`Erro ao carregar dados do aluno: ${err.message}`);
      } finally {
        setCarregandoAluno(false);
      }
    };

    if (alunoId && !aluno) {
      buscarDadosAluno();
    }
  }, [alunoId, aluno]);

  // Usar o objeto aluno que foi passado diretamente, ou o que foi buscado pelo ID
  const alunoAtual = aluno || dadosAluno;

  // Função para formatar a data no padrão brasileiro
  const formatarData = (dataString) => {
    if (!dataString) return "Data não disponível";

    const data = new Date(dataString);
    if (isNaN(data.getTime())) return dataString; // Se não conseguir converter, retorna como está

    return data.toLocaleDateString("pt-BR");
  };

  const handleVoltar = () => {
    if (onNavigateBack) {
      onNavigateBack("alunos"); // Volta para a lista de alunos
    }
  };

  // Exibir mensagem de carregamento quando estiver buscando dados do aluno
  if (carregandoAluno) {
    return (
      <div className="loading-container">Carregando dados do aluno...</div>
    );
  }

  // Exibir mensagem de erro se ocorrer algum problema
  if (erro) {
    return (
      <div className="error-container">
        <p className="error-message">{erro}</p>
        <button className="btn-voltar" onClick={handleVoltar}>
          Voltar para Lista de Alunos
        </button>
      </div>
    );
  }

  // Se não tem aluno nem dados do aluno, mostrar mensagem
  if (!alunoAtual) {
    return (
      <div className="error-container">
        <p>Aluno não encontrado</p>
        <button className="btn-voltar" onClick={handleVoltar}>
          Voltar para Lista de Alunos
        </button>
      </div>
    );
  }

  return (
    <div className="detalhes-aluno">
      <h2>Detalhes do Cadastro: {alunoAtual.nome}</h2>

      <div className="detalhes-grid">
        {/* Dados Pessoais */}
        <div className="dados-aluno-card">
          <h3>Dados Pessoais</h3>
          <div className="info-container">
            <p>
              <strong>Nome Completo:</strong> {alunoAtual.nome}
            </p>
            <p>
              <strong>Telefone:</strong>{" "}
              {alunoAtual.telefone || "Não cadastrado"}
            </p>
            <p>
              <strong>Data de Nascimento:</strong>{" "}
              {alunoAtual.data_nascimento
                ? formatarData(alunoAtual.data_nascimento)
                : "Não cadastrada"}
            </p>
            <p>
              <strong>Idade:</strong> {alunoAtual.idade || "N/A"}
            </p>
            <p>
              <strong>Status da Matrícula:</strong>{" "}
              <span
                className={`status-${
                  alunoAtual.status === "ativo" ? "atual" : "cancelada"
                }`}
              >
                {alunoAtual.status === "ativo" ? "Ativo" : "Inativo"}
              </span>
            </p>
          </div>
        </div>

        {/* Informações de Treino */}
        <div className="dados-aluno-card">
          <h3>Informações de Treino</h3>
          <div className="info-container">
            <p>
              <strong>Plano:</strong> {alunoAtual.plano || "N/A"}
            </p>
            <p>
              <strong>Nível:</strong> {alunoAtual.nivel || "N/A"}
            </p>

            <div className="lesao-info">
              <p>
                <strong>Lesão:</strong>{" "}
                <span
                  className={`${
                    alunoAtual.lesao?.includes("Grave")
                      ? "lesao-grave"
                      : alunoAtual.lesao?.includes("Moderada")
                      ? "lesao-moderada"
                      : ""
                  }`}
                >
                  {alunoAtual.lesao || "Nenhuma"}
                </span>
              </p>

              {alunoAtual.lesao &&
                alunoAtual.lesao !== "Nao" &&
                alunoAtual.tipo_lesao && (
                  <div className="tipo-lesao">
                    <p>
                      <strong>Detalhes da lesão:</strong>
                    </p>
                    <p className="lesao-descricao">{alunoAtual.tipo_lesao}</p>
                  </div>
                )}
            </div>

            <div className="objetivo-treino">
              <p className="objetivo-treino-titulo">
                <strong>Objetivo de Treino:</strong>
              </p>
              <div className="objetivo-treino-texto">
                {alunoAtual.objetivo || "Não informado"}
              </div>
            </div>

            <p className="titulo-observacoes">
              <strong>Observações:</strong>
            </p>
            <div className="observacoes-texto">
              {alunoAtual.observacoes || "Nenhuma observação cadastrada"}
            </div>
          </div>
        </div>

        {/* Informações do Sistema */}
        <div className="dados-aluno-card">
          <h3>Informações do Sistema</h3>
          <div className="info-container">
            <p>
              <strong>ID:</strong> {alunoAtual.id}
            </p>
            <p>
              <strong>Criado em:</strong>{" "}
              {alunoAtual.created_at
                ? formatarData(alunoAtual.created_at)
                : "N/A"}
            </p>
            <p>
              <strong>Última atualização:</strong>{" "}
              {alunoAtual.updated_at
                ? formatarData(alunoAtual.updated_at)
                : "N/A"}
            </p>
          </div>
        </div>
      </div>

      {/* Botões de ação */}
      <div className="botoes-acao">
        <button className="btn-voltar" onClick={handleVoltar}>
          Voltar para Lista de Alunos
        </button>
        <button
          className="btn-editar"
          onClick={() => onNavigateBack(`editar-aluno/${alunoAtual.id}`)}
        >
          Editar Aluno
        </button>
      </div>
    </div>
  );
};

export default DetalheCadastroAluno;

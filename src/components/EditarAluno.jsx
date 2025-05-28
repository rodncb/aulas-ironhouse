import React, { useState, useEffect } from "react";
import { supabase } from "../services/supabase";
import { navegarPara } from "../lib/utils";
import "../styles/EditarAluno.css"; // Importando o CSS específico para EditarAluno
import { useCadastroAluno } from "../contexts/CadastroAlunoContext"; // Importar o contexto

const EditarAluno = ({ alunoId, setActiveSection }) => {
  // Usar o contexto para gerenciar dados do aluno
  const {
    formData: dadosContexto,
    setFormData,
    carregarAluno: carregarAlunoDoContexto,
    carregandoAluno: carregandoAlunoDoContexto,
    alunoId: alunoIdContexto,
    error: erroContexto,
    limparDadosCadastro,
  } = useCadastroAluno();

  // Estados locais
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [formData, setLocalFormData] = useState({
    nome: "",
    data_nascimento: "",
    lesao: "Não",
    tipo_lesao: "",
    objetivo: "",
    plano: "8 Check-in",
    nivel: "Iniciante",
    observacoes: "",
    status: "ativo",
  });

  // Carregar dados do aluno ao montar o componente
  useEffect(() => {
    const carregarAluno = async () => {
      try {
        setLoading(true);

        // Se já temos os dados do aluno no contexto e o ID corresponde, usá-los
        if (
          alunoIdContexto === alunoId &&
          Object.keys(dadosContexto).length > 0
        ) {
    
          setLocalFormData({
            nome: dadosContexto.nome || "",
            data_nascimento: dadosContexto.data_nascimento || "",
            lesao: dadosContexto.lesao || "Não",
            tipo_lesao: dadosContexto.tipo_lesao || "",
            objetivo: dadosContexto.objetivo || "",
            plano: dadosContexto.plano || "8 Check-in",
            nivel: dadosContexto.nivel || "Iniciante",
            observacoes: dadosContexto.observacoes || "",
            status: dadosContexto.status || "ativo",
          });
          setLoading(false);
          return;
        }

        // Se não temos os dados ou o ID é diferente, carregar do backend através do contexto
        await carregarAlunoDoContexto(alunoId);

        // Verificar se os dados foram carregados no contexto após a operação
        if (
          dadosContexto &&
          Object.keys(dadosContexto).length > 0 &&
          alunoIdContexto === alunoId
        ) {
          // Os dados serão processados no próximo useEffect quando dadosContexto for atualizado
        } else {
          // Se não conseguir carregar via contexto, tentar carregar diretamente
          const { data, error } = await supabase
            .from("alunos")
            .select("*")
            .eq("id", alunoId)
            .single();

          if (error) {
            console.error("Erro ao carregar aluno:", error);
            setMessage({
              type: "error",
              text: "Não foi possível carregar os dados do aluno.",
            });
          } else if (data) {
            // Preencher formData com os dados do aluno
            setLocalFormData({
              nome: data.nome || "",
              data_nascimento: data.data_nascimento || "",
              lesao: data.lesao || "Não",
              tipo_lesao: data.tipo_lesao || "",
              objetivo: data.objetivo || "",
              plano: data.plano || "8 Check-in",
              nivel: data.nivel || "Iniciante",
              observacoes: data.observacoes || "",
              status: data.status || "ativo",
            });

            // Atualizar também o contexto
            setFormData({
              ...data,
              editandoAluno: true,
            });
          } else {
            setMessage({
              type: "error",
              text: "Aluno não encontrado.",
            });
          }
        }
      } catch (err) {
        console.error("Erro ao carregar aluno:", err);
        setMessage({
          type: "error",
          text: "Erro ao carregar dados do aluno.",
        });
      } finally {
        setLoading(false);
      }
    };

    if (alunoId) {
      carregarAluno();
    }
  }, [alunoId, carregarAlunoDoContexto, alunoIdContexto]); // Removida dependência dadosContexto e setFormData

  // Atualizar formulário local quando os dados do contexto mudarem
  useEffect(() => {
    if (
      dadosContexto &&
      Object.keys(dadosContexto).length > 0 &&
      alunoIdContexto === alunoId
    ) {
      setLocalFormData({
        nome: dadosContexto.nome || "",
        data_nascimento: dadosContexto.data_nascimento || "",
        lesao: dadosContexto.lesao || "Não",
        tipo_lesao: dadosContexto.tipo_lesao || "",
        objetivo: dadosContexto.objetivo || "",
        plano: dadosContexto.plano || "8 Check-in",
        nivel: dadosContexto.nivel || "Iniciante",
        observacoes: dadosContexto.observacoes || "",
        status: dadosContexto.status || "ativo",
      });
      setLoading(false);
    }
  }, [dadosContexto, alunoIdContexto, alunoId]);

  // Função para lidar com mudanças nos campos do formulário
  const handleChange = (e) => {
    const { name, value } = e.target;
    setLocalFormData((prev) => ({ ...prev, [name]: value }));

    // Atualizar também no contexto
    setFormData((prev) => ({ ...prev, [name]: value, editandoAluno: true }));

    // Se o tipo de lesão mudar para 'Não', limpe o campo tipo_lesao
    if (name === "lesao" && value === "Não") {
      setLocalFormData((prev) => ({ ...prev, tipo_lesao: "" }));
      setFormData((prev) => ({ ...prev, tipo_lesao: "" }));
    }
  };

  // Função para lidar com mudança no plano (checkbox)
  const handlePlanoChange = (plano) => {
    setLocalFormData((prev) => ({ ...prev, plano }));
    setFormData((prev) => ({ ...prev, plano, editandoAluno: true }));
  };

  // Função para lidar com o envio do formulário
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ type: "", text: "" });

    try {
      // Preparar dados para atualização
      const alunoData = { ...formData };

      // Se a lesão for 'Não', remova o tipo_lesao
      if (alunoData.lesao === "Não") {
        alunoData.tipo_lesao = null;
      }

      // Corrigir o valor de "lesao" para garantir que não contenha acentuação
      let lesaoCorrigida = alunoData.lesao;
      if (lesaoCorrigida === "Não") {
        lesaoCorrigida = "Nao";
      }
      alunoData.lesao = lesaoCorrigida;

      // Executar atualização no Supabase
      const { error } = await supabase
        .from("alunos")
        .update(alunoData)
        .eq("id", alunoId);

      if (error) {
        console.error("Erro ao atualizar aluno:", error);
        setMessage({
          type: "error",
          text: `Erro ao atualizar aluno: ${error.message}`,
        });
      } else {
        setMessage({
          type: "success",
          text: "Aluno atualizado com sucesso!",
        });

        // Limpar dados do contexto após salvar com sucesso
        limparDadosCadastro();

        // Redirecionar após alguns segundos
        setTimeout(() => {
          voltarParaLista();
        }, 1500);
      }
    } catch (error) {
      console.error("Erro ao atualizar aluno:", error);
      setMessage({
        type: "error",
        text: "Ocorreu um erro ao atualizar os dados do aluno.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Função para voltar para a lista de alunos
  const voltarParaLista = () => {
    // Limpar dados do contexto ao voltar
    limparDadosCadastro();

    // Navegar de volta para a listagem de alunos
    navegarPara("alunos"); // Mudando para "alunos" para ir para a tela de Gerenciamento de Alunos
  };

  // Botão voltar no topo da página - melhorado para que sempre funcione
  const handleVoltar = () => {
    voltarParaLista();
  };

  // Mostrar indicador de carregamento
  if (loading || carregandoAlunoDoContexto) {
    return (
      <div className="cadastro-container">
        <div className="cadastro-header">
          <h2>Editar Aluno</h2>
        </div>
        <div className="loading-indicator">
          <div className="spinner"></div>
          <p>Carregando dados do aluno...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cadastro-container">
      <div className="cadastro-header">
        <h2>Editar Aluno</h2>
        <button className="btn-voltar" onClick={handleVoltar}>
          ← Voltar
        </button>
      </div>

      {message.text && (
        <div className={`message ${message.type}`}>{message.text}</div>
      )}

      <form className="cadastro-form" onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="nome">Nome Completo*</label>
            <input
              type="text"
              id="nome"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              required
              placeholder="Nome do aluno"
            />
          </div>

          <div className="form-group">
            <label htmlFor="data_nascimento">Data de Nascimento</label>
            <input
              type="date"
              id="data_nascimento"
              name="data_nascimento"
              value={formData.data_nascimento || ""}
              onChange={handleChange}
              placeholder="Data de nascimento do aluno"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Plano</label>
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="plano"
                  checked={formData.plano === "8 Check-in"}
                  onChange={() => handlePlanoChange("8 Check-in")}
                />
                <span>8 Check-in</span>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="plano"
                  checked={formData.plano === "12 Check-in"}
                  onChange={() => handlePlanoChange("12 Check-in")}
                />
                <span>12 Check-in</span>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="plano"
                  checked={formData.plano === "16 Check-in"}
                  onChange={() => handlePlanoChange("16 Check-in")}
                />
                <span>16 Check-in</span>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="plano"
                  checked={formData.plano === "Premium"}
                  onChange={() => handlePlanoChange("Premium")}
                />
                <span>Premium</span>
              </label>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="nivel">Nível de experiência</label>
            <select
              id="nivel"
              name="nivel"
              value={formData.nivel}
              onChange={handleChange}
            >
              <option value="">Selecione um nível</option>
              <option value="Iniciante">Iniciante</option>
              <option value="Intermediário">Intermediário</option>
              <option value="Avançado">Avançado</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="lesao">Tem alguma lesão?</label>
            <select
              id="lesao"
              name="lesao"
              value={formData.lesao}
              onChange={handleChange}
            >
              <option value="Não">Não</option>
              <option value="Sim - Lesao Moderada">Sim - Lesão Moderada</option>
              <option value="Sim - Lesao Grave">Sim - Lesão Grave</option>
            </select>
          </div>
        </div>

        {formData.lesao !== "Não" && (
          <div className="form-row">
            <div className="form-group full-width">
              <label htmlFor="tipo_lesao">Descrição da Lesão</label>
              <textarea
                id="tipo_lesao"
                name="tipo_lesao"
                value={formData.tipo_lesao || ""}
                onChange={handleChange}
                placeholder="Descreva detalhes sobre a lesão"
                rows={3}
              />
            </div>
          </div>
        )}

        <div className="form-row">
          <div className="form-group full-width">
            <label htmlFor="objetivo">Objetivo de Treino</label>
            <textarea
              id="objetivo"
              name="objetivo"
              value={formData.objetivo || ""}
              onChange={handleChange}
              placeholder="Qual o objetivo do aluno com o treino?"
              rows={3}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group full-width">
            <label htmlFor="observacoes">Observações</label>
            <textarea
              id="observacoes"
              name="observacoes"
              value={formData.observacoes || ""}
              onChange={handleChange}
              placeholder="Observações adicionais sobre o aluno..."
              rows={3}
            />
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={voltarParaLista}
            disabled={submitting}
          >
            Cancelar
          </button>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? "Salvando..." : "Salvar Alterações"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditarAluno;

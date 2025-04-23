import React, { useState, useEffect } from "react";
import AlunosService from "../services/AlunosService";
import { supabase, reloadSupabaseSchemaCache } from "../services/supabase";
import { voltarPagina, navegarPara } from "../lib/utils";
import "../styles/DetalheAluno.css";
import "../styles/EditarAluno.css"; // Caso precise de estilos específicos para o formulário

const EditarAluno = ({ alunoId, setActiveSection }) => {
  const [aluno, setAluno] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [existingColumns, setExistingColumns] = useState([]);

  // Estados para cada campo do formulário
  const [formData, setFormData] = useState({
    nome: "",
    idade: "",
    telefone: "",
    objetivo: "",
    lesao: "Não",
    tipoLesao: "", // Changed from tipo_lesao
    status: "ativo",
    plano: "",
    nivel: "",
  });

  // Verificar as colunas existentes na tabela
  useEffect(() => {
    const verificarEstruturaBanco = async () => {
      try {
        // Tentar obter um registro para ver a estrutura das colunas
        const { data, error } = await supabase
          .from("alunos")
          .select("*")
          .limit(1)
          .single();

        if (error && error.code !== "PGRST116") {
          console.error("Erro ao verificar estrutura do banco:", error);
          return;
        }

        if (data) {
          const colunas = Object.keys(data);
          console.log("Colunas encontradas na tabela alunos:", colunas);
          setExistingColumns(colunas);
        }
      } catch (err) {
        console.error("Erro ao verificar colunas:", err);
      }
    };

    verificarEstruturaBanco();
  }, []);

  useEffect(() => {
    const carregarAluno = async () => {
      setLoading(true);
      try {
        const infoAluno = await AlunosService.obterAlunoPorId(alunoId);
        setAluno(infoAluno);

        // Preencher o formulário com todos os campos necessários
        setFormData({
          nome: infoAluno.nome || "",
          idade: infoAluno.idade || "",
          telefone: infoAluno.telefone || "",
          objetivo: infoAluno.objetivo || "",
          lesao: infoAluno.lesao || "Não",
          tipoLesao: infoAluno.tipoLesao || "", // Changed from tipo_lesao
          status: infoAluno.status || "ativo",
          plano: infoAluno.plano || "",
          nivel: infoAluno.nivel || "",
        });

        // Atualizar a lista de colunas existentes
        if (infoAluno) {
          setExistingColumns(Object.keys(infoAluno));
        }
      } catch (err) {
        console.error("Erro ao carregar dados do aluno:", err);
        setError(
          "Não foi possível carregar os dados do aluno. Por favor, tente novamente."
        );
      } finally {
        setLoading(false);
      }
    };

    if (alunoId) {
      carregarAluno();
    }
  }, [alunoId]);

  // Verificar se uma coluna existe no banco
  const colunaExiste = (coluna) => {
    return existingColumns.includes(coluna);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Função para voltar para o gerenciamento de alunos
  const voltarParaGerenciamento = () => {
    if (setActiveSection) {
      setActiveSection("alunos");
    } else {
      navegarPara("alunos");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      // Forçar atualização do cache do esquema
      await reloadSupabaseSchemaCache();

      // Garantir que as colunas existem
      await AlunosService.garantirColunasExistem();

      // Criar objeto com os dados a serem atualizados
      const dadosAtualizados = {
        nome: formData.nome,
        status: formData.status,
        lesao: formData.lesao,
        plano: formData.plano,
        nivel: formData.nivel,
      };

      // Adicionar campos opcionais apenas se tiverem valor
      if (formData.idade) {
        dadosAtualizados.idade = parseInt(formData.idade) || null;
      }

      if (formData.telefone) {
        dadosAtualizados.telefone = formData.telefone;
      }

      if (formData.objetivo) {
        dadosAtualizados.objetivo = formData.objetivo;
      }

      // Use tipoLesao here
      if (formData.tipoLesao && formData.lesao !== "Não") {
        dadosAtualizados.tipoLesao = formData.tipoLesao; // Changed from tipo_lesao
      }

      console.log("Enviando dados para atualização:", dadosAtualizados);

      // Atualizar diretamente usando o Supabase sem passar por serviços intermediários
      const { data, error } = await supabase
        .from("alunos")
        .update(dadosAtualizados)
        .eq("id", alunoId)
        .select();

      if (error) {
        console.error("Erro ao atualizar aluno:", error);
        throw error;
      }

      console.log("Aluno atualizado com sucesso:", data);

      // Atualizar o estado local com os dados atualizados
      setAluno({ ...data[0], ativo: data[0].status === "ativo" });
      setSuccess(true);

      // Mostrar mensagem de sucesso por um tempo e depois voltar
      setTimeout(() => {
        voltarParaGerenciamento();
      }, 2000);
    } catch (err) {
      console.error("Erro ao atualizar aluno:", err);
      setError(`Erro ao salvar alterações: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="detalhe-aluno-container">
        <div className="detalhe-header">
          <h2>Editar Aluno</h2>
          <button className="btn-voltar" onClick={voltarParaGerenciamento}>
            ← Voltar
          </button>
        </div>
        <div className="detalhe-loading">
          <div className="spinner"></div>
          <p>Carregando dados do aluno...</p>
        </div>
      </div>
    );
  }

  if (error && !aluno) {
    return (
      <div className="detalhe-aluno-container">
        <div className="detalhe-header">
          <h2>Editar Aluno</h2>
          <button className="btn-voltar" onClick={voltarParaGerenciamento}>
            ← Voltar
          </button>
        </div>
        <div className="detalhe-error">
          <p>{error || "Aluno não encontrado"}</p>
          <button className="btn-voltar" onClick={voltarParaGerenciamento}>
            Voltar para a lista
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="detalhe-aluno-container">
      <div className="detalhe-header">
        <h2>Editar Aluno</h2>
        <button className="btn-voltar" onClick={voltarParaGerenciamento}>
          ← Voltar
        </button>
      </div>

      <div className="detalhe-card">
        <div className="detalhe-foto">
          <div className="foto-placeholder">
            {formData.nome ? formData.nome.charAt(0).toUpperCase() : "?"}
          </div>
        </div>
        <div className="detalhe-info">
          <h3>{formData.nome}</h3>
        </div>
      </div>

      <div className="editar-aluno-form-container">
        {success && (
          <div className="mensagem-sucesso">
            Dados do aluno atualizados com sucesso!
          </div>
        )}

        {error && <div className="mensagem-erro">{error}</div>}

        <form onSubmit={handleSubmit} className="editar-aluno-form">
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
              <label htmlFor="idade">Idade</label>
              <input
                type="number"
                id="idade"
                name="idade"
                value={formData.idade}
                onChange={handleChange}
                placeholder="Idade do aluno"
                min="0"
                max="120"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="telefone">Telefone / WhatsApp</label>
              <input
                type="tel"
                id="telefone"
                name="telefone"
                value={formData.telefone}
                onChange={handleChange}
                placeholder="(00) 00000-0000"
              />
            </div>

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
                    onChange={() =>
                      setFormData({ ...formData, plano: "8 Check-in" })
                    }
                  />
                  8 Check-in
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="plano"
                    checked={formData.plano === "12 Check-in"}
                    onChange={() =>
                      setFormData({ ...formData, plano: "12 Check-in" })
                    }
                  />
                  12 Check-in
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="plano"
                    checked={formData.plano === "16 Check-in"}
                    onChange={() =>
                      setFormData({ ...formData, plano: "16 Check-in" })
                    }
                  />
                  16 Check-in
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="plano"
                    checked={formData.plano === "Premium"}
                    onChange={() =>
                      setFormData({ ...formData, plano: "Premium" })
                    }
                  />
                  Premium
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
                <option value="Sim - Moderada">Sim - Lesão Moderada</option>
                <option value="Sim - Grave">Sim - Lesão Grave</option>
              </select>
            </div>
          </div>

          {formData.lesao !== "Não" && (
            <div className="form-row">
              <div className="form-group full-width">
                <label htmlFor="tipoLesao">Descrição da Lesão</label>{" "}
                {/* Changed from tipo_lesao */}
                <textarea
                  id="tipoLesao" // Changed from tipo_lesao
                  name="tipoLesao" // Changed from tipo_lesao
                  value={formData.tipoLesao} // Changed from tipo_lesao
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
                value={formData.objetivo}
                onChange={handleChange}
                placeholder="Qual o objetivo do aluno com o treino?"
                rows={3}
              />
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn-cancelar"
              onClick={voltarParaGerenciamento}
            >
              Cancelar
            </button>
            <button type="submit" className="btn-salvar" disabled={saving}>
              {saving ? "Salvando..." : "Salvar Alterações"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditarAluno;

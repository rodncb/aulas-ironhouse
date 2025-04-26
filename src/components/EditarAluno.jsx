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
    dataNascimento: "", // Novo: data de nascimento
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
          dataNascimento: infoAluno.data_nascimento || "", // Usar o campo data_nascimento do backend
          objetivo: infoAluno.objetivo || "",
          lesao: infoAluno.lesao || "Não",
          tipoLesao: infoAluno.tipo_lesao || "", // Usando campo do backend
          status: infoAluno.status || "ativo",
          plano: infoAluno.plano || "",
          nivel: infoAluno.nivel || "",
          observacoes: infoAluno.observacoes || "", // Garantir que observações sejam carregadas
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

      // Corrigir o valor de "lesao" para garantir que não contenha acentuação
      let lesaoCorrigida = formData.lesao;
      if (lesaoCorrigida === "Não") {
        lesaoCorrigida = "Nao";
        console.log("Corrigindo valor de lesão de 'Não' para 'Nao'");
      }

      // Calcular a idade a partir da data de nascimento
      let idade = null;
      if (formData.dataNascimento) {
        const hoje = new Date();
        const dataNasc = new Date(formData.dataNascimento);
        idade = hoje.getFullYear() - dataNasc.getFullYear();
        const mesAtual = hoje.getMonth();
        const mesNasc = dataNasc.getMonth();

        // Ajuste da idade se ainda não fez aniversário este ano
        if (
          mesNasc > mesAtual ||
          (mesNasc === mesAtual && dataNasc.getDate() > hoje.getDate())
        ) {
          idade--;
        }
      }

      // Criar objeto com os dados a serem atualizados
      const dadosAtualizados = {
        nome: formData.nome,
        status: formData.status,
        lesao: lesaoCorrigida, // Usar valor corrigido
        plano: formData.plano,
        nivel: formData.nivel,
        data_nascimento: formData.dataNascimento || null, // Adicionar data de nascimento
        idade: idade, // Idade calculada
        observacoes: formData.observacoes || null, // Garantir que observações sejam persistidas
      };

      // Adicionar campos opcionais apenas se tiverem valor
      if (formData.objetivo) {
        dadosAtualizados.objetivo = formData.objetivo;
      }

      // Adicionar descrição da lesão se necessário
      if (lesaoCorrigida !== "Nao" && formData.tipoLesao) {
        dadosAtualizados.tipo_lesao = formData.tipoLesao; // Usar o snake_case para o campo do banco
      } else if (lesaoCorrigida === "Nao") {
        dadosAtualizados.tipo_lesao = null; // Limpar tipo de lesão se não tiver lesão
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
              <label htmlFor="dataNascimento">Data de Nascimento</label>
              <input
                type="date"
                id="dataNascimento"
                name="dataNascimento"
                value={formData.dataNascimento}
                onChange={handleChange}
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
                {/* Corrigido: value="Nao" (sem acento) */}
                <option value="Nao">Não</option>
                {/* Corrigido: value="Sim - Lesao Moderada" */}
                <option value="Sim - Lesao Moderada">
                  Sim - Lesão Moderada
                </option>
                {/* Corrigido: value="Sim - Lesao Grave" */}
                <option value="Sim - Lesao Grave">Sim - Lesão Grave</option>
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

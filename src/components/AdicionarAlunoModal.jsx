import React, { useState } from "react";
import "../styles/AdicionarAlunoModal.css";

const AdicionarAlunoModal = ({ onClose, onAdicionar }) => {
  const [formData, setFormData] = useState({
    nome: "",
    dataNascimento: "", // Substituindo idade por data de nascimento
    tipo: "iniciante", // iniciante, moderado, avançado
    nivel: 1, // 1 a 10
    lesao: "verde", // verde, amarelo, vermelho
    observacoes: "", // Adicionando campo de observações
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Calcular idade baseado na data de nascimento
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

    // Enviar dados com a idade calculada automaticamente
    onAdicionar({
      ...formData,
      idade: idade,
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h3>Cadastrar Aluno</h3>
          <button className="btn-fechar" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="nome">Nome do Aluno</label>
            <input
              type="text"
              id="nome"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              required
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

          <div className="form-group">
            <label htmlFor="tipo">Tipo de Aluno</label>
            <select
              id="tipo"
              name="tipo"
              value={formData.tipo}
              onChange={handleChange}
              required
            >
              <option value="iniciante">Iniciante</option>
              <option value="moderado">Moderado</option>
              <option value="avancado">Avançado</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="nivel">Nível do Treino (1-10)</label>
            <input
              type="number"
              id="nivel"
              name="nivel"
              min="1"
              max="10"
              value={formData.nivel}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Status de Lesão</label>
            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  name="lesao"
                  value="verde"
                  checked={formData.lesao === "verde"}
                  onChange={handleChange}
                />
                <span className="status-indicator verde"></span>
                Sem lesão
              </label>

              <label>
                <input
                  type="radio"
                  name="lesao"
                  value="amarelo"
                  checked={formData.lesao === "amarelo"}
                  onChange={handleChange}
                />
                <span className="status-indicator amarelo"></span>
                Atenção
              </label>

              <label>
                <input
                  type="radio"
                  name="lesao"
                  value="vermelho"
                  checked={formData.lesao === "vermelho"}
                  onChange={handleChange}
                />
                <span className="status-indicator vermelho"></span>
                Lesionado
              </label>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="observacoes">Observações</label>
            <textarea
              id="observacoes"
              name="observacoes"
              value={formData.observacoes}
              onChange={handleChange}
              placeholder="Observações adicionais sobre o aluno..."
              rows={3}
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancelar" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-salvar">
              Adicionar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdicionarAlunoModal;

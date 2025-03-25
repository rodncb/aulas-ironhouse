import React, { useState } from "react";
import "../styles/AdicionarAlunoModal.css";

const AdicionarAlunoModal = ({ onClose, onAdicionar }) => {
  const [formData, setFormData] = useState({
    nome: "",
    tipo: "iniciante", // iniciante, moderado, avançado
    nivel: 1, // 1 a 10
    lesao: "verde", // verde, amarelo, vermelho
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
    onAdicionar(formData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h3>Adicionar Aluno</h3>
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

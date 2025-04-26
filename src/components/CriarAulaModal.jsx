// src/components/CriarAulaModal.jsx
import React, { useState } from "react";
import "../styles/Modal.css";

const CriarAulaModal = ({ onSave, onCancel }) => {
  const [formData, setFormData] = useState({ data: "", observacoes: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!formData.data) {
      setError("Por favor, selecione a data da aula.");
      return;
    }
    try {
      setLoading(true);
      await onSave(formData);
      setFormData({ data: "", observacoes: "" });
      onCancel();
    } catch (err) {
      setError(err.message || "Erro ao criar aula. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content criar-aula-modal">
        <div className="modal-header">
          <h2>Criar Nova Aula</h2>
          <button
            className="close-button"
            onClick={onCancel}
            disabled={loading}
          >
            &times;
          </button>
        </div>
        <div className="modal-body">
          {error && <div className="error-message">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="data">Data da Aula*</label>
              <input
                type="date"
                id="data"
                name="data"
                value={formData.data}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="observacoes">Observações (opcional)</label>
              <textarea
                id="observacoes"
                name="observacoes"
                value={formData.observacoes}
                onChange={handleChange}
                rows={4}
                placeholder="Anotações para esta aula"
              />
            </div>
            <div className="form-actions">
              <button
                type="button"
                className="btn-cancelar"
                onClick={onCancel}
                disabled={loading}
              >
                Cancelar
              </button>
              <button type="submit" className="btn-criar" disabled={loading}>
                {loading ? "Criando..." : "Criar Aula"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CriarAulaModal;

import React, { useState } from "react";
import "../styles/Modal.css";

const FormularioAulaRealizadaModal = ({ aula, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    observacoes: aula?.observacoes || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({ observacoes: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      setLoading(true);
      await onSave(formData);
      onCancel();
    } catch (err) {
      setError(err.message || "Erro ao salvar aula finalizada.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content finalizar-aula-modal">
        <div className="modal-header">
          <h2>Finalizar Aula</h2>
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
              <label htmlFor="observacoes">Observações Finais</label>
              <textarea
                id="observacoes"
                name="observacoes"
                value={formData.observacoes}
                onChange={handleChange}
                rows={4}
                placeholder="Insira notas e considerações finais"
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
              <button type="submit" className="btn-salvar" disabled={loading}>
                {loading ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FormularioAulaRealizadaModal;

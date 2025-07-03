import React, { useState } from "react";
import "./ConfirmarExclusaoProfessor.css";

const ConfirmarExclusaoProfessor = ({
  professor,
  isOpen,
  onClose,
  onConfirm,
  professorInfo = null, // Informações adicionais como número de aulas
}) => {
  const [opcaoExclusao, setOpcaoExclusao] = useState("desabilitar"); // 'desabilitar', 'excluir_manter_aulas', 'excluir_completo'
  const [loading, setLoading] = useState(false);
  const [confirmacao, setConfirmacao] = useState("");

  if (!isOpen || !professor) return null;

  const handleConfirm = async () => {
    if (confirmacao.toLowerCase() !== "excluir") {
      alert('Digite "EXCLUIR" para confirmar a operação');
      return;
    }

    setLoading(true);
    try {
      await onConfirm(professor.id, opcaoExclusao);
      onClose();
    } catch (error) {
      console.error("Erro ao processar exclusão:", error);
      alert(
        "Erro ao processar a operação. Verifique o console para mais detalhes."
      );
    } finally {
      setLoading(false);
    }
  };

  const totalAulas = professorInfo?.aulaCount || 0;

  return (
    <div className="modal-overlay">
      <div className="modal-content exclusao-professor-modal">
        <div className="modal-header">
          <h3>⚠️ Confirmar Operação - Professor</h3>
          <button className="close-button" onClick={onClose} disabled={loading}>
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="professor-info">
            <h4>Professor: {professor.nome}</h4>
            <p>
              <strong>Email:</strong> {professor.email}
            </p>
            <p>
              <strong>ID:</strong> {professor.id}
            </p>
            {professorInfo && (
              <p>
                <strong>Total de aulas:</strong> {totalAulas}
              </p>
            )}
          </div>

          <div className="opcoes-exclusao">
            <h4>Escolha a operação:</h4>

            <div className="opcao-radio">
              <input
                type="radio"
                id="desabilitar"
                name="opcaoExclusao"
                value="desabilitar"
                checked={opcaoExclusao === "desabilitar"}
                onChange={(e) => setOpcaoExclusao(e.target.value)}
              />
              <label htmlFor="desabilitar">
                <strong>🔒 Desabilitar (Recomendado)</strong>
                <br />
                <small>
                  • Professor fica inativo no sistema
                  <br />
                  • Usuário é desabilitado no Supabase
                  <br />
                  • Aulas e dados são preservados
                  <br />• Operação reversível
                </small>
              </label>
            </div>

            <div className="opcao-radio">
              <input
                type="radio"
                id="excluir_manter_aulas"
                name="opcaoExclusao"
                value="excluir_manter_aulas"
                checked={opcaoExclusao === "excluir_manter_aulas"}
              />
              <label htmlFor="excluir_manter_aulas">
                <strong>🗑️ Excluir Professor (Manter Aulas)</strong>
                <br />
                <small>
                  • Remove professor da tabela
                  <br />
                  • Desabilita usuário no Supabase
                  <br />
                  • Aulas ficam sem professor (marcadas)
                  <br />• Operação irreversível
                </small>
              </label>
            </div>

            <div className="opcao-radio">
              <input
                type="radio"
                id="excluir_completo"
                name="opcaoExclusao"
                value="excluir_completo"
                checked={opcaoExclusao === "excluir_completo"}
              />
              <label htmlFor="excluir_completo">
                <strong>💀 Exclusão Completa (PERIGOSO)</strong>
                <br />
                <small>
                  • Remove professor completamente
                  <br />
                  • Exclui usuário do Supabase
                  <br />
                  • Remove todas as referências
                  <br />• ⚠️ OPERAÇÃO IRREVERSÍVEL
                </small>
              </label>
            </div>
          </div>

          {opcaoExclusao === "excluir_completo" && (
            <div className="aviso-perigo">
              <p>
                ⚠️ <strong>ATENÇÃO:</strong> A exclusão completa é irreversível
                e pode afetar dados históricos!
              </p>
            </div>
          )}

          <div className="confirmacao-input">
            <label htmlFor="confirmacao">
              Digite "EXCLUIR" para confirmar:
            </label>
            <input
              type="text"
              id="confirmacao"
              value={confirmacao}
              onChange={(e) => setConfirmacao(e.target.value)}
              placeholder="Digite EXCLUIR para confirmar"
              disabled={loading}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-cancelar" onClick={onClose} disabled={loading}>
            Cancelar
          </button>
          <button
            className={`btn-confirmar ${
              opcaoExclusao === "excluir_completo" ? "btn-perigo" : ""
            }`}
            onClick={handleConfirm}
            disabled={loading || confirmacao.toLowerCase() !== "excluir"}
          >
            {loading
              ? "Processando..."
              : opcaoExclusao === "desabilitar"
              ? "Desabilitar Professor"
              : opcaoExclusao === "excluir_manter_aulas"
              ? "Excluir Professor"
              : "Exclusão Completa"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmarExclusaoProfessor;

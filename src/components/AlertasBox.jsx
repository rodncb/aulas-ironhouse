import React, { useState, useEffect } from "react";
import alertasService from "../services/alertas.service";
import "../styles/AlertasBox.css";

const AlertasBox = () => {
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const carregarAlertas = async () => {
      try {
        setLoading(true);
        const todosAlertas = await alertasService.getAllAlertas();
        setAlertas(todosAlertas);
      } catch (error) {
        console.error("Erro ao carregar alertas:", error);
      } finally {
        setLoading(false);
      }
    };

    carregarAlertas();

    // Recarregar alertas a cada 5 minutos
    const intervalo = setInterval(carregarAlertas, 5 * 60 * 1000);

    return () => clearInterval(intervalo);
  }, []);

  // Função para determinar o estilo de severidade
  const getSeveridadeClass = (severidade) => {
    switch (severidade) {
      case "alto":
        return "alerta-alto";
      case "medio":
        return "alerta-medio";
      case "aviso":
        return "alerta-aviso";
      default:
        return "";
    }
  };

  // Função para obter ícone baseado no tipo de alerta
  const getTipoIcon = (tipo) => {
    switch (tipo) {
      case "ultimo_checkin":
        return "🔔";
      case "plano_excedido":
        return "⚠️";
      case "frequencia_alta":
        return "🔄";
      case "inatividade":
        return "⏱️";
      default:
        return "📝";
    }
  };

  // Total de alertas por severidade
  const alertasAlto = alertas.filter((a) => a.severidade === "alto").length;
  const alertasMedio = alertas.filter((a) => a.severidade === "medio").length;

  // Função para exibir o resumo condensado
  const renderResumo = () => {
    if (alertas.length === 0) {
      return <span className="sem-alertas">Nenhum alerta pendente</span>;
    }

    return (
      <span className="resumo-alertas">
        {alertasAlto > 0 && (
          <span className="badge alerta-alto">{alertasAlto}</span>
        )}
        {alertasMedio > 0 && (
          <span className="badge alerta-medio">{alertasMedio}</span>
        )}
        {alertas.length - alertasAlto - alertasMedio > 0 && (
          <span className="badge alerta-aviso">
            {alertas.length - alertasAlto - alertasMedio}
          </span>
        )}
        <span className="total-alertas">{alertas.length} alertas</span>
      </span>
    );
  };

  return (
    <div className={`alertas-box ${expanded ? "expanded" : ""}`}>
      <div className="alertas-header" onClick={() => setExpanded(!expanded)}>
        <h3>
          <span className="alertas-icon">🔔</span>
          Alertas
        </h3>
        {!expanded && renderResumo()}
        <span className="expandir-icon">{expanded ? "▲" : "▼"}</span>
      </div>

      {expanded && (
        <div className="alertas-content">
          {loading ? (
            <div className="loading-alertas">Carregando alertas...</div>
          ) : alertas.length > 0 ? (
            <ul className="lista-alertas">
              {alertas.map((alerta, index) => (
                <li
                  key={`${alerta.alunoId}-${alerta.tipo}-${index}`}
                  className={`alerta-item ${getSeveridadeClass(
                    alerta.severidade
                  )}`}
                >
                  <div className="alerta-icon">{getTipoIcon(alerta.tipo)}</div>
                  <div className="alerta-info">
                    <div className="alerta-mensagem">{alerta.mensagem}</div>
                    <div className="alerta-aluno">
                      <strong>{alerta.alunoNome}</strong>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="sem-alertas-expandido">
              <span className="icon-check">✓</span>
              <p>Nenhum alerta pendente</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AlertasBox;

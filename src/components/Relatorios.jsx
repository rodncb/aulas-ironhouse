import React, { useState, useEffect } from "react";
import "../styles/Relatorios.css";
import RelatorioAberturaAula from "./RelatorioAberturaAula.jsx";
import RelatorioAulaProfessor from "./RelatorioAulaProfessor.jsx";
import RelatorioKPIApontamento from "./RelatorioKPIApontamento.jsx";

const Relatorios = () => {
  const [tipoRelatorio, setTipoRelatorio] = useState("volume");

  // Função para limpar todos os dados salvos dos relatórios
  const limparTodosDadosRelatorios = () => {
    try {
      // Chamar as funções globais de limpeza se existirem
      if (window.limparDadosRelatorioVolume) {
        window.limparDadosRelatorioVolume();
      }
      if (window.limparDadosRelatorioHorario) {
        window.limparDadosRelatorioHorario();
      }
      if (window.limparDadosRelatorioKPI) {
        window.limparDadosRelatorioKPI();
      }
    } catch (error) {
      console.error("Erro ao limpar dados dos relatórios:", error);
    }
  };

  // Limpar dados quando sair dos relatórios (componente desmontado)
  useEffect(() => {
    return () => {
      // Cleanup quando o componente for desmontado
      limparTodosDadosRelatorios();
    };
  }, []);

  // Expor função de limpeza globalmente
  useEffect(() => {
    window.limparTodosDadosRelatorios = limparTodosDadosRelatorios;
    return () => {
      delete window.limparTodosDadosRelatorios;
    };
  }, []);

  return (
    <div className="relatorios-container">
      <div className="relatorios-header">
        <h1>Relatórios</h1>
        <p className="relatorios-subtitle">
          Relatórios e análises do sistema - Acesso restrito a administradores
        </p>

        <div className="relatorios-navegacao">
          <button
            className={`btn-relatorio ${
              tipoRelatorio === "volume" ? "ativo" : ""
            }`}
            onClick={() => setTipoRelatorio("volume")}
          >
            Volume de Aulas
          </button>
          <button
            className={`btn-relatorio ${
              tipoRelatorio === "pontualidade" ? "ativo" : ""
            }`}
            onClick={() => setTipoRelatorio("pontualidade")}
          >
            Horário/Professor
          </button>
          <button
            className={`btn-relatorio ${
              tipoRelatorio === "kpi" ? "ativo" : ""
            }`}
            onClick={() => setTipoRelatorio("kpi")}
          >
            KPI Apontamento
          </button>
        </div>
      </div>

      <div className="relatorios-content">
        {tipoRelatorio === "volume" ? (
          <RelatorioAberturaAula />
        ) : tipoRelatorio === "pontualidade" ? (
          <RelatorioAulaProfessor />
        ) : (
          <RelatorioKPIApontamento />
        )}
      </div>
    </div>
  );
};

export default Relatorios;

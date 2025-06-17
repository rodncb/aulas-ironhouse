import React, { useState } from "react";
import "../styles/Relatorios.css";
import RelatorioAberturaAula from "./RelatorioAberturaAula.jsx";
import RelatorioAulaProfessor from "./RelatorioAulaProfessor.jsx";

const Relatorios = () => {
  const [tipoRelatorio, setTipoRelatorio] = useState("volume");

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
        </div>
      </div>

      <div className="relatorios-content">
        {tipoRelatorio === "volume" ? (
          <RelatorioAberturaAula />
        ) : (
          <RelatorioAulaProfessor />
        )}
      </div>
    </div>
  );
};

export default Relatorios;

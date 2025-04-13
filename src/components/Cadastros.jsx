import React, { useState } from "react";
import "../styles/Cadastros.css";
import CadastroMusculatura from "./CadastroMusculatura";
import CadastroExercicio from "./CadastroExercicio";
import { voltarPagina, navegarPara } from "../lib/utils"; // Importar funções utilitárias

const Cadastros = () => {
  const [activeCadastro, setActiveCadastro] = useState(null);

  const renderCadastroContent = () => {
    switch (activeCadastro) {
      case "musculatura":
        return <CadastroMusculatura />;
      case "exercicio":
        return <CadastroExercicio />;
      default:
        return (
          <div className="cadastros-menu">
            <div
              className="cadastro-card"
              onClick={() => setActiveCadastro("musculatura")}
            >
              <h2>Musculatura</h2>
            </div>
            <div
              className="cadastro-card"
              onClick={() => setActiveCadastro("exercicio")}
            >
              <h2>Exercício</h2>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="cadastros-container">
      <div className="apple-back-button-container">
        <button
          className="apple-back-button"
          onClick={() => {
            window.dispatchEvent(
              new CustomEvent("navegarPara", {
                detail: { secao: "geral" },
              })
            );
          }}
        >
          <span className="apple-back-arrow">←</span> Voltar
        </button>
      </div>

      <div className="cadastros-header">
        <h2 className="page-title">
          <span onClick={() => setActiveCadastro(null)}>
            <i className="icon">➕</i> Cadastros
          </span>
          {activeCadastro && <i className="icon-separator">▶</i>}
          {activeCadastro === "musculatura" && "Musculatura"}
          {activeCadastro === "exercicio" && "Exercício"}
        </h2>
      </div>
      {renderCadastroContent()}
    </div>
  );
};

export default Cadastros;

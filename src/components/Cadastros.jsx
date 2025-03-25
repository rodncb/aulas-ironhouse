import React, { useState } from "react";
import "../styles/Cadastros.css";
import CadastroMusculatura from "./CadastroMusculatura";
import CadastroExercicio from "./CadastroExercicio";
import CadastroAluno from "./CadastroAluno";

const Cadastros = () => {
  const [activeCadastro, setActiveCadastro] = useState(null);

  const renderCadastroContent = () => {
    switch (activeCadastro) {
      case "musculatura":
        return <CadastroMusculatura />;
      case "exercicio":
        return <CadastroExercicio />;
      case "aluno":
        return <CadastroAluno />;
      default:
        return (
          <div className="cadastros-menu">
            <div
              className="cadastro-card"
              onClick={() => setActiveCadastro("aluno")}
            >
              <h2>Aluno</h2>
            </div>
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
      <div className="cadastros-header">
        <h2 className="page-title">
          <span onClick={() => setActiveCadastro(null)}>
            <i className="icon">➕</i> Cadastros
          </span>
          {activeCadastro && <i className="icon-separator">▶</i>}
          {activeCadastro === "musculatura" && "Musculatura"}
          {activeCadastro === "exercicio" && "Exercício"}
          {activeCadastro === "aluno" && "Aluno"}
        </h2>
      </div>
      {renderCadastroContent()}
    </div>
  );
};

export default Cadastros;

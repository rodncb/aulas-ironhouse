import React, { useState } from "react";
import "../styles/TreinosList.css";

const TreinosList = ({ aluno, onClose }) => {
  // Array com os tipos de treino conforme solicitado
  const tiposTreino = [
    { id: 1, nome: "TREINO 01 - Musculação" },
    { id: 2, nome: "TREINO 02 - Membro Superior" },
    { id: 3, nome: "TREINO 03 - Full body" },
    { id: 4, nome: "TREINO 04 - Glúteo" },
    { id: 5, nome: "TREINO 05 - Membro Superior" },
  ];

  const [treinos, setTreinos] = useState([]);
  const [novoTreino, setNovoTreino] = useState({
    tipo: 1,
    dataInicio: "",
    dataFim: "",
    nivel: aluno.nivel,
    observacoes: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNovoTreino({
      ...novoTreino,
      [name]: value,
    });
  };

  const adicionarTreino = (e) => {
    e.preventDefault();

    // Calcula data de fim (30 dias a partir da data de início)
    const dataInicio = new Date(novoTreino.dataInicio);
    const dataFim = new Date(dataInicio);
    dataFim.setDate(dataFim.getDate() + 30);

    const treinoCompleto = {
      ...novoTreino,
      id: Date.now(),
      dataFim: dataFim.toISOString().split("T")[0],
      tipoNome: tiposTreino.find((t) => t.id === parseInt(novoTreino.tipo))
        .nome,
    };

    setTreinos([...treinos, treinoCompleto]);

    // Reset form
    setNovoTreino({
      tipo: 1,
      dataInicio: "",
      dataFim: "",
      nivel: aluno.nivel,
      observacoes: "",
    });
  };

  return (
    <div className="treinos-container">
      <div className="treinos-header">
        <h2>Treinos de {aluno.nome}</h2>
        <button className="btn-fechar" onClick={onClose}>
          ×
        </button>
      </div>

      <div className="treinos-form">
        <h3>Adicionar Novo Treino</h3>
        <form onSubmit={adicionarTreino}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="tipo">Tipo de Treino</label>
              <select
                id="tipo"
                name="tipo"
                value={novoTreino.tipo}
                onChange={handleChange}
                required
              >
                {tiposTreino.map((tipo) => (
                  <option key={tipo.id} value={tipo.id}>
                    {tipo.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="dataInicio">Data de Início</label>
              <input
                type="date"
                id="dataInicio"
                name="dataInicio"
                value={novoTreino.dataInicio}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="nivel">Nível (1-10)</label>
              <input
                type="number"
                id="nivel"
                name="nivel"
                min="1"
                max="10"
                value={novoTreino.nivel}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="observacoes">Observações</label>
            <textarea
              id="observacoes"
              name="observacoes"
              value={novoTreino.observacoes}
              onChange={handleChange}
              rows="3"
            ></textarea>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-adicionar">
              Adicionar Treino
            </button>
          </div>
        </form>
      </div>

      <div className="treinos-lista">
        <h3>Histórico de Treinos</h3>

        {treinos.length === 0 ? (
          <p className="sem-treinos">Nenhum treino registrado ainda.</p>
        ) : (
          <table className="tabela-treinos">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Início</th>
                <th>Fim</th>
                <th>Nível</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {treinos.map((treino) => (
                <tr key={treino.id}>
                  <td>{treino.tipoNome}</td>
                  <td>{treino.dataInicio}</td>
                  <td>{treino.dataFim}</td>
                  <td>{treino.nivel}</td>
                  <td>
                    <button className="btn-detalhes">Ver</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default TreinosList;

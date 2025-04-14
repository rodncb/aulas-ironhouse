import React, { useState } from "react";
import "../styles/Cadastros.css";

const USUARIOS_KEY = "usuariosSistema";

// Carregar usuários do localStorage ou mock inicial
function getUsuarios() {
  const local = localStorage.getItem(USUARIOS_KEY);
  if (local) return JSON.parse(local);
  // Mock inicial
  return [
    { id: 1, email: "admin@example.com", role: "admin", nome: "Administrador" },
    {
      id: 2,
      email: "professor@example.com",
      role: "professor",
      nome: "Professor",
    },
  ];
}

export default function Configuracoes() {
  const [usuarios, setUsuarios] = useState(getUsuarios());
  const [novo, setNovo] = useState({ nome: "", email: "", role: "professor" });
  const [erro, setErro] = useState("");

  // Salvar no localStorage sempre que houver alteração
  const salvarUsuarios = (lista) => {
    setUsuarios(lista);
    localStorage.setItem(USUARIOS_KEY, JSON.stringify(lista));
  };

  const handleChange = (e) => {
    setNovo({ ...novo, [e.target.name]: e.target.value });
  };

  const handleAdd = (e) => {
    e.preventDefault();
    setErro("");
    if (!novo.nome.trim() || !novo.email.trim()) {
      setErro("Preencha nome e email.");
      return;
    }
    if (usuarios.some((u) => u.email === novo.email)) {
      setErro("Já existe um usuário com este email.");
      return;
    }
    const novoUsuario = {
      ...novo,
      id: Date.now(),
    };
    salvarUsuarios([...usuarios, novoUsuario]);
    setNovo({ nome: "", email: "", role: "professor" });
  };

  const handleRemove = (id) => {
    if (window.confirm("Tem certeza que deseja remover este usuário?")) {
      salvarUsuarios(usuarios.filter((u) => u.id !== id));
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
      <h2 className="page-title">Gerenciamento de Usuários</h2>
      <form
        className="cadastro-form"
        onSubmit={handleAdd}
        style={{ marginBottom: 24 }}
      >
        <div className="form-fields">
          <input
            type="text"
            name="nome"
            value={novo.nome}
            onChange={handleChange}
            placeholder="Nome"
            required
          />
          <input
            type="email"
            name="email"
            value={novo.email}
            onChange={handleChange}
            placeholder="E-mail"
            required
          />
          <select name="role" value={novo.role} onChange={handleChange}>
            <option value="professor">Professor</option>
            <option value="admin">Administrador</option>
          </select>
          <button type="submit" className="btn-cadastrar">
            Adicionar
          </button>
        </div>
        {erro && <div style={{ color: "#f44336", marginTop: 8 }}>{erro}</div>}
      </form>
      <table className="data-table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Email</th>
            <th>Papel</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((u) => (
            <tr key={u.id}>
              <td>{u.nome}</td>
              <td>{u.email}</td>
              <td>{u.role === "admin" ? "Administrador" : "Professor"}</td>
              <td>
                <button
                  className="btn-excluir"
                  onClick={() => handleRemove(u.id)}
                >
                  Remover
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

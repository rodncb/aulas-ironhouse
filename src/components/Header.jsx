import React from "react";
import "../styles/Header.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faSignOutAlt } from "@fortawesome/free-solid-svg-icons";
import logoCompleta from "../assets/logo_completa.png";

const Header = ({ toggleSidebar, user, onLogout }) => {
  // Garantir que mostramos o email do usuário ou o nome, se disponível
  const displayName = user ? user.email || user.nome || "Usuário" : "Usuário";

  const handleLogout = (e) => {
    e.preventDefault();
    console.log("Fazendo logout...");
    if (onLogout) {
      onLogout();
    }
  };

  return (
    <header className="header">
      <div className="header-left">
        <button className="menu-btn" onClick={toggleSidebar}>
          <FontAwesomeIcon icon={faBars} />
        </button>
        <img src={logoCompleta} alt="Logo" className="header-logo" />
      </div>
      <div className="header-right">
        {user ? (
          <div className="user-menu">
            <span className="user-name">{displayName}</span>
            <button className="logout-btn" onClick={handleLogout} title="Sair">
              <FontAwesomeIcon icon={faSignOutAlt} /> <span>Sair</span>
            </button>
          </div>
        ) : (
          <span className="loading-user">Carregando...</span>
        )}
      </div>
    </header>
  );
};

export default Header;

import React from "react";
import "../styles/Header.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faSignOutAlt,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import logoCompleta from "../assets/logo_completa.png";

function Header({ toggleSidebar, user, onLogout }) {
  return (
    <header className="app-header">
      <div className="header-left">
        <button className="menu-toggle" onClick={toggleSidebar}>
          <FontAwesomeIcon icon={faBars} />
        </button>
        <h1>
          <img src={logoCompleta} alt="Iron House" className="header-logo" />
        </h1>
      </div>
      <div className="header-right">
        {user && (
          <div className="user-info">
            <div className="user-avatar">
              <FontAwesomeIcon icon={faUser} />
            </div>
            <span className="user-name">{user.nome}</span>
            <button className="logout-button" onClick={onLogout} title="Sair">
              <FontAwesomeIcon icon={faSignOutAlt} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;

import React from "react";
import "../styles/Sidebar.css";
import logoCompleta from "../assets/logo_completa.png";
import logoIcone from "../assets/logo_icone.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHome,
  faUsers,
  faCalendarAlt,
  faDumbbell,
  faUser,
  faChevronLeft,
  faChevronRight,
  faCog,
  faClipboardList,
  faFileInvoiceDollar,
  faChartLine,
  faUserPlus,
  faChartPie,
} from "@fortawesome/free-solid-svg-icons";

function Sidebar({
  activeSection,
  setActiveSection,
  collapsed,
  toggleSidebar,
  userRole,
}) {
  // Função para determinar a classe da seção ativa
  const getClassName = (section) => {
    return `sidebar-item ${activeSection === section ? "active" : ""}`;
  };

  return (
    <div className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="sidebar-header">
        <img
          src={collapsed ? logoIcone : logoCompleta}
          alt="Logo Iron House"
          className={`logo ${collapsed ? "icon" : "complete"}`}
        />
        <button className="collapse-button" onClick={toggleSidebar}>
          <FontAwesomeIcon
            icon={collapsed ? faChevronRight : faChevronLeft}
            className="collapse-icon"
          />
        </button>
      </div>

      <div className="sidebar-menu">
        {/* Menu específico para professores */}
        {userRole === "professor" && (
          <>
            <div
              className={getClassName("alunos_em_aula")}
              onClick={() => setActiveSection("alunos_em_aula")}
            >
              <FontAwesomeIcon icon={faDumbbell} className="sidebar-icon" />
              {!collapsed && <span>Alunos em Aula</span>}
            </div>
          </>
        )}

        {/* Menu específico para administradores */}
        {userRole === "admin" && (
          <>
            <div
              className={getClassName("geral")}
              onClick={() => setActiveSection("geral")}
            >
              <FontAwesomeIcon icon={faChartPie} className="sidebar-icon" />
              {!collapsed && <span>Geral</span>}
            </div>
            <div
              className={getClassName("cadastros")}
              onClick={() => setActiveSection("cadastros")}
            >
              <FontAwesomeIcon icon={faUserPlus} className="sidebar-icon" />
              {!collapsed && <span>Cadastros</span>}
            </div>
            <div
              className={getClassName("alunos")}
              onClick={() => setActiveSection("alunos")}
            >
              <FontAwesomeIcon icon={faUsers} className="sidebar-icon" />
              {!collapsed && <span>Alunos</span>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Sidebar;

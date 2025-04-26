import React, { useEffect } from "react";
import "../styles/Sidebar.css";
import logoCompleta from "../assets/logo_completa.png";
import logoIcone from "../assets/logo_icone.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUsers,
  faDumbbell,
  faUser,
  faChevronLeft,
  faChevronRight,
  faUserPlus,
  faChartPie,
  faSignOutAlt,
  faHistory,
  faChalkboard, // Ícone para a Sala
} from "@fortawesome/free-solid-svg-icons";

function Sidebar({
  activeSection,
  setActiveSection,
  collapsed,
  toggleSidebar,
  userRole,
  currentUser,
  onLogout,
}) {
  // Função para determinar a classe da seção ativa
  const getClassName = (section) => {
    return `sidebar-item ${activeSection === section ? "active" : ""}`;
  };

  // Controle do overlay e scroll do body em mobile
  useEffect(() => {
    const handleOverlay = () => {
      if (window.innerWidth <= 768 && !collapsed) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
      }
    };

    handleOverlay();
    window.addEventListener("resize", handleOverlay);

    return () => {
      window.removeEventListener("resize", handleOverlay);
      document.body.style.overflow = "";
    };
  }, [collapsed]);

  // Função para fechar o sidebar e mudar de seção
  const handleSectionChange = (section) => {
    setActiveSection(section);
    if (window.innerWidth <= 768) {
      toggleSidebar();
    }
  };

  // Função para lidar com o clique no botão de logout
  const handleLogout = (e) => {
    e.preventDefault();
    console.log("Logout solicitado pelo Sidebar");
    if (onLogout) {
      onLogout();
    }
  };

  // Determinar o nome de exibição do usuário
  const displayName = currentUser
    ? currentUser.email || currentUser.nome || "Usuário"
    : "Usuário";

  return (
    <>
      {/* Overlay para dispositivos móveis */}
      {!collapsed && window.innerWidth <= 768 && (
        <div
          className={`sidebar-overlay ${!collapsed ? "active" : ""}`}
          onClick={toggleSidebar}
        />
      )}

      <div className={`sidebar ${collapsed ? "collapsed" : ""}`}>
        <div className="sidebar-header">
          <div className="logo-container">
            <img
              src={collapsed ? logoIcone : logoCompleta}
              alt="Logo Iron House"
              className={`logo ${collapsed ? "icon" : "complete"}`}
            />
          </div>
          <button className="collapse-button" onClick={toggleSidebar}>
            <FontAwesomeIcon
              icon={collapsed ? faChevronRight : faChevronLeft}
              className="collapse-icon"
            />
          </button>
        </div>

        {currentUser && (
          <div className="user-info">
            {!collapsed && (
              <>
                <span className="user-name">{displayName}</span>
                <span className="user-role">
                  {userRole === "admin" ? "Administrador" : "Professor"}
                </span>
              </>
            )}
          </div>
        )}

        <div className="sidebar-menu">
          {/* Sala como primeira opção no menu para todos os usuários */}
          <div
            className={getClassName("sala")}
            onClick={() => handleSectionChange("sala")}
          >
            <FontAwesomeIcon icon={faChalkboard} className="sidebar-icon" />
            {!collapsed && <span>Sala</span>}
          </div>

          {/* Dashboard comentado - temporariamente removido */}
          {/* <div
            className={getClassName("geral")}
            onClick={() => handleSectionChange("geral")}
          >
            <FontAwesomeIcon icon={faChartPie} className="sidebar-icon" />
            {!collapsed && <span>Dashboard</span>}
          </div> */}

          {/* Acesso limitado para professores */}
          {userRole === "professor" && (
            <>
              <div
                className={getClassName("alunos_historico")}
                onClick={() => handleSectionChange("alunos_historico")}
              >
                <FontAwesomeIcon icon={faHistory} className="sidebar-icon" />
                {!collapsed && <span>Histórico de Alunos</span>}
              </div>
              <div
                className={getClassName("cadastro_exercicios")}
                onClick={() => handleSectionChange("cadastro_exercicios")}
              >
                <FontAwesomeIcon icon={faDumbbell} className="sidebar-icon" />
                {!collapsed && <span>Cadastro de Exercícios</span>}
              </div>
            </>
          )}

          {/* Acesso completo para administradores */}
          {userRole === "admin" && (
            <>
              <div
                className={getClassName("cadastros")}
                onClick={() => handleSectionChange("cadastros")}
              >
                <FontAwesomeIcon icon={faUserPlus} className="sidebar-icon" />
                {!collapsed && <span>Cadastros</span>}
              </div>
              <div
                className={getClassName("alunos")}
                onClick={() => handleSectionChange("alunos")}
              >
                <FontAwesomeIcon icon={faUsers} className="sidebar-icon" />
                {!collapsed && <span>Alunos</span>}
              </div>
              <div
                className={getClassName("professores")}
                onClick={() => handleSectionChange("professores")}
              >
                <FontAwesomeIcon icon={faUser} className="sidebar-icon" />
                {!collapsed && <span>Professores</span>}
              </div>
            </>
          )}
        </div>

        {/* Botão de logout */}
        <div className="sidebar-footer">
          <div className="sidebar-item logout" onClick={handleLogout}>
            <FontAwesomeIcon icon={faSignOutAlt} className="sidebar-icon" />
            {!collapsed && <span>Sair</span>}
          </div>
        </div>
      </div>
    </>
  );
}

export default Sidebar;

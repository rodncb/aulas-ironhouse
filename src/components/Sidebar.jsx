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

const FORM_STORAGE_KEY = "cadastro_aluno_form_data";
const FORM_STATE_KEY = "cadastro_aluno_form_state";

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

  // Verificar se há formulários em andamento no localStorage ao carregar o componente
  useEffect(() => {
    // Verificar se há formulários salvos e restaurar a navegação
    try {
      const savedAlunoCadastro = localStorage.getItem(FORM_STORAGE_KEY);

      // Se existir um formulário salvo e o usuário não está na página de cadastro
      if (savedAlunoCadastro && activeSection !== "cadastros") {
        // Perguntar ao usuário se deseja continuar o cadastro - usando window.confirm para evitar ESLint error
        if (
          window.confirm(
            "Você tem um cadastro de aluno em andamento. Deseja continuar?"
          )
        ) {
          // Redirecionar para a seção de cadastros
          setActiveSection("cadastros");
        }
      }
    } catch (error) {
      console.warn("Erro ao verificar formulários salvos:", error);
    }

    // Adicionar listener para eventos de visibilidade para manter seção atual
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const lastSection = localStorage.getItem("lastActiveSection");
        const savedForm = localStorage.getItem(FORM_STORAGE_KEY);

        // Se temos um formulário salvo e a última seção era cadastros
        if (
          savedForm &&
          lastSection === "cadastros" &&
          activeSection !== "cadastros"
        ) {
          if (
            window.confirm(
              "Você estava cadastrando um aluno. Deseja continuar?"
            )
          ) {
            setActiveSection("cadastros");
          }
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [setActiveSection, activeSection]);

  // Função para fechar o sidebar e mudar de seção
  const handleSectionChange = (section) => {
    // Se estamos na seção "cadastros" e queremos mudar para outra
    if (activeSection === "cadastros" && section !== "cadastros") {
      try {
        const savedForm = localStorage.getItem(FORM_STORAGE_KEY);
        const formState = localStorage.getItem(FORM_STATE_KEY);

        // Se existe um formulário salvo e estamos em cadastros
        if (savedForm && formState === "open") {
          // Perguntar se realmente quer sair
          if (
            !window.confirm(
              "Você está no meio de um cadastro. Se sair agora, o formulário será salvo para continuar depois. Deseja sair?"
            )
          ) {
            return; // Não muda de seção
          }
          // Se confirmou que quer sair, atualiza o estado para "saved" em vez de "open"
          localStorage.setItem(FORM_STATE_KEY, "saved");
        }
      } catch (error) {
        console.warn("Erro ao verificar formulário ao mudar de seção:", error);
      }
    }

    // Salvar a seção atual no localStorage
    try {
      localStorage.setItem("lastActiveSection", section);
    } catch (error) {
      console.warn("Erro ao salvar seção atual:", error);
    }

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

          {/* Opções comuns para professores e administradores */}
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

          {/* Módulo de Professores - apenas para administradores */}
          {userRole === "admin" && (
            <div
              className={getClassName("professores")}
              onClick={() => handleSectionChange("professores")}
            >
              <FontAwesomeIcon icon={faUser} className="sidebar-icon" />
              {!collapsed && <span>Professores</span>}
            </div>
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

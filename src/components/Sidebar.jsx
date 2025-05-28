import React, { useEffect } from "react";
import "../styles/Sidebar.css";
import { Link, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUsers,
  faUser,
  faChevronLeft,
  faChevronRight,
  faSignOutAlt,
  faChalkboard, // Ícone para a Sala
} from "@fortawesome/free-solid-svg-icons";

const FORM_STORAGE_KEY = "cadastro_aluno_form_data";
const FORM_STATE_KEY = "cadastro_aluno_form_state";

function Sidebar({ navigate, collapsed, toggleSidebar, userRole, onLogout }) {
  const location = useLocation();
  const currentPath = location.pathname;

  // Função para determinar a classe da seção ativa
  const getClassName = (path) => {
    return `sidebar-item ${currentPath === path ? "active" : ""}`;
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
      if (savedAlunoCadastro && !currentPath.includes("/cadastros")) {
        // Perguntar ao usuário se deseja continuar o cadastro - usando window.confirm para evitar ESLint error
        if (
          window.confirm(
            "Você tem um cadastro de aluno em andamento. Deseja continuar?"
          )
        ) {
          // Redirecionar para a seção de cadastros
          navigate("/cadastros");
        }
      }
    } catch (error) {
      console.warn("Erro ao verificar formulários salvos:", error);
    }

    // Adicionar listener para eventos de visibilidade para manter seção atual
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const lastPath = localStorage.getItem("lastActivePath");
        const savedForm = localStorage.getItem(FORM_STORAGE_KEY);

        // Se temos um formulário salvo e a última seção era cadastros
        if (
          savedForm &&
          lastPath === "/cadastros" &&
          currentPath !== "/cadastros"
        ) {
          if (
            window.confirm(
              "Você estava cadastrando um aluno. Deseja continuar?"
            )
          ) {
            navigate("/cadastros");
          }
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [navigate, currentPath]);

  // Função para fechar o sidebar e mudar de seção
  const handleNavigation = (path) => {
    // Se estamos na seção "cadastros" e queremos mudar para outra
    if (currentPath === "/cadastros" && path !== "/cadastros") {
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
      localStorage.setItem("lastActivePath", path);
    } catch (error) {
      console.warn("Erro ao salvar caminho atual:", error);
    }

    // Fechar o sidebar antes de navegar (em qualquer tamanho de tela)
    if (!collapsed) {
      toggleSidebar();
    }

    // Depois de esconder o sidebar, navegue para a rota
    setTimeout(() => {
      navigate(path);
    }, 50); // Pequeno timeout para garantir que a UI reaja corretamente
  };

  // Função para lidar com o clique no botão de logout
  const handleLogout = (e) => {
    e.preventDefault();

    // Fechar o sidebar no mobile antes de fazer logout
    if (window.innerWidth <= 768 && !collapsed) {
      toggleSidebar();
    }

    // Chamar a função de logout
    if (onLogout) {
      onLogout();
    }
  };

  return (
    <>
      {/* Overlay para dispositivos móveis */}
      {!collapsed && (
        <div
          className={`sidebar-overlay ${!collapsed ? "active" : ""}`}
          onClick={toggleSidebar}
        />
      )}

      <div className={`sidebar ${collapsed ? "collapsed" : ""}`}>
        <div className="sidebar-header">
          {/* Removendo o logo do sidebar pois já existe no header */}
          <button className="collapse-button" onClick={toggleSidebar}>
            <FontAwesomeIcon
              icon={collapsed ? faChevronRight : faChevronLeft}
              className="collapse-icon"
            />
          </button>
        </div>

        <div className="sidebar-menu">
          {/* Sala como primeira opção no menu para todos os usuários */}
          <div
            className={getClassName("/sala")}
            onClick={() => handleNavigation("/sala")}
          >
            <FontAwesomeIcon icon={faChalkboard} className="sidebar-icon" />
            {!collapsed && <span>Sala</span>}
          </div>

          {/* Alunos */}
          <div
            className={getClassName("/alunos")}
            onClick={() => handleNavigation("/alunos")}
          >
            <FontAwesomeIcon icon={faUsers} className="sidebar-icon" />
            {!collapsed && <span>Alunos</span>}
          </div>

          {/* Módulo de Professores */}
          <div
            className={getClassName("/professores")}
            onClick={() => handleNavigation("/professores")}
          >
            <FontAwesomeIcon icon={faUser} className="sidebar-icon" />
            {!collapsed && <span>Professores</span>}
          </div>
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

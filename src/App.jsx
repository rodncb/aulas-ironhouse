import React, { useState, useEffect } from "react";
import "./App.css";
import "./styles/Apple.css";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import AlunosEmAula from "./components/AlunosEmAula";
import Cadastros from "./components/Cadastros";
import GerenciamentoAlunos from "./components/GerenciamentoAlunos";
import GerenciamentoProfessores from "./components/GerenciamentoProfessores";
import Geral from "./components/Geral";
import Login from "./components/Login";

const App = () => {
  // Estado de autenticação
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null); // 'professor' ou 'admin'

  const [activeSection, setActiveSection] = useState("geral"); // Definindo 'geral' como padrão
  // Estado para armazenar os alunos em aula, compartilhado entre os componentes
  const [alunosEmAulaApp, setAlunosEmAulaApp] = useState([]);
  // Estado para controlar se o sidebar está colapsado
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Verificar se há um usuário no localStorage ao carregar
  useEffect(() => {
    const savedUser = localStorage.getItem("currentUser");
    const savedRole = localStorage.getItem("userRole");

    if (savedUser && savedRole) {
      setCurrentUser(JSON.parse(savedUser));
      setUserRole(savedRole);
      setIsAuthenticated(true);
      // Sempre definir geral como seção inicial após login/recarregamento
      setActiveSection("geral");
    }
  }, []);

  // Escuta eventos de redimensionamento da janela
  useEffect(() => {
    const handleResize = () => {
      // Auto-recolhe o sidebar em dispositivos móveis
      if (window.innerWidth <= 768 && !sidebarCollapsed) {
        setSidebarCollapsed(true);
      }
    };

    window.addEventListener("resize", handleResize);

    // Limpa o listener ao desmontar o componente
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [sidebarCollapsed]);

  // Adicionar um novo useEffect para gerenciar o comportamento responsivo
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setSidebarCollapsed(true);
      }
    };

    // Executar no mount
    handleResize();

    // Adicionar listener para redimensionamento
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Adicionando um listener para eventos de navegação
  useEffect(() => {
    // Event listener para navegação
    const handleNavegacao = (event) => {
      setActiveSection(event.detail.secao);
    };

    window.addEventListener("navegarPara", handleNavegacao);

    return () => {
      window.removeEventListener("navegarPara", handleNavegacao);
    };
  }, []);

  // Função para lidar com o login
  const handleLogin = (role, user) => {
    setIsAuthenticated(true);
    setCurrentUser(user);
    setUserRole(role);

    // Salvar no localStorage para persistir entre recarregamentos
    localStorage.setItem("currentUser", JSON.stringify(user));
    localStorage.setItem("userRole", role);

    // Sempre definir geral como seção inicial após login
    setActiveSection("geral");
  };

  // Função para lidar com o logout
  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setUserRole(null);
    localStorage.removeItem("currentUser");
    localStorage.removeItem("userRole");
  };

  // Função para atualizar os alunos em aula
  const atualizarAlunosEmAula = (alunos) => {
    setAlunosEmAulaApp(alunos);
  };

  // Função para controlar o estado do sidebar
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);

    // Controle do scroll do body no mobile
    if (window.innerWidth <= 768) {
      if (!sidebarCollapsed) {
        document.body.style.overflow = "";
      } else {
        document.body.style.overflow = "hidden";
      }
    }
  };

  // Função para tratar mudança de seção
  const handleSectionChange = (section) => {
    setActiveSection(section);
    // Em dispositivos móveis, fechar o sidebar após selecionar uma seção
    if (window.innerWidth <= 768) {
      setSidebarCollapsed(true);
      document.body.style.overflow = "";
    }
  };

  // Renderiza o componente apropriado com base na seção ativa
  const renderContent = () => {
    switch (activeSection) {
      case "geral":
        return (
          <Geral
            alunosEmAula={alunosEmAulaApp}
            atualizarAlunosEmAula={atualizarAlunosEmAula}
          />
        );
      case "cadastros":
        return <Cadastros />;
      case "alunos":
        return <GerenciamentoAlunos setActiveSection={setActiveSection} />;
      case "professores":
        return <GerenciamentoProfessores />;
      case "alunos_em_aula":
        return <AlunosEmAula atualizarAlunosEmAula={atualizarAlunosEmAula} />;
      default:
        return (
          <Geral
            alunosEmAula={alunosEmAulaApp}
            atualizarAlunosEmAula={atualizarAlunosEmAula}
          />
        );
    }
  };

  // Se não estiver autenticado, mostra a tela de login
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="app-container">
      <Header
        toggleSidebar={toggleSidebar}
        user={currentUser}
        onLogout={handleLogout}
      />
      <Sidebar
        activeSection={activeSection}
        setActiveSection={handleSectionChange}
        collapsed={sidebarCollapsed}
        toggleSidebar={toggleSidebar}
        userRole={userRole}
        currentUser={currentUser}
        onLogout={handleLogout}
      />
      <main className={`main-content ${sidebarCollapsed ? "expanded" : ""}`}>
        <div className="content-wrapper">{renderContent()}</div>
      </main>
    </div>
  );
};

export default App;

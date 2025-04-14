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
import HistoricoAlunos from "./components/HistoricoAlunos";
import CadastroExercicio from "./components/CadastroExercicio";
import Configuracoes from "./components/Configuracoes";
import { useAuth } from "./hooks/useAuth";

const App = () => {
  // Usando o hook de autenticação
  const { user, loading, signIn, signOut, canAccess } = useAuth();

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
    if (user) {
      setCurrentUser(user);
      setUserRole(user.role);
      setIsAuthenticated(true);
      setActiveSection("geral");
    } else if (!loading) {
      setIsAuthenticated(false);
      setCurrentUser(null);
      setUserRole(null);
    }
  }, [user, loading]);

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
  const handleLogin = async (email, password) => {
    const { error } = await signIn(email, password);

    if (error) {
      return { success: false, message: error.message };
    }

    return { success: true };
  };

  // Função para lidar com o logout
  const handleLogout = () => {
    signOut();
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
    // Verificar se o usuário tem acesso a esta seção
    if (!canUserAccessSection(section)) {
      // Redirecionar para a página permitida padrão
      setActiveSection("geral");
      return;
    }

    setActiveSection(section);
    // Em dispositivos móveis, fechar o sidebar após selecionar uma seção
    if (window.innerWidth <= 768) {
      setSidebarCollapsed(true);
      document.body.style.overflow = "";
    }
  };

  // Função para verificar se o usuário pode acessar uma seção
  const canUserAccessSection = (section) => {
    // Administradores podem acessar todas as seções
    if (userRole === "admin") return true;

    // Seções permitidas para professores
    if (userRole === "professor") {
      const allowedSections = [
        "geral",
        "alunos_historico",
        "cadastro_exercicios",
      ];
      return allowedSections.includes(section);
    }

    return false;
  };

  // Renderiza o componente apropriado com base na seção ativa
  const renderContent = () => {
    // Verificar novamente se o usuário pode acessar esta seção
    if (!canUserAccessSection(activeSection)) {
      setActiveSection("geral");
      return (
        <Geral
          alunosEmAula={alunosEmAulaApp}
          atualizarAlunosEmAula={atualizarAlunosEmAula}
        />
      );
    }

    switch (activeSection) {
      case "geral":
        return (
          <Geral
            alunosEmAula={alunosEmAulaApp}
            atualizarAlunosEmAula={atualizarAlunosEmAula}
          />
        );
      case "cadastros":
        return <Cadastros userRole={userRole} />;
      case "alunos":
        return <GerenciamentoAlunos setActiveSection={setActiveSection} />;
      case "professores":
        return <GerenciamentoProfessores />;
      case "alunos_em_aula":
        return <AlunosEmAula atualizarAlunosEmAula={atualizarAlunosEmAula} />;
      case "alunos_historico":
        return <HistoricoAlunos />;
      case "cadastro_exercicios":
        return <CadastroExercicio />;
      case "configuracoes":
        return <Configuracoes />;
      default:
        return (
          <Geral
            alunosEmAula={alunosEmAulaApp}
            atualizarAlunosEmAula={atualizarAlunosEmAula}
          />
        );
    }
  };

  // Aguardar o carregamento inicial da autenticação
  if (loading) {
    return <div className="loading">Carregando...</div>;
  }

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

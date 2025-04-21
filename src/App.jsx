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
import { reloadSupabaseSchemaCache } from "./services/supabase";
import DetalheAluno from "./components/DetalheAluno";
import EditarAluno from "./components/EditarAluno";

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

  // Removemos os estados relacionados ao botão de recarga de cache
  // const [mostrarBotaoRecarregarCache, setMostrarBotaoRecarregarCache] = useState(false);
  // const [recarregandoCache, setRecarregandoCache] = useState(false);
  // const [mensagemCache, setMensagemCache] = useState("");

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
    try {
      const result = await signIn(email, password);

      if (!result || !result.success) {
        console.error(
          "Erro durante login:",
          result?.message || "Falha na autenticação"
        );
        return {
          success: false,
          error:
            result?.message ||
            "Credenciais inválidas. Verifique seu email e senha.",
        };
      }

      // Login bem-sucedido
      return { success: true, data: result.data };
    } catch (error) {
      console.error("Exceção durante login:", error);
      return {
        success: false,
        error: "Erro ao processar login. Tente novamente mais tarde.",
      };
    }
  };

  // Função para lidar com o logout
  const handleLogout = async () => {
    try {
      // Limpar estados locais relacionados ao usuário e autenticação
      setCurrentUser(null);
      setIsAuthenticated(false);
      setUserRole(null);
      setActiveSection("geral");

      // Chamar o método de signOut do hook de autenticação
      await signOut();
    } catch (error) {
      // Forçar limpeza local mesmo com erro
      setIsAuthenticated(false);
      setCurrentUser(null);
      setUserRole(null);
    }
  };

  // Função para atualizar os alunos em aula
  const atualizarAlunosEmAula = (alunos) => {
    // Evitar atualizações desnecessárias comparando os IDs dos alunos
    if (alunos.length === alunosEmAulaApp.length) {
      const idsAtuais = new Set(alunosEmAulaApp.map((a) => a.id));
      const todosIguais = alunos.every((aluno) => idsAtuais.has(aluno.id));

      if (todosIguais) {
        return;
      }
    }

    // Se chegou aqui, é porque há diferença entre os arrays
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

  // Removemos a função handleReloadSchemaCache que não será mais utilizada
  /*
  const handleReloadSchemaCache = async () => {
    setRecarregandoCache(true);
    setMensagemCache("");

    try {
      const sucesso = await reloadSupabaseSchemaCache();

      if (sucesso) {
        setMensagemCache("Cache recarregado com sucesso!");
        setTimeout(() => {
          setMensagemCache("");
          setMostrarBotaoRecarregarCache(false);
        }, 3000);
      } else {
        setMensagemCache("Falha ao recarregar o cache. Tente novamente.");
      }
    } catch (error) {
      console.error("Erro no processo de recarga do cache:", error);
      setMensagemCache("Erro inesperado ao recarregar o cache.");
    } finally {
      setRecarregandoCache(false);
    }
  };
  */

  // Removemos o listener para erros de schema cache
  /*
  useEffect(() => {
    const handleSchemaCacheError = () => {
      setMostrarBotaoRecarregarCache(true);
      setMensagemCache("Erro de cache do esquema detectado");
    };

    window.addEventListener("schema-cache-error", handleSchemaCacheError);

    return () => {
      window.removeEventListener("schema-cache-error", handleSchemaCacheError);
    };
  }, []);
  */

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

    // Verificar se a seção ativa começa com "detalhe-aluno/" ou "editar-aluno/"
    if (activeSection.startsWith("detalhe-aluno/")) {
      const alunoId = activeSection.split("/")[1];
      return <DetalheAluno alunoId={alunoId} />;
    }

    if (activeSection.startsWith("editar-aluno/")) {
      const editAlunoId = activeSection.split("/")[1];
      return (
        <EditarAluno
          alunoId={editAlunoId}
          setActiveSection={setActiveSection}
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
        <div className="content-wrapper">
          {/* Removemos o botão de recarregar cache */}
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;

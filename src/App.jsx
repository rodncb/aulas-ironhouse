import React, { useState, useEffect, useCallback } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  useNavigate,
  Routes,
  Route,
  Navigate,
  useParams,
} from "react-router-dom";
import supabase from "./config/supabaseConfig";
import Login from "./components/Login";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
// Componentes
import Sala from "./components/Sala";
import Cadastros from "./components/Cadastros";
import Configuracoes from "./components/Configuracoes";
import HistoricoAlunos from "./components/HistoricoAlunos";
import GerenciamentoAlunos from "./components/GerenciamentoAlunos";
import GerenciamentoProfessores from "./components/GerenciamentoProfessores";
import DetalheCadastroAluno from "./components/DetalheCadastroAluno";
import EditarAluno from "./components/EditarAluno";
import { SalaProvider } from "./contexts/SalaContext";
import { CadastroAlunoProvider } from "./contexts/CadastroAlunoContext";
import startAutoEndScheduler from "./services/scheduler";
import "./App.css";

// Chaves do localStorage
const CADASTRO_FORM_STORAGE_KEY = "ironhouse_cadastroAlunoForm";
const AULA_ATUAL_STORAGE_KEY = "ironhouse_aulaAtual";

// Componente wrapper para DetalheCadastroAluno
const DetalheAlunoWrapper = ({ onNavigateBack }) => {
  const { id } = useParams();
  return <DetalheCadastroAluno alunoId={id} onNavigateBack={onNavigateBack} />;
};

// Componente wrapper para EditarAluno
const EditarAlunoWrapper = ({ navigate }) => {
  const { id } = useParams();
  return <EditarAluno alunoId={id} navigate={navigate} />;
};

const App = () => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true); // Sempre inicia como true (colapsado/escondido)
  const [alunosEmAula, setAlunosEmAula] = useState([]);
  const navigate = useNavigate();

  // Efeito principal para autenticação e verificação de sessão
  useEffect(() => {
    console.log("[App.jsx] useEffect principal MONTADO/EXECUTADO");
    let isMounted = true;

    // Função para inicializar a aplicação (simplificada)
    const initializeApp = async () => {
      console.log("[App.jsx] Iniciando initializeApp SIMPLIFICADA...");

      try {
        // 1. Obter sessão atual
        const { data: sessionData, error: sessionError } =
          await supabase.auth.getSession();

        if (sessionError) {
          console.error("[App.jsx] Erro ao obter sessão:", sessionError);
          if (isMounted) {
            setUser(null);
            setUserRole(null);
            navigate("/login");
            setLoading(false);
          }
          return;
        }

        const currentUser = sessionData?.session?.user;

        // 2. Se não tem usuário logado, mostrar login
        if (!currentUser) {
          console.log("[App.jsx] Nenhum usuário logado.");
          if (isMounted) {
            setUser(null);
            setUserRole(null);
            navigate("/login");
            setLoading(false);
          }
          return;
        }

        // 3. Usuário logado, definir usuário e buscar role
        if (isMounted) {
          setUser(currentUser);
          console.log("[App.jsx] Usuário logado encontrado:", currentUser.id);
        }

        // 4. Buscar role do usuário
        let userRoleValue = null;
        try {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", currentUser.id)
            .single();

          if (profile) {
            userRoleValue = profile.role;
            console.log("[App.jsx] Role definida:", userRoleValue);
          }
        } catch (error) {
          console.error("[App.jsx] Erro ao buscar role:", error);
        }

        // 5. IMPORTANTE: Atualizar estados MESMO QUE HAJA ERROS nas etapas anteriores
        if (isMounted) {
          setUserRole(userRoleValue);
          setLoading(false);
          console.log("[App.jsx] Inicialização concluída. Loading = false");
        }
      } catch (error) {
        console.error("[App.jsx] Erro GERAL em initializeApp:", error);
        // Mesmo com erro, definir tela de login e sair do loading
        if (isMounted) {
          setUser(null);
          setUserRole(null);
          navigate("/login");
          setLoading(false);
          console.log("[App.jsx] Erro na inicialização. Loading = false");
        }
      }
    };

    // Chamar inicialização
    initializeApp();

    // Configurar listener de autenticação simplificado
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        console.log("[App.jsx] onAuthStateChange:", _event);

        if (!isMounted) return;

        const currentUser = session?.user;
        setUser(currentUser);

        if (!currentUser) {
          // Se não tem usuário (logout), ir para login
          setUserRole(null);
          navigate("/login");
          setLoading(false);
        } else if (_event === "SIGNED_IN") {
          // Se acabou de logar, buscar role
          supabase
            .from("profiles")
            .select("role")
            .eq("id", currentUser.id)
            .single()
            .then(({ data }) => {
              if (isMounted) {
                const role = data?.role || null;
                setUserRole(role);
                setLoading(false);
              }
            })
            .catch((error) => {
              console.error("[App.jsx] Erro ao buscar role após login:", error);
              if (isMounted) {
                setUserRole(null);
                setLoading(false);
              }
            });
        }
      }
    );

    // Definir um fallback para garantir que loading sempre termine
    const timeoutId = setTimeout(() => {
      if (isMounted && loading) {
        console.log(
          "[App.jsx] FALLBACK: Forçando loading = false após timeout"
        );
        setLoading(false);
      }
    }, 5000); // 5 segundos

    // Cleanup
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      console.log("[App.jsx] Executando cleanup do useEffect principal.");
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
        console.log("[App.jsx] Listener de autenticação removido.");
      }
    };
  }, []); // Sem dependências para evitar re-execuções

  // Efeito para o Scheduler (separado)
  useEffect(() => {
    let isMounted = true;
    let stopScheduler = null;

    console.log("[App.jsx] Efeito do Scheduler montado/executado.");

    // Iniciar apenas se não estivermos no estado de loading inicial
    // e se o componente ainda estiver montado
    if (!loading && isMounted) {
      console.log(
        "[App.jsx] Iniciando agendamento de finalização automática..."
      );
      stopScheduler = startAutoEndScheduler();
    } else {
      console.log(
        `[App.jsx] Scheduler não iniciado (loading: ${loading}, isMounted: ${isMounted}).`
      );
    }

    return () => {
      isMounted = false;
      console.log("[App.jsx] Executando cleanup do useEffect do Scheduler.");
      if (stopScheduler) {
        console.log(
          "[App.jsx] Parando agendamento de finalização automática..."
        );
        stopScheduler();
      }
    };
  }, [loading]); // Depende apenas do estado de loading

  // Adicionar um efeito para lidar com eventos de navegação customizada
  useEffect(() => {
    const handleNavigation = (event) => {
      const { secao } = event.detail;
      console.log(`[App.jsx] Evento navegarPara recebido: ${secao}`);

      if (secao.startsWith("detalhe-aluno/")) {
        const id = secao.split("/")[1];
        navigate(`/detalhe-aluno/${id}`);
      } else if (secao.startsWith("editar-aluno/")) {
        const id = secao.split("/")[1];
        navigate(`/editar-aluno/${id}`);
      } else {
        navigate(`/${secao}`);
      }
    };

    window.addEventListener("navegarPara", handleNavigation);

    return () => {
      window.removeEventListener("navegarPara", handleNavigation);
      console.log("[App.jsx] Listener de navegação removido.");
    };
  }, [navigate]);

  // Função para verificar se o usuário pode acessar uma seção
  const canUserAccessSection = useCallback(
    (section) => {
      // Seção sala é acessível por padrão para usuários logados
      if (section === "sala" || section === "cadastros") return true;

      // Verificações adicionais baseadas em role
      if (!userRole) return false; // Para outras seções, precisa de role
      if (userRole === "admin") return true; // Admin acessa tudo
      if (userRole === "professor") {
        // Professor não acessa configuracoes
        return section !== "configuracoes";
      }
      return false; // Por padrão, nega acesso
    },
    [userRole]
  );

  // Função para lidar com o login
  const handleLogin = async (email, password) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      toast.success("Login realizado com sucesso!");
      navigate("/sala"); // Ir para sala após login bem-sucedido
    } catch (error) {
      console.error("Erro no login:", error);
      toast.error(`Falha no login: ${error.message}`);
    }
  };

  // Função para lidar com o logout
  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      // Limpeza de estados gerenciada pelo onAuthStateChange/useEffect
      toast.info("Você foi desconectado.");
    } catch (error) {
      console.error("Erro no logout:", error);
      toast.error(`Falha ao sair: ${error.message}`);
    }
  };

  // Função para atualizar os alunos em aula (passada para Sala)
  const atualizarAlunosEmAula = useCallback((alunos) => {
    setAlunosEmAula(alunos);
  }, []);

  // Função para controlar o estado do sidebar
  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const newState = !prev;
      // Controlar o scroll do body quando o sidebar está aberto em mobile
      if (window.innerWidth <= 768) {
        if (newState) {
          // Fechando o sidebar
          document.body.style.overflow = "";
        } else {
          // Abrindo o sidebar
          document.body.style.overflow = "hidden";
        }
      }
      return newState;
    });
  }, []);

  // Função para mudar a rota com verificações
  const handleNavigate = useCallback(
    (path) => {
      console.log(`[App.jsx] handleNavigate chamado com: ${path}`);

      // Extrair a seção base da rota
      const section = path.split("/")[1] || path;

      // 1. Verificar se está tentando sair de 'cadastros' com dados pendentes
      if (
        window.location.pathname.includes("/cadastros") &&
        !path.includes("/cadastros")
      ) {
        try {
          const savedForm = localStorage.getItem(CADASTRO_FORM_STORAGE_KEY);
          if (savedForm && savedForm !== "{}") {
            if (
              !window.confirm(
                "Você tem dados não salvos no cadastro de aluno. Se sair agora, poderá continuar depois. Deseja realmente sair?"
              )
            ) {
              return; // Não muda de seção se o usuário cancelar
            }
          }
        } catch (error) {
          console.warn(
            "Erro ao verificar formulário salvo ao sair da seção:",
            error
          );
        }
      }

      // 2. Verificar permissão de acesso
      if (!canUserAccessSection(section)) {
        console.warn(
          `Usuário ${userRole} não tem permissão para acessar ${section}.`
        );
        toast.warn("Você não tem permissão para acessar esta área.");
        return; // Impede a navegação
      }

      // 3. Navegar para a rota
      navigate(path);

      // 4. Fechar sidebar em mobile
      if (window.innerWidth <= 768) {
        setSidebarCollapsed(true);
        document.body.style.overflow = "";
      }
    },
    [navigate, userRole, canUserAccessSection]
  );

  // Componente para verificar autenticação e redirecionar, se necessário
  const ProtectedRoute = ({ children, requiredSection = null }) => {
    if (loading) {
      return <div className="loading-indicator">Carregando...</div>;
    }

    if (!user) {
      return <Navigate to="/login" replace />;
    }

    if (requiredSection && !canUserAccessSection(requiredSection)) {
      toast.warn("Você não tem permissão para acessar esta área.");
      return <Navigate to="/sala" replace />;
    }

    return children;
  };

  return (
    <CadastroAlunoProvider>
      <div className="app-container">
        {user && !loading && (
          <>
            <Header
              user={user}
              onLogout={handleLogout}
              toggleSidebar={toggleSidebar}
              sidebarCollapsed={sidebarCollapsed}
            />
            <Sidebar
              userRole={userRole}
              navigate={handleNavigate}
              collapsed={sidebarCollapsed}
              toggleSidebar={toggleSidebar}
            />
          </>
        )}
        <main
          className={`main-content ${
            user && !loading && !sidebarCollapsed ? "" : "expanded"
          }`}
        >
          <div className="content-wrapper">
            <Routes>
              <Route
                path="/login"
                element={
                  loading ? (
                    <div className="loading-indicator">Carregando...</div>
                  ) : user ? (
                    <Navigate to="/sala" replace />
                  ) : (
                    <Login onLogin={handleLogin} />
                  )
                }
              />

              <Route
                path="/sala"
                element={
                  <ProtectedRoute>
                    <SalaProvider>
                      <Sala
                        userRole={userRole}
                        alunosEmAula={alunosEmAula}
                        atualizarAlunosEmAula={atualizarAlunosEmAula}
                      />
                    </SalaProvider>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/alunos"
                element={
                  <ProtectedRoute requiredSection="alunos">
                    <GerenciamentoAlunos navigate={handleNavigate} />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/cadastros"
                element={
                  <ProtectedRoute>
                    <Cadastros userRole={userRole} />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/configuracoes"
                element={
                  <ProtectedRoute requiredSection="configuracoes">
                    <Configuracoes />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/historico"
                element={
                  <ProtectedRoute requiredSection="historico">
                    <HistoricoAlunos />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/detalhe-aluno/:id"
                element={
                  <ProtectedRoute>
                    <DetalheAlunoWrapper onNavigateBack={handleNavigate} />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/editar-aluno/:id"
                element={
                  <ProtectedRoute requiredSection="alunos">
                    <EditarAlunoWrapper navigate={handleNavigate} />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/professores"
                element={
                  <ProtectedRoute>
                    <GerenciamentoProfessores navigate={handleNavigate} />
                  </ProtectedRoute>
                }
              />

              <Route path="/" element={<Navigate to="/sala" replace />} />

              <Route path="*" element={<Navigate to="/sala" replace />} />
            </Routes>
          </div>
        </main>
        <ToastContainer position="bottom-right" autoClose={3000} />
      </div>
    </CadastroAlunoProvider>
  );
};

export default App;

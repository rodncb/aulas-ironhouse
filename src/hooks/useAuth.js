import {
  useState,
  useEffect,
  useCallback,
  useRef,
  createContext,
  useContext,
} from "react";
import authService from "../services/auth.service";
import { supabase } from "../services/supabase";

// Create the context with a default value
const AuthContext = createContext(undefined);

// --- Helper Function (remains the same) ---
const fetchUserProfile = async (userId) => {
  if (!userId) return { role: null };

  try {
    // 1. Tenta obter a role dos metadados do usuário
    const { data: userData } = await supabase.auth.getUser();
    const roleFromMetadata = userData?.user?.user_metadata?.role;

    if (roleFromMetadata) {
      console.log("Role encontrada nos metadados:", roleFromMetadata);
      return { role: roleFromMetadata };
    }

    // 2. Se não encontrou nos metadados, busca na tabela profiles
    console.log(
      "Role não encontrada nos metadados, buscando na tabela profiles..."
    );
    const { data: profile, error } = await supabase
      .from("profiles") // Consulta a tabela 'profiles'
      .select("role")
      .eq("id", userId) // Filtra pelo ID do usuário
      .single();

    if (error) {
      console.error("Erro ao buscar perfil na tabela profiles:", error.message);
      return { role: null }; // Retorna null se houve erro na busca
    }

    if (profile?.role) {
      console.log("Role encontrada na tabela profiles:", profile.role);
      return { role: profile.role };
    }

    // Se não encontrou em nenhum lugar
    console.warn(
      "Role não encontrada nem nos metadados nem na tabela profiles para o usuário:",
      userId
    );
    return { role: null };
  } catch (fetchError) {
    console.error(
      "Exceção ao buscar perfil (metadados ou profiles):",
      fetchError
    );
    return { role: null };
  }
};

// --- AuthProvider Component ---
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionChecked, setSessionChecked] = useState(false);
  const authListenerRef = useRef(null);
  const isUpdatingRef = useRef(false);

  // Função para atualizar o estado do usuário
  // Removido useCallback para evitar dependências cíclicas
  const updateUserState = async (session) => {
    if (isUpdatingRef.current) {
      console.log("AuthProvider: Atualização em andamento, ignorando...");
      return;
    }

    try {
      isUpdatingRef.current = true;

      if (!session?.user) {
        setUser(null);
        setLoading(false);
        setSessionChecked(true);
        return;
      }

      // Busca informações adicionais do perfil
      const userId = session.user.id;
      const { role } = await fetchUserProfile(userId);
      let finalRole = session.user.user_metadata?.role || role || "professor";

      if (finalRole !== "admin" && finalRole !== "professor") {
        finalRole = "professor";
      }

      const userData = {
        id: userId,
        email: session.user.email,
        nome: session.user.user_metadata?.nome || "Usuário",
        role: finalRole,
      };

      // Atualiza o estado
      setUser(userData);
    } catch (error) {
      console.error("AuthProvider: Erro ao atualizar usuário:", error);
      setUser(null);
    } finally {
      setLoading(false);
      setSessionChecked(true);
      isUpdatingRef.current = false;
    }
  };

  // Efeito para verificar a sessão e configurar o listener
  // Executado apenas uma vez na montagem inicial
  useEffect(() => {
    let isMounted = true;
    console.log("AuthProvider: useEffect inicial executando");

    // Verificação de sessão inicial
    const checkSession = async () => {
      console.log("AuthProvider: Verificando sessão existente...");

      try {
        const { data, error } = await supabase.auth.getSession();

        if (!isMounted) return;

        if (error) {
          console.error("AuthProvider: Erro ao buscar sessão:", error);
          setUser(null);
          setLoading(false);
          setSessionChecked(true);
          return;
        }

        if (data?.session) {
          console.log("AuthProvider: Sessão encontrada");
          await updateUserState(data.session);
        } else {
          console.log("AuthProvider: Nenhuma sessão encontrada.");
          setUser(null);
          setLoading(false);
          setSessionChecked(true);
        }
      } catch (err) {
        console.error("AuthProvider: Erro ao verificar sessão:", err);
        setUser(null);
        setLoading(false);
        setSessionChecked(true);
      }
    };

    // Configura o listener para eventos de autenticação
    const setupAuthListener = () => {
      if (authListenerRef.current) {
        console.log("AuthProvider: Listener já existe, pulando configuração");
        return;
      }

      console.log("AuthProvider: Configurando listener onAuthStateChange.");

      const { data: authListener } = supabase.auth.onAuthStateChange(
        (event, session) => {
          console.log("AuthProvider: Evento auth:", event);

          if (!isMounted) return;

          if (event === "SIGNED_IN" && session) {
            updateUserState(session);
          } else if (event === "SIGNED_OUT") {
            setUser(null);
            setLoading(false);
            setSessionChecked(true);
          } else if (event === "USER_UPDATED" && session) {
            updateUserState(session);
          }
        }
      );

      authListenerRef.current = authListener;
    };

    // Executa verificação inicial e configura o listener
    checkSession();
    setupAuthListener();

    // Limpeza ao desmontar
    return () => {
      isMounted = false;
      console.log("AuthProvider: Desinscrevendo listener onAuthStateChange.");

      if (authListenerRef.current?.subscription?.unsubscribe) {
        authListenerRef.current.subscription.unsubscribe();
        authListenerRef.current = null;
      }
    };
    // Não incluir dependências que podem causar loops
  }, []); // Executar apenas uma vez na montagem inicial

  // Função para fazer login
  const signIn = async (email, password, expectedUserType) => {
    setLoading(true);

    try {
      console.log(`AuthProvider: Tentando login para: ${email}`);
      const authResult = await authService.login(email, password);

      if (!authResult.success || !authResult.data?.user) {
        console.error("AuthProvider: Falha na autenticação:", authResult.error);
        setLoading(false);
        return {
          success: false,
          error: authResult.error || "Email ou senha incorretos.",
        };
      }

      // Verifica o tipo de usuário
      const userId = authResult.data.user.id;
      const userMetadata = authResult.data.user.user_metadata;
      let { role: roleFromProfile } = await fetchUserProfile(userId);
      let finalRole = userMetadata?.role || roleFromProfile || "professor";

      if (finalRole !== "admin" && finalRole !== "professor") {
        finalRole = "professor";
      }

      if (finalRole !== expectedUserType) {
        console.warn(
          `AuthProvider: Tipo de usuário incorreto. Esperado: ${expectedUserType}, Obtido: ${finalRole}`
        );
        await authService.logout();
        setLoading(false);
        return {
          success: false,
          error: `Este usuário não é um ${expectedUserType}. Selecione o tipo correto.`,
        };
      }

      // Login bem-sucedido
      const userData = {
        id: userId,
        email: authResult.data.user.email,
        nome: userMetadata?.nome || "Usuário",
        role: finalRole,
      };

      setUser(userData);
      setLoading(false);
      setSessionChecked(true);

      return { success: true, data: userData };
    } catch (error) {
      console.error("AuthProvider: Erro no login:", error);
      await authService.logout().catch(() => {});
      setLoading(false);

      return {
        success: false,
        error: error.message || "Erro inesperado durante o login.",
      };
    }
  };

  // Função para fazer logout
  const signOut = async () => {
    console.log("AuthProvider: Iniciando logout");

    // Limpa o estado primeiro para feedback imediato na UI
    setUser(null);
    setLoading(false);

    try {
      await authService.logout();
      console.log("AuthProvider: Logout concluído");
    } catch (error) {
      console.error("AuthProvider: Erro no logout:", error);
    }
  };

  // Funções auxiliares para verificar permissões
  const hasPermission = (requiredRole) => {
    if (!user) return false;
    if (user.role === "admin") return true;
    return user.role === requiredRole;
  };

  const canAccess = (route) => {
    if (!user) return false;
    if (user.role === "admin") return true;
    if (user.role === "professor") {
      const allowedRoutes = [
        "/geral",
        "/alunos/visualizar",
        "/cadastro/exercicios",
        "/alunos_historico",
        "/sala", // Adicionando sala explicitamente
      ];
      return allowedRoutes.some(
        (r) => route === r || route.startsWith(r + "/")
      );
    }
    return false;
  };

  // Valor do contexto
  const value = {
    user,
    loading,
    sessionChecked,
    signIn,
    signOut,
    hasPermission,
    canAccess,
    isAdmin: user?.role === "admin",
    isProfessor: user?.role === "professor",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook para usar o contexto de autenticação
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}

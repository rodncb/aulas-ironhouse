import { useState, useEffect, useCallback } from "react";
import authService from "../services/auth.service";
import supabase from "../services/supabase";

// Função auxiliar para buscar o perfil e a role
const fetchUserProfile = async (userId) => {
  if (!userId) return { role: null };

  try {
    // Primeiro, tenta obter a role dos metadados do usuário
    const { data: userData } = await supabase.auth.getUser();
    if (userData?.user?.user_metadata?.role) {
      return { role: userData.user.user_metadata.role };
    }

    // Se não encontrou nos metadados, busca na tabela profiles
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Erro ao buscar perfil:", error.message);
      return { role: null };
    }

    return { role: profile?.role };
  } catch (fetchError) {
    console.error("Exceção ao buscar perfil:", fetchError);
    return { role: null };
  }
};

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionChecked, setSessionChecked] = useState(false);

  // Função memoizada para atualizar o estado do usuário
  const updateUserState = useCallback(async (session) => {
    if (!session?.user) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      // Busca informações adicionais do perfil
      const { role } = await fetchUserProfile(session.user.id);
      
      // Prepara dados do usuário com fallbacks para valores indefinidos
      const userData = {
        id: session.user.id,
        email: session.user.email,
        nome: session.user.user_metadata?.nome || "Usuário",
        // Usa role dos metadados ou do perfil, com fallback para 'professor'
        role: session.user.user_metadata?.role || role || "professor",
      };

      // Atualiza o estado
      setUser(userData);
      console.log("Estado de usuário atualizado:", userData.email, userData.role);
    } catch (error) {
      console.error("Erro ao atualizar estado do usuário:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Efeito para verificar e configurar a sessão
  useEffect(() => {
    let isMounted = true;
    
    // Função para verificar a sessão existente
    const checkExistingSession = async () => {
      try {
        setLoading(true);
        console.log("Verificando sessão existente...");
        
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Erro ao buscar sessão:", error.message);
          if (isMounted) {
            setUser(null);
            setLoading(false);
          }
          return;
        }

        if (data?.session) {
          console.log("Sessão encontrada, atualizando usuário");
          if (isMounted) {
            await updateUserState(data.session);
          }
        } else {
          console.log("Nenhuma sessão encontrada");
          if (isMounted) {
            setUser(null);
            setLoading(false);
          }
        }
      } catch (error) {
        console.error("Exceção ao verificar sessão:", error);
        if (isMounted) {
          setUser(null);
          setLoading(false);
        }
      } finally {
        if (isMounted) {
          setSessionChecked(true);
        }
      }
    };

    checkExistingSession();

    // Configura o listener para mudanças no estado de autenticação
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Evento de autenticação:", event);
        
        if (isMounted) {
          if (session) {
            console.log("Sessão atualizada");
            await updateUserState(session);
          } else {
            console.log("Sessão encerrada");
            setUser(null);
            setLoading(false);
          }
        }
      }
    );

    // Limpeza quando o componente é desmontado
    return () => {
      isMounted = false;
      if (authListener?.subscription?.unsubscribe) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [updateUserState]);

  // Função para fazer login
  const signIn = async (email, password) => {
    try {
      setLoading(true);
      console.log("Tentando fazer login para:", email);
      
      const result = await authService.login(email, password);

      if (!result.success) {
        console.error("Falha no login:", result.error || "Erro desconhecido");
        return {
          success: false,
          message: result.error || "Erro ao fazer login. Verifique suas credenciais.",
        };
      }

      // Atualiza o estado se o login for bem-sucedido
      if (result.data?.user) {
        setUser({
          id: result.data.user.id,
          email: result.data.user.email,
          nome: result.data.user.nome || "Usuário",
          role: result.data.user.role || "professor",
        });
        
        console.log("Login bem-sucedido, usuário definido:", result.data.user.email);
        return { success: true, data: result.data };
      }

      return { success: true, data: result.data };
    } catch (error) {
      console.error("Exceção ao fazer login:", error);
      return {
        success: false,
        message: error.message || "Erro de autenticação",
      };
    } finally {
      setLoading(false);
    }
  };

  // Função para fazer logout
  const signOut = async () => {
    try {
      console.log("Iniciando processo de logout");
      
      // Define user como null antes de chamar o logout para garantir atualização imediata da UI
      setUser(null);

      // Chama o serviço de logout
      const { error } = await authService.logout();
      if (error) {
        console.error("Erro durante logout:", error);
        throw new Error(error);
      }
      
      console.log("Logout concluído com sucesso");
    } catch (error) {
      console.error("Exceção durante logout:", error);
      // Mesmo com erro, garantimos que o estado local é limpo
      setUser(null);
    }
  };

  // Verifica se o usuário tem uma determinada permissão
  const hasPermission = (requiredRole) => {
    if (!user) return false;

    if (user.role === "admin") return true;

    return user.role === requiredRole;
  };

  // Verifica se o usuário pode acessar uma determinada rota
  const canAccess = (route) => {
    if (!user) return false;

    if (user.role === "admin") return true;

    if (user.role === "professor") {
      const allowedRoutes = [
        "/geral",
        "/alunos/visualizar",
        "/cadastro/exercicios",
        "/alunos_historico",
      ];

      return allowedRoutes.some(
        (r) => route === r || route.startsWith(r + "/")
      );
    }

    return false;
  };

  // Retorna o objeto com os valores e funções do hook
  return {
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
}

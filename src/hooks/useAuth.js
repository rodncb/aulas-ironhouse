import { useState, useEffect } from "react";
import authService from "../services/auth.service";
import supabase from "../services/supabase";

// Função auxiliar para buscar o perfil e a role
const fetchUserProfile = async (userId) => {
  if (!userId) return { role: null };

  try {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (error) {
      return { role: null };
    }

    return { role: profile?.role };
  } catch (fetchError) {
    return { role: null };
  }
};

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const updateUserState = async (session) => {
      if (!isMounted) return;

      if (session?.user) {
        setLoading(true);
        const { role } = await fetchUserProfile(session.user.id);
        if (!isMounted) return;

        const userData = {
          id: session.user.id,
          email: session.user.email,
          nome: session.user.user_metadata?.nome || "Usuário",
          role: role,
        };

        setUser(userData);
        setLoading(false);
      } else {
        setUser(null);
        setLoading(false);
      }
    };

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        updateUserState(session);
      })
      .catch(() => {
        if (isMounted) {
          setUser(null);
          setLoading(false);
        }
      });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        updateUserState(session);
      }
    );

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const signIn = async (email, password) => {
    try {
      setLoading(true);
      const result = await authService.login(email, password);

      if (result.success && result.data?.user) {
        return { success: true, data: result.data };
      }

      return {
        success: false,
        message:
          result.error || "Erro ao fazer login. Verifique suas credenciais.",
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || "Erro de autenticação",
      };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      // Define user como null antes de chamar o logout para garantir atualização imediata da UI
      setUser(null);

      // Chama o serviço de logout
      const { error } = await authService.logout();
      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      // Mesmo com erro, garantimos que o estado local é limpo
      setUser(null);
    }
  };

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
      ];

      return allowedRoutes.some(
        (r) => route === r || route.startsWith(r + "/")
      );
    }

    return false;
  };

  return {
    user,
    loading,
    signIn,
    signOut,
    hasPermission,
    canAccess,
    isAdmin: user?.role === "admin",
    isProfessor: user?.role === "professor",
  };
}

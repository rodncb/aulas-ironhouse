import { useState, useEffect, useCallback, useRef } from "react";
import authService from "../services/auth.service";
import { supabase } from "../services/supabase";

// Função auxiliar para buscar o perfil e a role
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
      // Loga o erro, mas não impede o fluxo necessariamente
      // Pode ser que o perfil ainda não exista, o que é tratado como 'professor' no fallback do signIn
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

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionChecked, setSessionChecked] = useState(false);
  const authListenerRef = useRef(null); // Ref para controlar a inscrição do listener
  const isUpdatingRef = useRef(false); // Ref para evitar atualizações simultâneas

  // Função memoizada para atualizar o estado do usuário
  const updateUserState = useCallback(async (session) => {
    // Evita múltiplas atualizações simultâneas
    if (isUpdatingRef.current) {
      console.log("Já existe uma atualização em andamento, ignorando...");
      return;
    }

    if (!session?.user) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      isUpdatingRef.current = true;
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
      console.log(
        "Estado de usuário atualizado:",
        userData.email,
        userData.role
      );
    } catch (error) {
      console.error("Erro ao atualizar estado do usuário:", error);
    } finally {
      setLoading(false);
      isUpdatingRef.current = false;
    }
  }, []);

  // Efeito para verificar e configurar a sessão
  useEffect(() => {
    let isMounted = true;

    // Função para verificar a sessão existente
    const checkExistingSession = async () => {
      // Se já estiver verificando outra sessão, encerra
      if (isUpdatingRef.current) return;

      try {
        isUpdatingRef.current = true; // Marcar que está atualizando
        setLoading(true);
        console.log("Verificando sessão existente...");

        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Erro ao buscar sessão:", error.message);
          if (isMounted) {
            setUser(null);
            setLoading(false);
          }
          isUpdatingRef.current = false; // Certifique-se de limpar mesmo em caso de erro
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
        // Garantir que estas flags sejam atualizadas independentemente do resultado
        if (isMounted) {
          setSessionChecked(true);
          isUpdatingRef.current = false; // Limpar a flag sempre
        }
      }
    };

    checkExistingSession();

    // Configura o listener para mudanças no estado de autenticação apenas uma vez
    if (!authListenerRef.current) {
      const { data: authListener } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log("Evento de autenticação:", event);

          if (!isMounted) return;

          if (session) {
            console.log("Sessão atualizada");
            try {
              await updateUserState(session);
            } catch (error) {
              console.error("Erro ao atualizar estado do usuário após evento:", error);
              // Garantir que o estado de carregamento seja definido como falso mesmo em caso de erro
              setLoading(false);
            }
          } else {
            console.log("Sessão encerrada");
            setUser(null);
            setLoading(false);
          }
        }
      );

      authListenerRef.current = authListener;
    }

    // Limpeza quando o componente é desmontado
    return () => {
      isMounted = false;
      // Só desinscreve se o listener existir
      if (authListenerRef.current?.subscription?.unsubscribe) {
        authListenerRef.current.subscription.unsubscribe();
        authListenerRef.current = null;
      }
    };
  }, [updateUserState]);

  // Função para fazer login
  const signIn = async (email, password, expectedUserType) => {
    // Adiciona expectedUserType
    try {
      setLoading(true);
      console.log(
        `Tentando fazer login para: ${email} como ${expectedUserType}`
      );

      // 1. Autentica com Supabase
      const authResult = await authService.login(email, password);

      if (!authResult.success || !authResult.data?.user) {
        console.error(
          "Falha na autenticação:",
          authResult.error || "Usuário não retornado"
        );
        return {
          success: false,
          error: authResult.error || "Email ou senha incorretos.",
        };
      }

      // 2. Busca o perfil/role do usuário autenticado
      const { role: actualRole } = await fetchUserProfile(
        authResult.data.user.id
      );
      const finalRole =
        authResult.data.user.user_metadata?.role || actualRole || "professor"; // Lógica de fallback

      // 3. Verifica se o tipo de usuário bate com o esperado
      if (finalRole !== expectedUserType) {
        console.warn(
          `Tipo de usuário incorreto. Esperado: ${expectedUserType}, Obtido: ${finalRole}`
        );
        // Desloga o usuário que acabou de logar com tipo errado
        await authService.logout();
        return {
          success: false,
          error: `Este usuário não é um ${expectedUserType}. Selecione o tipo correto.`,
        };
      }

      // 4. Se tudo deu certo, atualiza o estado do usuário
      const userData = {
        id: authResult.data.user.id,
        email: authResult.data.user.email,
        nome: authResult.data.user.user_metadata?.nome || "Usuário",
        role: finalRole,
      };

      setUser(userData);
      console.log(
        "Login bem-sucedido e tipo verificado:",
        userData.email,
        userData.role
      );
      return { success: true, data: userData }; // Retorna os dados do usuário
    } catch (error) {
      console.error("Exceção ao fazer login:", error);
      // Tenta deslogar em caso de exceção inesperada após autenticação parcial
      await authService.logout().catch(() => {}); // Ignora erros no logout aqui
      return {
        success: false,
        error: error.message || "Erro inesperado durante o login.",
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

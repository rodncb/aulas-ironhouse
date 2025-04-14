import { useState, useEffect } from "react";

// Definindo os tipos de usuário
// 'admin' | 'professor'

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar se há um usuário no localStorage
    const savedUser = localStorage.getItem("currentUser");
    const savedRole = localStorage.getItem("userRole");

    if (savedUser && savedRole) {
      setUser({
        ...JSON.parse(savedUser),
        role: savedRole,
      });
    }

    setLoading(false);
  }, []);

  const signIn = async (email, password) => {
    // Simular autenticação baseada em localStorage (será substituída pelo Supabase depois)
    // Neste exemplo simulado, usamos email como nome de usuário para simplicidade
    const mockUsers = [
      {
        id: 1,
        email: "admin@example.com",
        password: "admin123",
        role: "admin",
        nome: "Administrador",
      },
      {
        id: 2,
        email: "professor@example.com",
        password: "prof123",
        role: "professor",
        nome: "Professor",
      },
    ];

    const foundUser = mockUsers.find(
      (u) => u.email === email && u.password === password
    );

    if (foundUser) {
      const userToSave = {
        id: foundUser.id,
        email: foundUser.email,
        nome: foundUser.nome,
      };

      localStorage.setItem("currentUser", JSON.stringify(userToSave));
      localStorage.setItem("userRole", foundUser.role);

      setUser({
        ...userToSave,
        role: foundUser.role,
      });

      return { error: null, data: { user: userToSave } };
    }

    return { error: { message: "Credenciais inválidas" }, data: null };
  };

  const signOut = () => {
    localStorage.removeItem("currentUser");
    localStorage.removeItem("userRole");
    setUser(null);
  };

  // Função para verificar se o usuário tem permissão específica
  const hasPermission = (requiredRole) => {
    if (!user) return false;

    // Administradores têm acesso a tudo
    if (user.role === "admin") return true;

    // Verifica se o usuário tem o papel específico necessário
    return user.role === requiredRole;
  };

  // Verificar se pode acessar uma determinada rota
  const canAccess = (route) => {
    if (!user) return false;

    // Administradores têm acesso a todas as rotas
    if (user.role === "admin") return true;

    // Rotas acessíveis para professores
    if (user.role === "professor") {
      const allowedRoutes = [
        "/geral",
        "/alunos/visualizar",
        "/cadastro/exercicios",
      ];

      return allowedRoutes.some((r) => route.startsWith(r));
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

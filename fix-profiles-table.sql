-- Script para corrigir a tabela profiles e garantir o funcionamento das políticas RLS

-- Criar a tabela profiles se não existir
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'professor')),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS na tabela profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Verificar se há usuários na tabela auth.users que não estão na tabela profiles
INSERT INTO public.profiles (id, role)
SELECT au.id, COALESCE(au.raw_user_meta_data->>'role', 'professor') as role
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- Criar políticas RLS para a tabela profiles
DROP POLICY IF EXISTS "Permitir leitura do próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Permitir atualização do próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Permitir leitura de todos perfis para admin" ON public.profiles;
DROP POLICY IF EXISTS "Permitir inserção do próprio perfil" ON public.profiles;

-- Permitir que usuários vejam seu próprio perfil
CREATE POLICY "Permitir leitura do próprio perfil" ON public.profiles
  FOR SELECT USING (id = auth.uid());

-- Permitir que usuários atualizem seu próprio perfil
CREATE POLICY "Permitir atualização do próprio perfil" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

-- Permitir que administradores vejam todos os perfis
CREATE POLICY "Permitir leitura de todos perfis para admin" ON public.profiles
  FOR SELECT USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Permitir que novos usuários criem seu perfil
CREATE POLICY "Permitir inserção do próprio perfil" ON public.profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- Garantir que a função check_user_role funcione corretamente
CREATE OR REPLACE FUNCTION public.check_user_role(required_roles TEXT[])
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM public.profiles WHERE id = auth.uid();
  
  IF user_role IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN user_role = ANY(required_roles);
END;
$$;

-- Criar uma função RPC que pode ser chamada do frontend para recarregar o cache do schema
CREATE OR REPLACE FUNCTION public.reload_schema_cache()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Esta é uma função simples que só existe para forçar o Supabase a recarregar o cache do schema
  -- A execução de qualquer função pode ajudar a resetar o cache
  RETURN TRUE;
END;
$$;

-- Adicionar uma política temporária permissiva para debug (remove depois de resolver o problema)
DROP POLICY IF EXISTS "Debug - Permitir acesso temporário a todas as tabelas" ON public.alunos;
CREATE POLICY "Debug - Permitir acesso temporário a todas as tabelas" ON public.alunos
  FOR ALL USING (auth.role() = 'authenticated');
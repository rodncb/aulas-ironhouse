-- Estrutura das tabelas para o Supabase

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Configuração de profiles (gerada automaticamente pelo Supabase Auth)
ALTER TABLE auth.users 
ADD COLUMN IF NOT EXISTS nome TEXT,
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'professor';

-- Remover triggers existentes se necessário
DROP TRIGGER IF EXISTS update_professores_timestamp ON public.professores;
DROP TRIGGER IF EXISTS update_alunos_timestamp ON public.alunos;
DROP TRIGGER IF EXISTS update_exercicios_timestamp ON public.exercicios;
DROP TRIGGER IF EXISTS update_aulas_timestamp ON public.aulas;

-- Tabela de professores
DROP TABLE IF EXISTS public.professores CASCADE;
CREATE TABLE public.professores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL UNIQUE,
  idade INTEGER,
  especialidade TEXT,
  experiencia TEXT,
  formacao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de alunos
DROP TABLE IF EXISTS public.alunos CASCADE;
CREATE TABLE public.alunos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL UNIQUE,
  idade INTEGER,
  lesao TEXT DEFAULT 'Nao' CHECK (lesao IN ('Sim - Lesao Grave', 'Sim - Lesao Moderada', 'Nao')),
  tipo_lesao TEXT,
  objetivo TEXT,
  plano TEXT DEFAULT '8 Check-in' CHECK (plano IN ('8 Check-in', '12 Check-in', '16 Check-in', 'Premium')),
  nivel TEXT DEFAULT 'Iniciante' CHECK (nivel IN ('Iniciante', 'Intermediário', 'Avançado')),
  observacoes TEXT,
  status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')), -- Adicionada coluna status
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de exercícios
DROP TABLE IF EXISTS public.exercicios CASCADE;
CREATE TABLE public.exercicios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL UNIQUE,
  musculatura TEXT,
  aparelho TEXT, -- Coluna adicionada
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de aulas
DROP TABLE IF EXISTS public.aulas CASCADE;
CREATE TABLE public.aulas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  data DATE NOT NULL,
  status TEXT DEFAULT 'atual',
  anotacoes TEXT,
  lesoes TEXT,
  professor_id UUID REFERENCES public.professores(id) ON DELETE SET NULL,
  total_alunos INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de relação entre aulas e alunos
DROP TABLE IF EXISTS public.aula_alunos CASCADE;
CREATE TABLE public.aula_alunos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  aula_id UUID REFERENCES public.aulas(id) ON DELETE CASCADE,
  aluno_id UUID REFERENCES public.alunos(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(aula_id, aluno_id)
);

-- Criar a tabela profiles se não existir (Melhor abordagem)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'professor')),
  nome TEXT, -- Coluna nome adicionada aqui
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
-- Habilitar RLS na tabela profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
-- Sincronizar usuários existentes que não estão em profiles
INSERT INTO public.profiles (id, role, nome)
SELECT au.id,
       COALESCE(au.raw_user_meta_data->>'role', 'professor') as role,
       au.raw_user_meta_data->>'nome' as nome -- Agora esta linha funcionará
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- Função para criar uma aula e associar alunos em uma transação
CREATE OR REPLACE FUNCTION public.criar_aula(
  p_titulo TEXT,
  p_descricao TEXT,
  p_data DATE,
  p_hora TIME,
  p_professor_id UUID,
  p_exercicios JSONB,
  p_alunos_ids UUID[]
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_aula_id UUID;
  v_aluno_id UUID;
BEGIN
  -- Criar a aula
  INSERT INTO public.aulas (titulo, descricao, data, hora, professor_id, exercicios)
  VALUES (p_titulo, p_descricao, p_data, p_hora, p_professor_id, p_exercicios)
  RETURNING id INTO v_aula_id;
  
  -- Associar alunos à aula
  FOREACH v_aluno_id IN ARRAY p_alunos_ids
  LOOP
    INSERT INTO public.aula_alunos (aula_id, aluno_id)
    VALUES (v_aula_id, v_aluno_id);
  END LOOP;
  
  RETURN v_aula_id;
END;
$$;

-- Função para atualizar uma aula e suas associações com alunos
CREATE OR REPLACE FUNCTION public.atualizar_aula(
  p_aula_id UUID,
  p_titulo TEXT,
  p_descricao TEXT,
  p_data DATE,
  p_hora TIME,
  p_professor_id UUID,
  p_exercicios JSONB,
  p_alunos_ids UUID[]
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_aluno_id UUID;
BEGIN
  -- Atualizar a aula
  UPDATE public.aulas 
  SET 
    titulo = p_titulo,
    descricao = p_descricao,
    data = p_data,
    hora = p_hora,
    professor_id = p_professor_id,
    exercicios = p_exercicios,
    updated_at = now()
  WHERE id = p_aula_id;
  
  -- Remover todas as associações anteriores
  DELETE FROM public.aula_alunos WHERE aula_id = p_aula_id;
  
  -- Adicionar as novas associações
  FOREACH v_aluno_id IN ARRAY p_alunos_ids
  LOOP
    INSERT INTO public.aula_alunos (aula_id, aluno_id)
    VALUES (p_aula_id, v_aluno_id);
  END LOOP;
  
  RETURN p_aula_id;
END;
$$;

-- Função para atualizar o timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar triggers para atualizar o campo updated_at
CREATE TRIGGER update_professores_timestamp
    BEFORE UPDATE ON public.professores
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_alunos_timestamp
    BEFORE UPDATE ON public.alunos
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_exercicios_timestamp
    BEFORE UPDATE ON public.exercicios
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_aulas_timestamp
    BEFORE UPDATE ON public.aulas
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.professores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aula_alunos ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas e permissivas (se existirem)
DROP POLICY IF EXISTS "Permitir acesso total a usuários autenticados" ON public.professores;
DROP POLICY IF EXISTS "Permitir acesso total a usuários autenticados" ON public.alunos;
DROP POLICY IF EXISTS "Permitir acesso total a usuários autenticados" ON public.exercicios;
DROP POLICY IF EXISTS "Permitir acesso total a usuários autenticados" ON public.aulas;
DROP POLICY IF EXISTS "Permitir acesso total a usuários autenticados" ON public.aula_alunos;

-- Função auxiliar para verificar role (assume tabela 'profiles' com colunas 'id' e 'role')
CREATE OR REPLACE FUNCTION public.check_user_role(required_roles TEXT[])
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public -- Garante que a tabela profiles seja encontrada
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid() AND role = ANY(required_roles)
  );
END;
$$;

-- Políticas para a tabela 'professores' (Apenas Admins podem gerenciar)
CREATE POLICY "Permitir leitura de professores para admins" ON public.professores
  FOR SELECT USING (check_user_role(ARRAY['admin']));
CREATE POLICY "Permitir criação de professores para admins" ON public.professores
  FOR INSERT WITH CHECK (check_user_role(ARRAY['admin']));
CREATE POLICY "Permitir atualização de professores para admins" ON public.professores
  FOR UPDATE USING (check_user_role(ARRAY['admin']));
CREATE POLICY "Permitir exclusão de professores para admins" ON public.professores
  FOR DELETE USING (check_user_role(ARRAY['admin']));

-- Políticas para a tabela 'alunos' (Admins e Professores podem gerenciar)
CREATE POLICY "Permitir leitura de alunos para admins/professores" ON public.alunos
  FOR SELECT USING (check_user_role(ARRAY['admin', 'professor']));
CREATE POLICY "Permitir criação de alunos para admins/professores" ON public.alunos
  FOR INSERT WITH CHECK (check_user_role(ARRAY['admin', 'professor']));
CREATE POLICY "Permitir atualização de alunos para admins/professores" ON public.alunos
  FOR UPDATE USING (check_user_role(ARRAY['admin', 'professor']));
CREATE POLICY "Permitir exclusão de alunos para admins/professores" ON public.alunos
  FOR DELETE USING (check_user_role(ARRAY['admin', 'professor']));

-- Políticas para a tabela 'exercicios' (Admins e Professores podem gerenciar)
CREATE POLICY "Permitir leitura de exercicios para admins/professores" ON public.exercicios
  FOR SELECT USING (check_user_role(ARRAY['admin', 'professor']));
CREATE POLICY "Permitir criação de exercicios para admins/professores" ON public.exercicios
  FOR INSERT WITH CHECK (check_user_role(ARRAY['admin', 'professor']));
CREATE POLICY "Permitir atualização de exercicios para admins/professores" ON public.exercicios
  FOR UPDATE USING (check_user_role(ARRAY['admin', 'professor']));
CREATE POLICY "Permitir exclusão de exercicios para admins/professores" ON public.exercicios
  FOR DELETE USING (check_user_role(ARRAY['admin', 'professor']));

-- Políticas para a tabela 'aulas' (Admins e Professores podem gerenciar)
CREATE POLICY "Permitir leitura de aulas para admins/professores" ON public.aulas
  FOR SELECT USING (check_user_role(ARRAY['admin', 'professor']));
CREATE POLICY "Permitir criação de aulas para admins/professores" ON public.aulas
  FOR INSERT WITH CHECK (check_user_role(ARRAY['admin', 'professor']));
CREATE POLICY "Permitir atualização de aulas para admins/professores" ON public.aulas
  FOR UPDATE USING (check_user_role(ARRAY['admin', 'professor']));
CREATE POLICY "Permitir exclusão de aulas para admins/professores" ON public.aulas
  FOR DELETE USING (check_user_role(ARRAY['admin', 'professor']));

-- Políticas para a tabela 'aula_alunos' (Admins e Professores podem gerenciar)
CREATE POLICY "Permitir leitura de aula_alunos para admins/professores" ON public.aula_alunos
  FOR SELECT USING (check_user_role(ARRAY['admin', 'professor']));
CREATE POLICY "Permitir criação de aula_alunos para admins/professores" ON public.aula_alunos
  FOR INSERT WITH CHECK (check_user_role(ARRAY['admin', 'professor']));
CREATE POLICY "Permitir atualização de aula_alunos para admins/professores" ON public.aula_alunos
  FOR UPDATE USING (check_user_role(ARRAY['admin', 'professor']));
CREATE POLICY "Permitir exclusão de aula_alunos para admins/professores" ON public.aula_alunos
  FOR DELETE USING (check_user_role(ARRAY['admin', 'professor']));

-- Políticas para a tabela 'profiles' (Usuário pode ver/atualizar seu próprio perfil, admin pode ver todos)
-- Certifique-se que a tabela profiles existe e tem RLS ativado
-- ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY; -- Descomente se necessário
DROP POLICY IF EXISTS "Permitir leitura do próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Permitir atualização do próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Permitir leitura de todos perfis para admin" ON public.profiles;

CREATE POLICY "Permitir leitura do próprio perfil" ON public.profiles
  FOR SELECT USING (id = auth.uid());
CREATE POLICY "Permitir atualização do próprio perfil" ON public.profiles
  FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Permitir leitura de todos perfis para admin" ON public.profiles
  FOR SELECT USING (check_user_role(ARRAY['admin']));
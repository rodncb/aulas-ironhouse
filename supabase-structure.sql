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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de exercícios
DROP TABLE IF EXISTS public.exercicios CASCADE;
CREATE TABLE public.exercicios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL UNIQUE,
  musculatura TEXT,
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

-- Criar políticas de acesso
CREATE POLICY "Permitir acesso total a usuários autenticados" ON public.professores FOR ALL TO authenticated USING (true);
CREATE POLICY "Permitir acesso total a usuários autenticados" ON public.alunos FOR ALL TO authenticated USING (true);
CREATE POLICY "Permitir acesso total a usuários autenticados" ON public.exercicios FOR ALL TO authenticated USING (true);
CREATE POLICY "Permitir acesso total a usuários autenticados" ON public.aulas FOR ALL TO authenticated USING (true);
CREATE POLICY "Permitir acesso total a usuários autenticados" ON public.aula_alunos FOR ALL TO authenticated USING (true);
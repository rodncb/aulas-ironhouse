-- SCRIPT PARA VERIFICAR ESTRUTURA DAS TABELAS
-- Execute este primeiro para entender a estrutura

-- =============================================
-- VERIFICAR ESTRUTURA DAS TABELAS PRINCIPAIS
-- =============================================

-- Estrutura da tabela professores
SELECT 
    'TABELA PROFESSORES' as tabela,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'professores' 
ORDER BY ordinal_position;

-- Estrutura da tabela profiles
SELECT 
    'TABELA PROFILES' as tabela,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- Estrutura da tabela aulas
SELECT 
    'TABELA AULAS' as tabela,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'aulas' 
ORDER BY ordinal_position;

-- Verificar se a tabela auth.users está acessível
SELECT 
    'TABELA AUTH.USERS' as tabela,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'auth' AND table_name = 'users' 
ORDER BY ordinal_position;

-- =============================================
-- VERIFICAR DADOS ATUAIS DAS FLÁVIAS
-- =============================================

-- Todas as colunas disponíveis na tabela professores
SELECT * FROM professores 
WHERE nome ILIKE '%flavia%' OR nome ILIKE '%flávia%';

-- Se a tabela profiles existir e tiver dados
SELECT 'PROFILES' as tipo, * FROM profiles 
WHERE nome ILIKE '%flavia%' OR nome ILIKE '%flávia%'
LIMIT 5;

-- Verificar usuários relacionados
SELECT 'AUTH USERS' as tipo, id, email, created_at, banned_until 
FROM auth.users 
WHERE email LIKE '%flavia%'
LIMIT 5;

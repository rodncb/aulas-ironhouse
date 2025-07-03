-- Script para verificar se há policies de RLS limitando as aulas
-- Execute no Supabase para verificar segurança e acesso

-- 1. Verificar se RLS está ativado na tabela aulas
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_ativado
FROM pg_tables 
WHERE tablename = 'aulas';

-- 2. Verificar policies aplicadas na tabela aulas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd as operacao,
    qual as condicao
FROM pg_policies 
WHERE tablename = 'aulas';

-- 3. Teste direto: contar aulas antes de 24/06 (SEM filtros)
SELECT 
    'TOTAL ANTES DE 24/06' as teste,
    COUNT(*) as total
FROM aulas 
WHERE data < '2025-06-24';

-- 4. Teste: primeiras 5 aulas do sistema (ordenadas por data)
SELECT 
    'PRIMEIRAS 5 AULAS' as teste,
    data,
    id,
    professor_id
FROM aulas 
ORDER BY data ASC 
LIMIT 5;

-- 5. Verificar se existe algum filtro automático
SELECT 
    'AULAS MAIO 2025' as teste,
    COUNT(*) as total
FROM aulas 
WHERE data >= '2025-05-01' AND data < '2025-06-01';

SELECT 
    'AULAS JUNHO 2025' as teste,
    COUNT(*) as total
FROM aulas 
WHERE data >= '2025-06-01' AND data < '2025-07-01';

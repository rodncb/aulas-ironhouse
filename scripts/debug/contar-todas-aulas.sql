-- Script SIMPLES para verificar EXATAMENTE quantas aulas existem
-- Execute no Supabase para comparar com o que aparece no sistema

-- 1. Total geral de aulas
SELECT COUNT(*) as total_aulas_no_banco FROM aulas;

-- 2. Aulas por data (TODAS as datas) - CORRIGIDO
SELECT 
    data,
    COUNT(*) as total_aulas
FROM aulas 
GROUP BY data
ORDER BY data ASC;

-- 3. Primeira e última aula
SELECT 
    MIN(data) as primeira_aula,
    MAX(data) as ultima_aula,
    COUNT(*) as total_entre_primeira_e_ultima
FROM aulas;

-- 4. Quantas aulas antes de 24/06
SELECT 
    'ANTES DE 24/06' as periodo,
    COUNT(*) as total_aulas
FROM aulas 
WHERE data < '2025-06-24'
UNION ALL
SELECT 
    'A PARTIR DE 24/06' as periodo,
    COUNT(*) as total_aulas
FROM aulas 
WHERE data >= '2025-06-24';

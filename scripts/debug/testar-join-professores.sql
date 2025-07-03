-- Script para confirmar se o problema é o JOIN com professores
-- Execute no Supabase para testar nossa hipótese

-- 1. Aulas com professores válidos (com JOIN)
SELECT 
    'AULAS COM PROFESSORES VÁLIDOS' as teste,
    COUNT(*) as total
FROM aulas a
INNER JOIN professores p ON a.professor_id = p.id;

-- 2. Aulas SEM professores válidos (órfãs)
SELECT 
    'AULAS ÓRFÃS (sem professor)' as teste,
    COUNT(*) as total
FROM aulas a
LEFT JOIN professores p ON a.professor_id = p.id
WHERE p.id IS NULL;

-- 3. Comparar: todas as aulas vs aulas com professores
SELECT 
    'TOTAL DE AULAS' as tipo,
    COUNT(*) as total
FROM aulas
UNION ALL
SELECT 
    'AULAS COM PROFESSOR VÁLIDO' as tipo,
    COUNT(*) as total
FROM aulas a
INNER JOIN professores p ON a.professor_id = p.id;

-- 4. Verificar professor_id que não existem mais
SELECT 
    'PROFESSOR_IDS ÓRFÃOS' as teste,
    COUNT(DISTINCT a.professor_id) as professores_orfaos
FROM aulas a
LEFT JOIN professores p ON a.professor_id = p.id
WHERE p.id IS NULL;

-- 5. Aulas antes de 24/06 COM professores válidos
SELECT 
    'ANTES 24/06 COM PROFESSORES' as teste,
    COUNT(*) as total
FROM aulas a
INNER JOIN professores p ON a.professor_id = p.id
WHERE a.data < '2025-06-24';

-- 6. Aulas antes de 24/06 SEM professores válidos
SELECT 
    'ANTES 24/06 SEM PROFESSORES' as teste,
    COUNT(*) as total
FROM aulas a
LEFT JOIN professores p ON a.professor_id = p.id
WHERE a.data < '2025-06-24' AND p.id IS NULL;

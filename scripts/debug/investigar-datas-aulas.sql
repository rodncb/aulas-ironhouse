-- Script para investigar datas das aulas no sistema
-- Execute no Supabase para entender por que os relatórios começam em 24/06

-- 1. Primeira aula registrada no sistema
SELECT 
    'PRIMEIRA AULA NO SISTEMA' as tipo,
    MIN(data) as primeira_aula,
    COUNT(*) as total_aulas
FROM aulas;

-- 2. Últimas 10 aulas por data (mais recentes primeiro)
SELECT 
    'AULAS MAIS RECENTES' as tipo,
    data,
    COUNT(*) as total_aulas_no_dia,
    STRING_AGG(DISTINCT 
        (SELECT nome FROM professores WHERE id = aulas.professor_id), 
        ', '
    ) as professores
FROM aulas 
GROUP BY data
ORDER BY data DESC
LIMIT 10;

-- 3. Primeiras 10 aulas por data (mais antigas primeiro)
SELECT 
    'AULAS MAIS ANTIGAS' as tipo,
    data,
    COUNT(*) as total_aulas_no_dia,
    STRING_AGG(DISTINCT 
        (SELECT nome FROM professores WHERE id = aulas.professor_id), 
        ', '
    ) as professores
FROM aulas 
GROUP BY data
ORDER BY data ASC
LIMIT 10;

-- 4. Distribuição de aulas por mês em 2025
SELECT 
    'DISTRIBUIÇÃO POR MÊS 2025' as tipo,
    EXTRACT(MONTH FROM data) as mes,
    COUNT(*) as total_aulas,
    MIN(data) as primeira_do_mes,
    MAX(data) as ultima_do_mes
FROM aulas 
WHERE EXTRACT(YEAR FROM data) = 2025
GROUP BY EXTRACT(MONTH FROM data)
ORDER BY mes;

-- 5. Verificar se há aulas com datas futuras (depois de hoje)
SELECT 
    'AULAS FUTURAS' as tipo,
    COUNT(*) as total_aulas_futuras,
    MIN(data) as primeira_futura,
    MAX(data) as ultima_futura
FROM aulas 
WHERE data > CURRENT_DATE;

-- 6. Aulas do último ano (365 dias)
SELECT 
    'AULAS ÚLTIMO ANO' as tipo,
    data,
    COUNT(*) as total_aulas,
    STRING_AGG(DISTINCT 
        (SELECT nome FROM professores WHERE id = aulas.professor_id), 
        ', '
    ) as professores
FROM aulas 
WHERE data >= CURRENT_DATE - INTERVAL '365 days'
GROUP BY data
ORDER BY data DESC
LIMIT 30;

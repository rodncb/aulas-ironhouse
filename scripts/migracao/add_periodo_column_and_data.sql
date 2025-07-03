-- Script para adicionar coluna 'periodo' à tabela aulas e popular com dados de exemplo
-- Execute este script no SQL Editor do Supabase

-- 1. Adicionar a coluna periodo à tabela aulas
ALTER TABLE public.aulas 
ADD COLUMN IF NOT EXISTS periodo TEXT;

-- 2. Criar alguns períodos padrão baseados no horário ou data
-- Vamos definir períodos como: Manhã, Tarde, Noite
UPDATE public.aulas 
SET periodo = CASE 
  WHEN EXTRACT(HOUR FROM created_at) BETWEEN 6 AND 11 THEN 'Manhã'
  WHEN EXTRACT(HOUR FROM created_at) BETWEEN 12 AND 17 THEN 'Tarde'
  WHEN EXTRACT(HOUR FROM created_at) BETWEEN 18 AND 23 THEN 'Noite'
  ELSE 'Manhã'
END
WHERE periodo IS NULL;

-- 3. Inserir algumas aulas de exemplo para diferentes dias e status (para teste do relatório)
-- Primeiro, vamos verificar se temos professores cadastrados
DO $$
DECLARE
    prof_id UUID;
    data_hoje DATE := CURRENT_DATE;
    prof_count INTEGER;
BEGIN
    -- Verificar quantos professores existem
    SELECT COUNT(*) INTO prof_count FROM public.professores;
    
    IF prof_count > 0 THEN
        -- Inserir aulas de exemplo para diferentes dias da semana e períodos
        
        -- Loop pelos professores disponíveis
        FOR prof_id IN (SELECT id FROM public.professores LIMIT 3)
        LOOP
            -- Segunda-feira - Manhã
            INSERT INTO public.aulas (data, status, periodo, professor_id, total_alunos, anotacoes)
            VALUES (data_hoje, 'atual', 'Manhã', prof_id, 2, 'Aula de exemplo - Segunda manhã')
            ON CONFLICT DO NOTHING;
            
            -- Terça-feira - Tarde
            INSERT INTO public.aulas (data, status, periodo, professor_id, total_alunos, anotacoes)
            VALUES (data_hoje + 1, 'realizada', 'Tarde', prof_id, 3, 'Aula de exemplo - Terça tarde')
            ON CONFLICT DO NOTHING;
            
            -- Quarta-feira - Noite
            INSERT INTO public.aulas (data, status, periodo, professor_id, total_alunos, anotacoes)
            VALUES (data_hoje + 2, 'atual', 'Noite', prof_id, 1, 'Aula de exemplo - Quarta noite')
            ON CONFLICT DO NOTHING;
            
            -- Quinta-feira - Manhã
            INSERT INTO public.aulas (data, status, periodo, professor_id, total_alunos, anotacoes)
            VALUES (data_hoje + 3, 'cancelada', 'Manhã', prof_id, 0, 'Aula de exemplo - Quinta manhã')
            ON CONFLICT DO NOTHING;
            
            -- Sexta-feira - Tarde
            INSERT INTO public.aulas (data, status, periodo, professor_id, total_alunos, anotacoes)
            VALUES (data_hoje + 4, 'atual', 'Tarde', prof_id, 4, 'Aula de exemplo - Sexta tarde')
            ON CONFLICT DO NOTHING;
            
            -- Sábado - Manhã
            INSERT INTO public.aulas (data, status, periodo, professor_id, total_alunos, anotacoes)
            VALUES (data_hoje + 5, 'realizada', 'Manhã', prof_id, 2, 'Aula de exemplo - Sábado manhã')
            ON CONFLICT DO NOTHING;
        END LOOP;
        
        RAISE NOTICE 'Aulas de exemplo criadas para diferentes dias e períodos';
    ELSE
        RAISE NOTICE 'Nenhum professor encontrado. Aulas de exemplo não foram criadas.';
    END IF;
END $$;

-- 4. Verificar os dados inseridos
SELECT 
    a.id,
    a.data,
    a.status,
    a.periodo,
    p.nome as professor_nome,
    a.total_alunos,
    a.anotacoes
FROM public.aulas a
LEFT JOIN public.professores p ON a.professor_id = p.id
ORDER BY a.data, a.periodo;

-- 5. Mostrar estatísticas do que foi criado
SELECT 
    'Total de aulas' as descricao, 
    COUNT(*) as quantidade 
FROM public.aulas
UNION ALL
SELECT 
    'Aulas por período - Manhã', 
    COUNT(*) 
FROM public.aulas 
WHERE periodo = 'Manhã'
UNION ALL
SELECT 
    'Aulas por período - Tarde', 
    COUNT(*) 
FROM public.aulas 
WHERE periodo = 'Tarde'
UNION ALL
SELECT 
    'Aulas por período - Noite', 
    COUNT(*) 
FROM public.aulas 
WHERE periodo = 'Noite'
UNION ALL
SELECT 
    'Professores cadastrados', 
    COUNT(*) 
FROM public.professores;

-- Script de migração de dados para o Supabase
-- Execute este script no SQL Editor do Supabase para importar os dados do localStorage

-- Limpar tabelas existentes (opcional - remova estas linhas se quiser preservar dados existentes)
DELETE FROM aula_alunos;
DELETE FROM aulas;
DELETE FROM alunos;
DELETE FROM professores;
DELETE FROM exercicios;

-- Inserir professores
INSERT INTO professores (nome, idade, especialidade, experiencia, formacao, created_at)
SELECT 
  p.nome,
  COALESCE(p.idade, 0),
  COALESCE(p.especialidade, ''),
  COALESCE(p.experiencia, ''),
  '',
  NOW()
FROM (
  SELECT * FROM json_to_recordset('[{"id":1,"nome":"Carlos Silva","idade":35,"especialidade":"Musculação","experiencia":"5 anos"},{"id":2,"nome":"Amanda Oliveira","idade":30,"especialidade":"Pilates","experiencia":"3 anos"}]') 
  AS p(id int, nome text, idade int, especialidade text, experiencia text)
) AS p
ON CONFLICT (nome) DO NOTHING;

-- Inserir alunos
INSERT INTO alunos (nome, idade, lesao, tipo_lesao, objetivo, created_at)
SELECT 
  a.nome,
  COALESCE(a.idade, 0),
  CASE WHEN a.lesao IS NOT NULL AND a.lesao != '' THEN a.lesao ELSE 'Não' END,
  COALESCE(a.tipoLesao, ''),
  COALESCE(a.objetivo, ''),
  NOW()
FROM (
  SELECT * FROM json_to_recordset('[{"id":1,"nome":"Adriano Faria de Souza","idade":43,"lesao":"Sim - Controlada","tipoLesao":"Joelho","objetivo":"Ganhar massa"},{"id":2,"nome":"Adriano Laranjo","idade":37},{"id":3,"nome":"Adriano Silva","idade":39},{"id":4,"nome":"Agnella Massara","idade":46},{"id":5,"nome":"Alessandra Cunha","idade":46},{"id":6,"nome":"Alessandra Maria Sales","idade":46},{"id":7,"nome":"Alexandre Buscher","idade":36},{"id":8,"nome":"Alexandre Teixeira","idade":36},{"id":9,"nome":"Vitor","idade":25}]') 
  AS a(id int, nome text, idade int, lesao text, tipoLesao text, objetivo text)
) AS a
ON CONFLICT (nome) DO NOTHING;

-- Inserir exercícios
INSERT INTO exercicios (nome, musculatura, created_at)
SELECT 
  e.nome,
  COALESCE(e.musculatura, ''),
  NOW()
FROM (
  SELECT * FROM json_to_recordset('[{"id":1,"nome":"AB Butterfly Sit up","musculatura":"Abdômen"},{"id":2,"nome":"AB Remador","musculatura":"Abdômen"},{"id":3,"nome":"Abdutora Elástico","musculatura":"Glúteos"},{"id":4,"nome":"Abdução de ombro","musculatura":"Ombro"},{"id":5,"nome":"Afundo","musculatura":"Perna Anterior"},{"id":6,"nome":"Afundo c/ tronco inclinado","musculatura":"Perna Posterior"},{"id":7,"nome":"Afundo Cruzado","musculatura":"Perna Anterior"},{"id":8,"nome":"Agachamento","musculatura":"Perna Anterior"},{"id":9,"nome":"Agachamento cruzado","musculatura":"Perna Anterior"},{"id":10,"nome":"Arnold","musculatura":"Ombro"}]') 
  AS e(id int, nome text, musculatura text)
) AS e
ON CONFLICT (nome) DO NOTHING;

-- Inserir aulas e alunos associados em uma transação
DO $$
DECLARE
    aula_id UUID;
    aluno_id UUID;
    aluno_nome TEXT;
    professor_id UUID;
    professor_nome TEXT;
    alunos_array JSONB;
    r RECORD;
BEGIN
    FOR r IN 
        SELECT 
            (a.data)::text as data, 
            (a.status)::text as status, 
            (a.totalAlunos)::int as total_alunos,
            CASE 
                WHEN a.professor IS NOT NULL AND a.professor ? 'nome' 
                THEN a.professor->>'nome' 
                ELSE NULL 
            END as professor_nome,
            a.alunos
        FROM json_to_recordset('[
            {"id":1742998693064,"data":"26/03/2025","status":"realizada","totalAlunos":3,"alunos":[{"id":3,"nome":"Adriano Silva","idade":39},{"id":4,"nome":"Agnella Massara","idade":46},{"id":7,"nome":"Alexandre Buscher","idade":36}]},
            {"id":1742998927035,"data":"26/03/2025","status":"realizada","totalAlunos":1,"alunos":[{"id":2,"nome":"Adriano Laranjo","idade":37}]},
            {"id":1744279174103,"data":"10/04/2025","status":"realizada","totalAlunos":3,"alunos":[{"id":2,"nome":"Adriano Laranjo","idade":37},{"id":6,"nome":"Alessandra Maria Sales","idade":46},{"id":4,"nome":"Agnella Massara","idade":46}]},
            {"id":1744279725116,"data":"10/04/2025","status":"realizada","totalAlunos":2,"alunos":[{"id":2,"nome":"Adriano Laranjo","idade":37},{"id":1,"nome":"Adriano Faria de Souza","idade":43}]},
            {"id":1744279742548,"data":"10/04/2025","status":"realizada","totalAlunos":2,"alunos":[{"id":4,"nome":"Agnella Massara","idade":46},{"id":3,"nome":"Adriano Silva","idade":39}]},
            {"id":1744279770314,"data":"10/04/2025","status":"realizada","totalAlunos":1,"alunos":[{"id":2,"nome":"Adriano Laranjo","idade":37}]},
            {"id":1744280442013,"data":"10/04/2025","status":"realizada","totalAlunos":1,"alunos":[{"id":4,"nome":"Agnella Massara","idade":46}]},
            {"id":1744283035032,"data":"10/04/2025","status":"realizada","totalAlunos":1,"alunos":[{"id":3,"nome":"Adriano Silva","idade":39}],"professor":{"id":1,"nome":"Carlos Silva","idade":35,"especialidade":"Musculação","experiencia":"5 anos"}},
            {"id":1744293319707,"data":"10/04/2025","status":"realizada","totalAlunos":2,"alunos":[{"id":3,"nome":"Adriano Silva","idade":39},{"id":6,"nome":"Alessandra Maria Sales","idade":46}],"professor":{"id":1,"nome":"Carlos Silva","idade":35,"especialidade":"Musculação","experiencia":"5 anos"}},
            {"id":1744316362915,"data":"10/04/2025","status":"realizada","totalAlunos":1,"alunos":[{"id":5,"nome":"Alessandra Cunha","idade":46}],"professor":{"id":2,"nome":"Amanda Oliveira","idade":30,"especialidade":"Pilates","experiencia":"3 anos"}},
            {"id":1744316377326,"data":"10/04/2025","status":"realizada","totalAlunos":1,"alunos":[{"id":5,"nome":"Alessandra Cunha","idade":46}]},
            {"id":1744317160961,"data":"10/04/2025","status":"cancelada","totalAlunos":0,"alunos":[]},
            {"id":1744317340359,"data":"10/04/2025","status":"realizada","totalAlunos":1,"alunos":[{"id":2,"nome":"Adriano Laranjo","idade":37}],"professor":{"id":1,"nome":"Carlos Silva","idade":35,"especialidade":"Musculação","experiencia":"5 anos"}},
            {"id":1744317701327,"data":"10/04/2025","status":"realizada","totalAlunos":2,"alunos":[{"id":1,"nome":"Adriano Faria de Souza","idade":43},{"id":7,"nome":"Alexandre Buscher","idade":36}],"professor":{"id":1,"nome":"Carlos Silva","idade":35,"especialidade":"Musculação","experiencia":"5 anos"}},
            {"id":1744317789229,"data":"10/04/2025","status":"realizada","totalAlunos":1,"alunos":[{"id":3,"nome":"Adriano Silva","idade":39}],"professor":{"id":2,"nome":"Amanda Oliveira","idade":30,"especialidade":"Pilates","experiencia":"3 anos"}},
            {"id":1744317796309,"data":"10/04/2025","status":"realizada","totalAlunos":1,"alunos":[{"id":1,"nome":"Adriano Faria de Souza","idade":43}],"professor":{"id":2,"nome":"Amanda Oliveira","idade":30,"especialidade":"Pilates","experiencia":"3 anos"}},
            {"id":1744380981135,"data":"11/04/2025","status":"realizada","totalAlunos":3,"alunos":[{"id":9,"nome":"Vitor","idade":25},{"id":3,"nome":"Adriano Silva","idade":39},{"id":7,"nome":"Alexandre Buscher","idade":36}]},
            {"id":1744380981136,"data":"11/04/2025","status":"atual","totalAlunos":3,"alunos":[{"id":2,"nome":"Adriano Laranjo","idade":37},{"id":6,"nome":"Alessandra Maria Sales","idade":46},{"id":8,"nome":"Alexandre Teixeira","idade":36}]},
            {"id":1744585388003,"data":"13/04/2025","status":"realizada","totalAlunos":3,"alunos":[{"id":3,"nome":"Adriano Silva","idade":39},{"id":4,"nome":"Agnella Massara","idade":46},{"id":7,"nome":"Alexandre Buscher","idade":36},{"id":9,"nome":"Vitor","idade":25}]},
            {"id":1744585388004,"data":"13/04/2025","status":"atual","totalAlunos":1,"alunos":[{"id":9,"nome":"Vitor","idade":25}]},
            {"id":1744650284228,"data":"14/04/2025","status":"realizada","totalAlunos":1,"alunos":[{"id":2,"nome":"Adriano Laranjo","idade":37}]},
            {"id":1744650881613,"data":"14/04/2025","status":"realizada","totalAlunos":1,"alunos":[{"id":2,"nome":"Adriano Laranjo","idade":37}]},
            {"id":1744652786155,"data":"14/04/2025","status":"realizada","totalAlunos":1,"alunos":[{"id":4,"nome":"Agnella Massara","idade":46}]},
            {"id":1744652794011,"data":"14/04/2025","status":"realizada","totalAlunos":2,"alunos":[{"id":4,"nome":"Agnella Massara","idade":46},{"id":5,"nome":"Alessandra Cunha","idade":46}]},
            {"id":1744668712596,"data":"14/04/2025","status":"realizada","totalAlunos":1,"alunos":[{"id":1,"nome":"Adriano Faria de Souza","idade":43}]}
        ]') AS a(id int, data text, status text, totalAlunos int, professor jsonb, alunos jsonb)
    LOOP
        -- Converter data para o formato correto
        IF r.data ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4}$' THEN
            r.data := to_char(to_date(r.data, 'DD/MM/YYYY'), 'YYYY-MM-DD');
        END IF;
        
        -- Buscar o ID do professor pelo nome
        professor_id := NULL;
        IF r.professor_nome IS NOT NULL THEN
            SELECT id INTO professor_id FROM professores WHERE nome = r.professor_nome LIMIT 1;
        END IF;
        
        -- Inserir a aula
        INSERT INTO aulas (data, status, anotacoes, lesoes, professor_id, total_alunos, created_at)
        VALUES (r.data::date, r.status, '', '', professor_id, r.total_alunos, NOW())
        RETURNING id INTO aula_id;
        
        -- Associar alunos à aula
        IF r.alunos IS NOT NULL AND jsonb_array_length(r.alunos) > 0 THEN
            FOR i IN 0..(jsonb_array_length(r.alunos)-1) LOOP
                aluno_nome := r.alunos->i->>'nome';
                
                IF aluno_nome IS NOT NULL THEN
                    -- Buscar ID do aluno pelo nome
                    SELECT id INTO aluno_id FROM alunos WHERE nome = aluno_nome LIMIT 1;
                    
                    -- Se encontrou o aluno, criar a associação
                    IF aluno_id IS NOT NULL THEN
                        INSERT INTO aula_alunos (aula_id, aluno_id, created_at)
                        VALUES (aula_id, aluno_id, NOW())
                        ON CONFLICT DO NOTHING;
                    END IF;
                END IF;
            END LOOP;
        END IF;
    END LOOP;
END;
$$;

-- Feedback de conclusão
SELECT 'Migração concluída com sucesso!' as resultado,
       (SELECT COUNT(*) FROM professores) as professores_migrados,
       (SELECT COUNT(*) FROM alunos) as alunos_migrados,
       (SELECT COUNT(*) FROM exercicios) as exercicios_migrados,
       (SELECT COUNT(*) FROM aulas) as aulas_migradas,
       (SELECT COUNT(*) FROM aula_alunos) as relacoes_aula_alunos_migradas;
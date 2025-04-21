-- Script para popular o Supabase com dados iniciais
-- Primeiro, limpar todas as tabelas
DELETE FROM aula_alunos;
DELETE FROM aulas;
DELETE FROM alunos;
DELETE FROM professores;
DELETE FROM exercicios;

-- Inserir professores iniciais
INSERT INTO professores (nome, idade, especialidade, experiencia, formacao)
VALUES 
  ('João Silva', 32, 'Musculação', '8 anos', 'Educação Física'),
  ('Maria Santos', 28, 'Pilates', '5 anos', 'Fisioterapia')
RETURNING id, nome;

-- Inserir alunos iniciais
INSERT INTO alunos (nome, idade, lesao, tipo_lesao, objetivo)
VALUES 
  ('Pedro Oliveira', 28, 'Não', '', 'Ganho de massa muscular'),
  ('Ana Costa', 35, 'Sim - Controlada', 'Joelho direito', 'Reabilitação e fortalecimento'),
  ('Lucas Martins', 42, 'Não', '', 'Perda de peso'),
  ('Carla Santos', 31, 'Não', '', 'Condicionamento físico'),
  ('Roberto Almeida', 45, 'Sim - Controlada', 'Coluna lombar', 'Fortalecimento e mobilidade')
RETURNING id, nome;

-- Inserir exercícios básicos
INSERT INTO exercicios (nome, musculatura)
VALUES 
  ('Supino Reto', 'Peitoral'),
  ('Agachamento', 'Pernas'),
  ('Remada Baixa', 'Costas'),
  ('Elevação Lateral', 'Ombros'),
  ('Prancha', 'Core')
RETURNING id, nome;

-- Função auxiliar para inserir aulas e suas relações com alunos
CREATE OR REPLACE FUNCTION inserir_aula_com_alunos(
    p_data DATE,
    p_status TEXT,
    p_professor_nome TEXT,
    p_alunos TEXT[]
) RETURNS UUID AS $$
DECLARE
    v_aula_id UUID;
    v_professor_id UUID;
    v_aluno_id UUID;
    v_aluno TEXT;
BEGIN
    -- Buscar ID do professor
    SELECT id INTO v_professor_id FROM professores WHERE nome = p_professor_nome;
    
    -- Inserir aula
    INSERT INTO aulas (data, status, professor_id, total_alunos)
    VALUES (p_data, p_status, v_professor_id, array_length(p_alunos, 1))
    RETURNING id INTO v_aula_id;
    
    -- Inserir relações com alunos
    FOREACH v_aluno IN ARRAY p_alunos
    LOOP
        SELECT id INTO v_aluno_id FROM alunos WHERE nome = v_aluno;
        IF v_aluno_id IS NOT NULL THEN
            INSERT INTO aula_alunos (aula_id, aluno_id)
            VALUES (v_aula_id, v_aluno_id);
        END IF;
    END LOOP;
    
    RETURN v_aula_id;
END;
$$ LANGUAGE plpgsql;

-- Inserir aulas realizadas (passadas)
SELECT inserir_aula_com_alunos(
    '2025-04-15'::DATE,
    'realizada',
    'João Silva',
    ARRAY['Pedro Oliveira', 'Ana Costa', 'Lucas Martins']
);

SELECT inserir_aula_com_alunos(
    '2025-04-15'::DATE,
    'realizada',
    'Maria Santos',
    ARRAY['Carla Santos', 'Roberto Almeida']
);

-- Inserir aulas atuais
SELECT inserir_aula_com_alunos(
    '2025-04-16'::DATE,
    'atual',
    'João Silva',
    ARRAY['Lucas Martins', 'Roberto Almeida']
);

SELECT inserir_aula_com_alunos(
    '2025-04-16'::DATE,
    'atual',
    'Maria Santos',
    ARRAY['Ana Costa', 'Carla Santos']
);

-- Remover a função auxiliar
DROP FUNCTION IF EXISTS inserir_aula_com_alunos;

-- Mostrar resumo dos dados inseridos
SELECT 'Dados iniciais inseridos com sucesso!' as resultado,
       (SELECT COUNT(*) FROM professores) as total_professores,
       (SELECT COUNT(*) FROM alunos) as total_alunos,
       (SELECT COUNT(*) FROM exercicios) as total_exercicios,
       (SELECT COUNT(*) FROM aulas) as total_aulas,
       (SELECT COUNT(*) FROM aula_alunos) as total_relacoes_aula_alunos;
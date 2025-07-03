-- Função SIMPLIFICADA para excluir professor completo
-- Execute este script no Supabase SQL Editor

-- Remover função antiga
DROP FUNCTION IF EXISTS excluir_professor_completo(UUID);

-- Criar função simplificada
CREATE OR REPLACE FUNCTION excluir_professor_completo(prof_id UUID)
RETURNS JSON AS $$
DECLARE
    aulas_count INTEGER;
    result JSON;
BEGIN
    -- Contar aulas do professor
    SELECT COUNT(*) INTO aulas_count 
    FROM aulas WHERE professor_id = prof_id;
    
    -- Excluir relacionamentos aula_alunos
    DELETE FROM aula_alunos 
    WHERE aula_id IN (SELECT id FROM aulas WHERE professor_id = prof_id);
    
    -- Excluir aulas
    DELETE FROM aulas WHERE professor_id = prof_id;
    
    -- Excluir professor
    DELETE FROM professores WHERE id = prof_id;
    
    -- Retornar resultado
    result := json_build_object(
        'success', true,
        'message', 'Professor excluído com sucesso',
        'aulas_removidas', aulas_count
    );
    
    RETURN result;
    
EXCEPTION WHEN OTHERS THEN
    result := json_build_object(
        'success', false,
        'error', SQLERRM
    );
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Testar se foi criada
SELECT routine_name FROM information_schema.routines 
WHERE routine_name = 'excluir_professor_completo';

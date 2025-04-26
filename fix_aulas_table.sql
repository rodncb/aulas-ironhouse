-- Adiciona a coluna alunos como JSONB para armazenar dados dos alunos e a coluna observacoes
ALTER TABLE aulas 
ADD COLUMN IF NOT EXISTS alunos JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS observacoes TEXT;

-- Função para recarregar o cache do schema (pode ser necessário executar no cliente)
CREATE OR REPLACE FUNCTION reload_schema_cache() 
RETURNS VOID AS $$
BEGIN
  -- Esta função é apenas um placeholder
  -- O recarregamento real do cache ocorre no cliente
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- Atualiza os registros existentes convertendo as relações em aula_alunos para o formato JSONB
-- Este comando é uma sugestão para migração de dados existentes
/*
UPDATE aulas a
SET alunos = (
  SELECT jsonb_agg(jsonb_build_object(
    'id', al.id,
    'nome', al.nome,
    'idade', al.idade,
    'lesao', al.lesao,
    'observacoes', al.observacoes
  ))
  FROM aula_alunos aa
  JOIN alunos al ON aa.aluno_id = al.id
  WHERE aa.aula_id = a.id
);
*/

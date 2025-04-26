-- Adicionar coluna alunos como JSONB para armazenar os dados dos alunos associados à aula
ALTER TABLE aulas ADD COLUMN IF NOT EXISTS alunos JSONB DEFAULT '[]'::jsonb;

-- Adicionar coluna observacoes se ainda não existir
ALTER TABLE aulas ADD COLUMN IF NOT EXISTS observacoes TEXT;

-- Criando uma função para atualizar automaticamente os dados dos alunos
CREATE OR REPLACE FUNCTION update_aulas_alunos()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o trigger for chamado por DELETE, usamos OLD.aula_id
  IF (TG_OP = 'DELETE') THEN
    UPDATE aulas a
    SET alunos = (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', al.id,
        'nome', al.nome,
        'idade', al.idade,
        'lesao', al.lesao,
        'observacoes', al.observacoes
      )), '[]'::jsonb)
      FROM aula_alunos aa
      JOIN alunos al ON aa.aluno_id = al.id
      WHERE aa.aula_id = OLD.aula_id
    )
    WHERE a.id = OLD.aula_id;
    
    RETURN OLD;
  ELSE
    -- Para INSERT e UPDATE, usamos NEW.aula_id
    UPDATE aulas a
    SET alunos = (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', al.id,
        'nome', al.nome,
        'idade', al.idade,
        'lesao', al.lesao,
        'observacoes', al.observacoes
      )), '[]'::jsonb)
      FROM aula_alunos aa
      JOIN alunos al ON aa.aluno_id = al.id
      WHERE aa.aula_id = NEW.aula_id
    )
    WHERE a.id = NEW.aula_id;
    
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Criando trigger para manter a coluna alunos atualizada
DROP TRIGGER IF EXISTS update_aulas_alunos_trigger ON aula_alunos;
CREATE TRIGGER update_aulas_alunos_trigger
AFTER INSERT OR UPDATE OR DELETE ON aula_alunos
FOR EACH ROW
EXECUTE FUNCTION update_aulas_alunos();

-- Preencher dados iniciais para aulas existentes
UPDATE aulas a
SET alunos = (
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', al.id,
    'nome', al.nome,
    'idade', al.idade,
    'lesao', al.lesao,
    'observacoes', al.observacoes
  )), '[]'::jsonb)
  FROM aula_alunos aa
  JOIN alunos al ON aa.aluno_id = al.id
  WHERE aa.aula_id = a.id
);

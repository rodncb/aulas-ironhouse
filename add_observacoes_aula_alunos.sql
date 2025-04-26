-- Adicionar coluna observacoes na tabela aula_alunos
ALTER TABLE aula_alunos ADD COLUMN IF NOT EXISTS observacoes TEXT;

-- Comentário para documentar a coluna
COMMENT ON COLUMN aula_alunos.observacoes IS 'Observações específicas do aluno para esta aula';
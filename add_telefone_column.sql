-- Script para adicionar a coluna 'telefone' à tabela 'alunos'

-- Adiciona a coluna 'telefone' como VARCHAR
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS telefone VARCHAR;

-- Comentário para a coluna
COMMENT ON COLUMN alunos.telefone IS 'Número de telefone ou WhatsApp do aluno';

-- Log da operação
DO $$
BEGIN
  RAISE NOTICE 'Coluna telefone adicionada à tabela alunos com sucesso!';
END $$;
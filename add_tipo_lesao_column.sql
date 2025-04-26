-- Script para adicionar a coluna 'tipo_lesao' à tabela 'alunos'

-- Adiciona a coluna 'tipo_lesao' como TEXT (para armazenar descrições longas)
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS tipo_lesao TEXT;

-- Comentário para a coluna
COMMENT ON COLUMN alunos.tipo_lesao IS 'Descrição da lesão do aluno';

-- Log da operação
DO $$
BEGIN
  RAISE NOTICE 'Coluna tipo_lesao adicionada à tabela alunos com sucesso!';
END $$;
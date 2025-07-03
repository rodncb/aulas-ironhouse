-- Script para adicionar todas as colunas possivelmente faltantes à tabela 'alunos'

-- Adiciona a coluna 'telefone' se não existir
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS telefone VARCHAR;
COMMENT ON COLUMN alunos.telefone IS 'Número de telefone ou WhatsApp do aluno';

-- Adiciona a coluna 'tipo_lesao' se não existir
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS tipo_lesao TEXT;
COMMENT ON COLUMN alunos.tipo_lesao IS 'Descrição da lesão do aluno';

-- Adiciona a coluna 'plano' se não existir
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS plano VARCHAR DEFAULT '8 Check-in';
COMMENT ON COLUMN alunos.plano IS 'Plano de treino do aluno (8 Check-in, 12 Check-in, 16 Check-in, Premium)';

-- Adiciona a coluna 'nivel' se não existir
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS nivel VARCHAR DEFAULT 'Iniciante';
COMMENT ON COLUMN alunos.nivel IS 'Nível de experiência do aluno (Iniciante, Intermediário, Avançado)';

-- Adiciona a coluna 'observacoes' se não existir
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS observacoes TEXT;
COMMENT ON COLUMN alunos.observacoes IS 'Observações gerais sobre o aluno';

-- Adiciona a coluna 'status' se não existir
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'ativo';
COMMENT ON COLUMN alunos.status IS 'Status do aluno (ativo, inativo)';

-- Log da operação
DO $$
BEGIN
  RAISE NOTICE 'Todas as colunas necessárias foram adicionadas à tabela alunos com sucesso!';
END $$;
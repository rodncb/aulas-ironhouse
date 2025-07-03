-- Script para vincular professores aos usuários existentes no Supabase
-- Data: 28 de abril de 2025

-- 1. Atualizar os IDs dos professores para corresponder aos IDs dos usuários autenticados

-- Para Bruna da Costa
UPDATE professores
SET id = '3e00eb6f-8781-4adb-be0c-02810cdc470f'
WHERE nome = 'Bruna da Costa';

-- Para Rebeca Colasso
UPDATE professores
SET id = 'd6640310-b2f0-4209-b0b3-8679af11fbea'
WHERE nome = 'Rebeca Colasso';

-- Para Eduardo Freddy
UPDATE professores
SET id = 'fae503d2-dade-4010-9d8e-f22ac3a468c2'
WHERE nome = 'Eduardo Freddy';

-- Para Flávia J
UPDATE professores
SET id = '831cf87f-3ca4-4bd6-94e6-575c576ec728'
WHERE nome = 'Flávia J';

-- Se não existirem, criar os professores com os IDs corretos
DO $$
BEGIN
  -- Verificar se já existem professores com estes nomes/IDs
  IF NOT EXISTS (SELECT 1 FROM professores WHERE id = '3e00eb6f-8781-4adb-be0c-02810cdc470f') AND 
     NOT EXISTS (SELECT 1 FROM professores WHERE nome = 'Bruna da Costa') THEN
    INSERT INTO professores (id, nome, idade, especialidade)
    VALUES ('3e00eb6f-8781-4adb-be0c-02810cdc470f', 'Bruna da Costa', 36, 'Pilates');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM professores WHERE id = 'd6640310-b2f0-4209-b0b3-8679af11fbea') AND
     NOT EXISTS (SELECT 1 FROM professores WHERE nome = 'Rebeca Colasso') THEN
    INSERT INTO professores (id, nome, idade, especialidade)
    VALUES ('d6640310-b2f0-4209-b0b3-8679af11fbea', 'Rebeca Colasso', 23, 'Fisioterapia');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM professores WHERE id = 'fae503d2-dade-4010-9d8e-f22ac3a468c2') AND
     NOT EXISTS (SELECT 1 FROM professores WHERE nome = 'Eduardo Freddy') THEN
    INSERT INTO professores (id, nome, idade, especialidade)
    VALUES ('fae503d2-dade-4010-9d8e-f22ac3a468c2', 'Eduardo Freddy', 26, 'Musculação');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM professores WHERE id = '831cf87f-3ca4-4bd6-94e6-575c576ec728') AND
     NOT EXISTS (SELECT 1 FROM professores WHERE nome = 'Flávia J') THEN
    INSERT INTO professores (id, nome, idade, especialidade)
    VALUES ('831cf87f-3ca4-4bd6-94e6-575c576ec728', 'Flávia J', 28, 'Personal Trainer');
  END IF;
END
$$;

-- 2. Adicionar email à tabela professores (se a coluna existir)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'professores' AND column_name = 'email'
  ) THEN
    -- Atualizar os emails dos professores
    UPDATE professores
    SET email = 'bruninhacosta489@gmail.com'
    WHERE id = '3e00eb6f-8781-4adb-be0c-02810cdc470f';

    UPDATE professores
    SET email = 'colassorebeca@gmail.com'
    WHERE id = 'd6640310-b2f0-4209-b0b3-8679af11fbea';
    
    UPDATE professores
    SET email = 'carlos_freddi@hotmail.com'
    WHERE id = 'fae503d2-dade-4010-9d8e-f22ac3a468c2';
    
    UPDATE professores
    SET email = 'flavinha.fray1995@gmail.com'
    WHERE id = '831cf87f-3ca4-4bd6-94e6-575c576ec728';
  END IF;
END
$$;

-- 3. Atualizar metadados dos usuários para definir role=professor
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"professor"'
)
WHERE id IN (
  '3e00eb6f-8781-4adb-be0c-02810cdc470f',
  'd6640310-b2f0-4209-b0b3-8679af11fbea',
  'fae503d2-dade-4010-9d8e-f22ac3a468c2',
  '831cf87f-3ca4-4bd6-94e6-575c576ec728'
);

-- Verificar se os registros foram criados/atualizados corretamente
-- Corrigindo o erro da incompatibilidade de tipos uuid e text
SELECT p.id, p.nome, p.especialidade, 
       au.email, au.raw_user_meta_data
FROM professores p
JOIN auth.users au ON p.id::uuid = au.id
WHERE p.id IN (
  '3e00eb6f-8781-4adb-be0c-02810cdc470f',
  'd6640310-b2f0-4209-b0b3-8679af11fbea',
  'fae503d2-dade-4010-9d8e-f22ac3a468c2',
  '831cf87f-3ca4-4bd6-94e6-575c576ec728'
);
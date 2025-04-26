-- Script para sincronizar os IDs dos professores com os IDs do Supabase Auth
-- Execute este script no SQL Editor do painel do Supabase

-- ETAPA 1: Criar uma tabela temporária para mapear os IDs dos professores
CREATE TEMP TABLE professor_id_map (
    nome TEXT,
    id_atual UUID,
    id_novo UUID
);

-- ETAPA 2: Inserir o mapeamento dos IDs atuais para os novos IDs
INSERT INTO professor_id_map (nome, id_novo)
VALUES
  ('Alex Molina', '27a803e6-7ded-4a40-9829-9aadb3ee41ae'),
  ('Felipe Barbosa', '9c51be79-6418-40d5-91d0-18c49b8c9dce'),
  ('Pedro Pacheco', '3211f123-8a12-4195-b6c7-53a4cb3d0aae'),
  ('Alef Guimarães', 'cf060174-6f8f-49a6-acc4-fed7f28001af'),
  ('Gabriel Medeiros', 'ada1bd83-c338-489e-923f-cc61a6d95cab'),
  ('Reinaldo Oliveira', '3248a93e-7880-45dc-b5f5-c3f47a5ee3c6'),
  ('Filipe Florenzano', 'd87b563c-7a05-4785-9687-727d3b57197d'),
  ('Patrick Salgado', '39dd99bf-461a-48df-a2fc-51097b6190e8'),
  ('Hellen Almeida', '7625bd7f-bafb-49a5-aade-2749caf27b64'),
  ('Alexia Carvalho', '2ee23275-0625-48f4-b043-c7ba81f2ec85'),
  ('Flávia J', '831cf87f-3ca4-4bd6-94e6-575c576ec728');

-- ETAPA 3: Atualizar os IDs atuais na tabela de mapeamento
UPDATE professor_id_map m
SET id_atual = p.id
FROM public.professores p
WHERE m.nome = p.nome;

-- ETAPA 4: Verificar o mapeamento (opcional)
SELECT * FROM professor_id_map;

-- ETAPA 5: Primeiro, desativar temporariamente a restrição de chave estrangeira
ALTER TABLE public.aulas DROP CONSTRAINT IF EXISTS aulas_professor_id_fkey;

-- ETAPA 6: Criar uma coluna temporária para armazenar o novo ID do professor
ALTER TABLE public.aulas ADD COLUMN IF NOT EXISTS temp_professor_id UUID;

-- ETAPA 7: Atualizar a coluna temporária com os novos IDs mapeados
UPDATE public.aulas a
SET temp_professor_id = m.id_novo
FROM professor_id_map m
WHERE a.professor_id = m.id_atual;

-- ETAPA 8: Atualizar a coluna professor_id com os valores da coluna temporária
UPDATE public.aulas 
SET professor_id = temp_professor_id 
WHERE temp_professor_id IS NOT NULL;

-- ETAPA 9: Remover a coluna temporária
ALTER TABLE public.aulas DROP COLUMN IF EXISTS temp_professor_id;

-- ETAPA 10: Agora atualizar os IDs dos professores sem conflitos
UPDATE public.professores p
SET id = m.id_novo
FROM professor_id_map m
WHERE p.id = m.id_atual;

-- ETAPA 11: Recriar a restrição de chave estrangeira
ALTER TABLE public.aulas
ADD CONSTRAINT aulas_professor_id_fkey
FOREIGN KEY (professor_id)
REFERENCES public.professores(id);

-- ETAPA 12: Verificar os professores atualizados
SELECT * FROM public.professores;

-- ETAPA 13: Verificar se as aulas estão corretamente vinculadas aos professores
SELECT a.id, a.data, a.professor_id, p.nome as nome_professor
FROM public.aulas a
JOIN public.professores p ON a.professor_id = p.id
LIMIT 10;
-- Script para adicionar emails aos professores existentes
-- Execute este script no SQL Editor do painel do Supabase

-- Verificar se a coluna email existe, caso contrário, criar
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'professores' AND column_name = 'email'
  ) THEN
    ALTER TABLE public.professores ADD COLUMN email TEXT;
  END IF;
END$$;

-- Atualizar os emails dos professores
UPDATE public.professores SET email = 'alexmolina.11@hotmail.com' WHERE id = '27a803e6-7ded-4a40-9829-9aadb3ee41ae';
UPDATE public.professores SET email = 'felipe2021eg@gmail.com' WHERE id = '9c51be79-6418-40d5-91d0-18c49b8c9dce';
UPDATE public.professores SET email = 'pedropsr@icloud.com' WHERE id = '3211f123-8a12-4195-b6c7-53a4cb3d0aae';
UPDATE public.professores SET email = 'alefmts22@gmail.com' WHERE id = 'cf060174-6f8f-49a6-acc4-fed7f28001af';
UPDATE public.professores SET email = 'gavriel.albu13@gmail.com' WHERE id = 'ada1bd83-c338-489e-923f-cc61a6d95cab';
UPDATE public.professores SET email = 'nal-dinho07@hotmail.com' WHERE id = '3248a93e-7880-45dc-b5f5-c3f47a5ee3c6';
UPDATE public.professores SET email = 'lipifp17@hotmail.com' WHERE id = 'd87b563c-7a05-4785-9687-727d3b57197d';
UPDATE public.professores SET email = 'patrick.salgado1@gmail.com' WHERE id = '39dd99bf-461a-48df-a2fc-51097b6190e8';
UPDATE public.professores SET email = 'hcmoura11@gmail.com' WHERE id = '7625bd7f-bafb-49a5-aade-2749caf27b64';
UPDATE public.professores SET email = 'alexia2811@icloud.com' WHERE id = '2ee23275-0625-48f4-b043-c7ba81f2ec85';
UPDATE public.professores SET email = 'flavinha.fray1995@gmail.com' WHERE id = '831cf87f-3ca4-4bd6-94e6-575c576ec728';

-- Verificar os resultados
SELECT id, nome, email FROM public.professores;
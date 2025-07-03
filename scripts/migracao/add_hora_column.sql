-- Script para adicionar a coluna 'hora' à tabela 'aulas' no Supabase
-- Esta coluna vai armazenar o horário de início/fim das aulas no formato HH:MM

-- Verifica se a coluna já existe para evitar erros
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'aulas' AND column_name = 'hora'
    ) THEN
        -- Adicionar a coluna 'hora' à tabela 'aulas'
        ALTER TABLE aulas ADD COLUMN hora VARCHAR(5);
        
        -- Adicionar um comentário explicando o propósito da coluna
        COMMENT ON COLUMN aulas.hora IS 'Armazena o horário de início ou fim da aula no formato HH:MM';
    END IF;
END $$;

-- Confirmar que a coluna foi adicionada
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'aulas' AND column_name = 'hora';

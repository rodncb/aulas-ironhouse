-- Verificar a estrutura atual da tabela aulas
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'aulas' 
ORDER BY ordinal_position;

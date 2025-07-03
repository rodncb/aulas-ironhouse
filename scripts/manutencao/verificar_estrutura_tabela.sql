-- Script para verificar a estrutura da tabela alunos
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'alunos'
ORDER BY ordinal_position;
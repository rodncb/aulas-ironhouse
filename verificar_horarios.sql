-- Script para verificar se os horários foram atualizados corretamente
-- Execute este script no Supabase Dashboard para verificar os dados

-- 1. Verificar todas as aulas e seus horários
SELECT 
  id,
  data,
  hora,
  status,
  created_at
FROM aulas
ORDER BY created_at DESC
LIMIT 10;

-- 2. Contar aulas por status e presença de horário
SELECT 
  status,
  COUNT(*) as total,
  COUNT(CASE WHEN hora IS NOT NULL AND hora != '' THEN 1 END) as com_hora,
  COUNT(CASE WHEN hora IS NULL OR hora = '' THEN 1 END) as sem_hora
FROM aulas
GROUP BY status;

-- 3. Verificar especificamente aulas realizadas/finalizadas
SELECT 
  id,
  data,
  hora,
  status,
  created_at
FROM aulas
WHERE status IN ('realizada', 'finalizada')
ORDER BY created_at DESC
LIMIT 5;

-- 4. Verificar se existem valores '00:00' ou nulos
SELECT 
  id,
  data,
  hora,
  status
FROM aulas
WHERE hora IS NULL OR hora = '00:00' OR hora = ''
LIMIT 10;

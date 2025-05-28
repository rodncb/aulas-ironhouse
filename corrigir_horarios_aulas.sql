-- Script para corrigir valores de horário nas aulas
-- Este script corrige as aulas que não têm horário registrado

-- 1. Listar estatísticas atuais - quantas aulas têm ou não têm horário
SELECT 
  status,
  COUNT(*) AS total,
  COUNT(CASE WHEN hora IS NOT NULL THEN 1 END) AS com_hora,
  COUNT(CASE WHEN hora IS NULL THEN 1 END) AS sem_hora
FROM 
  aulas
GROUP BY 
  status;

-- 2. Atualizar aulas em andamento sem horário para o horário atual
UPDATE aulas
SET hora = to_char(now(), 'HH24:MI')  -- formato HH:MM
WHERE hora IS NULL 
AND status = 'em_andamento';

-- 3. Atualizar aulas finalizadas sem horário para '23:59'
UPDATE aulas
SET hora = '23:59'
WHERE hora IS NULL 
AND (status = 'finalizada' OR status = 'realizada');

-- 4. Atualizar aulas canceladas sem horário para um valor padrão
UPDATE aulas
SET hora = '00:00'
WHERE hora IS NULL 
AND status = 'cancelada';

-- 5. Verificar se todas as aulas têm horário registrado após as atualizações
SELECT 
  status,
  COUNT(*) AS total,
  COUNT(CASE WHEN hora IS NOT NULL THEN 1 END) AS com_hora,
  COUNT(CASE WHEN hora IS NULL THEN 1 END) AS sem_hora
FROM 
  aulas
GROUP BY 
  status;

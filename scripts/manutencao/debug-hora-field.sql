-- Verifica se a coluna hora está sendo preenchida corretamente
-- Esse script ajuda a debugar o campo hora nas aulas

-- Verifica as últimas 10 aulas criadas
SELECT 
  id, 
  data, 
  status, 
  hora,
  created_at
FROM 
  aulas 
ORDER BY 
  created_at DESC 
LIMIT 10;

-- Verifica quantidade de aulas com hora preenchida
SELECT 
  COUNT(*) AS total_aulas,
  COUNT(CASE WHEN hora IS NOT NULL THEN 1 END) AS aulas_com_hora,
  COUNT(CASE WHEN hora IS NULL THEN 1 END) AS aulas_sem_hora
FROM 
  aulas;

-- Verifica aulas por status
SELECT 
  status,
  COUNT(*) AS total,
  COUNT(CASE WHEN hora IS NOT NULL THEN 1 END) AS com_hora,
  COUNT(CASE WHEN hora IS NULL THEN 1 END) AS sem_hora
FROM 
  aulas
GROUP BY 
  status;

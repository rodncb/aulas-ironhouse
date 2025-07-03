-- SCRIPT DE VERIFICAÇÃO PÓS-EXCLUSÃO CORRIGIDO
-- Execute após excluir a duplicata

-- =============================================
-- VERIFICAÇÃO BÁSICA (SEM ASSUMIR COLUNAS)
-- =============================================

-- 1. Contar quantas Flávias restaram
SELECT 
    'TOTAL FLAVIAS' as tipo,
    COUNT(*) as quantidade,
    STRING_AGG(nome, ' | ') as nomes
FROM professores 
WHERE nome ILIKE '%flavia%' OR nome ILIKE '%flávia%';

-- 2. Mostrar a Flávia que restou (apenas colunas que sabemos que existem)
SELECT 
    'FLAVIA RESTANTE' as tipo,
    id,
    nome,
    idade,
    especialidade,
    created_at
FROM professores 
WHERE nome ILIKE '%flavia%' OR nome ILIKE '%flávia%';

-- 3. Verificar usuário no Supabase Auth
SELECT 
    'USUARIO SUPABASE' as tipo,
    id,
    email,
    created_at,
    last_sign_in_at,
    email_confirmed_at,
    CASE 
        WHEN banned_until IS NULL OR banned_until < NOW() THEN '✅ ATIVO'
        ELSE '🔒 BANIDO até ' || banned_until::date
    END as status_usuario
FROM auth.users 
WHERE email = 'flavinha.fray1995@gmail.com';

-- 4. Verificar se existe perfil (só se a tabela profiles tiver dados)
SELECT 
    'PERFIL' as tipo,
    COUNT(*) as perfis_encontrados
FROM profiles 
WHERE nome ILIKE '%flavia%' OR nome ILIKE '%flávia%';

-- Se encontrou perfis, mostrar detalhes (sem coluna tipo)
SELECT 
    'DETALHES PERFIL' as tipo,
    id,
    nome,
    created_at
FROM profiles 
WHERE nome ILIKE '%flavia%' OR nome ILIKE '%flávia%'
LIMIT 1;

-- 5. Verificar aulas da Flávia correta
SELECT 
    'AULAS DA FLAVIA' as tipo,
    COUNT(*) as total_aulas,
    COUNT(CASE WHEN status = 'confirmada' THEN 1 END) as aulas_confirmadas,
    COUNT(CASE WHEN status = 'cancelada' THEN 1 END) as aulas_canceladas,
    MIN(data) as primeira_aula,
    MAX(data) as ultima_aula
FROM aulas 
WHERE professor_id = '831cf87f-3ca4-4bd6-94e6-575c576ec728';

-- 6. Verificar aulas transferidas (que têm a observação especial)
SELECT 
    'AULAS TRANSFERIDAS' as tipo,
    COUNT(*) as total_transferidas
FROM aulas 
WHERE professor_id = '831cf87f-3ca4-4bd6-94e6-575c576ec728'
  AND observacoes LIKE '%TRANSFERIDO DE PROFESSOR DUPLICADO%';

-- 7. Últimas 3 aulas da Flávia
SELECT 
    'ULTIMAS AULAS' as tipo,
    id,
    data,
    status,
    CASE 
        WHEN observacoes LIKE '%TRANSFERIDO%' THEN '📋 Transferida'
        ELSE '📅 Original'
    END as origem
FROM aulas 
WHERE professor_id = '831cf87f-3ca4-4bd6-94e6-575c576ec728'
ORDER BY data DESC, created_at DESC
LIMIT 3;

-- 8. Verificar se não há referências órfãs
SELECT 
    'REFERENCIAS ORFAS' as tipo,
    COUNT(*) as aulas_sem_professor
FROM aulas 
WHERE professor_id IS NULL;

-- 9. Confirmar que a duplicata foi removida
SELECT 
    'CONFIRMACAO EXCLUSAO' as tipo,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ DUPLICATA REMOVIDA COM SUCESSO'
        ELSE '❌ DUPLICATA AINDA EXISTE'
    END as status
FROM professores 
WHERE id = '389187e0-ab94-48ea-92e4-1d66c222e4f1';

-- 10. Resumo final
SELECT 
    'RESUMO FINAL' as tipo,
    (SELECT COUNT(*) FROM professores WHERE nome ILIKE '%flavia%') as flavias_restantes,
    (SELECT COUNT(*) FROM aulas WHERE professor_id = '831cf87f-3ca4-4bd6-94e6-575c576ec728') as total_aulas_flavia,
    (SELECT COUNT(*) FROM auth.users WHERE email = 'flavinha.fray1995@gmail.com') as usuario_existe,
    CASE 
        WHEN (SELECT COUNT(*) FROM professores WHERE nome ILIKE '%flavia%') = 1 THEN '✅ SUCESSO'
        ELSE '❌ VERIFICAR'
    END as resultado;

-- =============================================
-- INSTRUÇÕES DE TESTE
-- =============================================

/*
PARA TESTAR O LOGIN:

1. Acesse a interface do sistema
2. Use as credenciais:
   - Email: flavinha.fray1995@gmail.com
   - Senha: Flavia@house
3. Verifique se:
   - Login é aceito ✅
   - Nome aparece como "Flávia J" ✅
   - Não há duplicação na lista ✅
   - Aulas anteriores estão preservadas ✅

RESULTADO ESPERADO:
- FLAVIAS_RESTANTES: 1
- USUARIO_EXISTE: 1  
- RESULTADO: ✅ SUCESSO
*/

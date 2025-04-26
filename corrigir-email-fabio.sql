-- Script para corrigir o email do usuário Fabio Augusto no Supabase
-- Execute este script no SQL Editor do painel administrativo do Supabase

-- ATENÇÃO: Este script precisa ser executado por um usuário com permissões de administrador no Supabase

-- Atualize o email na tabela auth.users (sistema de autenticação do Supabase)
UPDATE auth.users 
SET email = 'fabioaugustogp@gmail.com'  -- Email correto com o "l" adicionado
WHERE id = '7318009d-8a2a-4ec8-a8fb-34d7bd74f6ba';  -- ID do usuário Fabio Augusto
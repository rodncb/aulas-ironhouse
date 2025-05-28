# Documentação: Sistema de Horários de Aulas

## Visão Geral

O sistema de registro automático de horários para aulas no Ironhouse foi implementado para capturar quando as aulas começam e terminam, sem necessidade de entrada manual.

## Como Funciona

### Registro de Horário de Início

- Quando uma aula é criada, o horário atual é automaticamente capturado no campo `hora`
- Isso ocorre tanto na criação manual quanto automática de aulas

### Registro de Horário de Término

- Quando uma aula é finalizada, o horário atual é registrado no campo `hora`
- Para aulas finalizadas automaticamente pelo sistema (fim de dia), o horário "23:59" é registrado

### Exibição no Histórico do Aluno

- O histórico de aulas exibe os horários registrados
- Para aulas em andamento: mostra o horário de início
- Para aulas finalizadas: mostra o horário em que a aula foi finalizada

## Arquivos Relevantes

1. `/src/components/DetalheAluno.jsx` - Exibe o histórico de aulas com horários
2. `/src/components/Sala.jsx` - Registra horários ao criar/finalizar aulas
3. `/src/services/aulas.service.js` - Serviços para gerenciar aulas e horários

## Scripts de Correção

Se algumas aulas tiverem problemas com horários faltando:

- Execute o script `corrigir_horarios_aulas.sql` no SQL Editor do Supabase
- Ou execute o script `fix-missing-hora-values.js` via Node.js

## Limitações Atuais

- O sistema atualmente armazena apenas um único valor de horário por aula
- Para aulas finalizadas, esse valor representa o horário de término da aula

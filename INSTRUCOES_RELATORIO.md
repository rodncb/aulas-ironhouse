# Instruções para Configurar o Relatório de Aulas

## Passo 1: Executar o Script SQL

1. Acesse o **Supabase Dashboard** do seu projeto
2. Vá para **SQL Editor** no menu lateral
3. Copie e cole o conteúdo do arquivo `add_periodo_column_and_data.sql`
4. Clique em **Run** para executar o script

## O que o script faz:

1. **Adiciona a coluna `periodo`** à tabela `aulas`
2. **Popula períodos existentes** baseado no horário de criação:
   - Manhã: 6h às 11h
   - Tarde: 12h às 17h  
   - Noite: 18h às 23h
3. **Cria aulas de exemplo** para diferentes dias da semana e status diversos
4. **Mostra estatísticas** do que foi criado

## Passo 2: Testar o Relatório

Após executar o script:

1. Acesse a aplicação como **administrador**
2. Vá para o menu **Relatórios** 
3. Selecione "Relatório de Aulas por Professor e Período"
4. Agora você deve conseguir:
   - Selecionar professores no filtro (ou "Todos os Professores")
   - Selecionar períodos (Manhã, Tarde, Noite ou "Todos os Períodos")
   - Ver todas as aulas conforme os filtros selecionados

## Resultado Esperado:

- Filtros funcionando corretamente
- Dados de aulas sendo exibidos conforme seleção
- Possibilidade de exportar o relatório
- Contadores mostrando total de aulas por filtro
- **Relatório flexível**: o usuário controla quais dados ver

## Troubleshooting:

Se não aparecerem dados:
1. Verifique se há professores cadastrados no sistema
2. Confirme que o script foi executado sem erros
3. Verifique os logs do console no navegador para erros de carregamento

## Estrutura dos Períodos:

Os períodos são categorizados como:
- **Manhã**: Das 6h às 11h59
- **Tarde**: Das 12h às 17h59  
- **Noite**: Das 18h às 23h59

Você pode ajustar esses períodos diretamente no banco de dados conforme necessário.

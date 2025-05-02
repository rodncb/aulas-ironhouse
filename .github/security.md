# Política de Segurança

## Vulnerabilidades Reportadas

Este projeto utiliza o React-Scripts (Create React App) que contém algumas dependências de desenvolvimento com vulnerabilidades conhecidas. Estas vulnerabilidades:

1. **Não afetam o ambiente de produção**, pois estão relacionadas apenas a ferramentas de build
2. Estão em **dependências transitivas profundas** que não podem ser facilmente atualizadas sem impacto na estabilidade
3. Foram **avaliadas e consideradas de baixo risco** para este tipo de aplicação

## Mitigações Implementadas

- Atualizamos o `react-router-dom` para a versão mais recente (7.5.3+) que corrige importantes vulnerabilidades
- Configuramos o Dependabot para ignorar falsos positivos ou vulnerabilidades em código não executado em produção
- Mantemos revisões regulares de segurança para identificar novos problemas

## Reportando Novas Vulnerabilidades

Se você descobrir uma vulnerabilidade de segurança, por favor reporte através de uma Issue privada no GitHub ou entre em contato com os mantenedores do projeto.

Obrigado por ajudar a manter este projeto seguro!
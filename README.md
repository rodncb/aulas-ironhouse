# Sistema de Gestão de Aulas - IronHouse

Sistema completo para gestão de aulas, professores, alunos e relatórios desenvolvido em React com Supabase.

## 🚀 Funcionalidades

### Gestão de Professores
- ✅ Cadastro, edição e listagem de professores
- ✅ Exclusão completa de professores (remove aulas e relacionamentos)
- ✅ Validação de dados e prevenção de duplicatas

### Gestão de Alunos
- ✅ Cadastro, edição e listagem de alunos
- ✅ Controle de dados pessoais e informações médicas
- ✅ Gestão de tipos de lesão e observações

### Gestão de Aulas
- ✅ Agendamento e controle de aulas
- ✅ Vinculação professor-aluno
- ✅ Controle de presença e pontualidade
- ✅ Gestão de horários e períodos

### Relatórios
- ✅ **Relatório de Volume de Aulas**: Contagem de participações por período
- ✅ **Relatório de KPI**: Indicadores de pontualidade e frequência
- ✅ **Relatório Horário/Professor**: Visualização com cores de pontualidade

## 🛠️ Tecnologias

- **Frontend**: React 18, CSS Modules
- **Backend**: Supabase (PostgreSQL + Auth + RPC)
- **Deploy**: Vercel/Netlify
- **Autenticação**: Supabase Auth

## 📦 Instalação

1. Clone o repositório:
```bash
git clone [URL_DO_REPOSITORIO]
cd aulas-ironhouse
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
# Crie um arquivo .env.local
REACT_APP_SUPABASE_URL=sua_url_supabase
REACT_APP_SUPABASE_ANON_KEY=sua_chave_supabase
```

4. Execute o projeto:
```bash
npm start
```

## 🗄️ Banco de Dados

### Configuração do Supabase

1. **Estrutura das tabelas**: Execute `scripts/migracao/supabase-structure.sql`
2. **Dados iniciais**: Execute `scripts/migracao/dados_iniciais.sql`
3. **Função de exclusão**: Execute `scripts/setup/funcao-excluir-simples.sql`

### Scripts Disponíveis

#### Migração
- `scripts/migracao/supabase-structure.sql` - Estrutura completa das tabelas
- `scripts/migracao/dados_iniciais.sql` - Dados básicos para funcionamento

#### Setup
- `scripts/setup/funcao-excluir-simples.sql` - Função RPC para exclusão de professores
- `scripts/setup/inserir-professores.cjs` - Script para inserir professores via API

#### Manutenção
- `scripts/manutencao/` - Scripts para verificação e manutenção do sistema

#### Usuários
- `scripts/usuarios/` - Scripts para gestão de usuários e vinculação

## 🚀 Deploy

### Build para Produção
```bash
npm run build
```

### Deploy Automático
O projeto está configurado para deploy automático via:
- **Vercel**: Conectado ao repositório GitHub
- **Netlify**: Build da pasta `build/`

## 📊 Relatórios

### Volume de Aulas
- Contagem de participações por período
- Filtros por data, professor e aluno
- Exclusão automática de aulas vazias

### KPI de Pontualidade
- Indicadores visuais de pontualidade
- Legendas com cores (Verde/Amarelo/Vermelho)
- Métricas de frequência

### Horário/Professor
- Grade visual com cores de pontualidade
- Filtros por período e professor
- Exportação de dados

## 🔧 Manutenção

### Logs e Monitoramento
- Logs de erro integrados no frontend
- Monitoramento via Supabase Dashboard
- Alertas de performance

### Backup
- Backup automático via Supabase
- Scripts de verificação de integridade
- Recuperação de dados

## 📞 Suporte

Para suporte técnico ou dúvidas sobre o sistema:
- Documentação: Consulte este README
- Issues: Use o sistema de issues do GitHub
- Contato: [seu-email@exemplo.com]

## 📝 Licença

Este projeto é propriedade da IronHouse. Todos os direitos reservados.

---

**Última atualização**: Julho 2025  
**Versão**: 2.0.0 - Sistema completo com relatórios aprimorados e exclusão de professores

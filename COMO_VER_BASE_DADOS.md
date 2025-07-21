# Como Ver e Gerir a Sua Base de Dados

## Opção 1: Interface Web do Neon Database (Mais Fácil)

### Passo 1: Aceder ao Dashboard
1. Vá a https://neon.tech
2. Faça login na sua conta
3. Selecione o projeto da sua aplicação

### Passo 2: Usar o Query Editor
1. No dashboard, clique em "SQL Editor" 
2. Pode executar consultas SQL diretamente
3. Exemplos de consultas úteis:

```sql
-- Ver todas as empresas
SELECT * FROM companies LIMIT 10;

-- Ver todos os projetos
SELECT * FROM projects LIMIT 10;

-- Ver investimentos recentes
SELECT * FROM investments ORDER BY created_at DESC LIMIT 10;

-- Ver estatísticas gerais
SELECT 
  (SELECT COUNT(*) FROM users) as total_usuarios,
  (SELECT COUNT(*) FROM companies) as total_empresas,
  (SELECT COUNT(*) FROM projects) as total_projetos;
```

## Opção 2: Ferramenta de Admin no Próprio Site

Vou criar uma página de administração da base de dados no seu site.

## Opção 3: pgAdmin (Ferramenta Profissional)

### Configuração:
1. Baixe pgAdmin em https://www.pgadmin.org/
2. Crie nova conexão servidor
3. Use as credenciais do Neon Database
4. Interface completa para gerir tabelas, dados, etc.

## Opção 4: Linha de Comandos (No Replit)

Execute no terminal do Replit:
```bash
# Ver estrutura das tabelas
npm run db:studio

# Ou usar psql diretamente (se disponível)
psql $DATABASE_URL
```

## Consultas Úteis para Ver Dados

### Ver Empresas Registadas:
```sql
SELECT 
  c.name as empresa,
  u.email,
  c.sector,
  c.created_at as registado_em
FROM companies c
JOIN users u ON c.user_id = u.id
ORDER BY c.created_at DESC;
```

### Ver Projectos e Investimentos:
```sql
SELECT 
  p.name as projecto,
  p.description,
  p.sdg_number,
  COALESCE(SUM(i.amount), 0) as total_investido
FROM projects p
LEFT JOIN investments i ON p.id = i.project_id
GROUP BY p.id, p.name, p.description, p.sdg_number
ORDER BY total_investido DESC;
```

### Ver Actividade Recente:
```sql
-- Últimos registos
SELECT 'Empresa' as tipo, name as nome, created_at 
FROM companies 
UNION ALL
SELECT 'Projecto' as tipo, name as nome, created_at 
FROM projects
ORDER BY created_at DESC LIMIT 20;
```

## Backup dos Dados

### Fazer Download dos Dados:
```sql
-- Exportar empresas
COPY companies TO '/tmp/empresas.csv' WITH CSV HEADER;

-- Exportar projectos  
COPY projects TO '/tmp/projectos.csv' WITH CSV HEADER;
```
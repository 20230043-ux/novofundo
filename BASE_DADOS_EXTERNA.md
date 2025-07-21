# Guia: Como Conectar a uma Base de Dados Externa

## Por que usar uma base de dados externa?

O Replit hiberna aplicações gratuitas após inatividade, incluindo a base de dados. Usar uma base de dados externa resolve este problema porque:
- As bases de dados externas nunca hibernam
- Seus dados ficam sempre disponíveis
- Melhor performance e estabilidade

## Opção 1: Neon Database (Recomendado)

### Passo 1: Criar conta no Neon
1. Acesse https://neon.tech
2. Clique em "Sign Up" 
3. Crie uma conta gratuita

### Passo 2: Criar base de dados
1. No dashboard, clique em "Create Project"
2. Escolha um nome para o projeto (ex: "fundo-verde")
3. Selecione região mais próxima de Angola (Europe - Frankfurt)
4. Clique em "Create Project"

### Passo 3: Obter URL de conexão
1. No dashboard do projeto, vá em "Connection string"
2. Copie a URL que começa com `postgresql://`
3. Exemplo: `postgresql://username:password@host.neon.tech/database`

### Passo 4: Configurar no Replit
1. No Replit, vá nas configurações do projeto (ícone de engrenagem)
2. Clique em "Secrets" (ou "Environment variables")
3. Adicione uma nova variável:
   - Nome: `DATABASE_URL`
   - Valor: Cole a URL do Neon aqui

### Passo 5: Migrar dados
Execute estes comandos no terminal do Replit:
```bash
# Aplicar schema na nova base de dados
npm run db:push

# Popular com dados iniciais
npm run db:seed
```

## Opção 2: Supabase

### Passo 1: Criar conta
1. Acesse https://supabase.com
2. Clique em "Start your project"
3. Crie conta gratuita

### Passo 2: Criar projeto
1. Clique em "New Project"
2. Escolha nome: "fundo-verde"
3. Crie uma senha forte
4. Selecione região: "West EU (Ireland)"
5. Clique em "Create new project"

### Passo 3: Obter URL de conexão
1. No dashboard, vá em "Settings" > "Database"
2. Procure por "Connection string"
3. Copie a URL da seção "URI"
4. Substitua `[YOUR-PASSWORD]` pela senha que criou

### Passo 4: Configurar no Replit
1. Adicione a variável `DATABASE_URL` com a URL do Supabase
2. Execute `npm run db:push` e `npm run db:seed`

## Como Verificar se Funcionou

1. Reinicie sua aplicação no Replit
2. Verifique os logs - deve aparecer: "✅ Banco de dados conectado com sucesso!"
3. Teste registrar uma empresa e fazer login
4. Os dados devem persistir mesmo se o Replit hibernar

## Vantagens de Cada Opção

### Neon Database
- ✅ Mais fácil de configurar
- ✅ Interface simples
- ✅ Específico para PostgreSQL
- ❌ Limite de 512MB

### Supabase  
- ✅ Mais recursos (500MB)
- ✅ Interface de administração
- ✅ Backups automáticos
- ❌ Mais complexo

## Problemas Comuns

### Erro de conexão
- Verifique se a URL está correta
- Confirme que copiou a senha corretamente
- Teste a conexão diretamente no terminal

### Schema não encontrado
- Execute `npm run db:push` para criar as tabelas
- Execute `npm run db:seed` para dados iniciais

### Dados não aparecem
- Confirme que está usando a nova `DATABASE_URL`
- Verifique se os dados foram migrados corretamente

## Suporte

Se tiver problemas, verifique:
1. A variável `DATABASE_URL` está configurada corretamente
2. A base de dados externa está acessível
3. O schema foi aplicado com `npm run db:push`
4. Os dados iniciais foram carregados com `npm run db:seed`
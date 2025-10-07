# 🚀 Guia de Deploy no Vercel - Fundo Verde

Este projeto foi adaptado para funcionar completamente no Vercel de forma **100% GRATUITA**.

## 📋 Pré-requisitos

### 1. Conta Vercel (Grátis)
- Crie uma conta em: https://vercel.com/signup
- Conecte seu GitHub/GitLab

### 2. Banco de Dados Neon (Grátis)
- Já configurado! Seu `DATABASE_URL` atual funciona perfeitamente
- Neon nunca hiberna e tem plano gratuito generoso

### 3. Cloudinary (Plano Grátis)
1. Crie conta: https://cloudinary.com/users/register/free
2. Acesse o Dashboard
3. Copie:
   - Cloud Name
   - API Key
   - API Secret

### 4. Pusher Channels (Plano Grátis)
1. Crie conta: https://pusher.com/channels
2. Crie um novo App
3. Copie:
   - App ID
   - Key
   - Secret
   - Cluster (ex: us2)

## 🔧 Configuração

### Passo 1: Variáveis de Ambiente no Vercel

1. Acesse seu projeto no Vercel
2. Vá em **Settings** → **Environment Variables**
3. Adicione as seguintes variáveis:

```bash
# Database
DATABASE_URL=<seu-neon-database-url>

# JWT
JWT_SECRET=<gere-uma-chave-secreta-forte>

# Cloudinary
CLOUDINARY_CLOUD_NAME=<seu-cloud-name>
CLOUDINARY_API_KEY=<sua-api-key>
CLOUDINARY_API_SECRET=<sua-api-secret>

# Pusher
PUSHER_APP_ID=<seu-app-id>
PUSHER_KEY=<sua-key>
PUSHER_SECRET=<seu-secret>
PUSHER_CLUSTER=<seu-cluster>

# Frontend (VITE_)
VITE_PUSHER_KEY=<mesma-key-do-pusher>
VITE_PUSHER_CLUSTER=<mesmo-cluster-do-pusher>
```

### Passo 2: Deploy

#### Opção 1: Via Vercel CLI
```bash
# Instalar Vercel CLI
npm i -g vercel

# Fazer deploy
vercel

# Deploy em produção
vercel --prod
```

#### Opção 2: Via GitHub
1. Faça push do código para GitHub
2. Importe o projeto no Vercel
3. Configure as variáveis de ambiente
4. Deploy automático!

### Passo 3: Configurar Database Schema

Após o primeiro deploy:

```bash
# Localmente, com DATABASE_URL do Vercel
npm run db:push
npm run db:seed
```

## 📁 Estrutura Adaptada

### Mudanças Principais:

1. **✅ Autenticação**
   - ~~Express Sessions~~ → **JWT em cookies**
   - Rotas: `/api/auth/login`, `/api/auth/register`, `/api/auth/logout`

2. **✅ Upload de Arquivos**
   - ~~Filesystem local~~ → **Cloudinary**
   - Hook: `useCloudinaryUpload()`

3. **✅ Real-time**
   - ~~WebSockets~~ → **Pusher Channels**
   - Hook: `useRealTimeUpdates()`

4. **✅ API Routes**
   - ~~Express tradicional~~ → **Vercel Serverless Functions**
   - Estrutura: `/api/[endpoint].ts`

5. **✅ Database**
   - Neon PostgreSQL com HTTP driver (otimizado para serverless)

## 🌐 Endpoints API

Todas as rotas foram migradas para Vercel serverless:

### Autenticação
- `POST /api/auth/register` - Registro
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/user` - Usuário autenticado

### Públicas
- `GET /api/sdgs` - Lista ODS
- `GET /api/sdgs/[id]` - ODS específico
- `GET /api/projects` - Lista projetos
- `GET /api/projects/[id]` - Projeto específico

### Company (Protegidas)
- `GET/PUT /api/company/profile` - Perfil
- `GET/POST /api/company/consumption` - Consumo
- `GET/POST /api/company/payment-proofs` - Comprovantes

### Admin (Protegidas)
- `GET /api/admin/stats` - Estatísticas
- `POST /api/admin/projects/create` - Criar projeto
- `PUT /api/admin/projects/[id]/update` - Atualizar projeto
- `GET /api/admin/payment-proofs/pending` - Comprovantes pendentes
- `PUT /api/admin/payment-proofs/[id]/approve` - Aprovar comprovante

### Upload
- `POST /api/upload/image` - Upload de imagem

## 🔍 Troubleshooting

### Erro de CORS
- Certifique-se que `credentials: 'include'` está nas requests
- Cookies funcionam automaticamente no Vercel

### Erro de Database
- Verifique se `DATABASE_URL` está configurada
- Rode `npm run db:push` após deploy

### Erro de Upload
- Verifique credenciais Cloudinary
- Limite de upload gratuito: 10GB/mês

### Real-time não funciona
- Verifique credenciais Pusher
- Plano grátis: 100 conexões simultâneas, 200k mensagens/dia

## 📊 Limites do Plano Gratuito

### Vercel
- ✅ 100GB bandwidth/mês
- ✅ Serverless functions ilimitadas
- ✅ Deploy automático

### Neon Database
- ✅ 512MB storage
- ✅ Nunca hiberna
- ✅ Conexões ilimitadas

### Cloudinary
- ✅ 25 créditos/mês (≈25GB bandwidth)
- ✅ 25GB storage
- ✅ Transformações ilimitadas

### Pusher
- ✅ 100 conexões simultâneas
- ✅ 200k mensagens/dia
- ✅ Canais ilimitados

## 🎉 Pronto!

Seu projeto agora está rodando no Vercel de forma totalmente gratuita com:
- ✅ Backend serverless
- ✅ Database PostgreSQL
- ✅ Upload de arquivos na nuvem
- ✅ Real-time com Pusher
- ✅ Autenticação JWT

**URL da aplicação:** https://seu-projeto.vercel.app

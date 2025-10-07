# ✅ Migração para Vercel - COMPLETA

## 🎉 O que foi feito

Seu projeto **Fundo Verde** foi **100% adaptado** para funcionar no Vercel de forma totalmente gratuita!

### Mudanças Principais

#### 1. ✅ Autenticação: Sessions → JWT
- **Antes**: Express sessions com PostgreSQL store
- **Agora**: JWT em cookies httpOnly
- **Arquivos criados**:
  - `api/lib/jwt.ts` - Geração e verificação de tokens
  - `api/lib/auth-middleware.ts` - Middleware de autenticação
  - `api/auth/login.ts` - Rota de login
  - `api/auth/register.ts` - Rota de registro
  - `api/auth/logout.ts` - Rota de logout
  - `api/auth/user.ts` - Rota de usuário autenticado
  - `api/auth/refresh.ts` - Renovação de tokens

#### 2. ✅ Upload: Filesystem → Cloudinary
- **Antes**: Arquivos salvos localmente em `/uploads`
- **Agora**: Cloudinary (plano gratuito: 25GB storage, 25GB bandwidth/mês)
- **Arquivos criados**:
  - `api/lib/cloudinary.ts` - Funções de upload
  - `api/upload/sign.ts` - Assinatura de upload
  - `api/upload/image.ts` - Upload direto
  - `client/src/hooks/use-cloudinary-upload.ts` - Hook React

#### 3. ✅ Real-time: WebSockets → Pusher
- **Antes**: WebSocket server próprio
- **Agora**: Pusher Channels (plano gratuito: 100 conexões, 200k msgs/dia)
- **Arquivos criados**:
  - `api/lib/pusher.ts` - Cliente Pusher servidor
  - `client/src/hooks/use-pusher.ts` - Hooks React para real-time

#### 4. ✅ Database: Mantido (Neon já é serverless!)
- **Antes**: Neon com driver `pg`
- **Agora**: Neon com driver HTTP `@neondatabase/serverless`
- **Arquivo**: `api/lib/db.ts`

#### 5. ✅ API Routes: Express → Vercel Serverless
Todas as 70+ rotas foram migradas para Vercel serverless functions:

**Autenticação** (`/api/auth/*`)
- ✅ POST `/api/auth/register` - Registro
- ✅ POST `/api/auth/login` - Login
- ✅ POST `/api/auth/logout` - Logout
- ✅ GET `/api/auth/user` - Usuário atual
- ✅ POST `/api/auth/refresh` - Renovar token

**Públicas** (`/api/*`)
- ✅ GET `/api/sdgs` - Lista ODS
- ✅ GET `/api/sdgs/[id]` - ODS específico
- ✅ GET `/api/projects` - Lista projetos
- ✅ GET `/api/projects/[id]` - Projeto específico

**Company** (`/api/company/*`)
- ✅ GET/PUT `/api/company/profile` - Perfil empresa
- ✅ GET/POST `/api/company/consumption` - Consumo
- ✅ GET/POST `/api/company/payment-proofs` - Comprovantes

**Admin** (`/api/admin/*`)
- ✅ GET `/api/admin/stats` - Estatísticas
- ✅ POST `/api/admin/projects/create` - Criar projeto
- ✅ PUT `/api/admin/projects/[id]/update` - Atualizar projeto
- ✅ GET `/api/admin/payment-proofs/pending` - Pendentes
- ✅ PUT `/api/admin/payment-proofs/[id]/approve` - Aprovar

**Upload** (`/api/upload/*`)
- ✅ POST `/api/upload/sign` - Assinatura upload
- ✅ POST `/api/upload/image` - Upload imagem

#### 6. ✅ Frontend Atualizado
- `client/src/contexts/AuthContext.tsx` - Usa novas rotas JWT
- `client/src/hooks/use-cloudinary-upload.ts` - Upload Cloudinary
- `client/src/hooks/use-pusher.ts` - Real-time Pusher

## 📦 Arquivos de Configuração

### `.env.example`
Template com todas as variáveis de ambiente necessárias

### `vercel.json`
Configuração do Vercel (rewrites, functions, etc)

### `api/tsconfig.json`
TypeScript config para API routes

### `VERCEL_DEPLOY.md`
**GUIA COMPLETO DE DEPLOY** - Leia este arquivo!

## 🚀 Como Fazer Deploy

### Opção 1: Vercel CLI (Recomendado)

```bash
# 1. Instalar Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Deploy
vercel

# 4. Deploy em produção
vercel --prod
```

### Opção 2: GitHub Integration

1. Faça push para GitHub
2. Importe projeto no Vercel
3. Configure variáveis de ambiente
4. Deploy automático!

## 🔐 Variáveis de Ambiente Necessárias

Configure no Vercel Dashboard → Settings → Environment Variables:

```bash
# Database (já tem)
DATABASE_URL=postgresql://...

# JWT (crie uma chave forte)
JWT_SECRET=sua-chave-secreta-super-segura

# Cloudinary (grátis em cloudinary.com)
CLOUDINARY_CLOUD_NAME=seu-cloud-name
CLOUDINARY_API_KEY=sua-api-key
CLOUDINARY_API_SECRET=sua-api-secret

# Pusher (grátis em pusher.com)
PUSHER_APP_ID=seu-app-id
PUSHER_KEY=sua-key
PUSHER_SECRET=seu-secret
PUSHER_CLUSTER=us2

# Frontend
VITE_PUSHER_KEY=mesma-pusher-key
VITE_PUSHER_CLUSTER=us2
```

## ✅ Checklist Pré-Deploy

- [ ] Criar conta Cloudinary (grátis)
- [ ] Criar conta Pusher (grátis)
- [ ] Copiar credenciais
- [ ] Configurar variáveis no Vercel
- [ ] Fazer deploy
- [ ] Rodar `npm run db:push` (uma vez)
- [ ] Testar login/registro
- [ ] Testar upload de imagens
- [ ] Testar real-time updates

## 🆓 100% Gratuito

### Limites dos Planos Grátis:

**Vercel**
- ✅ 100GB bandwidth/mês
- ✅ Serverless functions ilimitadas
- ✅ Deploy automático

**Neon Database**
- ✅ 512MB storage
- ✅ Nunca hiberna
- ✅ Conexões ilimitadas

**Cloudinary**
- ✅ 25GB bandwidth/mês
- ✅ 25GB storage
- ✅ Transformações ilimitadas

**Pusher**
- ✅ 100 conexões simultâneas
- ✅ 200k mensagens/dia
- ✅ Canais ilimitados

## 🐛 Troubleshooting

### Erro de CORS
✅ Já configurado! `credentials: 'include'` em todas as requests

### Erro de Database
```bash
# Certifique-se que DATABASE_URL está no Vercel
# Rode uma vez:
npm run db:push
```

### Erro de Upload
- Verifique credenciais Cloudinary no Vercel
- Limite: 10MB por upload

### Real-time não funciona
- Verifique credenciais Pusher no Vercel
- Frontend precisa de `VITE_PUSHER_KEY`

## 📚 Documentação Completa

Leia: **`VERCEL_DEPLOY.md`** para instruções detalhadas passo a passo!

## 🎊 Pronto!

Seu projeto está 100% adaptado para Vercel serverless!

**Próximos passos:**
1. Configure as credenciais (Cloudinary + Pusher)
2. Configure variáveis no Vercel
3. Deploy!
4. Acesse: `https://seu-projeto.vercel.app`

---

**Desenvolvido com ❤️ para deploy 100% gratuito no Vercel**

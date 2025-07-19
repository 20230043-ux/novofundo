# 🇦🇴 Guia Completo: Replit Grátis sem Hibernação

## ✅ O Que Já Foi Implementado no Seu Projeto

### 1. **Sistema Keep-Alive Automático**
- ✅ Endpoint `/api/keep-alive` - verifica status da aplicação e banco
- ✅ Endpoint `/health` - monitoramento de saúde
- ✅ Consultas automáticas ao banco a cada 4 minutos
- ✅ Logs detalhados de atividade
- ✅ Serviço iniciado automaticamente no servidor

### 2. **Endpoints Disponíveis**
```
GET /api/keep-alive  - Status completo com info do banco
GET /health          - Mesmo que keep-alive
GET /                - Status básico da plataforma
```

## 🚀 Como Configurar o UptimeRobot (GRÁTIS)

### Passo 1: Criar Conta no UptimeRobot
1. Vá para [uptimerobot.com](https://uptimerobot.com)
2. Crie uma conta gratuita
3. Confirme seu email

### Passo 2: Adicionar Monitor
1. No painel, clique **"+ Add New Monitor"**
2. **Monitor Type**: HTTP(s)
3. **Friendly Name**: "Angola ODS Platform"
4. **URL**: `https://SEU_REPL_URL/api/projects`
   - Substitua `SEU_REPL_URL` pela URL do seu Repl
   - Exemplo: `https://carbon-platform-abc123.replit.app/api/projects`
   - Use `/api/projects` porque funciona tanto em desenvolvimento quanto produção
5. **Monitoring Interval**: 5 minutes (máximo no plano gratuito)
6. Clique **"Create Monitor"**

### Passo 3: Configurações Opcionais
- **Alert Contacts**: Adicione seu email para receber alertas
- **Keyword Monitoring**: Procurar por `"online"` na resposta
- **Timeout**: 30 segundos

## 📊 Como Funciona

### Temporização do Replit
- **Aplicação**: Hiberna após 30 minutos sem tráfego HTTP
- **Banco PostgreSQL**: Hiberna após 5 minutos sem consultas
- **Reativação**: Instantânea ao receber requisição

### Sistema Keep-Alive Implementado
```typescript
// Consulta automática a cada 4 minutos
setInterval(async () => {
  await db.execute(sql`SELECT 1`);
  console.log('🔄 Banco mantido ativo');
}, 4 * 60 * 1000);
```

### UptimeRobot
- Faz requisição GET a cada 5 minutos
- Mantém aplicação ativa 24/7
- Grátis até 50 monitores

## 🔧 Testando o Sistema

### 1. Verificar Endpoints Localmente
```bash
# No terminal do Replit
curl http://localhost:5000/api/keep-alive
```

### 2. Verificar Online
Acesse no navegador: `https://SEU_REPL_URL/api/projects`

Resposta esperada (lista de projetos):
```json
[{"id":5,"name":"angolahuambo","sdgId":6,"description":"...","imageUrl":"..."}]
```

**Nota**: Em desenvolvimento, use `/api/projects` em vez de `/api/keep-alive` devido às configurações do Vite.

## 💡 Dicas Extras para Economia

### 1. **Otimizações Já Implementadas**
- Cache inteligente com invalidação
- Compressão automática
- WebSockets para atualizações em tempo real
- Consultas otimizadas no banco

### 2. **Monitoramento de Uso**
- Acesse `Ferramentas → Database → Settings → Account resource usage`
- Monitore seu consumo diário (limite: 100 cycles/dia)
- Use o endpoint `/health` para verificar status

### 3. **Alternativas de Backup**
Se o UptimeRobot não funcionar:
- **StatusCake** (grátis, 1 monitor)
- **Pingdom** (grátis, 1 monitor)
- **Upticks** (grátis, 5 monitores)

## 🎯 Limites do Plano Gratuito Replit

### O Que Você Tem
- PostgreSQL: 1GB storage
- 100 compute cycles/dia
- Hibernação automática
- 1 banco de dados ativo

### Como Maximizar
- ✅ Keep-alive implementado (evita hibernação)
- ✅ Cache inteligente (reduz consultas)
- ✅ Consultas otimizadas (menos ciclos)
- ✅ Compressão (menos largura de banda)

## 🚨 Problemas Comuns e Soluções

### "Database not connected"
```bash
# Restart a aplicação
npm run dev
```

### Monitor UptimeRobot falhando
- Verifique se a URL está correta
- Teste manualmente no navegador
- Confirme que o Repl está rodando

### Consumindo muitos cycles
- Reduza a frequência das consultas keep-alive
- Otimize queries pesadas
- Use mais cache

## 📈 Status em Tempo Real

Monitore sua aplicação em:
- `/api/keep-alive` - Status completo
- UptimeRobot dashboard - Uptime histórico
- Replit Database settings - Uso de recursos

---

**✅ Sistema Implementado com Sucesso!**

Sua plataforma agora tem proteção contra hibernação e funcionará 24/7 no plano gratuito do Replit.
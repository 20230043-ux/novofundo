import qrcode from 'qrcode-terminal';
import cron from 'node-cron';
import { storage } from './storage';
import { log } from './vite';
import { whatsappAssistant } from './whatsapp-assistant';

// Import WhatsApp Web.js dynamically to handle module compatibility
let Client: any;
let LocalAuth: any;
let MessageMedia: any;

async function loadWhatsAppDeps() {
  try {
    const whatsappModule = await import('whatsapp-web.js');
    Client = whatsappModule.default?.Client || whatsappModule.Client;
    LocalAuth = whatsappModule.default?.LocalAuth || whatsappModule.LocalAuth;
    MessageMedia = whatsappModule.default?.MessageMedia || whatsappModule.MessageMedia;
    
    if (!Client || !LocalAuth || !MessageMedia) {
      log('❌ WhatsApp Web.js não disponível neste ambiente');
      return false;
    }
    return true;
  } catch (error) {
    log(`❌ Erro ao carregar WhatsApp Web.js: ${error}`);
    return false;
  }
}

interface WhatsAppGroup {
  id: string;
  name: string;
  active: boolean;
  projectIds?: number[];
  sdgIds?: number[];
  inviteLink?: string;
  isPublic?: boolean;
}

class WhatsAppService {
  private client: Client | null = null;
  private isReady = false;
  private groups: WhatsAppGroup[] = [];
  private qrCodeGenerated = false;

  constructor() {
    // Defer initialization until WhatsApp dependencies are loaded
  }

  private async initializeClient() {
    const depsLoaded = await loadWhatsAppDeps();
    if (!depsLoaded) {
      log('❌ WhatsApp Web.js não disponível. Funcionalidade desabilitada.');
      return false;
    }

    this.client = new Client({
      authStrategy: new LocalAuth({
        clientId: "sustainability-platform"
      }),
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      }
    });

    this.setupEventHandlers();
    return true;
  }

  private setupEventHandlers() {
    if (!this.client) return;

    this.client.on('qr', (qr) => {
      if (!this.qrCodeGenerated) {
        log('📱 Escaneie o QR Code abaixo com o WhatsApp para conectar:');
        qrcode.generate(qr, { small: true });
        this.qrCodeGenerated = true;
      }
    });

    this.client.on('ready', () => {
      log('✅ WhatsApp conectado com sucesso!');
      this.isReady = true;
      this.loadGroups();
      this.startCronJobs();
    });

    this.client.on('authenticated', () => {
      log('🔐 WhatsApp autenticado');
    });

    this.client.on('auth_failure', () => {
      log('❌ Falha na autenticação do WhatsApp');
    });

    this.client.on('disconnected', () => {
      log('📱 WhatsApp desconectado');
      this.isReady = false;
    });

    // Handle incoming messages for assistant
    this.client.on('message', async (message) => {
      try {
        // Only respond to private messages and group messages where bot is mentioned
        if (message.isStatus || message.from === 'status@broadcast') return;
        
        const chat = await message.getChat();
        const contact = await message.getContact();
        
        // Skip if message is from bot itself
        if (contact.isMe) return;

        let shouldRespond = false;
        let userType: 'company' | 'public' = 'public';

        if (chat.isGroup) {
          // In groups, only respond if mentioned or if it's a configured group
          const activeGroup = this.groups.find(g => g.id === chat.id._serialized && g.active);
          if (activeGroup || message.mentionedIds?.includes(this.client!.info.wid._serialized)) {
            shouldRespond = true;
            userType = 'public';
          }
        } else {
          // Always respond to private messages
          shouldRespond = true;
          
          // Check if user is from a company (basic check by contact name)
          const companies = await storage.getAllCompanies();
          const isCompanyUser = companies.some(company => 
            contact.name?.toLowerCase().includes(company.name.toLowerCase().substring(0, 10))
          );
          userType = isCompanyUser ? 'company' : 'public';
        }

        if (shouldRespond) {
          log(`📨 Mensagem recebida de ${contact.name || contact.number}: ${message.body}`);
          
          const response = await whatsappAssistant.processMessage(
            contact.id._serialized,
            message.body,
            userType
          );

          await message.reply(response);
          log(`🤖 Resposta enviada para ${contact.name || contact.number}`);
        }
      } catch (error) {
        log(`❌ Erro ao processar mensagem: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }
    });
  }

  async initialize() {
    try {
      const clientInitialized = await this.initializeClient();
      if (!clientInitialized || !this.client) {
        return false;
      }
      
      await this.client.initialize();
      return true;
    } catch (error) {
      log(`❌ Erro ao inicializar WhatsApp: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      return false;
    }
  }

  private async loadGroups() {
    if (!this.client || !this.isReady) return;

    try {
      const chats = await this.client.getChats();
      const groups = chats.filter(chat => chat.isGroup);
      
      log(`📋 Encontrados ${groups.length} grupos do WhatsApp`);
      
      // Salvar grupos encontrados
      this.groups = groups.map(group => ({
        id: group.id._serialized,
        name: group.name,
        active: false // Por padrão, grupos não são ativos até serem configurados
      }));
      
    } catch (error) {
      log(`❌ Erro ao carregar grupos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  async getAvailableGroups() {
    return this.groups;
  }

  async createPublicGroup(groupName: string) {
    if (!this.client || !this.isReady) {
      throw new Error('WhatsApp não está conectado');
    }

    try {
      // Note: Creating groups programmatically has limitations in WhatsApp Web.js
      // This is a simulation for demonstration
      const mockGroupId = `group_${Date.now()}@g.us`;
      
      const newGroup: WhatsAppGroup = {
        id: mockGroupId,
        name: groupName,
        active: true,
        isPublic: true,
        inviteLink: `https://chat.whatsapp.com/mock_${Date.now()}`
      };

      this.groups.push(newGroup);
      log(`✅ Grupo público "${groupName}" criado com sucesso`);
      
      return newGroup;
    } catch (error) {
      log(`❌ Erro ao criar grupo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      throw error;
    }
  }

  async getGroupInviteLink(groupId: string) {
    const group = this.groups.find(g => g.id === groupId);
    if (!group) {
      throw new Error('Grupo não encontrado');
    }

    if (group.inviteLink) {
      return group.inviteLink;
    }

    if (!this.client || !this.isReady) {
      throw new Error('WhatsApp não está conectado');
    }

    try {
      const chat = await this.client.getChatById(groupId);
      if (chat.isGroup) {
        const inviteCode = await chat.getInviteCode();
        const inviteLink = `https://chat.whatsapp.com/${inviteCode}`;
        
        // Update group with invite link
        group.inviteLink = inviteLink;
        
        return inviteLink;
      }
      throw new Error('Chat não é um grupo');
    } catch (error) {
      log(`❌ Erro ao obter link de convite: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      throw error;
    }
  }

  async configureGroup(groupId: string, projectIds?: number[], sdgIds?: number[], isPublic?: boolean) {
    const group = this.groups.find(g => g.id === groupId);
    if (!group) {
      throw new Error('Grupo não encontrado');
    }

    group.active = true;
    group.projectIds = projectIds;
    group.sdgIds = sdgIds;
    group.isPublic = isPublic;

    // Generate invite link if public and client is available
    if (isPublic && this.client && this.isReady) {
      try {
        const chat = await this.client.getChatById(groupId);
        if (chat.isGroup) {
          const inviteCode = await chat.getInviteCode();
          group.inviteLink = `https://chat.whatsapp.com/${inviteCode}`;
          log(`🔗 Link de convite gerado para "${group.name}": ${group.inviteLink}`);
        }
      } catch (error) {
        log(`❌ Erro ao gerar link de convite: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }
    }

    log(`✅ Grupo "${group.name}" configurado para receber notificações`);
    return group;
  }

  async sendProjectUpdate(projectId: number, updateMessage: string) {
    if (!this.client || !this.isReady) return;

    const activeGroups = this.groups.filter(g => 
      g.active && 
      (!g.projectIds || g.projectIds.includes(projectId))
    );

    for (const group of activeGroups) {
      try {
        const project = await storage.getProjectById(projectId);
        if (!project) continue;

        const message = `
🌱 *Atualização de Projeto*

📋 *Projeto:* ${project.name}
🎯 *ODS:* ${project.sdg_name}
💰 *Orçamento:* ${project.budget ? `$${Number(project.budget).toLocaleString()}` : 'Não informado'}

📢 *Atualização:*
${updateMessage}

🌍 _Plataforma de Sustentabilidade_
        `.trim();

        await this.client.sendMessage(group.id, message);
        log(`📤 Mensagem enviada para grupo: ${group.name}`);
        
      } catch (error) {
        log(`❌ Erro ao enviar mensagem para ${group.name}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }
    }
  }

  async sendWeeklyReport() {
    if (!this.client || !this.isReady) return;

    try {
      const stats = await storage.getAdminDashboardStats();
      const projects = await storage.getAllProjects();
      const activeProjects = projects.filter(p => p.status === 'active');

      const message = `
📊 *Relatório Semanal de Sustentabilidade*

🏢 *Empresas Cadastradas:* ${stats.companiesCount}
🌱 *Projetos Ativos:* ${activeProjects.length}
📈 *Emissões Totais:* ${stats.totalCarbonEmissions} toneladas CO₂
💰 *Investimentos:* $${Number(stats.totalInvestments || 0).toLocaleString()}

🎯 *Projetos em Destaque:*
${activeProjects.slice(0, 3).map(p => `• ${p.name} (${p.sdg_name})`).join('\n')}

🌍 _Relatório gerado automaticamente_
      `.trim();

      const activeGroups = this.groups.filter(g => g.active);
      
      for (const group of activeGroups) {
        await this.client.sendMessage(group.id, message);
        log(`📤 Relatório semanal enviado para: ${group.name}`);
      }

    } catch (error) {
      log(`❌ Erro ao enviar relatório semanal: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  async sendCarbonAlert(companyId: number, currentEmissions: number, threshold: number) {
    if (!this.client || !this.isReady) return;

    try {
      const company = await storage.getCompanyById(companyId);
      if (!company) return;

      const message = `
🚨 *Alerta de Emissões*

🏢 *Empresa:* ${company.name}
📊 *Emissões Atuais:* ${currentEmissions} toneladas CO₂
⚠️ *Limite:* ${threshold} toneladas CO₂

💡 *Recomendação:* Considere investir em projetos de compensação de carbono ou implementar medidas de redução.

🌱 _Sistema de Monitoramento Ambiental_
      `.trim();

      const activeGroups = this.groups.filter(g => g.active);
      
      for (const group of activeGroups) {
        await this.client.sendMessage(group.id, message);
        log(`📤 Alerta de carbono enviado para: ${group.name}`);
      }

    } catch (error) {
      log(`❌ Erro ao enviar alerta de carbono: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  private startCronJobs() {
    // Relatório semanal toda segunda-feira às 9h
    cron.schedule('0 9 * * 1', () => {
      log('📅 Executando relatório semanal automático');
      this.sendWeeklyReport();
    });

    // Verificação de emissões diariamente às 18h
    cron.schedule('0 18 * * *', async () => {
      log('📅 Verificando emissões diárias');
      try {
        const companies = await storage.getAllCompanies();
        for (const company of companies) {
          const stats = await storage.getCompanyCarbonStats(company.id);
          if (stats && stats.totalEmissions > 1000) { // Threshold de 1000 toneladas
            await this.sendCarbonAlert(company.id, stats.totalEmissions, 1000);
          }
        }
      } catch (error) {
        log(`❌ Erro na verificação diária: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }
    });
  }

  isConnected() {
    return this.isReady;
  }

  getAssistantStats() {
    return whatsappAssistant.getStats();
  }

  async sendMessageToUser(userId: string, message: string) {
    if (!this.client || !this.isReady) {
      throw new Error('WhatsApp não está conectado');
    }

    try {
      await this.client.sendMessage(userId, message);
      log(`📤 Mensagem enviada para ${userId}`);
      return true;
    } catch (error) {
      log(`❌ Erro ao enviar mensagem: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      throw error;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.destroy();
      this.isReady = false;
      log('📱 WhatsApp desconectado');
    }
  }
}

export const whatsappService = new WhatsAppService();
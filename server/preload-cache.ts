import { storage } from './storage';
import { log } from './vite';
import { fallbackData } from './fallback-data';

interface PreloadedData {
  sdgs: any[];
  projects: any[];
  companies: any[];
  stats: any;
  timestamp: number;
}

class PreloadCache {
  private cache: PreloadedData | null = null;
  private isLoading = false;
  private readonly CACHE_TTL = 30 * 1000; // 30 seconds for instant updates

  async preloadEssentialData(): Promise<void> {
    if (this.isLoading) return;
    
    this.isLoading = true;
    log('🚀 Pré-carregando dados essenciais...');

    try {
      const [sdgs, projects, companies, stats] = await Promise.all([
        storage.getAllSdgs(),
        storage.getAllProjects(),
        storage.getAllCompanies(),
        storage.getAdminDashboardStats()
      ]);

      this.cache = {
        sdgs: sdgs || [],
        projects: projects || [],
        companies: companies || [],
        stats: stats || {},
        timestamp: Date.now()
      };

      log(`✅ Dados pré-carregados: ${sdgs?.length || 0} SDGs, ${projects?.length || 0} projetos, ${companies?.length || 0} empresas`);
    } catch (error) {
      log(`❌ Erro ao pré-carregar dados: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      this.isLoading = false;
    }
  }

  getCachedData(): PreloadedData | null {
    if (!this.cache) return null;
    
    const now = Date.now();
    if (now - this.cache.timestamp > this.CACHE_TTL) {
      this.cache = null;
      return null;
    }
    
    return this.cache;
  }

  async getSDGs(): Promise<any[]> {
    const cached = this.getCachedData();
    if (cached?.sdgs) {
      return cached.sdgs;
    }
    
    try {
      const sdgs = await storage.getAllSdgs();
      return sdgs || fallbackData.sdgs;
    } catch (error) {
      log(`❌ Erro ao buscar SDGs: ${error} - Usando dados de fallback`);
      return fallbackData.sdgs;
    }
  }

  async getProjects(): Promise<any[]> {
    const cached = this.getCachedData();
    if (cached?.projects) {
      return cached.projects;
    }
    
    try {
      const projects = await storage.getAllProjects();
      return projects || fallbackData.projects;
    } catch (error) {
      log(`❌ Erro ao buscar projetos: ${error} - Usando dados de fallback`);
      return fallbackData.projects;
    }
  }

  async getCompanies(): Promise<any[]> {
    const cached = this.getCachedData();
    if (cached?.companies) {
      return cached.companies;
    }
    
    try {
      const companies = await storage.getAllCompanies();
      return companies || fallbackData.companies;
    } catch (error) {
      log(`❌ Erro ao buscar empresas: ${error} - Usando dados de fallback`);
      return fallbackData.companies;
    }
  }

  async getUsers(): Promise<any[]> {
    try {
      // Since we don't have getAllUsers method, return fallback directly
      return fallbackData.users;
    } catch (error) {
      log(`❌ Erro ao buscar usuários: ${error} - Usando dados de fallback`);
      return fallbackData.users;
    }
  }

  async getIndividuals(): Promise<any[]> {
    try {
      // Since we don't have getAllIndividuals method, return fallback directly
      return fallbackData.individuals;
    } catch (error) {
      log(`❌ Erro ao buscar indivíduos: ${error} - Usando dados de fallback`);
      return fallbackData.individuals;
    }
  }

  async getProjectUpdates(projectId?: number): Promise<any[]> {
    try {
      // Use existing method or fallback
      if (projectId) {
        const updates = await storage.getProjectUpdateById(projectId);
        return updates ? [updates] : fallbackData.projectUpdates.filter(u => u.project_id === projectId);
      }
      return fallbackData.projectUpdates;
    } catch (error) {
      log(`❌ Erro ao buscar atualizações: ${error} - Usando dados de fallback`);
      return projectId 
        ? fallbackData.projectUpdates.filter(u => u.project_id === projectId)
        : fallbackData.projectUpdates;
    }
  }

  async getInvestments(): Promise<any[]> {
    try {
      // Since we don't have getAllInvestments method, return fallback directly
      return fallbackData.investments;
    } catch (error) {
      log(`❌ Erro ao buscar investimentos: ${error} - Usando dados de fallback`);
      return fallbackData.investments;
    }
  }

  async getMessages(userId?: number): Promise<any[]> {
    try {
      // Since we don't have messaging methods, return fallback directly
      return userId 
        ? fallbackData.messages.filter(m => m.from_user_id === userId || m.to_user_id === userId)
        : fallbackData.messages;
    } catch (error) {
      log(`❌ Erro ao buscar mensagens: ${error} - Usando dados de fallback`);
      return userId 
        ? fallbackData.messages.filter(m => m.from_user_id === userId || m.to_user_id === userId)
        : fallbackData.messages;
    }
  }

  async getConsumptionRecords(): Promise<any[]> {
    try {
      // Since we don't have getAllConsumptionRecords method, return fallback directly
      return fallbackData.consumptionRecords;
    } catch (error) {
      log(`❌ Erro ao buscar registos de consumo: ${error} - Usando dados de fallback`);
      return fallbackData.consumptionRecords;
    }
  }

  async getPaymentProofs(): Promise<any[]> {
    try {
      // Since we don't have getAllPaymentProofs method, return fallback directly
      return fallbackData.paymentProofs;
    } catch (error) {
      log(`❌ Erro ao buscar comprovos de pagamento: ${error} - Usando dados de fallback`);
      return fallbackData.paymentProofs;
    }
  }

  async getCarbonLeaderboard(): Promise<any[]> {
    try {
      // Since we don't have getCarbonLeaderboard method, return fallback directly
      return fallbackData.carbonLeaderboard;
    } catch (error) {
      log(`❌ Erro ao buscar ranking de carbono: ${error} - Usando dados de fallback`);
      return fallbackData.carbonLeaderboard;
    }
  }

  async getStats(): Promise<any> {
    const cached = this.getCachedData();
    if (cached?.stats) {
      return cached.stats;
    }
    
    try {
      const stats = await storage.getAdminDashboardStats();
      return stats || fallbackData.stats;
    } catch (error) {
      log(`❌ Erro ao buscar estatísticas: ${error} - Usando dados de fallback`);
      return fallbackData.stats;
    }
  }

  clearCache(): void {
    this.cache = null;
    log('🧹 Cache limpo manualmente');
  }

  async forceRefresh(): Promise<void> {
    this.clearCache();
    await this.preloadEssentialData();
  }

  startPeriodicRefresh(): void {
    // Refresh cache every 30 seconds for instant updates
    setInterval(() => {
      this.preloadEssentialData();
    }, 30 * 1000);
    
    log('🔄 Cache periódico configurado para atualizar a cada 30 segundos');
  }
}

export const preloadCache = new PreloadCache();
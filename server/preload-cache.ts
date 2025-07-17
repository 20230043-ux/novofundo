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
      return companies || [];
    } catch (error) {
      log(`❌ Erro ao buscar empresas: ${error}`);
      return [];
    }
  }

  async getStats(): Promise<any> {
    const cached = this.getCachedData();
    if (cached?.stats) {
      return cached.stats;
    }
    
    try {
      const stats = await storage.getAdminDashboardStats();
      return stats || {};
    } catch (error) {
      log(`❌ Erro ao buscar estatísticas: ${error}`);
      return {};
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
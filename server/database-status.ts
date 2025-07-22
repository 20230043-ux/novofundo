// Sistema inteligente para detectar status da base de dados
import { storage } from "./storage";

export class DatabaseStatus {
  private static instance: DatabaseStatus;
  private isOnline = true;
  private lastCheckTime = 0;
  private readonly CHECK_INTERVAL = 30000; // 30 segundos

  static getInstance(): DatabaseStatus {
    if (!DatabaseStatus.instance) {
      DatabaseStatus.instance = new DatabaseStatus();
    }
    return DatabaseStatus.instance;
  }

  async isDBOnline(): Promise<boolean> {
    const now = Date.now();
    
    // Verifica apenas a cada 30 segundos para otimização
    if (now - this.lastCheckTime < this.CHECK_INTERVAL) {
      return this.isOnline;
    }

    try {
      // Tenta uma operação simples na base de dados
      await storage.testConnection();
      
      if (!this.isOnline) {
        console.log("✅ Base de dados voltou online - mudando para dados reais");
        this.clearOfflineData();
      }
      
      this.isOnline = true;
      this.lastCheckTime = now;
      return true;
    } catch (error) {
      if (this.isOnline) {
        console.log("⚠️ Base de dados offline detectada - activando modo fallback temporário");
      }
      
      this.isOnline = false;
      this.lastCheckTime = now;
      return false;
    }
  }

  forceOffline() {
    console.log("🔴 Forçando modo offline para teste");
    this.isOnline = false;
    this.lastCheckTime = Date.now();
  }

  forceOnline() {
    console.log("✅ Forçando modo online");
    this.isOnline = true;
    this.lastCheckTime = Date.now();
    this.clearOfflineData();
  }

  private clearOfflineData() {
    // Limpa dados temporários quando a base volta online
    const { fallbackData } = require("./fallback-data");
    fallbackData.authFallback.dynamicTempUsers = [];
    fallbackData.authFallback.sessionCounter = 1000;
    console.log("🧹 Dados temporários offline limpos");
  }

  getCurrentStatus(): { isOnline: boolean; statusMessage: string } {
    return {
      isOnline: this.isOnline,
      statusMessage: this.isOnline 
        ? "Base de dados online - dados permanentes" 
        : "Base de dados offline - modo temporário"
    };
  }
}

export const dbStatus = DatabaseStatus.getInstance();
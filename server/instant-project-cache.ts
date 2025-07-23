// Instant response cache for project publications
// This provides near-zero latency responses for project operations

import { storage } from './storage';
import { log } from './vite';

interface ProjectData {
  id: number;
  name: string;
  description: string;
  sdgId: number;
  imageUrl: string;
  totalInvested: string;
  peopleCount: number;
  createdAt: Date;
  updatedAt?: Date;
  sdg?: any;
  updates?: any[];
  investments?: any[];
}

class InstantProjectCache {
  private projects: Map<number, ProjectData> = new Map();
  private projectsList: ProjectData[] = [];
  private lastUpdate: number = 0;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    log('⚡ Inicializando cache instantâneo de projetos...');
    try {
      const projects = await storage.getAllProjects();
      this.syncProjects(projects || []);
      this.isInitialized = true;
      log(`⚡ Cache instantâneo inicializado com ${this.projectsList.length} projetos`);
    } catch (error) {
      log(`❌ Erro ao inicializar cache instantâneo: ${error}`);
    }
  }

  private syncProjects(projects: any[]): void {
    this.projects.clear();
    this.projectsList = [];
    
    for (const project of projects) {
      this.projects.set(project.id, project);
      this.projectsList.push(project);
    }
    
    this.lastUpdate = Date.now();
  }

  // Get all projects instantly from memory
  getProjectsInstant(): ProjectData[] {
    return [...this.projectsList];
  }

  // Get project by ID instantly from memory
  getProjectInstant(id: number): ProjectData | null {
    return this.projects.get(id) || null;
  }

  // Add project and return instantly
  async addProject(projectData: any): Promise<ProjectData> {
    // Create in database
    const newProject = await storage.createProject(projectData);
    
    // Add to memory cache instantly
    this.projects.set(newProject.id, newProject);
    this.projectsList.push(newProject);
    this.lastUpdate = Date.now();
    
    log(`⚡ Projeto ${newProject.name} adicionado ao cache instantâneo`);
    return newProject;
  }

  // Update project and return instantly
  async updateProject(id: number, updateData: any): Promise<ProjectData | null> {
    // Update in database
    const updatedProject = await storage.updateProject(id, updateData);
    
    if (updatedProject) {
      // Get the full project with relations to ensure we have all data
      const fullProject = await storage.getProjectById(id);
      const projectToCache = fullProject || updatedProject;
      
      // Update memory cache instantly
      this.projects.set(id, projectToCache);
      const index = this.projectsList.findIndex(p => p.id === id);
      if (index !== -1) {
        this.projectsList[index] = projectToCache;
      }
      this.lastUpdate = Date.now();
      
      log(`⚡ Projeto ${projectToCache.name} atualizado no cache instantâneo`);
      return projectToCache;
    }
    
    return updatedProject;
  }

  // Delete project and update cache instantly
  async deleteProject(id: number): Promise<boolean> {
    // Delete from database
    const result = await storage.deleteProject(id);
    
    if (result) {
      // Remove from memory cache instantly
      this.projects.delete(id);
      this.projectsList = this.projectsList.filter(p => p.id !== id);
      this.lastUpdate = Date.now();
      
      log(`⚡ Projeto removido do cache instantâneo`);
    }
    
    return result;
  }

  // Force refresh from database
  async forceRefresh(): Promise<void> {
    try {
      const projects = await storage.getAllProjects();
      this.syncProjects(projects || []);
      log('⚡ Cache instantâneo atualizado da base de dados');
    } catch (error) {
      log(`❌ Erro ao atualizar cache instantâneo: ${error}`);
    }
  }

  // Get cache stats
  getStats(): { count: number; lastUpdate: number; age: number } {
    return {
      count: this.projectsList.length,
      lastUpdate: this.lastUpdate,
      age: Date.now() - this.lastUpdate
    };
  }
}

export const instantProjectCache = new InstantProjectCache();
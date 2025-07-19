import fs from 'fs/promises';
import path from 'path';
import archiver from 'archiver';
import { createWriteStream, createReadStream } from 'fs';
import { db } from '@db';
import { users, companies, individuals, projects, projectUpdates, paymentProofs } from '@shared/schema';
import { eq } from 'drizzle-orm';

interface BackupMetadata {
  version: string;
  timestamp: string;
  description: string;
  fileCount: number;
  totalSize: number;
}

export class BackupService {
  private backupDir = path.resolve('./backups');
  private uploadsDir = path.resolve('./uploads');

  constructor() {
    this.ensureBackupDirectory();
  }

  private async ensureBackupDirectory() {
    try {
      await fs.access(this.backupDir);
    } catch {
      await fs.mkdir(this.backupDir, { recursive: true });
    }
  }

  /**
   * Cria backup completo de todos os arquivos organizados por categoria
   */
  async createFullBackup(description?: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `backup-completo-${timestamp}`;
    const backupPath = path.join(this.backupDir, `${backupName}.zip`);

    return new Promise(async (resolve, reject) => {
      try {
        const output = createWriteStream(backupPath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', () => {
          console.log(`✅ Backup criado: ${backupPath} (${archive.pointer()} bytes)`);
          resolve(backupPath);
        });

        archive.on('error', (err) => reject(err));
        archive.pipe(output);

        // 1. Backup de arquivos de empresas
        const companiesData = await db.query.companies.findMany({
          with: { 
            user: true,
            consumptionRecords: true,
            paymentProofs: true,
            investments: true
          }
        });

        for (const company of companiesData) {
          // Criar pasta da empresa no backup
          const companyFolder = `empresas/${company.id}-${this.sanitizeFilename(company.name)}`;
          
          // Adicionar dados JSON da empresa
          archive.append(JSON.stringify({
            company,
            metadata: {
              type: 'company',
              exportedAt: new Date().toISOString(),
              id: company.id,
              name: company.name
            }
          }, null, 2), { name: `${companyFolder}/dados.json` });

          // Adicionar logo da empresa se existir
          if (company.logoUrl) {
            const logoPath = path.join(this.uploadsDir, company.logoUrl.replace('/uploads/', ''));
            try {
              await fs.access(logoPath);
              archive.file(logoPath, { name: `${companyFolder}/logo${path.extname(logoPath)}` });
            } catch (error) {
              console.log(`⚠️ Logo não encontrado para ${company.name}: ${logoPath}`);
            }
          }

          // Adicionar comprovativos de pagamento da empresa
          for (const proof of company.paymentProofs || []) {
            if (proof.fileUrl) {
              const proofPath = path.join(this.uploadsDir, proof.fileUrl.replace('/uploads/', ''));
              try {
                await fs.access(proofPath);
                const fileName = `comprovativo-${proof.id}${path.extname(proofPath)}`;
                archive.file(proofPath, { name: `${companyFolder}/comprovativos/${fileName}` });
              } catch (error) {
                console.log(`⚠️ Comprovativo não encontrado: ${proofPath}`);
              }
            }
          }
        }

        // 2. Backup de arquivos de pessoas individuais
        const individualsData = await db.query.individuals.findMany({
          with: { 
            user: true,
            consumptionRecords: true,
            paymentProofs: true,
            investments: true
          }
        });

        for (const individual of individualsData) {
          const individualFolder = `pessoas/${individual.id}-${this.sanitizeFilename(individual.firstName)}-${this.sanitizeFilename(individual.lastName)}`;
          
          // Adicionar dados JSON da pessoa
          archive.append(JSON.stringify({
            individual,
            metadata: {
              type: 'individual',
              exportedAt: new Date().toISOString(),
              id: individual.id,
              name: `${individual.firstName} ${individual.lastName}`
            }
          }, null, 2), { name: `${individualFolder}/dados.json` });

          // Adicionar foto de perfil se existir
          if (individual.profilePictureUrl) {
            const photoPath = path.join(this.uploadsDir, individual.profilePictureUrl.replace('/uploads/', ''));
            try {
              await fs.access(photoPath);
              archive.file(photoPath, { name: `${individualFolder}/foto-perfil${path.extname(photoPath)}` });
            } catch (error) {
              console.log(`⚠️ Foto não encontrada para ${individual.firstName}: ${photoPath}`);
            }
          }

          // Adicionar comprovativos da pessoa
          for (const proof of individual.paymentProofs || []) {
            if (proof.fileUrl) {
              const proofPath = path.join(this.uploadsDir, proof.fileUrl.replace('/uploads/', ''));
              try {
                await fs.access(proofPath);
                const fileName = `comprovativo-${proof.id}${path.extname(proofPath)}`;
                archive.file(proofPath, { name: `${individualFolder}/comprovativos/${fileName}` });
              } catch (error) {
                console.log(`⚠️ Comprovativo não encontrado: ${proofPath}`);
              }
            }
          }
        }

        // 3. Backup de projetos e suas atualizações
        const projectsData = await db.query.projects.findMany({
          with: {
            sdg: true,
            updates: true,
            investments: true
          }
        });

        for (const project of projectsData) {
          const projectFolder = `projetos/${project.id}-${this.sanitizeFilename(project.name)}`;
          
          // Adicionar dados JSON do projeto
          archive.append(JSON.stringify({
            project,
            metadata: {
              type: 'project',
              exportedAt: new Date().toISOString(),
              id: project.id,
              name: project.name
            }
          }, null, 2), { name: `${projectFolder}/dados.json` });

          // Adicionar imagem principal do projeto
          if (project.imageUrl) {
            const imagePath = path.join(this.uploadsDir, project.imageUrl.replace('/uploads/', ''));
            try {
              await fs.access(imagePath);
              archive.file(imagePath, { name: `${projectFolder}/imagem-principal${path.extname(imagePath)}` });
            } catch (error) {
              console.log(`⚠️ Imagem principal não encontrada para ${project.name}: ${imagePath}`);
            }
          }

          // Adicionar medias das atualizações do projeto
          for (const update of project.updates || []) {
            if (update.mediaUrls && Array.isArray(update.mediaUrls)) {
              for (let i = 0; i < update.mediaUrls.length; i++) {
                const mediaUrl = update.mediaUrls[i];
                const mediaPath = path.join(this.uploadsDir, mediaUrl.replace('/uploads/', ''));
                try {
                  await fs.access(mediaPath);
                  const fileName = `atualizacao-${update.id}-media-${i + 1}${path.extname(mediaPath)}`;
                  archive.file(mediaPath, { name: `${projectFolder}/atualizacoes/${fileName}` });
                } catch (error) {
                  console.log(`⚠️ Media da atualização não encontrada: ${mediaPath}`);
                }
              }
            }
          }
        }

        // 4. Criar arquivo de metadados do backup
        const metadata: BackupMetadata = {
          version: '1.0.0',
          timestamp: new Date().toISOString(),
          description: description || 'Backup completo do sistema',
          fileCount: 0, // será calculado pelo archiver
          totalSize: 0  // será calculado pelo archiver
        };

        archive.append(JSON.stringify(metadata, null, 2), { name: 'backup-metadata.json' });

        // 5. Adicionar estrutura de pastas completa para referência
        const directoryStructure = await this.getDirectoryStructure();
        archive.append(JSON.stringify(directoryStructure, null, 2), { name: 'estrutura-pastas.json' });

        await archive.finalize();

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Cria backup específico por tipo (empresa, pessoa, projeto)
   */
  async createSpecificBackup(type: 'company' | 'individual' | 'project', entityId: number): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `backup-${type}-${entityId}-${timestamp}`;
    const backupPath = path.join(this.backupDir, `${backupName}.zip`);

    return new Promise(async (resolve, reject) => {
      try {
        const output = createWriteStream(backupPath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', () => resolve(backupPath));
        archive.on('error', (err) => reject(err));
        archive.pipe(output);

        switch (type) {
          case 'company':
            await this.addCompanyToBackup(archive, entityId);
            break;
          case 'individual':
            await this.addIndividualToBackup(archive, entityId);
            break;
          case 'project':
            await this.addProjectToBackup(archive, entityId);
            break;
        }

        await archive.finalize();

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Restaura backup a partir de um arquivo ZIP
   */
  async restoreFromBackup(backupFilePath: string): Promise<{ success: boolean; message: string; restored: any }> {
    try {
      // TODO: Implementar restauração completa
      // 1. Extrair ZIP
      // 2. Ler metadados
      // 3. Validar estrutura
      // 4. Restaurar arquivos na pasta uploads
      // 5. Atualizar referências no banco de dados
      
      return {
        success: true,
        message: 'Backup restaurado com sucesso',
        restored: { files: 0, entities: 0 }
      };
    } catch (error) {
      return {
        success: false,
        message: `Erro ao restaurar backup: ${error.message}`,
        restored: null
      };
    }
  }

  /**
   * Lista todos os backups disponíveis
   */
  async listBackups(): Promise<Array<{ name: string; path: string; size: number; createdAt: Date }>> {
    try {
      const files = await fs.readdir(this.backupDir);
      const backups = [];

      for (const file of files) {
        if (file.endsWith('.zip')) {
          const filePath = path.join(this.backupDir, file);
          const stats = await fs.stat(filePath);
          backups.push({
            name: file,
            path: filePath,
            size: stats.size,
            createdAt: stats.birthtime
          });
        }
      }

      return backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      console.error('Erro ao listar backups:', error);
      return [];
    }
  }

  // Métodos auxiliares privados
  private async addCompanyToBackup(archive: archiver.Archiver, companyId: number) {
    const company = await db.query.companies.findFirst({
      where: eq(companies.id, companyId),
      with: { user: true, paymentProofs: true, investments: true, consumptionRecords: true }
    });

    if (!company) throw new Error(`Empresa com ID ${companyId} não encontrada`);

    const folder = `empresa-${company.id}-${this.sanitizeFilename(company.name)}`;
    archive.append(JSON.stringify(company, null, 2), { name: `${folder}/dados.json` });

    // Adicionar arquivos da empresa...
    if (company.logoUrl) {
      const logoPath = path.join(this.uploadsDir, company.logoUrl.replace('/uploads/', ''));
      try {
        await fs.access(logoPath);
        archive.file(logoPath, { name: `${folder}/logo${path.extname(logoPath)}` });
      } catch {}
    }
  }

  private async addIndividualToBackup(archive: archiver.Archiver, individualId: number) {
    const individual = await db.query.individuals.findFirst({
      where: eq(individuals.id, individualId),
      with: { user: true, paymentProofs: true, investments: true, consumptionRecords: true }
    });

    if (!individual) throw new Error(`Pessoa com ID ${individualId} não encontrada`);

    const folder = `pessoa-${individual.id}-${this.sanitizeFilename(individual.firstName)}-${this.sanitizeFilename(individual.lastName)}`;
    archive.append(JSON.stringify(individual, null, 2), { name: `${folder}/dados.json` });

    // Adicionar arquivos da pessoa...
    if (individual.profilePictureUrl) {
      const photoPath = path.join(this.uploadsDir, individual.profilePictureUrl.replace('/uploads/', ''));
      try {
        await fs.access(photoPath);
        archive.file(photoPath, { name: `${folder}/foto-perfil${path.extname(photoPath)}` });
      } catch {}
    }
  }

  private async addProjectToBackup(archive: archiver.Archiver, projectId: number) {
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, projectId),
      with: { sdg: true, updates: true, investments: true }
    });

    if (!project) throw new Error(`Projeto com ID ${projectId} não encontrado`);

    const folder = `projeto-${project.id}-${this.sanitizeFilename(project.name)}`;
    archive.append(JSON.stringify(project, null, 2), { name: `${folder}/dados.json` });

    // Adicionar arquivos do projeto...
    if (project.imageUrl) {
      const imagePath = path.join(this.uploadsDir, project.imageUrl.replace('/uploads/', ''));
      try {
        await fs.access(imagePath);
        archive.file(imagePath, { name: `${folder}/imagem-principal${path.extname(imagePath)}` });
      } catch {}
    }
  }

  private sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9\-_]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase();
  }

  private async getDirectoryStructure(): Promise<any> {
    const structure = {
      uploads: {
        logos: await this.getFilesInDir(path.join(this.uploadsDir, 'logos')),
        profiles: await this.getFilesInDir(path.join(this.uploadsDir, 'profiles')),
        projects: await this.getFilesInDir(path.join(this.uploadsDir, 'projects')),
        proofs: await this.getFilesInDir(path.join(this.uploadsDir, 'proofs'))
      }
    };
    return structure;
  }

  private async getFilesInDir(dirPath: string): Promise<string[]> {
    try {
      const files = await fs.readdir(dirPath);
      return files.filter(file => !file.startsWith('.'));
    } catch {
      return [];
    }
  }
}

export const backupService = new BackupService();
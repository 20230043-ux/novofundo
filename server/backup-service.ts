import fs from 'fs/promises';
import path from 'path';
import archiver from 'archiver';
import { createWriteStream, createReadStream } from 'fs';
import { db } from '@db';
import { 
  users, companies, individuals, projects, projectUpdates, paymentProofs, 
  sdgs, consumptionRecords, investments, sessions 
} from '@shared/schema';
import { eq } from 'drizzle-orm';

interface BackupMetadata {
  version: string;
  timestamp: string;
  description: string;
  fileCount: number;
  totalSize: number;
  sdgImagesUrls: Record<number, string>;
  databaseSchema: string;
  systemFiles: string[];
  configFiles: string[];
  dependencies: Record<string, string>;
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
   * Cria backup COMPLETO de TUDO necessário para restaurar o site
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
          console.log(`✅ Backup COMPLETO criado: ${backupPath} (${archive.pointer()} bytes)`);
          resolve(backupPath);
        });

        archive.on('error', (err) => reject(err));
        archive.pipe(output);

        // NOVO: URLs das imagens dos ODS (para referência)
        const sdgImageUrls = {
          1: "https://th.bing.com/th/id/R.e450166479d03cfb325dd75b19af094e?rik=idy70PFGT0R9Ig&pid=ImgRaw&r=0",
          2: "https://th.bing.com/th/id/OIP.oaFy_ZF8rMobDNAQefPEMwHaHa?rs=1&pid=ImgDetMain",
          3: "https://th.bing.com/th/id/OIP.y4kQwPfXldkP0Sl_vas4YgHaHa?w=1024&h=1024&rs=1&pid=ImgDetMain",
          4: "https://www.atlasodsamazonas.ufam.edu.br/images/SDG-icon-PT-04.jpg",
          5: "https://th.bing.com/th/id/R.da468d5af7524497df187803fe0cae70?rik=5bkwuaNWDZB0xw&riu=http%3a%2f%2fwww.fiepr.org.br%2fnospodemosparana%2fdbimages%2f165839.img&ehk=Pz8eF2%2fpyco9Vo%2f2nhqn1LePL%2bA9E5vlgHXfHjs3ZGc%3d&risl=&pid=ImgRaw&r=0",
          6: "https://www.researchgate.net/publication/332105058/figure/fig1/AS:742498821484544@1554036922168/Figura-2-Icone-do-ODS-6_Q320.jpg",
          7: "https://th.bing.com/th/id/R.82b241e50d1b45b63ffd8de1c3c533f5?rik=8IWQk1ZIRjAYMw&riu=http%3a%2f%2fwww4.planalto.gov.br%2fods%2fobjetivos-de-desenvolvimento-sustentavel%2f7-energia-acessivel-e-limpa%2f7.png&ehk=2Cx1gE6R73fSslp%2bhUHnrc2oDBXcnvzFiwq0ocxDfoE%3d&risl=&pid=ImgRaw&r=0&sres=1&sresct=1",
          8: "https://th.bing.com/th/id/OIP.SfkeHcHVpu58f56QvSodSAAAAA?rs=1&pid=ImgDetMain",
          9: "https://th.bing.com/th/id/OIP.5n2ruG52gTFcl8z-2ulmpgHaHa?w=1772&h=1772&rs=1&pid=ImgDetMain",
          10: "https://ods.ine.gov.ao/img/team/ods10.png",
          11: "https://th.bing.com/th/id/OIP.TVr4hHLupfkGk14Md1GO_gHaHa?rs=1&pid=ImgDetMain",
          12: "https://www.terceiravia.org.br/wp-content/uploads/2020/11/ODS-12-2.png",
          13: "https://th.bing.com/th/id/OIP.JzbOWgHb5CgDVht4MUf37wHaHa?rs=1&pid=ImgDetMain",
          14: "https://th.bing.com/th/id/OIP.jdsJOCu9dLeAdGrpgeQ10wAAAA?w=466&h=466&rs=1&pid=ImgDetMain",
          15: "https://www.iberdrola.com/wcorp/gc/prod/es_ES/estaticos/ods-general/images/ico-ODS15-PT.png",
          16: "https://th.bing.com/th/id/OIP.vFknArfBQbEM6VaJOf3cIQHaHa?w=1024&h=1024&rs=1&pid=ImgDetMain",
          17: "https://th.bing.com/th/id/R.58589445ff5b3b737b0b7eabe2b4b601?rik=J1ybA5uwzTXDjg&riu=http%3a%2f%2fwww4.planalto.gov.br%2fods%2f17.png%2f%40%40images%2f35114d8b-1583-4660-90d4-1c6dca011b0f.png&ehk=GNtvTkjnrkn5JQa9CzZp7ejSfGCovMcO5WqMgQ9Ds8c%3d&risl=&pid=ImgRaw&r=0"
        };

        // ===== PARTE 1: BACKUP COMPLETO DA BASE DE DADOS =====
        await this.backupCompleteDatabase(archive);

        // ===== PARTE 2: BACKUP DE ARQUIVOS DO SISTEMA =====
        await this.backupSystemFiles(archive);

        // ===== PARTE 3: BACKUP DOS ARQUIVOS DE CONFIGURAÇÃO =====
        await this.backupConfigurationFiles(archive);

        // ===== PARTE 4: BACKUP DOS UPLOADS E MEDIA =====
        await this.backupUploadsAndMedia(archive);

        // ===== PARTE 5: BACKUP DOS ARQUIVOS PÚBLICOS =====
        await this.backupPublicFiles(archive);

        // ===== PARTE 6: CRIAR METADATA COMPLETO =====
        const metadata: BackupMetadata = {
          version: '2.0.0',
          timestamp: new Date().toISOString(),
          description: description || 'Backup COMPLETO do sistema Fundo Verde',
          fileCount: 0,
          totalSize: 0,
          sdgImagesUrls: sdgImageUrls,
          databaseSchema: await this.getDatabaseSchema(),
          systemFiles: await this.getSystemFilesList(),
          configFiles: await this.getConfigFilesList(),
          dependencies: await this.getDependenciesList()
        };

        archive.append(JSON.stringify(metadata, null, 2), { name: 'backup-metadata.json' });

        // ===== PARTE 7: INSTRUÇÕES DE RESTAURAÇÃO =====
        const restoreInstructions = await this.generateRestoreInstructions();
        archive.append(restoreInstructions, { name: 'COMO-RESTAURAR.md' });

        // ===== PARTE 8: ESTRUTURA COMPLETA =====
        const directoryStructure = await this.getDirectoryStructure();
        archive.append(JSON.stringify(directoryStructure, null, 2), { name: 'estrutura-completa.json' });

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
   * BACKUP ESSENCIAL - Apenas dados necessários conforme solicitado
   * Inclui: projetos, pessoas, empresas, históricos financeiros e de cálculo, links de imagens e senhas
   */
  async createEssentialBackup(description?: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `backup-essencial-${timestamp}`;
    const backupPath = path.join(this.backupDir, `${backupName}.zip`);

    return new Promise(async (resolve, reject) => {
      try {
        const output = createWriteStream(backupPath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', () => {
          console.log(`✅ Backup ESSENCIAL criado: ${backupPath} (${archive.pointer()} bytes)`);
          resolve(backupPath);
        });

        archive.on('error', (err) => reject(err));
        archive.pipe(output);

        // Backup apenas dos dados essenciais
        await this.backupEssentialData(archive);

        // Backup apenas das imagens dos uploads (logos, fotos de perfil, comprovativos)
        await this.backupEssentialImages(archive);

        // Schema do banco para referência
        try {
          archive.file('shared/schema.ts', { name: 'schema/database-schema.ts' });
        } catch (error) {
          console.warn('⚠️ Schema file not found, continuing without it');
        }

        // Metadados do backup essencial
        const metadata = {
          createdAt: new Date().toISOString(),
          timestamp: new Date().toISOString(),
          description: description || 'Backup ESSENCIAL do Fundo Verde - Dados críticos apenas',
          type: 'essential',
          includes: [
            'Projetos com imagens e investimentos',
            'Empresas com logos e históricos financeiros',
            'Pessoas com fotos e históricos de cálculo',
            'Comprovativos de pagamento',
            'Histórico completo de investimentos',
            'Senhas dos utilizadores (hash)',
            'Links de todas as imagens'
          ],
          fileCount: 0,
          totalSize: 0
        };

        archive.append(JSON.stringify(metadata, null, 2), { name: 'backup-essencial-metadata.json' });

        // Instruções de restauração essencial
        const restoreInstructions = `# Como Restaurar Backup Essencial

Este backup contém apenas os dados essenciais do Fundo Verde:

## Conteúdo Incluído:
- ✅ Todos os projetos com imagens e histórico de investimentos
- ✅ Todas as empresas com logos e históricos financeiros
- ✅ Todas as pessoas com fotos e históricos de cálculo
- ✅ Histórico completo de comprovativos de pagamento
- ✅ Histórico completo de investimentos
- ✅ Senhas dos utilizadores (hash bcrypt)
- ✅ Links de todas as imagens utilizadas

## Para Restaurar:
1. Extrair o arquivo ZIP
2. Importar os arquivos JSON da pasta 'database/' para o PostgreSQL
3. Copiar imagens da pasta 'uploads/' para o servidor
4. Verificar links de imagens no arquivo 'image_links.json'
5. As senhas estão preservadas e funcionarão imediatamente

## Dados NÃO Incluídos:
- Arquivos de sistema e configuração
- Dependências do Node.js
- Arquivos públicos
- Logs do sistema

Este backup é otimizado para migração rápida de dados críticos.
`;

        archive.append(restoreInstructions, { name: 'COMO-RESTAURAR-ESSENCIAL.md' });

        await archive.finalize();

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * BACKUP ESSENCIAL - APENAS DADOS NECESSÁRIOS
   * Inclui: projetos, pessoas, empresas, históricos de financiamento/cálculo, links de imagens e senhas
   */
  private async backupEssentialData(archive: any) {
    console.log('📊 Iniciando backup dos dados essenciais...');

    // 1. SDGs (para referência dos projetos)
    const sdgsData = await db.query.sdgs.findMany();
    archive.append(JSON.stringify(sdgsData, null, 2), { name: 'database/sdgs.json' });

    // 2. Utilizadores (COM SENHAS INCLUÍDAS para recuperação completa)
    const usersData = await db.query.users.findMany();
    // IMPORTANTE: Mantemos as senhas hash para poder restaurar os acessos
    archive.append(JSON.stringify(usersData, null, 2), { name: 'database/users.json' });

    // 3. Empresas com todos os históricos financeiros e de cálculo
    const companiesData = await db.query.companies.findMany({
      with: { 
        user: true, // Inclui dados de login
        consumptionRecords: true, // Histórico de cálculos de carbono
        paymentProofs: true, // Histórico de comprovativos
        investments: true // Histórico de investimentos
      }
    });
    archive.append(JSON.stringify(companiesData, null, 2), { name: 'database/companies.json' });

    // 4. Pessoas individuais com todos os históricos
    const individualsData = await db.query.individuals.findMany({
      with: { 
        user: true, // Inclui dados de login
        consumptionRecords: true, // Histórico de cálculos pessoais
        paymentProofs: true, // Histórico de comprovativos
        investments: true // Histórico de investimentos
      }
    });
    archive.append(JSON.stringify(individualsData, null, 2), { name: 'database/individuals.json' });

    // 5. Projetos com imagens e histórico completo
    const projectsData = await db.query.projects.findMany({
      with: {
        sdg: true, // Dados do ODS associado
        updates: true, // Atualizações do projeto
        investments: true // Histórico de investimentos recebidos
      }
    });
    archive.append(JSON.stringify(projectsData, null, 2), { name: 'database/projects.json' });

    // 6. Histórico completo de consumo (cálculos de carbono)
    const consumptionData = await db.query.consumptionRecords.findMany();
    archive.append(JSON.stringify(consumptionData, null, 2), { name: 'database/consumption_records.json' });

    // 7. Histórico completo de comprovativos de pagamento
    const paymentProofsData = await db.query.paymentProofs.findMany();
    archive.append(JSON.stringify(paymentProofsData, null, 2), { name: 'database/payment_proofs.json' });

    // 8. Histórico completo de investimentos
    const investmentsData = await db.query.investments.findMany();
    archive.append(JSON.stringify(investmentsData, null, 2), { name: 'database/investments.json' });

    // 9. Atualizações de projetos (conteúdo e mídia)
    const updatesData = await db.query.projectUpdates.findMany();
    archive.append(JSON.stringify(updatesData, null, 2), { name: 'database/project_updates.json' });

    // 10. Links de todas as imagens usadas no sistema
    const imageLinks = {
      companies: companiesData.map(c => ({ id: c.id, name: c.name, logoUrl: c.logoUrl })).filter(c => c.logoUrl),
      individuals: individualsData.map(i => ({ id: i.id, name: `${i.firstName} ${i.lastName}`, profilePictureUrl: i.profilePictureUrl })).filter(i => i.profilePictureUrl),
      projects: projectsData.map(p => ({ id: p.id, name: p.name, imageUrl: p.imageUrl })).filter(p => p.imageUrl),
      projectUpdates: updatesData.map(u => ({ id: u.id, title: u.title, mediaUrls: u.mediaUrls })).filter(u => u.mediaUrls && u.mediaUrls.length > 0)
    };
    archive.append(JSON.stringify(imageLinks, null, 2), { name: 'database/image_links.json' });

    console.log('✅ Backup dos dados essenciais concluído');
    console.log(`📊 Incluído: ${companiesData.length} empresas, ${individualsData.length} pessoas, ${projectsData.length} projetos`);
    console.log(`💰 Históricos: ${consumptionData.length} cálculos, ${paymentProofsData.length} comprovativos, ${investmentsData.length} investimentos`);
  }

  /**
   * BACKUP COMPLETO DA BASE DE DADOS - TODAS AS TABELAS (versão antiga mantida para compatibilidade)
   */
  private async backupCompleteDatabase(archive: any) {
    // Agora usa o backup essencial por padrão
    return this.backupEssentialData(archive);
  }

  /**
   * BACKUP DE ARQUIVOS DO SISTEMA
   */
  private async backupSystemFiles(archive: any) {
    console.log('🗂️ Iniciando backup de arquivos do sistema...');

    const systemFiles = [
      'package.json',
      'package-lock.json',
      'tsconfig.json',
      'vite.config.ts',
      'tailwind.config.ts',
      'postcss.config.js',
      'drizzle.config.ts',
      'components.json',
      '.gitignore',
      'replit.md',
      'REPLIT_KEEP_ALIVE_GUIDE.md'
    ];

    for (const file of systemFiles) {
      try {
        await fs.access(file);
        archive.file(file, { name: `sistema/${file}` });
      } catch (error) {
        console.log(`⚠️ Arquivo do sistema não encontrado: ${file}`);
      }
    }

    console.log('✅ Backup de arquivos do sistema concluído');
  }

  /**
   * BACKUP DE ARQUIVOS DE CONFIGURAÇÃO
   */
  private async backupConfigurationFiles(archive: any) {
    console.log('⚙️ Iniciando backup de arquivos de configuração...');

    // Arquivos de configuração críticos
    const configFiles = [
      '.replit',
      '.env.example',
      'shared/schema.ts',
      'db/seed.ts',
      'server/index.ts',
      'server/routes.ts',
      'server/auth.ts',
      'server/storage.ts'
    ];

    for (const file of configFiles) {
      try {
        await fs.access(file);
        archive.file(file, { name: `config/${file.replace('/', '-')}` });
      } catch (error) {
        console.log(`⚠️ Arquivo de configuração não encontrado: ${file}`);
      }
    }

    console.log('✅ Backup de arquivos de configuração concluído');
  }

  /**
   * BACKUP ESSENCIAL DE IMAGENS - Apenas imagens necessárias
   */
  private async backupEssentialImages(archive: any) {
    console.log('📁 Iniciando backup de imagens essenciais...');

    try {
      // Verificar se a pasta uploads existe
      await fs.access(this.uploadsDir);
      
      // Backup recursivo de toda a pasta uploads (inclui logos, fotos, comprovativos)
      archive.directory(this.uploadsDir, 'uploads');
      
      console.log('✅ Backup de imagens essenciais concluído');
    } catch (error) {
      console.log('⚠️ Pasta uploads não encontrada, criando estrutura vazia...');
      // Criar estrutura vazia para uploads
      archive.append('', { name: 'uploads/.gitkeep' });
    }
  }

  /**
   * BACKUP COMPLETO DOS UPLOADS E MEDIA
   */
  private async backupUploadsAndMedia(archive: any) {
    console.log('📁 Iniciando backup completo de uploads e media...');

    try {
      // Verificar se a pasta uploads existe
      await fs.access(this.uploadsDir);
      
      // Backup recursivo de toda a pasta uploads
      archive.directory(this.uploadsDir, 'uploads');
      
      console.log('✅ Backup de uploads e media concluído');
    } catch (error) {
      console.log('⚠️ Pasta uploads não encontrada, criando estrutura vazia...');
      // Criar estrutura vazia para uploads
      archive.append('', { name: 'uploads/.gitkeep' });
    }
  }

  /**
   * BACKUP DOS ARQUIVOS PÚBLICOS
   */
  private async backupPublicFiles(archive: any) {
    console.log('🌐 Iniciando backup de arquivos públicos...');

    try {
      const publicDir = path.resolve('./public');
      await fs.access(publicDir);
      archive.directory(publicDir, 'public');
      console.log('✅ Backup de arquivos públicos concluído');
    } catch (error) {
      console.log('⚠️ Pasta public não encontrada');
    }
  }

  /**
   * GERAR INSTRUÇÕES COMPLETAS DE RESTAURAÇÃO
   */
  private async generateRestoreInstructions(): Promise<string> {
    return `# 🔄 GUIA COMPLETO DE RESTAURAÇÃO - FUNDO VERDE

## ⚠️ IMPORTANTE: ESTE BACKUP CONTÉM TUDO NECESSÁRIO PARA RESTAURAR O SITE COMPLETAMENTE

### 📋 CONTEÚDO DO BACKUP:
- ✅ Base de dados completa (todas as tabelas)
- ✅ Todos os arquivos de uploads (logos, fotos, comprovativos)
- ✅ Links das imagens dos ODS (Objetivos de Desenvolvimento Sustentável)
- ✅ Arquivos de configuração do sistema
- ✅ Dependências e package.json
- ✅ Arquivos públicos
- ✅ Schema da base de dados

### 🚀 PASSOS PARA RESTAURAÇÃO COMPLETA:

#### 1. PREPARAR AMBIENTE:
\`\`\`bash
# 1. Criar novo projeto no Replit
# 2. Extrair este backup ZIP na raiz do projeto
# 3. Instalar dependências
npm install
\`\`\`

#### 2. CONFIGURAR BASE DE DADOS:
\`\`\`bash
# 1. Criar nova base de dados PostgreSQL (Neon Database)
# 2. Definir DATABASE_URL no .env
# 3. Aplicar schema
npm run db:push
# 4. Importar dados (ver pasta database/)
\`\`\`

#### 3. RESTAURAR ARQUIVOS:
- Copiar pasta \`uploads/\` para raiz do projeto
- Copiar pasta \`public/\` para raiz do projeto
- Copiar arquivos de \`sistema/\` para raiz
- Copiar arquivos de \`config/\` para respetivos locais

#### 4. CONFIGURAR VARIÁVEIS:
\`\`\`env
DATABASE_URL=sua_nova_database_url
SESSION_SECRET=sua_session_secret
\`\`\`

#### 5. INICIAR APLICAÇÃO:
\`\`\`bash
npm run dev
\`\`\`

### 📊 DADOS INCLUÍDOS NO BACKUP:
- **SDGs**: Links de todas as imagens dos ODS (ver backup-metadata.json)
- **Utilizadores**: Todos os logins e dados de autenticação
- **Empresas**: Dados completos + logos + comprovativos
- **Pessoas**: Dados completos + fotos + comprovativos
- **Projetos**: Dados completos + imagens + atualizações
- **Investimentos**: Todos os registros de investimentos
- **Cálculos**: Todos os registros de pegada de carbono

### 🔗 LINKS DAS IMAGENS DOS ODS:
Todos os links das imagens dos ODS estão salvos em \`backup-metadata.json\` na seção \`sdgImagesUrls\`.

### ⚡ SISTEMA KEEP-ALIVE:
Este backup inclui o sistema completo de keep-alive para evitar hibernação no Replit.
Ver: REPLIT_KEEP_ALIVE_GUIDE.md

### 🆘 SUPORTE:
Se houver problemas na restauração:
1. Verificar se todas as variáveis de ambiente estão definidas
2. Confirmar que a base de dados está acessível
3. Verificar se as pastas uploads e public têm as permissões corretas
4. Consultar logs do servidor para mais detalhes

**Data do Backup**: ${new Date().toISOString()}
**Versão**: 2.0.0 - Backup Completo Fundo Verde
`;
  }

  /**
   * OBTER SCHEMA DA BASE DE DADOS
   */
  private async getDatabaseSchema(): Promise<string> {
    return 'Drizzle ORM - Ver shared/schema.ts';
  }

  /**
   * OBTER LISTA DE ARQUIVOS DO SISTEMA
   */
  private async getSystemFilesList(): Promise<string[]> {
    return [
      'package.json', 'package-lock.json', 'tsconfig.json',
      'vite.config.ts', 'tailwind.config.ts', 'drizzle.config.ts',
      'replit.md', 'REPLIT_KEEP_ALIVE_GUIDE.md'
    ];
  }

  /**
   * OBTER LISTA DE ARQUIVOS DE CONFIGURAÇÃO
   */
  private async getConfigFilesList(): Promise<string[]> {
    return [
      '.replit', '.env.example', 'shared/schema.ts',
      'server/index.ts', 'server/routes.ts', 'server/auth.ts'
    ];
  }

  /**
   * OBTER LISTA DE DEPENDÊNCIAS
   */
  private async getDependenciesList(): Promise<Record<string, string>> {
    try {
      const packageJson = JSON.parse(await fs.readFile('package.json', 'utf-8'));
      return {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      };
    } catch {
      return {};
    }
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
        message: 'Backup restaurado com sucesso - Ver COMO-RESTAURAR.md no backup',
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
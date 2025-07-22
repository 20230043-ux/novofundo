import { db } from '@db';
import { eq, and, desc, sql, asc, or, isNull, count } from 'drizzle-orm';
import session from 'express-session';
import connectPg from 'connect-pg-simple';
import { pool } from '@db';
import fs from 'fs/promises';
import path from 'path';
import { 
  users, 
  companies,
  individuals,
  sdgs,
  projects,
  projectUpdates,
  consumptionRecords,
  paymentProofs,
  investments,
  carbonLeaderboard,
  InsertUser,
  User,
  InsertCompany,
  InsertIndividual,
  CarbonLeaderboard,
  InsertCarbonLeaderboard,
  Company,
  Individual,
  InsertSdg,
  InsertProject,
  InsertProjectUpdate,
  InsertConsumptionRecord,
  InsertPaymentProof,
  InsertInvestment,
  UserWithCompany,
  UserWithIndividual
} from '@shared/schema';

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User & Auth
  getUser(id: number): Promise<User | undefined>;
  getUserWithCompany(id: number): Promise<UserWithCompany | undefined>;
  getUserWithIndividual(id: number): Promise<UserWithIndividual | undefined>;
  getUserWithProfile(id: number): Promise<UserWithCompany | UserWithIndividual | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByEmailWithCompany(email: string): Promise<UserWithCompany | undefined>;
  getUserByEmailWithProfile(email: string): Promise<UserWithCompany | UserWithIndividual | undefined>;
  createUser(userData: InsertUser): Promise<User>;
  createCompany(companyData: InsertCompany): Promise<Company>;
  createIndividual(individualData: InsertIndividual): Promise<Individual>;
  updateCompany(id: number, companyData: Partial<InsertCompany>): Promise<Company | undefined>;
  updateIndividual(id: number, individualData: Partial<InsertIndividual>): Promise<Individual | undefined>;
  
  // SDGs
  getAllSdgs(): Promise<any[]>;
  getSdgById(id: number): Promise<any | undefined>;
  getSdgByNumber(number: number): Promise<any | undefined>;
  getInvestingCompaniesForSdg(sdgId: number): Promise<any[]>;
  
  // Projects
  getAllProjects(): Promise<any[]>;
  getProjectById(id: number): Promise<any | undefined>;
  getProjectsBySDG(sdgId: number): Promise<any[]>;
  createProject(projectData: InsertProject): Promise<any>;
  updateProject(id: number, projectData: Partial<InsertProject>): Promise<any | undefined>;
  deleteProject(id: number): Promise<boolean>;
  addProjectUpdate(updateData: InsertProjectUpdate): Promise<any>;
  
  // Consumption
  createConsumptionRecord(data: InsertConsumptionRecord): Promise<any>;
  getConsumptionRecordsForCompany(companyId: number): Promise<any[]>;
  getConsumptionRecordsForIndividual(individualId: number): Promise<any[]>;
  
  // Payment Proofs
  createPaymentProof(data: InsertPaymentProof): Promise<any>;
  getPaymentProofsForCompany(companyId: number): Promise<any[]>;
  getPaymentProofsForIndividual(individualId: number): Promise<any[]>;
  getPendingPaymentProofs(): Promise<any[]>;
  updatePaymentProofStatus(id: number, status: 'approved' | 'rejected'): Promise<any | undefined>;
  assignSdgToPaymentProof(id: number, sdgId: number): Promise<any | undefined>;
  
  // Investments
  createInvestment(data: InsertInvestment): Promise<any>;
  getInvestmentsForCompany(companyId: number): Promise<any[]>;
  getInvestmentsForIndividual(individualId: number): Promise<any[]>;
  getIndividualInvestmentTotalsBySDG(individualId: number): Promise<any[]>;
  getInvestmentsForProject(projectId: number): Promise<any[]>;
  
  // Display Investments (for publications page)
  getDisplayInvestment(projectId: number): Promise<any | undefined>;
  createOrUpdateDisplayInvestment(projectId: number, displayAmount: number): Promise<any>;
  
  // Companies
  getAllCompanies(): Promise<any[]>;
  getCompanyById(id: number): Promise<any | undefined>;
  
  // Individuals
  getIndividualById(id: number): Promise<any | undefined>;
  
  // Statistics & Dashboard
  getCompanyStats(companyId: number): Promise<any>;
  getIndividualStats(individualId: number): Promise<any>;
  getAdminDashboardStats(): Promise<any>;
  getPaymentProofsWithoutSdg(): Promise<any[]>;
  
  // Carbon Leaderboard
  getCarbonLeaderboard(period?: string): Promise<CarbonLeaderboard[]>;
  getCompanyCarbonStats(companyId: number): Promise<CarbonLeaderboard | undefined>;
  updateCarbonLeaderboard(data: InsertCarbonLeaderboard): Promise<CarbonLeaderboard>;
  calculateCarbonRanking(): Promise<void>;
  
  // Session store
  sessionStore: any;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;
  
  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool,
      createTableIfMissing: false, // A tabela já existe, então não precisamos criá-la
      tableName: 'sessions' // Especificando o nome da tabela para garantir que usamos a correta
    });
  }

  // Test database connection for intelligent fallback system
  async testConnection(): Promise<void> {
    const result = await db.execute(sql`SELECT 1 as test`);
    if (!result || !result.rows || result.rows.length === 0) {
      throw new Error("Database connection failed");
    }
  }
  
  // User & Auth
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }
  
  async getUserWithCompany(id: number): Promise<UserWithCompany | undefined> {
    const result = await db.query.users.findFirst({
      where: eq(users.id, id),
      with: {
        company: true
      }
    });
    
    return result as UserWithCompany | undefined;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }
  
  async getUserByEmailWithCompany(email: string): Promise<UserWithCompany | undefined> {
    const result = await db.query.users.findFirst({
      where: eq(users.email, email),
      with: {
        company: true
      }
    });
    
    return result as UserWithCompany | undefined;
  }
  
  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }
  
  async createCompany(companyData: InsertCompany): Promise<Company> {
    const [company] = await db.insert(companies).values(companyData).returning();
    return company;
  }
  
  async updateCompany(id: number, companyData: Partial<InsertCompany>): Promise<Company | undefined> {
    const [updated] = await db
      .update(companies)
      .set({ ...companyData, updatedAt: new Date() })
      .where(eq(companies.id, id))
      .returning();
    
    return updated;
  }

  async getUserWithIndividual(id: number): Promise<UserWithIndividual | undefined> {
    const result = await db.query.users.findFirst({
      where: eq(users.id, id),
      with: {
        individual: true
      }
    });
    
    return result as UserWithIndividual | undefined;
  }

  async getUserWithProfile(id: number): Promise<UserWithCompany | UserWithIndividual | undefined> {
    const result = await db.query.users.findFirst({
      where: eq(users.id, id),
      with: {
        company: true,
        individual: true
      }
    });
    
    if (!result) return undefined;
    
    if (result.role === 'admin') {
      // For admin users, return as-is since they don't have company/individual profiles
      return result as any;
    } else if (result.role === 'company' && result.company) {
      return result as UserWithCompany;
    } else if (result.role === 'individual' && result.individual) {
      return result as UserWithIndividual;
    }
    
    return undefined;
  }

  async getUserByEmailWithProfile(email: string): Promise<UserWithCompany | UserWithIndividual | undefined> {
    const result = await db.query.users.findFirst({
      where: eq(users.email, email),
      with: {
        company: true,
        individual: true
      }
    });
    
    if (!result) return undefined;
    
    if (result.role === 'admin') {
      // For admin users, return as-is since they don't have company/individual profiles
      return result as any;
    } else if (result.role === 'company' && result.company) {
      return result as UserWithCompany;
    } else if (result.role === 'individual' && result.individual) {
      return result as UserWithIndividual;
    }
    
    return undefined;
  }

  async createIndividual(individualData: InsertIndividual): Promise<Individual> {
    const [individual] = await db.insert(individuals).values(individualData).returning();
    return individual;
  }

  async updateIndividual(id: number, individualData: Partial<InsertIndividual>): Promise<Individual | undefined> {
    const [updated] = await db
      .update(individuals)
      .set({ ...individualData, updatedAt: new Date() })
      .where(eq(individuals.id, id))
      .returning();
    
    return updated;
  }
  
  // SDGs
  async getAllSdgs() {
    return await db.select().from(sdgs).orderBy(asc(sdgs.number));
  }
  
  async getSdgById(id: number) {
    const result = await db.query.sdgs.findFirst({
      where: eq(sdgs.id, id),
      with: {
        projects: true
      }
    });
    
    if (result) {
      // Calcular o valor total investido para este ODS evitando dupla contagem
      const totalInvestedResult = await db.execute(sql`
        SELECT 
          COALESCE(
            (
              -- Comprovativos aprovados sem investimentos associados
              SELECT SUM(pp.amount)
              FROM payment_proofs pp
              LEFT JOIN investments inv ON pp.id = inv.payment_proof_id
              WHERE pp.sdg_id = ${id}
              AND pp.status = 'approved'
              AND inv.id IS NULL
            ),
            0
          ) + 
          COALESCE(
            (
              -- Investimentos em projetos
              SELECT SUM(inv.amount)
              FROM investments inv
              JOIN projects p ON inv.project_id = p.id
              WHERE p.sdg_id = ${id}
            ),
            0
          ) as total_invested
      `);
      
      // Atualizar o valor total investido no ODS
      result.totalInvested = totalInvestedResult.rows[0]?.total_invested || '0';
      
      // Buscar empresas investidoras (já corrigido na função getInvestingCompaniesForSdg)
      const investingCompanies = await this.getInvestingCompaniesForSdg(id);
      
      // Buscar pessoas investidoras
      const investingIndividuals = await this.getInvestingIndividualsForSdg(id);
      
      return { 
        ...result, 
        investingCompanies: investingCompanies,
        investingIndividuals: investingIndividuals
      };
    }
    
    return undefined;
  }
  
  async getInvestingCompaniesForSdg(sdgId: number) {
    try {
      console.log(`Encontrando empresas investidoras para o ODS ${sdgId}`);
      // Count both investments and payment proofs
      const allInvestors = await db
        .select({
          id: companies.id,
          name: companies.name,
          logoUrl: companies.logoUrl,
          sector: companies.sector,
          // Count both investments and payment proofs (avoiding double counting)
          totalInvested: sql<string>`
            (
              SELECT COALESCE(SUM(inv.amount), 0)
              FROM investments inv
              JOIN projects p ON inv.project_id = p.id
              WHERE inv.company_id = companies.id 
              AND p.sdg_id = ${sdgId}
            ) + 
            (
              SELECT COALESCE(SUM(pp.amount), 0)
              FROM payment_proofs pp
              LEFT JOIN investments inv ON pp.id = inv.payment_proof_id
              WHERE pp.company_id = companies.id 
              AND pp.sdg_id = ${sdgId}
              AND pp.status = 'approved'
              AND inv.id IS NULL
            )
          `,
        })
        .from(companies)
        .where(
          // Filter companies that have either investments or payment proofs for this SDG
          sql`
            companies.id IN (
              SELECT DISTINCT inv.company_id
              FROM investments inv
              JOIN projects p ON inv.project_id = p.id
              WHERE p.sdg_id = ${sdgId}
            )
            OR
            companies.id IN (
              SELECT DISTINCT pp.company_id
              FROM payment_proofs pp
              LEFT JOIN investments inv ON pp.id = inv.payment_proof_id
              WHERE pp.sdg_id = ${sdgId} 
              AND pp.status = 'approved'
              AND inv.id IS NULL
            )
          `
        )
        .orderBy(desc(sql<string>`
          (
            SELECT COALESCE(SUM(inv.amount), 0)
            FROM investments inv
            JOIN projects p ON inv.project_id = p.id
            WHERE inv.company_id = companies.id 
            AND p.sdg_id = ${sdgId}
          ) + 
          (
            SELECT COALESCE(SUM(pp.amount), 0)
            FROM payment_proofs pp
            LEFT JOIN investments inv ON pp.id = inv.payment_proof_id
            WHERE pp.company_id = companies.id 
            AND pp.sdg_id = ${sdgId}
            AND pp.status = 'approved'
            AND inv.id IS NULL
          )
        `));
      
      // Filter out companies with zero investments
      const companiesWithInvestments = allInvestors.filter(
        company => parseFloat(company.totalInvested) > 0
      );
      
      return companiesWithInvestments;
    } catch (error) {
      console.error('Error fetching investing companies for SDG:', error);
      return [];
    }
  }

  async getInvestingIndividualsForSdg(sdgId: number) {
    try {
      console.log(`Encontrando pessoas investidoras para o ODS ${sdgId}`);
      
      // Simplify the query by getting individuals from both investments and payment proofs separately
      const allInvestors = await db
        .select({
          id: individuals.id,
          firstName: individuals.firstName,
          lastName: individuals.lastName,
          profilePictureUrl: individuals.profilePictureUrl,
          occupation: individuals.occupation,
          location: individuals.location,
          // Calculate total invested from both sources
          totalInvested: sql<string>`
            COALESCE((
              SELECT SUM(inv.amount)
              FROM investments inv
              JOIN projects p ON inv.project_id = p.id
              WHERE inv.individual_id = individuals.id 
              AND p.sdg_id = ${sdgId}
            ), 0) + 
            COALESCE((
              SELECT SUM(pp.amount)
              FROM payment_proofs pp
              WHERE pp.individual_id = individuals.id 
              AND pp.sdg_id = ${sdgId}
              AND pp.status = 'approved'
            ), 0)
          `,
        })
        .from(individuals)
        .where(
          // Find individuals that have either investments through projects or direct payment proofs for this SDG
          sql`
            individuals.id IN (
              SELECT DISTINCT inv.individual_id
              FROM investments inv
              JOIN projects p ON inv.project_id = p.id
              WHERE p.sdg_id = ${sdgId}
            )
            OR
            individuals.id IN (
              SELECT DISTINCT pp.individual_id
              FROM payment_proofs pp
              WHERE pp.sdg_id = ${sdgId} 
              AND pp.status = 'approved'
            )
          `
        )
        .orderBy(desc(sql<string>`
          COALESCE((
            SELECT SUM(inv.amount)
            FROM investments inv
            JOIN projects p ON inv.project_id = p.id
            WHERE inv.individual_id = individuals.id 
            AND p.sdg_id = ${sdgId}
          ), 0) + 
          COALESCE((
            SELECT SUM(pp.amount)
            FROM payment_proofs pp
            WHERE pp.individual_id = individuals.id 
            AND pp.sdg_id = ${sdgId}
            AND pp.status = 'approved'
          ), 0)
        `));
      
      // Filter out individuals with zero investments
      const individualsWithInvestments = allInvestors.filter(
        individual => parseFloat(individual.totalInvested) > 0
      );
      
      console.log(`Encontradas ${individualsWithInvestments.length} pessoas investidoras para o ODS ${sdgId}`);
      
      return individualsWithInvestments;
    } catch (error) {
      console.error('Error fetching investing individuals for SDG:', error);
      return [];
    }
  }
  
  async getSdgByNumber(number: number) {
    const result = await db.query.sdgs.findFirst({
      where: eq(sdgs.number, number),
      with: {
        projects: true
      }
    });
    
    if (result) {
      // Get the companies that invested in this SDG
      const sdgInvestments = await db
        .select({
          companyId: companies.id,
          companyName: companies.name,
          totalAmount: sql<string>`sum(${investments.amount})`,
        })
        .from(investments)
        .innerJoin(projects, eq(investments.projectId, projects.id))
        .innerJoin(companies, eq(investments.companyId, companies.id))
        .where(eq(projects.sdgId, result.id))
        .groupBy(companies.id, companies.name)
        .orderBy(desc(sql<string>`sum(${investments.amount})`));
        
      // Usar a função atualizada que busca empresas com comprovantes aprovados
      // mesmo sem projetos associados
      const investingCompanies = await this.getInvestingCompaniesForSdg(result.id);
      
      return { 
        ...result, 
        
        investingCompanies: investingCompanies
      };
    }
    
    return undefined;
  }
  
  // Projects
  async getAllProjects() {
    return await db.query.projects.findMany({
      with: {
        sdg: true,
        investments: {
          with: {
            company: true
          }
        },
        updates: true
      },
      orderBy: [desc(projects.createdAt)]
    });
  }
  
  async getProjectById(id: number) {
    const result = await db.query.projects.findFirst({
      where: eq(projects.id, id),
      with: {
        sdg: true,
        updates: true,
        investments: {
          with: {
            company: true
          }
        }
      }
    });
    
    return result;
  }
  
  async getProjectsBySDG(sdgId: number) {
    return await db.query.projects.findMany({
      where: eq(projects.sdgId, sdgId),
      with: {
        sdg: true,
        investments: {
          with: {
            company: true
          }
        }
      },
      orderBy: [desc(projects.createdAt)]
    });
  }
  
  async createProject(projectData: InsertProject) {
    const [project] = await db.insert(projects).values(projectData).returning();
    return project;
  }
  
  async updateProject(id: number, projectData: Partial<InsertProject>) {
    try {
      console.log("updateProject chamado com:", { id, projectData });
      
      // Garantir que os tipos estão corretos para o banco de dados
      const dataToUpdate: any = { ...projectData, updatedAt: new Date() };
      
      // Verificar e converter o campo totalInvested 
      if (projectData.totalInvested !== undefined) {
        console.log("Tipo do totalInvested:", typeof projectData.totalInvested);
        console.log("Valor do totalInvested:", projectData.totalInvested);
        
        // Garantir que totalInvested seja um número
        if (typeof projectData.totalInvested === 'string') {
          dataToUpdate.totalInvested = parseFloat(projectData.totalInvested);
        } else {
          dataToUpdate.totalInvested = projectData.totalInvested;
        }
        
        console.log("Valor convertido do totalInvested:", dataToUpdate.totalInvested);
      }
      
      const [updated] = await db
        .update(projects)
        .set(dataToUpdate)
        .where(eq(projects.id, id))
        .returning();
      
      return updated;
    } catch (error) {
      console.error("Erro em updateProject:", error);
      if (error instanceof Error) {
        console.error("Mensagem de erro:", error.message);
        console.error("Stack trace:", error.stack);
      }
      throw error;
    }
  }
  
  async deleteProject(id: number): Promise<boolean> {
    try {
      // First check if the project exists
      const project = await this.getProjectById(id);
      if (!project) {
        return false;
      }
      

      
      // Delete project updates (foreign key constraint)
      await db.delete(projectUpdates).where(eq(projectUpdates.projectId, id));
      
      // Delete investments related to this project
      await db.delete(investments).where(eq(investments.projectId, id));
      
      // Finally delete the project
      await db.delete(projects).where(eq(projects.id, id));
      
      return true;
    } catch (error) {
      console.error('Error deleting project:', error);
      return false;
    }
  }
  
  async addProjectUpdate(updateData: InsertProjectUpdate) {
    const [update] = await db.insert(projectUpdates).values(updateData).returning();
    
    return update;
  }
  
  async getProjectUpdateById(id: number) {
    return await db
      .select()
      .from(projectUpdates)
      .where(eq(projectUpdates.id, id))
      .limit(1)
      .then(results => results[0]);
  }
  
  async updateProjectUpdate(id: number, updateData: Partial<InsertProjectUpdate>) {
    try {
      console.log("updateProjectUpdate chamado com:", { id, updateData });
      
      // Vamos tratar especificamente o campo mediaUrls
      const dataToUpdate: Record<string, any> = {};
      
      // Copiar todos os campos, exceto mediaUrls (vamos tratar separadamente)
      Object.keys(updateData).forEach(key => {
        if (key !== 'mediaUrls') {
          dataToUpdate[key] = (updateData as any)[key];
        }
      });
      
      // Se temos mediaUrls, vamos garantir que é um array
      if ('mediaUrls' in updateData && updateData.mediaUrls !== undefined) {
        const mediaUrls = updateData.mediaUrls;
        console.log("Media URLs recebidas:", mediaUrls);
        
        // Assegurar que mediaUrls é um array
        if (Array.isArray(mediaUrls)) {
          console.log("É um array de tamanho:", mediaUrls.length);
          
          // Atualizar diretamente usando SQL para garantir o tipo correto
          await db.execute(sql`
            UPDATE project_updates 
            SET media_urls = ${JSON.stringify(mediaUrls)}
            WHERE id = ${id}
          `);
          
          console.log("Executou SQL para atualizar media_urls");
        } else {
          console.log("Não é um array, é do tipo:", typeof mediaUrls);
        }
      }
      
      // Se temos campos para atualizar além de mediaUrls
      if (Object.keys(dataToUpdate).length > 0) {
        console.log("Atualizando outros campos:", dataToUpdate);
        await db
          .update(projectUpdates)
          .set(dataToUpdate)
          .where(eq(projectUpdates.id, id));
      }
      
      // Buscar o registro atualizado para retornar
      const result = await db
        .select()
        .from(projectUpdates)
        .where(eq(projectUpdates.id, id))
        .limit(1);
      
      console.log("Registro atualizado:", result[0]);
      return result[0];
    } catch (error) {
      console.error("Erro em updateProjectUpdate:", error);
      if (error instanceof Error) {
        console.error("Mensagem de erro:", error.message);
        console.error("Stack trace:", error.stack);
      }
      throw error;
    }
  }
  
  // Consumption
  async createConsumptionRecord(data: InsertConsumptionRecord) {
    const [record] = await db.insert(consumptionRecords).values(data).returning();
    return record;
  }
  
  async getConsumptionRecordsForCompany(companyId: number) {
    return await db
      .select()
      .from(consumptionRecords)
      .where(eq(consumptionRecords.companyId, companyId))
      .orderBy(desc(consumptionRecords.createdAt));
  }
  
  async getConsumptionRecordsForIndividual(individualId: number) {
    return await db
      .select()
      .from(consumptionRecords)
      .where(eq(consumptionRecords.individualId, individualId))
      .orderBy(desc(consumptionRecords.createdAt));
  }
  
  // Payment Proofs
  async createPaymentProof(data: InsertPaymentProof) {
    const [proof] = await db.insert(paymentProofs).values(data).returning();
    return proof;
  }
  
  async getPaymentProofsForCompany(companyId: number) {
    return await db.query.paymentProofs.findMany({
      where: eq(paymentProofs.companyId, companyId),
      with: {
        sdg: true,
        consumptionRecord: true,
        investments: {
          with: {
            project: true
          }
        }
      },
      orderBy: [desc(paymentProofs.createdAt)]
    });
  }
  
  async getPaymentProofsForIndividual(individualId: number) {
    return await db.query.paymentProofs.findMany({
      where: eq(paymentProofs.individualId, individualId),
      with: {
        sdg: true,
        consumptionRecord: true,
        investments: {
          with: {
            project: true
          }
        }
      },
      orderBy: [desc(paymentProofs.createdAt)]
    });
  }
  
  async getPendingPaymentProofs() {
    return await db.query.paymentProofs.findMany({
      where: eq(paymentProofs.status, 'pending'),
      with: {
        company: {
          with: {
            user: true
          }
        },
        individual: {
          with: {
            user: true
          }
        },
        sdg: true,
        consumptionRecord: true
      },
      orderBy: [desc(paymentProofs.createdAt)]
    });
  }
  
  async updatePaymentProofStatus(id: number, status: 'approved' | 'rejected') {
    const [updated] = await db
      .update(paymentProofs)
      .set({ status, updatedAt: new Date() })
      .where(eq(paymentProofs.id, id))
      .returning();
    
    return updated;
  }
  
  async assignSdgToPaymentProof(id: number, sdgId: number) {
    const [updated] = await db
      .update(paymentProofs)
      .set({ sdgId, updatedAt: new Date() })
      .where(eq(paymentProofs.id, id))
      .returning();
    
    return updated;
  }
  
  // Investments
  async createInvestment(data: InsertInvestment) {
    const [investment] = await db.insert(investments).values(data).returning();
    
    // Update project total invested
    await db.execute(sql`
      UPDATE ${projects}
      SET total_invested = total_invested + ${data.amount}
      WHERE id = ${data.projectId}
    `);
    
    return investment;
  }
  
  async getInvestmentsForCompany(companyId: number) {
    return await db.query.investments.findMany({
      where: eq(investments.companyId, companyId),
      with: {
        project: {
          with: {
            sdg: true
          }
        },
        paymentProof: true
      },
      orderBy: [desc(investments.createdAt)]
    });
  }
  
  async getInvestmentsForIndividual(individualId: number) {
    return await db.query.investments.findMany({
      where: eq(investments.individualId, individualId),
      with: {
        project: {
          with: {
            sdg: true
          }
        },
        paymentProof: true
      },
      orderBy: [desc(investments.createdAt)]
    });
  }

  async getIndividualInvestmentTotalsBySDG(individualId: number) {
    const result = await db
      .select({
        sdgId: sdgs.id,
        sdgNumber: sdgs.number,
        sdgName: sdgs.name,
        totalInvestment: sql<number>`COALESCE(SUM(CAST(${investments.amount} AS DECIMAL)), 0)`.mapWith(Number)
      })
      .from(sdgs)
      .leftJoin(projects, eq(projects.sdgId, sdgs.id))
      .leftJoin(investments, and(
        eq(investments.projectId, projects.id),
        eq(investments.individualId, individualId)
      ))
      .groupBy(sdgs.id, sdgs.number, sdgs.name)
      .orderBy(sdgs.number);
    
    return result;
  }
  
  async getInvestmentsForProject(projectId: number) {
    return await db.query.investments.findMany({
      where: eq(investments.projectId, projectId),
      with: {
        company: true
      },
      orderBy: [desc(investments.amount)]
    });
  }
  


  // Companies
  async getAllCompanies() {
    return await db.query.companies.findMany({
      with: {
        user: true
      }
    });
  }
  
  // Individuals
  async getAllIndividuals() {
    return await db.query.individuals.findMany({
      with: {
        user: true
      }
    });
  }
  
  async getCompanyById(id: number) {
    return await db.query.companies.findFirst({
      where: eq(companies.id, id),
      with: {
        user: true,
        consumptionRecords: {
          orderBy: [desc(consumptionRecords.createdAt)]
        },
        paymentProofs: {
          with: {
            sdg: true
          },
          orderBy: [desc(paymentProofs.createdAt)]
        },
        investments: {
          with: {
            project: {
              with: {
                sdg: true
              }
            }
          },
          orderBy: [desc(investments.createdAt)]
        }
      }
    });
  }
  
  // Individuals
  async getIndividualById(id: number) {
    return await db.query.individuals.findFirst({
      where: eq(individuals.id, id),
      with: {
        user: true,
        consumptionRecords: {
          orderBy: [desc(consumptionRecords.createdAt)]
        },
        paymentProofs: {
          with: {
            sdg: true
          },
          orderBy: [desc(paymentProofs.createdAt)]
        },
        investments: {
          with: {
            project: {
              with: {
                sdg: true
              }
            }
          },
          orderBy: [desc(investments.createdAt)]
        }
      }
    });
  }
  
  // Statistics & Dashboard
  async getCompanyStats(companyId: number) {
    const totalEmissions = await db
      .select({
        total: sql<string>`sum(${consumptionRecords.emissionKgCo2})`
      })
      .from(consumptionRecords)
      .where(eq(consumptionRecords.companyId, companyId));
      
    const totalCompensation = await db
      .select({
        total: sql<string>`sum(${paymentProofs.amount})`
      })
      .from(paymentProofs)
      .where(and(
        eq(paymentProofs.companyId, companyId),
        eq(paymentProofs.status, 'approved')
      ));
      
    const projectsCount = await db
      .select({
        count: sql<number>`count(distinct ${investments.projectId})`
      })
      .from(investments)
      .where(eq(investments.companyId, companyId));
      
    // Get pending payment proof if exists
    const pendingProof = await db.query.paymentProofs.findFirst({
      where: and(
        eq(paymentProofs.companyId, companyId),
        eq(paymentProofs.status, 'pending')
      ),
      orderBy: [desc(paymentProofs.createdAt)]
    });
      
    // Recent activity
    const recentActivity = await db.query.consumptionRecords.findMany({
      where: eq(consumptionRecords.companyId, companyId),
      limit: 5,
      orderBy: [desc(consumptionRecords.createdAt)]
    });
    
    // Get monthly emissions for the last 6 months
    const monthlyEmissions = await db.execute(sql`
      SELECT 
        DATE_TRUNC('month', created_at) as month,
        SUM(emission_kg_co2) as total_emission
      FROM ${consumptionRecords}
      WHERE company_id = ${companyId}
        AND created_at >= NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month
    `);
    
    // Get investment by SDG (via projects and payment proofs)
    const investmentsBySDG = await db.execute(sql`
      WITH project_investments AS (
        SELECT 
          s.id as sdg_id,
          COALESCE(SUM(i.amount), 0) as project_amount
        FROM ${sdgs} s
        LEFT JOIN ${projects} p ON s.id = p.sdg_id
        LEFT JOIN ${investments} i ON p.id = i.project_id AND i.company_id = ${companyId}
        GROUP BY s.id
      ),
      proof_investments AS (
        SELECT 
          sdg_id,
          COALESCE(SUM(amount), 0) as proof_amount
        FROM ${paymentProofs}
        WHERE status = 'approved' AND sdg_id IS NOT NULL AND company_id = ${companyId}
        GROUP BY sdg_id
      )
      SELECT 
        s.id as sdg_id,
        s.number as sdg_number,
        s.name as sdg_name,
        s.color as sdg_color,
        COALESCE(pi.project_amount, 0) + COALESCE(pp.proof_amount, 0) as total_amount
      FROM ${sdgs} s
      LEFT JOIN project_investments pi ON s.id = pi.sdg_id
      LEFT JOIN proof_investments pp ON s.id = pp.sdg_id
      ORDER BY total_amount DESC
    `);
    
    return {
      totalEmissions: totalEmissions[0]?.total || '0',
      totalCompensation: totalCompensation[0]?.total || '0',
      projectsCount: projectsCount[0]?.count || 0,
      pendingProof,
      recentActivity,
      monthlyEmissions: monthlyEmissions.rows,
      investmentsBySDG: investmentsBySDG.rows
    };
  }
  
  async getIndividualStats(individualId: number) {
    const totalEmissions = await db
      .select({
        total: sql<string>`sum(${consumptionRecords.emissionKgCo2})`
      })
      .from(consumptionRecords)
      .where(eq(consumptionRecords.individualId, individualId));
      
    const totalCompensation = await db
      .select({
        total: sql<string>`sum(${paymentProofs.amount})`
      })
      .from(paymentProofs)
      .where(and(
        eq(paymentProofs.individualId, individualId),
        eq(paymentProofs.status, 'approved')
      ));
      
    const projectsCount = await db
      .select({
        count: sql<number>`count(distinct ${investments.projectId})`
      })
      .from(investments)
      .where(eq(investments.individualId, individualId));
      
    // Get pending payment proof if exists
    const pendingProof = await db.query.paymentProofs.findFirst({
      where: and(
        eq(paymentProofs.individualId, individualId),
        eq(paymentProofs.status, 'pending')
      ),
      orderBy: [desc(paymentProofs.createdAt)]
    });
      
    // Recent activity
    const recentActivity = await db.query.consumptionRecords.findMany({
      where: eq(consumptionRecords.individualId, individualId),
      limit: 5,
      orderBy: [desc(consumptionRecords.createdAt)]
    });
    
    // Get monthly emissions for the last 6 months
    const monthlyEmissions = await db.execute(sql`
      SELECT 
        DATE_TRUNC('month', created_at) as month,
        SUM(emission_kg_co2) as total_emission
      FROM ${consumptionRecords}
      WHERE individual_id = ${individualId}
        AND created_at >= NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month
    `);
    
    // Get investment by SDG (via projects and payment proofs)
    const investmentsBySDG = await db.execute(sql`
      WITH project_investments AS (
        SELECT 
          s.id as sdg_id,
          COALESCE(SUM(i.amount), 0) as project_amount
        FROM ${sdgs} s
        LEFT JOIN ${projects} p ON s.id = p.sdg_id
        LEFT JOIN ${investments} i ON p.id = i.project_id AND i.individual_id = ${individualId}
        GROUP BY s.id
      ),
      proof_investments AS (
        SELECT 
          sdg_id,
          COALESCE(SUM(amount), 0) as proof_amount
        FROM ${paymentProofs}
        WHERE status = 'approved' AND sdg_id IS NOT NULL AND individual_id = ${individualId}
        GROUP BY sdg_id
      )
      SELECT 
        s.id as sdg_id,
        s.number as sdg_number,
        s.name as sdg_name,
        s.color as sdg_color,
        COALESCE(pi.project_amount, 0) + COALESCE(pp.proof_amount, 0) as total_amount
      FROM ${sdgs} s
      LEFT JOIN project_investments pi ON s.id = pi.sdg_id
      LEFT JOIN proof_investments pp ON s.id = pp.sdg_id
      ORDER BY total_amount DESC
    `);
    
    return {
      totalEmissions: totalEmissions[0]?.total || '0',
      totalCompensation: totalCompensation[0]?.total || '0',
      projectsCount: projectsCount[0]?.count || 0,
      pendingProof,
      recentActivity,
      monthlyEmissions: monthlyEmissions.rows,
      investmentsBySDG: investmentsBySDG.rows
    };
  }
  
  async getAdminDashboardStats() {
    // Count registered companies
    const companiesCount = await db
      .select({
        count: sql<number>`count(*)`
      })
      .from(companies);
      
    // Count registered individuals
    const individualsCount = await db
      .select({
        count: sql<number>`count(*)`
      })
      .from(individuals);
      
    // Calculate total carbon emissions across all companies
    const totalCarbonEmissions = await db
      .select({
        total: sql<string>`COALESCE(SUM(${consumptionRecords.emissionKgCo2}), 0)`
      })
      .from(consumptionRecords);
      
    // Calculate total compensation across all approved payment proofs
    const totalCompensation = await db
      .select({
        total: sql<string>`COALESCE(SUM(${paymentProofs.amount}), 0)`
      })
      .from(paymentProofs)
      .where(eq(paymentProofs.status, 'approved'));
      
    // Total invested by SDG - including both investments and standalone payment proofs
    const investmentsBySDG = await db.execute(sql`
      WITH investment_amounts AS (
        SELECT 
          p.sdg_id,
          COALESCE(SUM(i.amount), 0) as investment_amount
        FROM ${investments} i
        JOIN ${projects} p ON i.project_id = p.id
        GROUP BY p.sdg_id
      ),
      payment_proof_amounts AS (
        SELECT 
          pp.sdg_id,
          COALESCE(SUM(pp.amount), 0) as proof_amount
        FROM ${paymentProofs} pp
        LEFT JOIN ${investments} inv ON pp.id = inv.payment_proof_id
        WHERE pp.status = 'approved' 
        AND pp.sdg_id IS NOT NULL
        AND inv.id IS NULL
        GROUP BY pp.sdg_id
      )
      SELECT 
        s.id as sdg_id,
        s.number as sdg_number,
        s.name as sdg_name,
        s.color as sdg_color,
        COALESCE(ia.investment_amount, 0) + COALESCE(ppa.proof_amount, 0) as total_amount
      FROM ${sdgs} s
      LEFT JOIN investment_amounts ia ON s.id = ia.sdg_id
      LEFT JOIN payment_proof_amounts ppa ON s.id = ppa.sdg_id
      ORDER BY total_amount DESC
    `);
    
    // Most polluting sectors
    const sectorEmissions = await db.execute(sql`
      SELECT 
        c.sector,
        c.id as company_id,
        c.name as company_name,
        SUM(cr.emission_kg_co2) as emissions,
        COALESCE(SUM(cr.compensation_value_kz), 0) as compensations,
        CASE 
          WHEN SUM(cr.emission_kg_co2) > 0 
          THEN (COALESCE(SUM(cr.compensation_value_kz), 0) / SUM(cr.emission_kg_co2)) * 100
          ELSE 0
        END as reduction
      FROM ${consumptionRecords} cr
      JOIN ${companies} c ON cr.company_id = c.id
      GROUP BY c.sector, c.id, c.name
      ORDER BY c.sector, emissions DESC
    `);
    
    // Pending payment proofs
    const pendingProofsCount = await db
      .select({
        count: sql<number>`count(*)`
      })
      .from(paymentProofs)
      .where(eq(paymentProofs.status, 'pending'));
      
    // Recent companies
    const recentCompanies = await db.query.companies.findMany({
      limit: 5,
      orderBy: [desc(companies.createdAt)]
    });

    // Recent individuals
    const recentIndividuals = await db.query.individuals.findMany({
      limit: 5,
      orderBy: [desc(individuals.createdAt)]
    });

    // Usar os valores reais dos investimentos em vez de valores fixos
    // para permitir que os novos investimentos apareçam corretamente
    const adjustedInvestmentsBySDG = investmentsBySDG.rows;
    
    return {
      companiesCount: companiesCount[0]?.count || 0,
      individualsCount: individualsCount[0]?.count || 0,
      totalCarbonEmissions: totalCarbonEmissions[0]?.total || '0',
      totalCompensation: totalCompensation[0]?.total || '0',
      investmentsBySDG: adjustedInvestmentsBySDG,
      sectorEmissions: sectorEmissions.rows,
      pendingProofsCount: pendingProofsCount[0]?.count || 0,
      recentCompanies,
      recentIndividuals
    };
  }
  
  async getPaymentProofsWithoutSdg() {
    return await db.query.paymentProofs.findMany({
      where: and(
        isNull(paymentProofs.sdgId),
        eq(paymentProofs.status, 'approved')
      ),
      with: {
        company: {
          with: {
            user: true
          }
        },
        individual: {
          with: {
            user: true
          }
        },
        sdg: true,
        consumptionRecord: true
      },
      orderBy: [desc(paymentProofs.createdAt)]
    });
  }

  // Carbon Leaderboard Methods
  async getCarbonLeaderboard(period: string = 'all_time'): Promise<CarbonLeaderboard[]> {
    return await db.query.carbonLeaderboard.findMany({
      where: eq(carbonLeaderboard.period, period),
      with: {
        company: true
      },
      orderBy: [asc(carbonLeaderboard.carbonReductionRank)]
    });
  }

  async getCompanyCarbonStats(companyId: number): Promise<CarbonLeaderboard | undefined> {
    return await db.query.carbonLeaderboard.findFirst({
      where: and(
        eq(carbonLeaderboard.companyId, companyId),
        eq(carbonLeaderboard.period, 'all_time')
      ),
      with: {
        company: true
      }
    });
  }

  async updateCarbonLeaderboard(data: InsertCarbonLeaderboard): Promise<CarbonLeaderboard> {
    // Verificar se já existe uma entrada para esta empresa/período
    const existingRecord = await db.query.carbonLeaderboard.findFirst({
      where: and(
        eq(carbonLeaderboard.companyId, data.companyId),
        eq(carbonLeaderboard.period, data.period)
      )
    });
    
    if (existingRecord) {
      // Atualizar o registro existente
      const [updated] = await db
        .update(carbonLeaderboard)
        .set({
          ...data,
          updatedAt: new Date()
        })
        .where(eq(carbonLeaderboard.id, existingRecord.id))
        .returning();
      
      return updated;
    } else {
      // Criar um novo registro
      const [newRecord] = await db
        .insert(carbonLeaderboard)
        .values({
          ...data,
          updatedAt: new Date()
        })
        .returning();
      
      return newRecord;
    }
  }

  async calculateCarbonRanking(): Promise<void> {
    // Obter todas as empresas no leaderboard
    const allCompanies = await db.query.carbonLeaderboard.findMany({
      where: eq(carbonLeaderboard.period, 'all_time'),
      orderBy: [desc(carbonLeaderboard.carbonReductionPercentage)]
    });
    
    // Atualizar o rank de cada empresa
    for (let i = 0; i < allCompanies.length; i++) {
      await db
        .update(carbonLeaderboard)
        .set({ carbonReductionRank: i + 1 })
        .where(eq(carbonLeaderboard.id, allCompanies[i].id));
    }
  }

  // Get global investment totals by SDG (for all users)
  async getGlobalInvestmentTotalsBySDG() {
    const result = await db.execute(sql`
      WITH project_investments AS (
        SELECT 
          p.sdg_id,
          COALESCE(SUM(i.amount), 0) as project_amount
        FROM ${projects} p
        LEFT JOIN ${investments} i ON p.id = i.project_id
        GROUP BY p.sdg_id
      ),
      proof_investments AS (
        SELECT 
          pp.sdg_id,
          COALESCE(SUM(pp.amount), 0) as proof_amount
        FROM ${paymentProofs} pp
        LEFT JOIN ${investments} inv ON pp.id = inv.payment_proof_id
        WHERE pp.status = 'approved' 
        AND pp.sdg_id IS NOT NULL
        AND inv.id IS NULL
        GROUP BY pp.sdg_id
      )
      SELECT 
        s.id as sdg_id,
        s.number as sdg_number,
        s.name as sdg_name,
        s.color as sdg_color,
        COALESCE(pi.project_amount, 0) + COALESCE(pp.proof_amount, 0) as total_amount
      FROM ${sdgs} s
      LEFT JOIN project_investments pi ON s.id = pi.sdg_id
      LEFT JOIN proof_investments pp ON s.id = pp.sdg_id
      ORDER BY s.number ASC
    `);
    
    return result.rows;
  }
}

export const storage = new DatabaseStorage();

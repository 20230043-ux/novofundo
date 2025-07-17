import { pgTable, text, serial, integer, timestamp, decimal, boolean, jsonb, varchar, index } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { relations } from 'drizzle-orm';
import { z } from 'zod';

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Define user roles
export const userRoles = {
  ADMIN: 'admin',
  COMPANY: 'company',
  INDIVIDUAL: 'individual',
} as const;

// Users table (for admin, companies, and individuals)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  role: text('role', { enum: [userRoles.ADMIN, userRoles.COMPANY, userRoles.INDIVIDUAL] }).notNull().default(userRoles.COMPANY),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Company profiles
export const companies = pgTable('companies', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull().unique(),
  name: text('name').notNull(),
  sector: text('sector').notNull(),
  logoUrl: text('logo_url'),
  phone: text('phone'),
  location: text('location'),
  employeeCount: integer('employee_count'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Individual profiles
export const individuals = pgTable('individuals', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull().unique(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  phone: text('phone'),
  location: text('location'),
  occupation: text('occupation'),
  profilePictureUrl: text('profile_picture_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Sustainable Development Goals
export const sdgs = pgTable('sdgs', {
  id: serial('id').primaryKey(),
  number: integer('number').notNull().unique(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  color: text('color').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Projects linked to SDGs
export const projects = pgTable('projects', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  sdgId: integer('sdg_id').references(() => sdgs.id).notNull(),
  description: text('description').notNull(),
  imageUrl: text('image_url').notNull(),
  totalInvested: decimal('total_invested', { precision: 12, scale: 2 }).notNull().default('0'),
  peopleCount: integer('people_count').notNull().default(0), // Número de pessoas impactadas pelo projeto
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Project updates and media
export const projectUpdates = pgTable('project_updates', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').references(() => projects.id).notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  mediaUrls: jsonb('media_urls').$type<string[]>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Consumption records for companies and individuals
export const consumptionRecords = pgTable('consumption_records', {
  id: serial('id').primaryKey(),
  companyId: integer('company_id').references(() => companies.id),
  individualId: integer('individual_id').references(() => individuals.id),
  energyKwh: decimal('energy_kwh', { precision: 10, scale: 2 }).default('0'),
  fuelLiters: decimal('fuel_liters', { precision: 10, scale: 2 }).default('0'),
  fuelType: text('fuel_type'),
  transportKm: decimal('transport_km', { precision: 10, scale: 2 }).default('0'),
  transportType: text('transport_type'),
  waterM3: decimal('water_m3', { precision: 10, scale: 2 }).default('0'), // Consumo de água em metros cúbicos
  wasteKg: decimal('waste_kg', { precision: 10, scale: 2 }).default('0'), // Geração de resíduos em kg
  emissionKgCo2: decimal('emission_kg_co2', { precision: 10, scale: 2 }).notNull(),
  compensationValueKz: decimal('compensation_value_kz', { precision: 12, scale: 2 }).notNull(),
  period: text('period').notNull(), // monthly, quarterly, yearly
  month: text('month'), // mês do consumo (01-12)
  day: integer('day'), // dia do consumo (opcional)
  year: integer('year'), // ano do consumo
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Payment proofs for consumption compensations
export const paymentProofs = pgTable('payment_proofs', {
  id: serial('id').primaryKey(),
  companyId: integer('company_id').references(() => companies.id),
  individualId: integer('individual_id').references(() => individuals.id),
  consumptionRecordId: integer('consumption_record_id').references(() => consumptionRecords.id),
  fileUrl: text('file_url').notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  sdgId: integer('sdg_id').references(() => sdgs.id),
  status: text('status', { enum: ['pending', 'approved', 'rejected'] }).notNull().default('pending'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Investments in projects
export const investments = pgTable('investments', {
  id: serial('id').primaryKey(),
  companyId: integer('company_id').references(() => companies.id),
  individualId: integer('individual_id').references(() => individuals.id),
  projectId: integer('project_id').references(() => projects.id).notNull(),
  paymentProofId: integer('payment_proof_id').references(() => paymentProofs.id).notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});



// Messages table for communication between admin and users
export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  fromUserId: integer('from_user_id').references(() => users.id).notNull(),
  toUserId: integer('to_user_id').references(() => users.id).notNull(),
  content: text('content').notNull(),
  isRead: boolean('is_read').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Tabela para armazenar o leaderboard de pegada de carbono
export const carbonLeaderboard = pgTable('carbon_leaderboard', {
  id: serial('id').primaryKey(),
  companyId: integer('company_id').references(() => companies.id).notNull(),
  totalEmissionKgCo2: decimal('total_emission_kg_co2', { precision: 12, scale: 2 }).notNull().default('0'),
  totalCompensationKgCo2: decimal('total_compensation_kg_co2', { precision: 12, scale: 2 }).notNull().default('0'),
  carbonReductionPercentage: decimal('carbon_reduction_percentage', { precision: 5, scale: 2 }).notNull().default('0'),
  carbonReductionRank: integer('carbon_reduction_rank'),
  score: integer('score').notNull().default(0), // Pontuação baseada em vários fatores
  period: text('period', { enum: ['monthly', 'quarterly', 'yearly', 'all_time'] }).notNull().default('all_time'),
  month: integer('month'), 
  year: integer('year').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relações para messages
export const messagesRelations = relations(messages, ({ one }) => ({
  fromUser: one(users, {
    fields: [messages.fromUserId],
    references: [users.id],
  }),
  toUser: one(users, {
    fields: [messages.toUserId],
    references: [users.id],
  }),
}));

// Relações para carbonLeaderboard
export const carbonLeaderboardRelations = relations(carbonLeaderboard, ({ one }) => ({
  company: one(companies, {
    fields: [carbonLeaderboard.companyId],
    references: [companies.id],
  }),
}));



// Define relations
export const usersRelations = relations(users, ({ one }) => ({
  company: one(companies, {
    fields: [users.id],
    references: [companies.userId],
  }),
  individual: one(individuals, {
    fields: [users.id],
    references: [individuals.userId],
  }),
}));

export const individualsRelations = relations(individuals, ({ one, many }) => ({
  user: one(users, {
    fields: [individuals.userId],
    references: [users.id],
  }),
  consumptionRecords: many(consumptionRecords),
  paymentProofs: many(paymentProofs),
  investments: many(investments),
}));

export const companiesRelations = relations(companies, ({ one, many }) => ({
  user: one(users, {
    fields: [companies.userId],
    references: [users.id],
  }),
  consumptionRecords: many(consumptionRecords),
  paymentProofs: many(paymentProofs),
  investments: many(investments),
}));

export const sdgsRelations = relations(sdgs, ({ many }) => ({
  projects: many(projects),
  paymentProofs: many(paymentProofs),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  sdg: one(sdgs, {
    fields: [projects.sdgId],
    references: [sdgs.id],
  }),
  updates: many(projectUpdates),
  investments: many(investments),
}));

export const projectUpdatesRelations = relations(projectUpdates, ({ one }) => ({
  project: one(projects, {
    fields: [projectUpdates.projectId],
    references: [projects.id],
  }),
}));

export const consumptionRecordsRelations = relations(consumptionRecords, ({ one, many }) => ({
  company: one(companies, {
    fields: [consumptionRecords.companyId],
    references: [companies.id],
  }),
  individual: one(individuals, {
    fields: [consumptionRecords.individualId],
    references: [individuals.id],
  }),
  paymentProofs: many(paymentProofs),
}));

export const paymentProofsRelations = relations(paymentProofs, ({ one, many }) => ({
  company: one(companies, {
    fields: [paymentProofs.companyId],
    references: [companies.id],
  }),
  individual: one(individuals, {
    fields: [paymentProofs.individualId],
    references: [individuals.id],
  }),
  consumptionRecord: one(consumptionRecords, {
    fields: [paymentProofs.consumptionRecordId],
    references: [consumptionRecords.id],
  }),
  sdg: one(sdgs, {
    fields: [paymentProofs.sdgId],
    references: [sdgs.id],
  }),
  investments: many(investments),
}));

export const investmentsRelations = relations(investments, ({ one }) => ({
  company: one(companies, {
    fields: [investments.companyId],
    references: [companies.id],
  }),
  individual: one(individuals, {
    fields: [investments.individualId],
    references: [individuals.id],
  }),
  project: one(projects, {
    fields: [investments.projectId],
    references: [projects.id],
  }),
  paymentProof: one(paymentProofs, {
    fields: [investments.paymentProofId],
    references: [paymentProofs.id],
  }),
}));

// Create Zod schemas
export const userInsertSchema = createInsertSchema(users, {
  email: (schema) => schema.email("Deve fornecer um email válido"),
  password: (schema) => schema.min(8, "A senha deve ter pelo menos 8 caracteres"),
  role: (schema) => schema.refine(
    (val) => Object.values(userRoles).includes(val as any),
    { message: "Função de usuário inválida" }
  ),
});

export const companyInsertSchema = createInsertSchema(companies, {
  name: (schema) => schema.min(2, "O nome deve ter pelo menos 2 caracteres"),
  sector: (schema) => schema.min(2, "O setor deve ter pelo menos 2 caracteres"),
});

export const individualInsertSchema = createInsertSchema(individuals, {
  firstName: (schema) => schema.min(2, "O primeiro nome deve ter pelo menos 2 caracteres"),
  lastName: (schema) => schema.min(2, "O sobrenome deve ter pelo menos 2 caracteres"),
});

export const loginSchema = z.object({
  email: z.string().email("Deve fornecer um email válido"),
  password: z.string().min(1, "A senha é obrigatória"),
});

export const registerSchema = z.object({
  email: z.string().email("Deve fornecer um email válido"),
  password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres"),
  name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres"),
  sector: z.string().min(2, "O setor deve ter pelo menos 2 caracteres"),
  logoUrl: z.string().optional(),
});

export const registerIndividualSchema = z.object({
  email: z.string().email("Deve fornecer um email válido"),
  password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres"),
  firstName: z.string().min(2, "O primeiro nome deve ter pelo menos 2 caracteres"),
  lastName: z.string().min(2, "O sobrenome deve ter pelo menos 2 caracteres"),
  phone: z.string().optional(),
  location: z.string().optional(),
  occupation: z.string().optional(),
});

export const sdgInsertSchema = createInsertSchema(sdgs);

// Schema personalizado para projetos com tratamento para totalInvested
export const projectInsertSchema = createInsertSchema(projects, {
  totalInvested: (schema) => schema.or(z.string().transform(val => parseFloat(val))),
  peopleCount: (schema) => schema.min(0, "O número de pessoas deve ser zero ou positivo")
});

export const projectUpdateSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  sdgId: z.number().optional(),
  imageUrl: z.string().optional(),
  totalInvested: z.union([
    z.number(),
    z.string().transform(val => {
      const number = parseFloat(val);
      return isNaN(number) ? 0 : number;
    })
  ]).optional(),
  peopleCount: z.union([
    z.number(),
    z.string().transform(val => {
      const number = parseInt(val);
      return isNaN(number) ? 0 : number;
    })
  ]).optional(),
});

export const projectUpdateInsertSchema = createInsertSchema(projectUpdates);

// Criar um esquema de inserção personalizado para consumptionRecords que aceite números
export const consumptionRecordInsertSchema = z.object({
  id: z.number().optional(),
  companyId: z.number(),
  energyKwh: z.union([z.string(), z.number()]).transform(val => 
    typeof val === 'string' ? val : val.toString()
  ).default('0'),
  fuelLiters: z.union([z.string(), z.number()]).transform(val => 
    typeof val === 'string' ? val : val.toString()
  ).default('0'),
  fuelType: z.string().optional(),
  transportKm: z.union([z.string(), z.number()]).transform(val => 
    typeof val === 'string' ? val : val.toString()
  ).default('0'),
  transportType: z.string().optional(),
  waterM3: z.union([z.string(), z.number()]).transform(val => 
    typeof val === 'string' ? val : val.toString()
  ).default('0'),
  wasteKg: z.union([z.string(), z.number()]).transform(val => 
    typeof val === 'string' ? val : val.toString()
  ).default('0'),
  emissionKgCo2: z.union([z.string(), z.number()]).transform(val => 
    typeof val === 'string' ? val : val.toString()
  ),
  compensationValueKz: z.union([z.string(), z.number()]).transform(val => 
    typeof val === 'string' ? val : val.toString()
  ),
  period: z.string(),
  day: z.union([z.string(), z.number(), z.null(), z.undefined()]).optional(),
  month: z.string().optional(),
  year: z.union([z.string(), z.number(), z.undefined()]).optional(),
  fuelTypes: z.array(z.string()).optional(),
  transportTypes: z.array(z.string()).optional(),
  createdAt: z.date().optional()
});

export const paymentProofInsertSchema = createInsertSchema(paymentProofs, {
  amount: (schema) => schema.or(z.string().transform(val => {
    const parsed = parseFloat(val);
    return isNaN(parsed) ? '0' : parsed.toString();
  }))
});
export const investmentInsertSchema = createInsertSchema(investments);


// Create select schemas for type safety
export const userSelectSchema = createSelectSchema(users);
export const companySelectSchema = createSelectSchema(companies);
export const individualSelectSchema = createSelectSchema(individuals);
export const sdgSelectSchema = createSelectSchema(sdgs);
export const projectSelectSchema = createSelectSchema(projects);
export const projectUpdateSelectSchema = createSelectSchema(projectUpdates);
export const consumptionRecordSelectSchema = createSelectSchema(consumptionRecords);
export const paymentProofSelectSchema = createSelectSchema(paymentProofs);
export const investmentSelectSchema = createSelectSchema(investments);

export const carbonLeaderboardSelectSchema = createSelectSchema(carbonLeaderboard);

// Message schemas
export const messageInsertSchema = createInsertSchema(messages, {
  content: (schema) => schema.min(1, "O conteúdo é obrigatório"),
});

export const messageSelectSchema = createSelectSchema(messages);

// Esquema de inserção para o leaderboard de carbono
export const carbonLeaderboardInsertSchema = createInsertSchema(carbonLeaderboard, {
  companyId: (schema) => schema.positive("ID da empresa inválido"),
  totalEmissionKgCo2: (schema) => schema.min(0, "Valor deve ser zero ou positivo"),
  totalCompensationKgCo2: (schema) => schema.min(0, "Valor deve ser zero ou positivo"),
  carbonReductionPercentage: (schema) => schema.min(0, "Valor deve ser zero ou positivo").max(100, "Valor não pode exceder 100%"),
  year: (schema) => schema.min(2000, "Ano inválido"),
});

// Export types
export type User = z.infer<typeof userSelectSchema>;
export type Company = z.infer<typeof companySelectSchema>;
export type Individual = z.infer<typeof individualSelectSchema>;
export type Sdg = z.infer<typeof sdgSelectSchema>;
export type Project = z.infer<typeof projectSelectSchema>;
export type ProjectUpdate = z.infer<typeof projectUpdateSelectSchema>;
export type ConsumptionRecord = z.infer<typeof consumptionRecordSelectSchema>;
export type PaymentProof = z.infer<typeof paymentProofSelectSchema>;
export type Investment = z.infer<typeof investmentSelectSchema>;
export type CarbonLeaderboard = z.infer<typeof carbonLeaderboardSelectSchema>;

export type InsertUser = z.infer<typeof userInsertSchema>;
export type InsertCompany = z.infer<typeof companyInsertSchema>;
export type InsertIndividual = z.infer<typeof individualInsertSchema>;
export type InsertSdg = z.infer<typeof sdgInsertSchema>;
export type InsertProject = z.infer<typeof projectInsertSchema>;
export type InsertProjectUpdate = z.infer<typeof projectUpdateInsertSchema>;
export type InsertConsumptionRecord = z.infer<typeof consumptionRecordInsertSchema>;
export type InsertPaymentProof = z.infer<typeof paymentProofInsertSchema>;
export type InsertInvestment = z.infer<typeof investmentInsertSchema>;
export type InsertCarbonLeaderboard = z.infer<typeof carbonLeaderboardInsertSchema>;

export type UserWithCompany = User & { company: Company };
export type UserWithIndividual = User & { individual: Individual };
export type Login = z.infer<typeof loginSchema>;
export type Register = z.infer<typeof registerSchema>;
export type RegisterIndividual = z.infer<typeof registerIndividualSchema>;

import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
// Importar setupAuth do arquivo auth
import { setupAuth } from "./auth";
import { eq, and, isNull, desc, sql } from "drizzle-orm";
import { keepAliveHandler } from "./keep-alive";
import { backupService } from "./backup-service";
import { createReadStream } from "fs";
import { stat } from "fs/promises";

import { preloadCache } from "./preload-cache";
import { optimizeStaticFiles, enableServerPush, optimizeForMobile } from "./cdn-optimization";
import { instantProjectCache } from "./instant-project-cache";
import multer from "multer";
import path from "path";
import { mkdir } from "fs/promises";




// Simple cache implementation with invalidation
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

function setCache(key: string, data: any, ttlMinutes: number = 1) {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl: ttlMinutes * 60 * 1000 // Minimum 1 minute for instant updates
  });
}

function getCache(key: string) {
  const cached = cache.get(key);
  if (!cached) return null;
  
  if (Date.now() - cached.timestamp > cached.ttl) {
    cache.delete(key);
    return null;
  }
  
  return cached.data;
}

function clearCacheByPattern(pattern: string) {
  const keysToDelete = Array.from(cache.keys()).filter(key => key.includes(pattern));
  keysToDelete.forEach(key => cache.delete(key));
  console.log(`Cache cleared for pattern: ${pattern}, keys cleared: ${keysToDelete.length}`);
}

function clearAllCache() {
  cache.clear();
  console.log('All cache cleared');
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function cacheMiddleware(key: string, ttlMinutes: number = 10) {
  return (req: Request, res: Response, next: any) => {
    const cacheKey = `${key}:${req.url}`;
    const cached = getCache(cacheKey);
    
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cached);
    }
    
    // Override res.json to cache the response
    const originalJson = res.json;
    res.json = function(data: any) {
      setCache(cacheKey, data, ttlMinutes);
      res.setHeader('X-Cache', 'MISS');
      return originalJson.call(this, data);
    };
    
    next();
  };
}
import { 
  consumptionRecordInsertSchema, 
  paymentProofInsertSchema, 
  projectInsertSchema, 
  projectUpdateInsertSchema, 
  projectUpdateSchema, 
  carbonLeaderboardInsertSchema,
  messageInsertSchema,
  messages,
  investments
} from "@shared/schema";
import { z } from "zod";
import { db } from "@db";

// Configure multer for file uploads
const uploadsDir = path.resolve(process.cwd(), "uploads");

// Create uploads directory if it doesn't exist
(async () => {
  try {
    await mkdir(uploadsDir, { recursive: true });
    await mkdir(path.join(uploadsDir, "logos"), { recursive: true });
    await mkdir(path.join(uploadsDir, "proofs"), { recursive: true });
    await mkdir(path.join(uploadsDir, "profiles"), { recursive: true });
    await mkdir(path.join(uploadsDir, "projects"), { recursive: true });
  } catch (error) {
    console.error("Error creating upload directories:", error);
  }
})();

const storage_config = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = "uploads";
    
    if (req.path.includes("/company/logo")) {
      folder = path.join(uploadsDir, "logos");
    } else if (req.path.includes("/payment-proof")) {
      folder = path.join(uploadsDir, "proofs");
    } else if (req.path.includes("/profile/photo")) {
      folder = path.join(uploadsDir, "profiles");
    } else if (req.path.includes("/project")) {
      folder = path.join(uploadsDir, "projects");
    }
    
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ storage: storage_config });

// Usando o isAuthenticated exportado de replitAuth.ts

// Middleware to check if user is admin
function isAdmin(req: Request, res: Response, next: any) {
  if (req.isAuthenticated() && req.user?.role === 'admin') {
    return next();
  }
  res.status(403).json({ message: "Acesso negado" });
}

// Middleware to check if user is company
function isCompany(req: Request, res: Response, next: any) {
  if (req.isAuthenticated() && req.user?.role === 'company') {
    return next();
  }
  res.status(403).json({ message: "Acesso negado" });
}

// Middleware to check if user is individual
function isIndividual(req: Request, res: Response, next: any) {
  if (req.isAuthenticated() && req.user?.role === 'individual') {
    return next();
  }
  res.status(403).json({ message: "Acesso negado" });
}

// Simple rate limiter for high-traffic protection
const requestCounts = new Map<string, { count: number; resetTime: number }>();

function rateLimiter(maxRequests = 200, windowMs = 60000) {
  return (req: Request, res: Response, next: any) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    
    const userRecord = requestCounts.get(ip);
    
    if (!userRecord || now > userRecord.resetTime) {
      requestCounts.set(ip, {
        count: 1,
        resetTime: now + windowMs
      });
      return next();
    }
    
    if (userRecord.count >= maxRequests) {
      return res.status(429).json({
        message: 'Muitas requisições. Tente novamente em alguns minutos.'
      });
    }
    
    userRecord.count++;
    next();
  };
}

// Optimize connections for external devices
function optimizeForExternalConnections() {
  return (req: Request, res: Response, next: any) => {
    // Preload critical resources
    if (req.path === '/') {
      res.setHeader('Link', '</api/sdgs>; rel=prefetch, </api/projects>; rel=prefetch');
    }
    
    // Optimize for slow connections
    const userAgent = req.get('User-Agent') || '';
    const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent);
    
    if (isMobile) {
      res.setHeader('Cache-Control', 'public, max-age=900'); // 15 minutes for mobile
    }
    
    // Set timeout for slow connections
    req.setTimeout(30000); // 30 seconds
    res.setTimeout(30000);
    
    next();
  };
}

export async function registerRoutes(app: Express, wsService?: any): Promise<Server> {
  // Apply optimizations for external connections and performance
  app.use(optimizeForExternalConnections());
  app.use(optimizeStaticFiles());
  app.use(enableServerPush());
  app.use(optimizeForMobile());
  
  // Apply rate limiting to all API routes  
  app.use('/api', rateLimiter(200, 60000)); // 200 requests per minute
  // Sets up /api/register, /api/login, /api/logout, /api/user
  setupAuth(app);

  // Serve project images from public folder (no authentication required)
  app.use("/projects", express.static(path.join(process.cwd(), "public", "projects")));
  
  // Enhanced image serving with better error handling and mobile optimization
  app.use("/uploads", (req, res, next) => {
    // Optimize images for mobile devices
    const userAgent = req.get('User-Agent') || '';
    const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent);
    
    // Set appropriate cache headers for images
    if (req.path.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
      if (isMobile) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); // 1 year for mobile
      } else {
        res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 day for desktop
      }
      res.setHeader('Vary', 'Accept-Encoding, User-Agent');
    }
    
    // Only serve files to authenticated users, except for company logos and project images
    if (req.isAuthenticated()) {
      return next();
    }
    
    // Allow public access to company logos, project images, and profile pictures for better UX
    if (req.path.startsWith("/logos/") || req.path.startsWith("/projects/") || req.path.startsWith("/profiles/")) {
      return next();
    }
    
    res.status(401).json({ message: "Não autorizado" });
  }, express.static(uploadsDir));
  
  // Adicionar rota especial para logos sem exigir autenticação
  app.use("/company-logos", express.static(path.join(uploadsDir, "logos")));

  // Image verification endpoint to check if an image exists
  app.get("/api/verify-image", async (req, res) => {
    const { url } = req.query;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ exists: false, error: "URL is required" });
    }

    try {
      // Extract the relative path from the URL
      const relativePath = url.replace(/^https?:\/\/[^\/]+/, '');
      let filePath = '';

      if (relativePath.startsWith('/uploads/')) {
        filePath = path.join(uploadsDir, relativePath.replace('/uploads/', ''));
      } else if (relativePath.startsWith('/projects/')) {
        filePath = path.join(process.cwd(), "public", relativePath);
      } else {
        return res.status(400).json({ exists: false, error: "Invalid path" });
      }

      // Check if file exists
      const { access } = await import('fs/promises');
      await access(filePath);
      
      res.json({ exists: true });
    } catch (error) {
      res.json({ exists: false });
    }
  });

  // Cache clearing endpoint for admin users
  app.post("/api/clear-cache", async (req, res) => {
    try {
      const { pattern } = req.body;
      if (pattern) {
        clearCacheByPattern(pattern);
        res.json({ success: true, message: `Cache cleared for pattern: ${pattern}` });
      } else {
        clearAllCache();
        res.json({ success: true, message: "All cache cleared" });
      }
    } catch (error) {
      res.status(500).json({ message: "Error clearing cache" });
    }
  });

  // Public routes

  // Get all SDGs (cached for 30 minutes - rarely changes)
  app.get("/api/sdgs", cacheMiddleware("sdgs", 30), async (req, res) => {
    const startTime = Date.now();
    try {
      // Enhanced caching and compression headers for external devices
      res.setHeader('Cache-Control', 'public, max-age=1800, s-maxage=1800, must-revalidate');
      res.setHeader('Vary', 'Accept-Encoding');
      res.setHeader('ETag', `"sdgs-cache"`);
      
      // Use preloaded cache for faster response
      const sdgs = await preloadCache.getSDGs();
      
      const responseTime = Date.now() - startTime;
      res.setHeader('X-Response-Time', `${responseTime}ms`);
      
      res.json(sdgs);
    } catch (error) {
      console.error("Erro ao buscar SDGs:", error);
      res.status(500).json([]);
    }
  });

  // Get SDG by ID with investing companies (cached for 1 hour)
  app.get("/api/sdgs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID inválido" });
      }
      
      const cacheKey = `sdg_detail_${id}`;
      const cached = getCache(cacheKey);
      if (cached) {
        res.setHeader('X-Cache', 'HIT');
        return res.json(cached);
      }
      
      const [sdg, investingCompanies] = await Promise.all([
        storage.getSdgById(id),
        storage.getInvestingCompaniesForSdg(id)
      ]);
      
      if (!sdg) {
        return res.status(404).json({ message: "ODS não encontrado" });
      }
      
      const result = { ...sdg, investingCompanies };
      setCache(cacheKey, result, 60);
      res.setHeader('X-Cache', 'MISS');
      res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour browser cache
      res.json(result);
    } catch (error) {
      console.error('Error in /api/sdgs/:id route:', error);
      res.status(500).json({ message: "Erro ao buscar ODS" });
    }
  });

  // Get SDG by number
  app.get("/api/sdgs/number/:number", async (req, res) => {
    try {
      const number = parseInt(req.params.number);
      if (isNaN(number)) {
        return res.status(400).json({ message: "Número inválido" });
      }
      
      const sdg = await storage.getSdgByNumber(number);
      if (!sdg) {
        return res.status(404).json({ message: "ODS não encontrado" });
      }
      
      res.json(sdg);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar ODS" });
    }
  });

  // Get all projects (instant response from memory cache)
  app.get("/api/projects", async (req, res) => {
    const startTime = Date.now();
    try {
      // Initialize instant cache if needed
      await instantProjectCache.initialize();
      
      // Get projects instantly from memory (no database query)
      const projects = instantProjectCache.getProjectsInstant();
      
      const responseTime = Date.now() - startTime;
      res.setHeader('X-Response-Time', `${responseTime}ms`);
      res.setHeader('X-Instant-Response', 'true');
      res.setHeader('X-Cache-Source', 'memory');
      res.setHeader('Cache-Control', 'no-cache'); // Force fresh data always
      
      res.json(projects);
    } catch (error) {
      console.error("Erro ao buscar projetos:", error);
      res.status(500).json([]);
    }
  });

  // Get project by ID (instant response from memory)
  app.get("/api/projects/:id", async (req, res) => {
    const startTime = Date.now();
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID inválido" });
      }
      
      // Initialize instant cache if needed
      await instantProjectCache.initialize();
      
      // Try to get from instant cache first
      let project = instantProjectCache.getProjectInstant(id);
      
      // If not in cache, get from database and cache it
      if (!project) {
        project = await storage.getProjectById(id);
        if (!project) {
          return res.status(404).json({ message: "Projeto não encontrado" });
        }
      }
      
      const responseTime = Date.now() - startTime;
      res.setHeader('X-Response-Time', `${responseTime}ms`);
      res.setHeader('X-Cache-Source', project ? 'memory' : 'database');
      res.setHeader('Cache-Control', 'no-cache'); // Force fresh data always
      
      res.json(project);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar projeto" });
    }
  });

  // Get projects by SDG ID
  app.get("/api/projects/sdg/:sdgId", async (req, res) => {
    try {
      const sdgId = parseInt(req.params.sdgId);
      if (isNaN(sdgId)) {
        return res.status(400).json({ message: "ID inválido" });
      }
      
      const projects = await storage.getProjectsBySDG(sdgId);
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar projetos" });
    }
  });

  // Company routes

  // Update company profile
  app.put("/api/company/profile", isCompany, async (req, res) => {
    try {
      const { name, sector, phone, location, employeeCount } = req.body;
      
      if (!name || !sector) {
        return res.status(400).json({ message: "Nome e setor são obrigatórios" });
      }
      
      const updated = await storage.updateCompany(req.user.company.id, {
        name,
        sector,
        phone: phone || null,
        location: location || null,
        employeeCount: employeeCount || null
      });
      
      if (!updated) {
        return res.status(404).json({ message: "Empresa não encontrada" });
      }
      
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Erro ao atualizar perfil" });
    }
  });

  // Upload company logo
  app.post("/api/company/logo", isCompany, upload.single("logo"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Nenhum arquivo enviado" });
      }
      
      // Ensure the logo directory exists
      try {
        await mkdir(path.join(uploadsDir, "logos"), { recursive: true });
      } catch (err) {
        console.error("Error ensuring logo directory exists:", err);
      }
      
      const logoUrl = `/uploads/logos/${req.file.filename}`;
      console.log("Logo file saved at:", logoUrl);
      
      const updated = await storage.updateCompany(req.user.company.id, {
        logoUrl
      });
      
      if (!updated) {
        return res.status(404).json({ message: "Empresa não encontrada" });
      }
      
      // Include user data with updated logo in response
      const updatedUser = await storage.getUserWithCompany(req.user.id);
      
      res.json({ 
        logoUrl,
        user: updatedUser
      });
    } catch (error) {
      console.error("Error uploading logo:", error);
      res.status(500).json({ message: "Erro ao fazer upload do logo" });
    }
  });

  // Create consumption record
  app.post("/api/company/consumption", isCompany, async (req, res) => {
    try {
      // Log the request data for debugging
      console.log('Consumo recebido:', req.body);
      
      // Primeiro, adicione o companyId aos dados recebidos
      const dataWithCompanyId = {
        ...req.body,
        companyId: req.user!.company.id,
        month: req.body.month || "",
        day: req.body.day || null,
        year: req.body.year || new Date().getFullYear(),
      };
      
      console.log('Dados com companyId:', dataWithCompanyId);
      
      // Agora valide os dados
      const validationResult = consumptionRecordInsertSchema.safeParse(dataWithCompanyId);
      
      if (!validationResult.success) {
        console.log('Erro de validação:', validationResult.error.format());
        return res.status(400).json({ 
          message: "Dados inválidos", 
          errors: validationResult.error.format() 
        });
      }
      
      // Use os dados validados diretamente
      const record = await storage.createConsumptionRecord(validationResult.data);
      
      // Clear cache for admin stats when new consumption data is added
      clearCacheByPattern('admin/stats');
      clearCacheByPattern('stats');
      
      // Add response header to trigger client-side cache invalidation
      res.setHeader('X-Cache-Invalidate', 'admin-stats');
      res.setHeader('X-Consumption-Updated', record.id?.toString() || 'new');
      
      res.status(201).json(record);
    } catch (error) {
      console.error('Erro ao criar registro de consumo:', error);
      res.status(500).json({ message: "Erro ao criar registro de consumo" });
    }
  });

  // Get consumption records for company
  app.get("/api/company/consumption", isCompany, async (req, res) => {
    try {
      const records = await storage.getConsumptionRecordsForCompany(req.user!.company.id);
      res.json(records);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar registros de consumo" });
    }
  });

  // Upload payment proof
  app.post("/api/company/payment-proof", isCompany, upload.single("proof"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Nenhum arquivo enviado" });
      }
      
      const fileUrl = `/uploads/proofs/${req.file.filename}`;
      const { amount, consumptionRecordId, sdgId } = req.body;
      
      // Validate amount
      if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        return res.status(400).json({ message: "Valor inválido" });
      }
      
      // Create payment proof data object
      const paymentProofData: any = {
        companyId: req.user!.company.id,
        fileUrl,
        amount: amount.toString(), // Convert to string as required by schema
        status: 'pending' as const
      };
      
      // Only add consumptionRecordId if it's a valid number
      if (consumptionRecordId && !isNaN(parseInt(consumptionRecordId))) {
        Object.assign(paymentProofData, { consumptionRecordId: parseInt(consumptionRecordId) });
      }
      
      // Only add sdgId if it's a valid number
      if (sdgId && !isNaN(parseInt(sdgId))) {
        Object.assign(paymentProofData, { sdgId: parseInt(sdgId) });
      }
      
      console.log("Enviando dados para criação do comprovativo:", paymentProofData);
      
      // Create payment proof
      const proof = await storage.createPaymentProof(paymentProofData);
      
      res.status(201).json(proof);
    } catch (error) {
      console.error("Erro ao processar upload do comprovativo:", error);
      if (error instanceof Error) {
        console.error("Mensagem do erro:", error.message);
        console.error("Stack trace:", error.stack);
      }
      res.status(500).json({ message: "Erro ao fazer upload do comprovativo" });
    }
  });

  // Get payment proofs for company
  app.get("/api/company/payment-proofs", isCompany, async (req, res) => {
    try {
      const proofs = await storage.getPaymentProofsForCompany(req.user.company.id);
      res.json(proofs);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar comprovativos" });
    }
  });

  // Get company statistics
  app.get("/api/company/stats", isCompany, async (req, res) => {
    try {
      const stats = await storage.getCompanyStats(req.user.company.id);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar estatísticas" });
    }
  });

  // Get investments for company
  app.get("/api/company/investments", isCompany, async (req, res) => {
    try {
      if (!req.user || !req.user.company) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }
      
      // Buscar investimentos diretamente
      const projectInvestments = await storage.getInvestmentsForCompany(req.user.company.id);
      
      // Exibir os investimentos disponíveis no log
      console.log(`Retornando ${projectInvestments.length} investimentos para a empresa ${req.user.company.id}`);
      res.json(projectInvestments);
    } catch (error) {
      console.error("Erro ao buscar investimentos:", error);
      res.status(500).json({ message: "Erro ao buscar investimentos" });
    }
  });

  // Individual routes
  
  // Get individual profile
  app.get("/api/individual/profile", isIndividual, async (req, res) => {
    try {
      const individual = await storage.getIndividualById(req.user!.individual.id);
      res.json(individual);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar perfil" });
    }
  });

  // Update individual profile
  app.put("/api/individual/profile", isIndividual, async (req, res) => {
    try {
      const { firstName, lastName, phone, location, occupation } = req.body;
      
      const updatedIndividual = await storage.updateIndividual(req.user!.individual.id, {
        firstName,
        lastName,
        phone,
        location,
        occupation
      });
      
      // Get updated user with individual profile
      const userWithIndividual = await storage.getUserWithIndividual(req.user!.id);
      res.json(userWithIndividual);
    } catch (error) {
      res.status(500).json({ message: "Erro ao atualizar perfil" });
    }
  });

  // Upload individual profile photo
  app.post("/api/individual/profile/photo", isIndividual, upload.single("profilePicture"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Nenhuma imagem enviada" });
      }
      
      const imageUrl = `/uploads/profiles/${req.file.filename}`;
      
      // Update the individual's profile picture URL
      await storage.updateIndividual(req.user!.individual.id, {
        profilePictureUrl: imageUrl
      });
      
      // Return the updated user object quickly without additional database calls
      const updatedUser = {
        ...req.user!,
        individual: {
          ...req.user!.individual,
          profilePictureUrl: imageUrl
        }
      };
      
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: "Erro ao fazer upload da foto" });
    }
  });

  // Create consumption record for individual
  app.post("/api/individual/consumption", isIndividual, async (req, res) => {
    try {
      const data = {
        ...req.body,
        individualId: req.user!.individual.id
      };
      
      const validationResult = consumptionRecordInsertSchema.safeParse(data);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Dados inválidos", 
          errors: validationResult.error.format() 
        });
      }
      
      const record = await storage.createConsumptionRecord(validationResult.data);
      res.status(201).json(record);
    } catch (error) {
      res.status(500).json({ message: "Erro ao criar registro de consumo" });
    }
  });

  // Get consumption records for individual
  app.get("/api/individual/consumption", isIndividual, async (req, res) => {
    try {
      const records = await storage.getConsumptionRecordsForIndividual(req.user!.individual.id);
      res.json(records);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar registros de consumo" });
    }
  });

  // Create payment proof for individual
  app.post("/api/individual/payment-proofs", isIndividual, upload.single("paymentProof"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Arquivo de comprovativo obrigatório" });
      }
      
      const { amount, sdgId, consumptionRecordId } = req.body;
      
      if (!amount || !sdgId) {
        return res.status(400).json({ message: "Valor e ODS são obrigatórios" });
      }
      
      const fileUrl = `/uploads/proofs/${req.file.filename}`;
      
      const paymentProofData: any = {
        individualId: req.user!.individual.id,
        fileUrl,
        amount: amount.toString(),
        status: 'pending' as const
      };
      
      // Only add consumptionRecordId if it's a valid number
      if (consumptionRecordId && !isNaN(parseInt(consumptionRecordId))) {
        Object.assign(paymentProofData, { consumptionRecordId: parseInt(consumptionRecordId) });
      }
      
      // Handle SDG assignment
      if (sdgId) {
        if (sdgId === 'admin_choice') {
          // Don't set sdgId - let it be null so admin can choose later
          console.log("User chose to let admin select SDG");
        } else if (!isNaN(parseInt(sdgId))) {
          Object.assign(paymentProofData, { sdgId: parseInt(sdgId) });
        }
      }
      
      const proof = await storage.createPaymentProof(paymentProofData);
      res.status(201).json(proof);
    } catch (error) {
      res.status(500).json({ message: "Erro ao fazer upload do comprovativo" });
    }
  });

  // Get payment proofs for individual
  app.get("/api/individual/payment-proofs", isIndividual, async (req, res) => {
    try {
      const proofs = await storage.getPaymentProofsForIndividual(req.user!.individual.id);
      res.json(proofs);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar comprovativos" });
    }
  });

  // Get individual statistics
  app.get("/api/individual/stats", isIndividual, async (req, res) => {
    try {
      const stats = await storage.getIndividualStats(req.user!.individual.id);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar estatísticas" });
    }
  });

  // Get investments for individual
  app.get("/api/individual/investments", isIndividual, async (req, res) => {
    try {
      const investments = await storage.getInvestmentsForIndividual(req.user!.individual.id);
      res.json(investments);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar investimentos" });
    }
  });

  // Get individual investment totals by SDG
  app.get("/api/individual/investment-totals", isIndividual, async (req, res) => {
    try {
      const totals = await storage.getIndividualInvestmentTotalsBySDG(req.user!.individual.id);
      res.json(totals);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar totais de investimento" });
    }
  });

  // Get global investment totals by SDG (for all users)
  app.get("/api/global/investment-totals", async (req, res) => {
    try {
      const totals = await storage.getGlobalInvestmentTotalsBySDG();
      res.json(totals);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar totais globais de investimento" });
    }
  });

  // Admin routes

  // Get all companies
  app.get("/api/admin/companies", isAdmin, async (req, res) => {
    try {
      const companies = await storage.getAllCompanies();
      res.json(companies);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar empresas" });
    }
  });
  
  // Get company by ID with detailed stats
  app.get("/api/admin/companies/:id", isAdmin, async (req, res) => {
    try {
      const companyId = parseInt(req.params.id);
      if (isNaN(companyId)) {
        return res.status(400).json({ message: "ID inválido" });
      }
      
      const company = await storage.getCompanyById(companyId);
      if (!company) {
        return res.status(404).json({ message: "Empresa não encontrada" });
      }
      
      // Get additional data for this company
      const stats = await storage.getCompanyStats(companyId);
      const paymentProofs = await storage.getPaymentProofsForCompany(companyId);
      const investments = await storage.getInvestmentsForCompany(companyId);
      
      res.json({
        ...company,
        stats,
        paymentProofs,
        investments
      });
    } catch (error) {
      console.error("Error getting company details:", error);
      res.status(500).json({ message: "Erro ao buscar detalhes da empresa" });
    }
  });

  // Get all individuals
  app.get("/api/admin/individuals", isAdmin, async (req, res) => {
    try {
      const individuals = await storage.getAllIndividuals();
      res.json(individuals);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar pessoas individuais" });
    }
  });
  
  // Get individual by ID with detailed stats
  app.get("/api/admin/individuals/:id", isAdmin, async (req, res) => {
    try {
      const individualId = parseInt(req.params.id);
      if (isNaN(individualId)) {
        return res.status(400).json({ message: "ID inválido" });
      }
      
      const individual = await storage.getIndividualById(individualId);
      if (!individual) {
        return res.status(404).json({ message: "Pessoa não encontrada" });
      }
      
      // Get additional data for this individual
      const stats = await storage.getIndividualStats(individualId);
      const paymentProofs = await storage.getPaymentProofsForIndividual(individualId);
      const investments = await storage.getInvestmentsForIndividual(individualId);
      
      res.json({
        ...individual,
        stats,
        paymentProofs,
        investments
      });
    } catch (error) {
      console.error("Error getting individual details:", error);
      res.status(500).json({ message: "Erro ao buscar detalhes da pessoa" });
    }
  });

  // Get admin dashboard statistics
  app.get("/api/admin/stats", isAdmin, async (req, res) => {
    try {
      // Force fresh data by setting no-cache headers
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      const stats = await storage.getAdminDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar estatísticas" });
    }
  });

  // Clear cache manually (admin only)
  app.post("/api/admin/clear-cache", isAdmin, async (req, res) => {
    try {
      clearAllCache();
      res.json({ message: "Cache limpo com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro ao limpar cache" });
    }
  });
  
  // Rota temporária para remover investimentos duplicados (apenas admin)
  app.get("/api/admin/fix-duplicate-investments", isAdmin, async (req, res) => {
    try {
      // Primeiro, vamos encontrar todos os investimentos
      const allInvestments = await db.select().from(investments);
      console.log(`Total de investimentos: ${allInvestments.length}`);
      
      // Mapa para rastrear investimentos por payment_proof_id
      const investmentsByPaymentProofId = new Map();
      const duplicates = [];
      
      // Identificar duplicações
      for (const inv of allInvestments) {
        if (!inv.paymentProofId) continue; // Pular se não tiver payment_proof_id
        
        if (investmentsByPaymentProofId.has(inv.paymentProofId)) {
          // É uma duplicação, adicionar à lista para remoção
          duplicates.push(inv);
        } else {
          // Primeiro investimento com este payment_proof_id
          investmentsByPaymentProofId.set(inv.paymentProofId, inv);
        }
      }
      
      console.log(`Encontradas ${duplicates.length} duplicações`);
      
      // Remover duplicações
      for (const duplicate of duplicates) {
        console.log(`Removendo investimento duplicado ID ${duplicate.id} (paymentProofId: ${duplicate.paymentProofId})`);
        await db.delete(investments).where(eq(investments.id, duplicate.id));
      }
      
      res.json({ 
        message: "Limpeza concluída", 
        totalInvestments: allInvestments.length, 
        duplicatesRemoved: duplicates.length,
        remainingInvestments: allInvestments.length - duplicates.length
      });
    } catch (error) {
      console.error("Erro ao limpar investimentos duplicados:", error);
      res.status(500).json({ message: "Erro ao limpar investimentos duplicados" });
    }
  });

  // Get pending payment proofs
  app.get("/api/admin/payment-proofs/pending", isAdmin, async (req, res) => {
    try {
      const proofs = await storage.getPendingPaymentProofs();
      res.json(proofs);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar comprovativos pendentes" });
    }
  });

  // Update payment proof status
  app.put("/api/admin/payment-proofs/:id/status", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID inválido" });
      }
      
      const { status } = req.body;
      if (status !== 'approved' && status !== 'rejected') {
        return res.status(400).json({ message: "Status inválido" });
      }
      
      const updated = await storage.updatePaymentProofStatus(id, status);
      if (!updated) {
        return res.status(404).json({ message: "Comprovativo não encontrado" });
      }
      
      // If the payment was approved and has an SDG, create an investment automatically
      if (status === 'approved' && updated.sdgId) {
        console.log(`Comprovativo ${id} aprovado com ODS ${updated.sdgId}. Criando investimento...`);
        
        // Get projects for this SDG
        const projectsForSdg = await storage.getProjectsBySDG(updated.sdgId);
        
        if (projectsForSdg && projectsForSdg.length > 0) {
          // Use the first project for now
          const project = projectsForSdg[0];
          
          // Create investment
          await storage.createInvestment({
            companyId: updated.companyId,
            projectId: project.id,
            amount: updated.amount,
            paymentProofId: updated.id,
            createdAt: new Date()
          });
          
          console.log(`Investimento criado para o projeto ${project.name}`);
        } else {
          console.log(`Nenhum projeto encontrado para o ODS ${updated.sdgId}`);
        }
      }
      
      // Broadcast real-time update to all connected clients
      if (wsService) {
        wsService.broadcastPaymentProofUpdate({
          action: 'status_update',
          paymentProof: updated,
          status: status
        });
      }
      
      res.json(updated);
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      res.status(500).json({ message: "Erro ao atualizar status" });
    }
  });

  // Get payment proofs without SDG
  app.get("/api/admin/payment-proofs/without-sdg", isAdmin, async (req, res) => {
    try {
      const proofs = await storage.getPaymentProofsWithoutSdg();
      res.json(proofs);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar comprovativos sem ODS" });
    }
  });

  // Assign SDG to payment proof
  app.put("/api/admin/payment-proofs/:id/sdg", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID inválido" });
      }
      
      const { sdgId } = req.body;
      if (!sdgId || isNaN(parseInt(sdgId))) {
        return res.status(400).json({ message: "ID de ODS inválido" });
      }
      
      const updated = await storage.assignSdgToPaymentProof(id, parseInt(sdgId));
      if (!updated) {
        return res.status(404).json({ message: "Comprovativo não encontrado" });
      }
      
      // If the payment is already approved, create an investment automatically
      if (updated.status === 'approved') {
        console.log(`Comprovativo ${id} já aprovado e agora com ODS ${sdgId}. Criando investimento...`);
        
        // Get projects for this SDG
        const projectsForSdg = await storage.getProjectsBySDG(parseInt(sdgId));
        
        if (projectsForSdg && projectsForSdg.length > 0) {
          // Use the first project for now
          const project = projectsForSdg[0];
          
          // Create investment
          await storage.createInvestment({
            companyId: updated.companyId,
            projectId: project.id,
            amount: updated.amount,
            paymentProofId: updated.id,
            createdAt: new Date()
          });
          
          console.log(`Investimento criado para o projeto ${project.name}`);
        } else {
          console.log(`Nenhum projeto encontrado para o ODS ${sdgId}`);
        }
      }
      
      // Broadcast real-time update to all connected clients
      if (wsService) {
        wsService.broadcastPaymentProofUpdate({
          action: 'sdg_assignment',
          paymentProof: updated,
          sdgId: parseInt(sdgId)
        });
      }
      
      res.json(updated);
    } catch (error) {
      console.error('Erro ao atribuir ODS:', error);
      res.status(500).json({ message: "Erro ao atribuir ODS" });
    }
  });

  // Create a project (optimized for instant response)
  app.post("/api/admin/projects", isAdmin, upload.single("image"), async (req, res) => {
    const startTime = Date.now();
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Imagem do projeto é obrigatória" });
      }
      
      const imageUrl = `/uploads/projects/${req.file.filename}`;
      
      const projectData = {
        name: req.body.name,
        description: req.body.description,
        sdgId: parseInt(req.body.sdgId),
        imageUrl,
        totalInvested: req.body.totalInvested || '0',
        peopleCount: parseInt(req.body.peopleCount) || 0
      };
      
      // Validate project data
      const validationResult = projectInsertSchema.safeParse(projectData);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Dados inválidos", 
          errors: validationResult.error.format() 
        });
      }
      
      // Use instant cache for immediate response
      const project = await instantProjectCache.addProject(validationResult.data);
      
      // Broadcast real-time update to all connected clients
      if (wsService) {
        wsService.broadcastProjectUpdate({
          action: 'create',
          project: project
        });
      }
      
      // Clear other caches in parallel (non-blocking)
      Promise.all([
        Promise.resolve(clearCacheByPattern('projects')),
        Promise.resolve(clearCacheByPattern('sdgs')),
        preloadCache.forceRefresh()
      ]).catch(err => console.warn('Cache clear warning:', err));
      
      const responseTime = Date.now() - startTime;
      res.setHeader('X-Response-Time', `${responseTime}ms`);
      res.setHeader('X-Cache-Invalidated', 'true');
      
      res.status(201).json(project);
    } catch (error) {
      console.error('Erro ao criar projeto:', error);
      res.status(500).json({ message: "Erro ao criar projeto" });
    }
  });

  // Clear cache manually (admin only)
  app.post("/api/admin/clear-cache", isAdmin, async (req, res) => {
    try {
      const { pattern } = req.body;
      
      if (pattern) {
        clearCacheByPattern(pattern);
        res.json({ message: `Cache cleared for pattern: ${pattern}` });
      } else {
        clearAllCache();
        res.json({ message: "All cache cleared" });
      }
    } catch (error) {
      res.status(500).json({ message: "Erro ao limpar cache" });
    }
  });

  // Update a project
  app.put("/api/admin/projects/:id", isAdmin, upload.single("image"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID inválido" });
      }
      
      console.log("Dados recebidos para atualização:", req.body);
      console.log("Tipo do Content-Type:", req.get('Content-Type'));
      
      let projectData;
      
      // Use o schema de validação para garantir tipos corretos
      try {
        // Validar e transformar os dados usando o schema
        const contentType = req.get('Content-Type') || '';
        
        if (contentType.includes('application/json')) {
          // Para JSON, valide diretamente o corpo
          projectData = projectUpdateSchema.parse(req.body);
          console.log("Dados JSON validados:", projectData);
        } else {
          // Para form-data ou outros tipos, pré-processar os dados
          const rawData: any = {};
          if (req.body.name) rawData.name = req.body.name;
          if (req.body.description) rawData.description = req.body.description;
          if (req.body.sdgId) rawData.sdgId = parseInt(req.body.sdgId);
          if (req.body.totalInvested !== undefined) rawData.totalInvested = req.body.totalInvested;
          if (req.body.peopleCount !== undefined) rawData.peopleCount = parseInt(req.body.peopleCount) || 0;
          
          projectData = projectUpdateSchema.parse(rawData);
          console.log("Dados form validados:", projectData);
        }
        
        // Adicione a imagem se foi enviada
        if (req.file) {
          projectData.imageUrl = `/uploads/projects/${req.file.filename}`;
        }
        
      } catch (error) {
        console.error("Erro na validação dos dados:", error);
        if (error instanceof z.ZodError) {
          return res.status(400).json({ 
            message: "Dados inválidos para atualização", 
            errors: error.format() 
          });
        }
        throw error;
      }
      
      console.log("Dados finais do projeto a atualizar:", projectData);
      
      if (Object.keys(projectData).length === 0) {
        return res.status(400).json({ message: "Nenhum dado fornecido para atualização" });
      }
      
      // Use instant cache for immediate response
      const updated = await instantProjectCache.updateProject(id, projectData);
      
      // Clear other caches in parallel (non-blocking)
      Promise.all([
        Promise.resolve(clearCacheByPattern('projects')),
        Promise.resolve(clearCacheByPattern(`project:${id}`)),
        Promise.resolve(clearCacheByPattern('sdgs')),
        preloadCache.forceRefresh()
      ]).catch(err => console.warn('Cache clear warning:', err));
      
      if (!updated) {
        return res.status(404).json({ message: "Projeto não encontrado" });
      }
      
      // Broadcast real-time update to all connected clients
      if (wsService) {
        wsService.broadcastProjectUpdate({
          action: 'update',
          project: updated,
          projectId: id
        });
      }
      
      // Add response headers for instant cache invalidation
      res.setHeader('X-Cache-Invalidate', 'projects');
      res.setHeader('X-Project-Updated', id.toString());
      res.setHeader('X-Cache-Invalidated', 'true');
      
      res.json(updated);
    } catch (error) {
      console.error("Erro ao atualizar projeto:", error);
      
      // Log mais detalhado para depuração
      if (error instanceof Error) {
        console.error("Mensagem de erro:", error.message);
        console.error("Stack trace:", error.stack);
      }
      
      res.status(500).json({ message: "Erro ao atualizar projeto: " + (error instanceof Error ? error.message : String(error)) });
    }
  });
  
  // Delete a project (optimized for instant response)
  app.delete("/api/admin/projects/:id", isAdmin, async (req, res) => {
    const startTime = Date.now();
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID inválido" });
      }
      
      // Use instant cache for immediate response
      const result = await instantProjectCache.deleteProject(id);
      
      // Broadcast real-time update to all connected clients
      if (wsService) {
        wsService.broadcastProjectUpdate({
          action: 'delete',
          projectId: id
        });
      }
      
      // Clear other caches in parallel (non-blocking)
      Promise.all([
        Promise.resolve(clearCacheByPattern('projects')),
        Promise.resolve(clearCacheByPattern(`project:${id}`)),
        Promise.resolve(clearCacheByPattern('sdgs')),
        preloadCache.forceRefresh()
      ]).catch(err => console.warn('Cache clear warning:', err));
      
      if (!result) {
        return res.status(404).json({ message: "Projeto não encontrado ou não pode ser excluído" });
      }
      
      const responseTime = Date.now() - startTime;
      res.setHeader('X-Response-Time', `${responseTime}ms`);
      res.setHeader('X-Cache-Invalidated', 'true');
      
      res.status(200).json({ message: "Projeto excluído com sucesso" });
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({ message: "Erro ao excluir projeto" });
    }
  });

  // Add a project update
  app.post("/api/admin/projects/:id/updates", isAdmin, upload.array("media"), async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "ID inválido" });
      }
      
      const { title, content } = req.body;
      
      if (!title || !content) {
        return res.status(400).json({ message: "Título e conteúdo são obrigatórios" });
      }
      
      // Process uploaded files
      const mediaUrls = [];
      if (req.files && Array.isArray(req.files)) {
        for (const file of req.files) {
          const fileUrl = `/uploads/projects/${file.filename}`;
          mediaUrls.push(fileUrl);
        }
      }
      
      const updateData = {
        projectId,
        title,
        content,
        mediaUrls
      };
      
      // Run all operations in parallel for instant response
      const [update] = await Promise.all([
        storage.addProjectUpdate(updateData),
        Promise.resolve(clearCacheByPattern('projects')),
        Promise.resolve(clearCacheByPattern(`project:${projectId}`)),
        Promise.resolve(clearCacheByPattern(`project_${projectId}`)),
        preloadCache.forceRefresh()
      ]);
      
      res.setHeader('X-Cache-Invalidated', 'true');
      res.status(201).json(update);
    } catch (error) {
      console.error("Error adding project update:", error);
      res.status(500).json({ message: "Erro ao adicionar atualização" });
    }
  });
  
  // NOVO Endpoint para substituir imagens de uma atualização de projeto
  app.post("/api/admin/project-updates/:id/replace-images", isAdmin, upload.array("media"), async (req, res) => {
    try {
      const updateId = parseInt(req.params.id);
      if (isNaN(updateId)) {
        return res.status(400).json({ message: "ID inválido" });
      }
      
      console.log("\n\n===== REQUISIÇÃO DE IMAGENS RECEBIDA =====");
      console.log("FILES:", req.files ? `${(req.files as any[]).length} arquivo(s)` : "nenhum arquivo");
      console.log("BODY KEYS:", Object.keys(req.body));
      console.log("EXISTING_MEDIA_URLS RAW:", req.body.existingMediaUrls);
      
      // Verificar e imprimir os arquivos recebidos
      if (req.files && Array.isArray(req.files)) {
        console.log("FILE DETAILS:", req.files.map(f => ({
          fieldname: f.fieldname,
          originalname: f.originalname,
          encoding: f.encoding,
          mimetype: f.mimetype,
          destination: f.destination,
          filename: f.filename,
          path: f.path,
          size: f.size
        })));
      }
      
      // Obter a atualização atual
      const currentUpdate = await storage.getProjectUpdateById(updateId);
      if (!currentUpdate) {
        return res.status(404).json({ message: "Atualização não encontrada" });
      }
      
      // Imprimir o estado atual
      console.log("MEDIA_URLS EXISTENTE NO BANCO:", currentUpdate.mediaUrls);
      console.log("TIPO DOS MEDIA_URLS:", typeof currentUpdate.mediaUrls);
      console.log("É ARRAY?", Array.isArray(currentUpdate.mediaUrls));
      
      // Processar a lista de URLs existentes
      let finalMediaUrls: string[] = [];
      
      // Preservar as URLs atuais se nenhuma lista de existingMediaUrls for fornecida
      if (!req.body.existingMediaUrls && Array.isArray(currentUpdate.mediaUrls)) {
        finalMediaUrls = [...currentUpdate.mediaUrls];
        console.log("USANDO URLs EXISTENTES DO BANCO:", finalMediaUrls);
      }
      // Se existingMediaUrls for fornecido, usar essa lista
      else if (req.body.existingMediaUrls) {
        try {
          const existingUrls = JSON.parse(req.body.existingMediaUrls);
          console.log("URLs EXISTENTES PARSEADAS:", existingUrls);
          console.log("TIPO DAS URLs PARSEADAS:", typeof existingUrls);
          console.log("É ARRAY?", Array.isArray(existingUrls));
          
          if (Array.isArray(existingUrls)) {
            finalMediaUrls = [...existingUrls];
          } else {
            console.log("AVISO: existingMediaUrls não é um array!");
            // Se não for array, mas tiver URLs do banco, usar essas
            if (Array.isArray(currentUpdate.mediaUrls)) {
              finalMediaUrls = [...currentUpdate.mediaUrls];
              console.log("USANDO URLs DO BANCO EM FALLBACK:", finalMediaUrls);
            }
          }
        } catch (e) {
          console.error("ERRO AO PROCESSAR URLS:", e);
          // Se houver erro no parsing, tentar usar as URLs do banco
          if (Array.isArray(currentUpdate.mediaUrls)) {
            finalMediaUrls = [...currentUpdate.mediaUrls];
            console.log("USANDO URLs DO BANCO EM FALLBACK DE ERRO:", finalMediaUrls);
          } else {
            return res.status(400).json({ message: "Formato inválido para existingMediaUrls" });
          }
        }
      }
      
      console.log("URLs MANTIDAS APÓS PROCESSAMENTO:", finalMediaUrls);
      
      // Adicionar novos arquivos
      const newMediaUrls: string[] = [];
      if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        console.log("NOVOS ARQUIVOS:", req.files.map(f => f.filename));
        for (const file of req.files) {
          const fileUrl = `/uploads/projects/${file.filename}`;
          newMediaUrls.push(fileUrl);
        }
      }
      
      console.log("NOVAS URLs:", newMediaUrls);
      
      // Juntar as URLs existentes com as novas
      const allMediaUrls = [...finalMediaUrls, ...newMediaUrls];
      console.log("LISTA FINAL COMPLETA:", allMediaUrls);
      
      // Garantir que temos um array válido para o banco de dados
      const jsonString = JSON.stringify(allMediaUrls);
      console.log("JSON A SER ENVIADO PARA O BANCO:", jsonString);
      
      // Executar a atualização com SQL direto para evitar problemas de tipo
      try {
        // Vamos verificar novamente a string final
        console.log("VERIFICAÇÃO FINAL:");
        console.log("- JSON STRING:", jsonString);
        console.log("- TIPO:", typeof jsonString);
        console.log("- DESCOMPACTANDO PARA VERIFICAR:", JSON.parse(jsonString));
        
        // Garantir que não temos caracteres de escape extras
        const cleanJsonString = JSON.stringify(JSON.parse(jsonString));
        console.log("- JSON STRING LIMPO:", cleanJsonString);
        
        const result = await db.execute(sql`
          UPDATE project_updates 
          SET media_urls = ${cleanJsonString}::jsonb
          WHERE id = ${updateId}
          RETURNING *
        `);
        
        console.log("RESULTADO SQL:", result);
        console.log("LINHAS AFETADAS:", result.rowCount);
        console.log("DADOS RETORNADOS:", result.rows);
      } catch (sqlError) {
        console.error("ERRO NA EXECUÇÃO SQL:", sqlError);
        console.error("DETALHES DO ERRO:", sqlError instanceof Error ? sqlError.message : sqlError);
      }
      
      // Buscar o registro atualizado para confirmar as mudanças
      const updatedUpdate = await storage.getProjectUpdateById(updateId);
      if (!updatedUpdate) {
        return res.status(404).json({ message: "Falha ao buscar atualização após ação" });
      }
      
      console.log("RESULTADO FINAL VERIFICADO:", updatedUpdate.mediaUrls);
      console.log("===== FIM DA REQUISIÇÃO =====\n\n");
      
      res.json(updatedUpdate);
    } catch (error) {
      console.error("Erro ao atualizar imagens:", error);
      res.status(500).json({ message: "Erro ao atualizar imagens da atualização" });
    }
  });

  // Update a project update
  app.put("/api/admin/project-updates/:id", isAdmin, async (req, res) => {
    try {
      const updateId = parseInt(req.params.id);
      if (isNaN(updateId)) {
        return res.status(400).json({ message: "ID inválido" });
      }
      
      const { title, content } = req.body;
      
      if (!title && !content) {
        return res.status(400).json({ message: "Título ou conteúdo são obrigatórios" });
      }
      
      // Buscar a atualização atual
      const currentUpdate = await storage.getProjectUpdateById(updateId);
      if (!currentUpdate) {
        return res.status(404).json({ message: "Atualização não encontrada" });
      }
      
      // Atualizar apenas título e conteúdo, deixando as imagens como estão
      const updateData: Record<string, any> = {};
      if (title) updateData.title = title;
      if (content) updateData.content = content;
      
      // Manter explicitamente as imagens existentes (não alterar)
      // updateData.mediaUrls = currentUpdate.mediaUrls || [];
      
      console.log("Dados de atualização (texto):", updateData);
      
      const updatedUpdate = await storage.updateProjectUpdate(updateId, updateData);
      if (!updatedUpdate) {
        return res.status(404).json({ message: "Falha ao atualizar" });
      }
      
      res.json(updatedUpdate);
    } catch (error) {
      console.error("Error updating project update:", error);
      res.status(500).json({ message: "Erro ao atualizar a atualização do projeto" });
    }
  });

  // Create an investment
  app.post("/api/admin/investments", isAdmin, async (req, res) => {
    try {
      const { companyId, projectId, paymentProofId, amount } = req.body;
      
      if (!companyId || !projectId || !paymentProofId || !amount) {
        return res.status(400).json({ message: "Todos os campos são obrigatórios" });
      }
      
      const investment = await storage.createInvestment({
        companyId: parseInt(companyId),
        projectId: parseInt(projectId),
        paymentProofId: parseInt(paymentProofId),
        amount: parseFloat(amount)
      });
      
      res.status(201).json(investment);
    } catch (error) {
      res.status(500).json({ message: "Erro ao criar investimento" });
    }
  });


  // Rotas para o Leaderboard de Pegada de Carbono
  
  // Obter o leaderboard completo
  app.get("/api/carbon-leaderboard", async (req, res) => {
    try {
      const period = req.query.period as string || 'all_time';
      const leaderboard = await storage.getCarbonLeaderboard(period);
      res.json(leaderboard);
    } catch (error) {
      console.error("Erro ao buscar leaderboard de carbono:", error);
      res.status(500).json({ message: "Erro ao buscar dados do leaderboard" });
    }
  });

  // Obter estatísticas de pegada de carbono para uma empresa específica
  app.get("/api/companies/:id/carbon-stats", async (req, res) => {
    try {
      const companyId = parseInt(req.params.id);
      if (isNaN(companyId)) {
        return res.status(400).json({ message: "ID inválido" });
      }
      
      const stats = await storage.getCompanyCarbonStats(companyId);
      if (!stats) {
        return res.status(404).json({ message: "Estatísticas não encontradas para esta empresa" });
      }
      
      res.json(stats);
    } catch (error) {
      console.error("Erro ao buscar estatísticas de carbono da empresa:", error);
      res.status(500).json({ message: "Erro ao buscar estatísticas de carbono" });
    }
  });

  // Atualizar dados de pegada de carbono (protegido para empresas autenticadas)
  app.post("/api/companies/:id/carbon-stats", isCompany, async (req, res) => {
    try {
      // Verificar se o usuário autenticado pertence a esta empresa
      const companyId = parseInt(req.params.id);
      if (isNaN(companyId)) {
        return res.status(400).json({ message: "ID inválido" });
      }
      
      // Verificar se o usuário tem permissão para atualizar esta empresa
      const userCompany = (req.user as any).company;
      if (!userCompany || userCompany.id !== companyId) {
        return res.status(403).json({ message: "Você não tem permissão para atualizar dados desta empresa" });
      }
      
      // Validar e processar os dados
      const validatedData = carbonLeaderboardInsertSchema.parse({
        ...req.body,
        companyId,
        year: new Date().getFullYear() // Usar o ano atual
      });
      
      // Atualizar os dados no banco
      const updatedStats = await storage.updateCarbonLeaderboard(validatedData);
      
      // Recalcular o ranking
      await storage.calculateCarbonRanking();
      
      res.json(updatedStats);
    } catch (error) {
      console.error("Erro ao atualizar estatísticas de carbono:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Dados inválidos", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Erro ao atualizar estatísticas de carbono" });
    }
  });

  // Rota administrativa para recalcular o ranking (protegida para administradores)
  app.post("/api/admin/carbon-leaderboard/recalculate", isAdmin, async (req, res) => {
    try {
      await storage.calculateCarbonRanking();
      const leaderboard = await storage.getCarbonLeaderboard();
      res.json({ message: "Ranking recalculado com sucesso", leaderboard });
    } catch (error) {
      console.error("Erro ao recalcular ranking:", error);
      res.status(500).json({ message: "Erro ao recalcular ranking" });
    }
  });

  // Rota para relatórios de emissões de carbono (admin)
  app.get("/api/admin/reports/carbon", isAdmin, async (req, res) => {
    try {
      const stats = await storage.getAdminDashboardStats();
      res.json({
        totalEmissions: stats.totalCarbonEmissions,
        totalCompensation: stats.totalCompensation,
        sectorEmissions: stats.sectorEmissions
      });
    } catch (error) {
      console.error("Erro ao buscar relatório de emissões:", error);
      res.status(500).json({ message: "Erro ao buscar relatório de emissões" });
    }
  });

  // Company logo endpoints - Generate SVG logos for Angolan companies
  app.get("/api/logo/:companySlug", (req, res) => {
    const { companySlug } = req.params;
    
    // Company logo configurations
    const logoConfigs: Record<string, { name: string; color: string; bgColor: string }> = {
      'bfa': { name: 'BFA', color: '#ffffff', bgColor: '#1a365d' },
      'banco-bic': { name: 'BIC', color: '#ffffff', bgColor: '#e53e3e' },
      'bai': { name: 'BAI', color: '#ffffff', bgColor: '#2b6cb0' },
      'bpc': { name: 'BPC', color: '#ffffff', bgColor: '#38a169' },
      'global-seguros': { name: 'GS', color: '#ffffff', bgColor: '#d69e2e' },
      'angola-cables': { name: 'AC', color: '#ffffff', bgColor: '#2d3748' },
      'movicel': { name: 'MC', color: '#ffffff', bgColor: '#805ad5' },
      'africell': { name: 'AF', color: '#ffffff', bgColor: '#e53e3e' },
      'kero': { name: 'KERO', color: '#ffffff', bgColor: '#38a169' },
      'shoprite': { name: 'SR', color: '#ffffff', bgColor: '#e53e3e' },
      'jumia': { name: 'JM', color: '#ffffff', bgColor: '#f56500' },
      'nosso-super': { name: 'NS', color: '#ffffff', bgColor: '#2b6cb0' },
      'zap': { name: 'ZAP', color: '#ffffff', bgColor: '#805ad5' },
      'taag': { name: 'TAAG', color: '#ffffff', bgColor: '#e53e3e' },
      'tcul': { name: 'TCUL', color: '#ffffff', bgColor: '#2d3748' },
      'macon': { name: 'MC', color: '#ffffff', bgColor: '#d69e2e' },
      'refriango': { name: 'RF', color: '#ffffff', bgColor: '#38a169' },
      'fazenda-girassol': { name: 'FG', color: '#ffffff', bgColor: '#d69e2e' },
      'coca-cola': { name: 'CC', color: '#ffffff', bgColor: '#e53e3e' },
      'tv-zimbo': { name: 'TVZ', color: '#ffffff', bgColor: '#2b6cb0' },
      'rna': { name: 'RNA', color: '#ffffff', bgColor: '#2d3748' },
      'ensul': { name: 'EN', color: '#ffffff', bgColor: '#805ad5' },
      'ende': { name: 'ENDE', color: '#ffffff', bgColor: '#d69e2e' },
      'epal': { name: 'EPAL', color: '#ffffff', bgColor: '#2b6cb0' },
      'refina': { name: 'RF', color: '#ffffff', bgColor: '#2d3748' },
      'eni': { name: 'ENI', color: '#ffffff', bgColor: '#e53e3e' },
      'chevron': { name: 'CV', color: '#ffffff', bgColor: '#2b6cb0' },
      'totalenergies': { name: 'TE', color: '#ffffff', bgColor: '#38a169' },
      'bp': { name: 'BP', color: '#ffffff', bgColor: '#38a169' },
      'endiama': { name: 'ED', color: '#ffffff', bgColor: '#805ad5' },
      'catoca': { name: 'CT', color: '#ffffff', bgColor: '#d69e2e' },
      'novonor': { name: 'NV', color: '#ffffff', bgColor: '#2d3748' },
      'ensa': { name: 'ENSA', color: '#ffffff', bgColor: '#2b6cb0' },
      'inapen': { name: 'IN', color: '#ffffff', bgColor: '#38a169' },
    };

    const config = logoConfigs[companySlug];
    if (!config) {
      return res.status(404).json({ error: 'Logo not found' });
    }

    const svg = `
      <svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <rect width="64" height="64" rx="8" fill="${config.bgColor}"/>
        <text x="32" y="38" font-family="Arial, sans-serif" font-size="12" font-weight="bold" 
              text-anchor="middle" fill="${config.color}">${config.name}</text>
      </svg>
    `;

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
    res.send(svg);
  });

  // Message API endpoints
  app.get("/api/messages", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Não autorizado" });
    }

    try {
      const userId = (req.user as any).id;
      const messages = await db.query.messages.findMany({
        where: (message, { eq, or }) => or(eq(message.fromUserId, userId), eq(message.toUserId, userId)),
        orderBy: (message, { desc }) => desc(message.createdAt),
        with: {
          fromUser: {
            with: {
              company: true,
              individual: true
            }
          },
          toUser: {
            with: {
              company: true,
              individual: true
            }
          }
        }
      });
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Erro ao buscar mensagens" });
    }
  });

  app.post("/api/messages", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Não autorizado" });
    }

    try {
      const userId = (req.user as any).id;
      const messageData = messageInsertSchema.parse({
        ...req.body,
        fromUserId: userId
      });

      const [newMessage] = await db.insert(messages).values(messageData).returning();
      res.status(201).json(newMessage);
    } catch (error) {
      console.error("Error creating message:", error);
      res.status(500).json({ message: "Erro ao criar mensagem" });
    }
  });

  app.patch("/api/messages/:id/read", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Não autorizado" });
    }

    try {
      const messageId = parseInt(req.params.id);
      const userId = (req.user as any).id;

      const [updatedMessage] = await db
        .update(messages)
        .set({ isRead: true, updatedAt: new Date() })
        .where(and(eq(messages.id, messageId), eq(messages.toUserId, userId)))
        .returning();

      if (!updatedMessage) {
        return res.status(404).json({ message: "Mensagem não encontrada" });
      }

      res.json(updatedMessage);
    } catch (error) {
      console.error("Error marking message as read:", error);
      res.status(500).json({ message: "Erro ao marcar mensagem como lida" });
    }
  });

  // Admin endpoints for messaging
  app.get("/api/admin/messages", isAdmin, async (req, res) => {
    try {
      const messages = await db.query.messages.findMany({
        orderBy: (message, { desc }) => desc(message.createdAt),
        with: {
          fromUser: {
            with: {
              company: true,
              individual: true
            }
          },
          toUser: {
            with: {
              company: true,
              individual: true
            }
          }
        }
      });
      res.json(messages);
    } catch (error) {
      console.error("Error fetching admin messages:", error);
      res.status(500).json({ message: "Erro ao buscar mensagens" });
    }
  });

  app.post("/api/admin/messages/send", isAdmin, async (req, res) => {
    try {
      const adminId = (req.user as any).id;
      const messageData = messageInsertSchema.parse({
        ...req.body,
        fromUserId: adminId
      });

      const [newMessage] = await db.insert(messages).values(messageData).returning();
      res.status(201).json(newMessage);
    } catch (error) {
      console.error("Error sending admin message:", error);
      res.status(500).json({ message: "Erro ao enviar mensagem" });
    }
  });

  // Keep-alive endpoint para evitar hibernação
  app.get("/api/keep-alive", keepAliveHandler);
  app.get("/health", keepAliveHandler);

  // ===== SISTEMA DE BACKUP E RESTAURAÇÃO =====
  
  // Criar backup completo de todo o sistema
  app.post("/api/admin/backup/create-full", isAdmin, async (req, res) => {
    try {
      const { description } = req.body;
      console.log("🗄️ Iniciando backup completo...");
      
      const backupPath = await backupService.createFullBackup(description);
      const stats = await stat(backupPath);
      
      console.log("✅ Backup completo criado com sucesso");
      res.json({
        success: true,
        message: "Backup completo criado com sucesso",
        filename: backupPath.split('/').pop(),
        size: stats.size,
        path: backupPath
      });
    } catch (error) {
      console.error("❌ Erro ao criar backup:", error);
      res.status(500).json({
        success: false,
        message: "Erro ao criar backup: " + error.message
      });
    }
  });

  // Criar backup específico (empresa, pessoa ou projeto)
  app.post("/api/admin/backup/create-specific", isAdmin, async (req, res) => {
    try {
      const { type, entityId } = req.body;
      
      if (!type || !entityId) {
        return res.status(400).json({
          success: false,
          message: "Tipo e ID da entidade são obrigatórios"
        });
      }

      if (!['company', 'individual', 'project'].includes(type)) {
        return res.status(400).json({
          success: false,
          message: "Tipo deve ser 'company', 'individual' ou 'project'"
        });
      }

      console.log(`🗄️ Iniciando backup específico: ${type} ID ${entityId}`);
      const backupPath = await backupService.createSpecificBackup(type, parseInt(entityId));
      const stats = await stat(backupPath);
      
      res.json({
        success: true,
        message: `Backup de ${type} criado com sucesso`,
        filename: backupPath.split('/').pop(),
        size: stats.size,
        path: backupPath
      });
    } catch (error) {
      console.error("❌ Erro ao criar backup específico:", error);
      res.status(500).json({
        success: false,
        message: "Erro ao criar backup: " + error.message
      });
    }
  });

  // Listar todos os backups disponíveis
  app.get("/api/admin/backup/list", isAdmin, async (req, res) => {
    try {
      const backups = await backupService.listBackups();
      res.json({
        success: true,
        backups: backups.map(backup => ({
          name: backup.name,
          size: backup.size,
          createdAt: backup.createdAt,
          sizeFormatted: formatFileSize(backup.size)
        }))
      });
    } catch (error) {
      console.error("❌ Erro ao listar backups:", error);
      res.status(500).json({
        success: false,
        message: "Erro ao listar backups: " + error.message
      });
    }
  });

  // Download de backup
  app.get("/api/admin/backup/download/:filename", isAdmin, async (req, res) => {
    try {
      const { filename } = req.params;
      const backups = await backupService.listBackups();
      const backup = backups.find(b => b.name === filename);
      
      if (!backup) {
        return res.status(404).json({
          success: false,
          message: "Backup não encontrado"
        });
      }

      const stats = await stat(backup.path);
      
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', stats.size);
      
      const readStream = createReadStream(backup.path);
      readStream.pipe(res);
      
      readStream.on('error', (error) => {
        console.error("❌ Erro ao fazer download do backup:", error);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: "Erro ao fazer download do backup"
          });
        }
      });

    } catch (error) {
      console.error("❌ Erro ao fazer download do backup:", error);
      res.status(500).json({
        success: false,
        message: "Erro ao fazer download do backup: " + error.message
      });
    }
  });

  // Upload e restauração de backup
  app.post("/api/admin/backup/restore", isAdmin, upload.single("backup"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Arquivo de backup é obrigatório"
        });
      }

      console.log("🔄 Iniciando restauração de backup...");
      const result = await backupService.restoreFromBackup(req.file.path);
      
      if (result.success) {
        console.log("✅ Backup restaurado com sucesso");
        res.json({
          success: true,
          message: result.message,
          restored: result.restored
        });
      } else {
        console.log("❌ Erro na restauração:", result.message);
        res.status(400).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      console.error("❌ Erro ao restaurar backup:", error);
      res.status(500).json({
        success: false,
        message: "Erro ao restaurar backup: " + error.message
      });
    }
  });



















  const httpServer = createServer(app);

  return httpServer;
}

import express, { type Request, Response, NextFunction } from "express";
import compression from "compression";
import { createServer } from "http";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { ensureDatabaseReady, startDatabaseHealthCheck } from "./database-init";
import { webSocketService } from "./websocket-service";
import { initializeRobustPersistence } from "./data-persistence";

import { preloadCache } from "./preload-cache";
import { instantProjectCache } from "./instant-project-cache";
import { startKeepAliveService } from "./keep-alive";

const app = express();

// Performance and security headers for external access
app.use((req, res, next) => {
  // CORS headers for cross-origin requests
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Performance headers
  res.header('X-DNS-Prefetch-Control', 'on');
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'SAMEORIGIN');
  
  // Connection keep-alive for better performance
  res.header('Connection', 'keep-alive');
  res.header('Keep-Alive', 'timeout=5, max=1000');
  
  next();
});

// Compression for faster loading with optimal settings
app.use(compression({
  level: 6, // Balanced compression
  threshold: 1024, // Only compress responses > 1KB
  filter: (req, res) => {
    // Always compress JSON and text
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// Enhanced JSON parsing with larger limits for robust data handling
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Verificar e garantir que o banco de dados esteja pronto
  log("🗄️ Inicializando banco de dados...");
  const databaseReady = await ensureDatabaseReady();
  
  if (!databaseReady) {
    log("❌ Falha na inicialização do banco de dados. O servidor será iniciado mesmo assim.");
  } else {
    // Iniciar monitoramento de saúde do banco de dados
    startDatabaseHealthCheck();
    
    // Inicializar sistema robusto de persistência
    log("🛡️ Inicializando sistema robusto de persistência...");
    try {
      await initializeRobustPersistence();
      log("✅ Sistema robusto de persistência inicializado com sucesso!");
    } catch (error) {
      log("⚠️ Aviso: Sistema robusto teve problemas na inicialização:", error);
    }
    
    // Inicializar cache instantâneo e pré-carregar dados essenciais
    setTimeout(async () => {
      await Promise.all([
        instantProjectCache.initialize(),
        preloadCache.preloadEssentialData()
      ]);
      preloadCache.startPeriodicRefresh();
      
      // Inicializar serviço keep-alive para evitar hibernação
      startKeepAliveService();
    }, 1000); // Aguarda 1 segundo após inicialização do banco
    

  }

  // Create HTTP server for WebSocket support
  const httpServer = createServer(app);
  
  // Initialize WebSocket service
  webSocketService.initialize(httpServer);
  
  await registerRoutes(app, webSocketService);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, httpServer);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  httpServer.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
    log(`🔌 WebSocket service available at ws://localhost:${port}/ws`);
  });
})();

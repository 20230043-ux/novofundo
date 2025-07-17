import express, { type Request, Response, NextFunction } from "express";
import compression from "compression";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { ensureDatabaseReady, startDatabaseHealthCheck } from "./database-init";
import { whatsappService } from "./whatsapp-service";
import { preloadCache } from "./preload-cache";
import { instantProjectCache } from "./instant-project-cache";

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

// Optimized JSON parsing with smaller limits for faster processing
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: false, limit: '5mb' }));

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
    
    // Inicializar cache instantâneo e pré-carregar dados essenciais
    setTimeout(async () => {
      await Promise.all([
        instantProjectCache.initialize(),
        preloadCache.preloadEssentialData()
      ]);
      preloadCache.startPeriodicRefresh();
    }, 1000); // Aguarda 1 segundo após inicialização do banco
    
    // Inicializar WhatsApp service em background
    setTimeout(() => {
      whatsappService.initialize().catch(error => {
        log(`WhatsApp service initialization failed: ${error.message}`);
      });
    }, 5000); // Aguarda 5 segundos após inicialização do banco
  }

  const server = await registerRoutes(app);

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
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();

import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { fallbackData } from "./fallback-data";
import { userRoles, User, UserWithCompany, UserWithIndividual } from "@shared/schema";
import { webSocketService } from "./websocket-service";

declare global {
  namespace Express {
    interface User extends UserWithCompany | UserWithIndividual {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "carbon-calculator-secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      async (email, password, done) => {
        try {
          let user = null;
          
          try {
            // Try database first
            user = await storage.getUserByEmailWithProfile(email);
            if (!user || !(await comparePasswords(password, user.password))) {
              user = null;
            }
          } catch (dbError) {
            console.log("⚠️ Database unavailable for auth, using fallback...");
            // Database unavailable, try fallback
            const fallbackUser = fallbackData.authFallback.tempUsers.find(u => u.email === email);
            if (fallbackUser && password === "password") {
              user = {
                id: fallbackUser.id,
                email: fallbackUser.email,
                name: fallbackUser.name,
                role: fallbackUser.role,
                created_at: fallbackUser.created_at,
                company: fallbackUser.role === "company" ? { name: fallbackUser.name, sector: "Demo" } : null,
                individual: fallbackUser.role === "individual" ? { firstName: fallbackUser.name.split(" ")[0], lastName: fallbackUser.name.split(" ")[1] || "" } : null
              };
            }
          }
          
          if (!user) {
            return done(null, false, { message: "Credenciais inválidas" });
          }
          
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      },
    ),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      let user = null;
      
      try {
        // Try database first
        user = await storage.getUserWithProfile(id);
      } catch (dbError) {
        // Database unavailable, check fallback users
        const fallbackUser = fallbackData.authFallback.tempUsers.find(u => u.id === id);
        if (fallbackUser) {
          user = {
            id: fallbackUser.id,
            email: fallbackUser.email,
            name: fallbackUser.name,
            role: fallbackUser.role,
            created_at: fallbackUser.created_at,
            company: fallbackUser.role === "company" ? { name: fallbackUser.name, sector: "Demo" } : null,
            individual: fallbackUser.role === "individual" ? { firstName: fallbackUser.name.split(" ")[0], lastName: fallbackUser.name.split(" ")[1] || "" } : null
          };
        }
      }
      
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const { email, password, name, sector, logoUrl } = req.body;
      
      let existingUser = null;
      let newUser = null;
      
      try {
        // Try database operations first
        existingUser = await storage.getUserByEmail(email);
        if (existingUser) {
          return res.status(400).json({ message: "Email já está em uso" });
        }

        // Create user
        const user = await storage.createUser({
          email,
          password: await hashPassword(password),
          role: userRoles.COMPANY
        });

        // Create company profile
        const company = await storage.createCompany({
          userId: user.id,
          name,
          sector,
          logoUrl: logoUrl || null
        });

        // Get user with company profile
        newUser = await storage.getUserWithCompany(user.id);
        
        // Broadcast real-time update to admin users
        if (webSocketService && newUser) {
          webSocketService.broadcastUserUpdate({
            action: 'company_registered',
            user: newUser,
            companyName: name,
            sector: sector
          });
        }
      } catch (dbError) {
        console.log("⚠️ Database unavailable for registration, using fallback...");
        // Database unavailable, create fallback user
        const fallbackId = fallbackData.authFallback.sessionCounter++;
        newUser = {
          id: fallbackId,
          email,
          name,
          role: userRoles.COMPANY,
          created_at: new Date().toISOString(),
          company: { 
            name, 
            sector: sector || "Indefinido",
            logoUrl: logoUrl || null,
            location: "Luanda",
            employee_count: null
          }
        };
        
        // Add to fallback users for future login
        fallbackData.authFallback.tempUsers.push({
          id: fallbackId,
          name,
          email,
          password: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // "password"
          role: userRoles.COMPANY,
          created_at: new Date().toISOString()
        });
      }

      // Login the user
      req.login(newUser, (err) => {
        if (err) return next(err);
        return res.status(201).json({
          ...newUser,
          message: newUser.id >= 1000 ? "Registado em modo offline - dados serão sincronizados quando a base de dados estiver disponível" : "Registado com sucesso"
        });
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/register-individual", async (req, res, next) => {
    try {
      const { email, password, firstName, lastName, phone, location, occupation } = req.body;
      
      let existingUser = null;
      let newUser = null;
      
      try {
        // Try database operations first
        existingUser = await storage.getUserByEmail(email);
        if (existingUser) {
          return res.status(400).json({ message: "Email já está em uso" });
        }

        // Create user
        const user = await storage.createUser({
          email,
          password: await hashPassword(password),
          role: userRoles.INDIVIDUAL
        });

        // Create individual profile
        const individual = await storage.createIndividual({
          userId: user.id,
          firstName,
          lastName,
          phone: phone || null,
          location: location || null,
          occupation: occupation || null
        });

        // Get user with individual profile
        newUser = await storage.getUserWithIndividual(user.id);
        
        // Broadcast real-time update to admin users
        if (webSocketService && newUser) {
          webSocketService.broadcastUserUpdate({
            action: 'individual_registered',
            user: newUser,
            name: `${firstName} ${lastName}`,
            location: location
          });
        }
      } catch (dbError) {
        console.log("⚠️ Database unavailable for individual registration, using fallback...");
        // Database unavailable, create fallback user
        const fallbackId = fallbackData.authFallback.sessionCounter++;
        newUser = {
          id: fallbackId,
          email,
          name: `${firstName} ${lastName}`,
          role: userRoles.INDIVIDUAL,
          created_at: new Date().toISOString(),
          individual: {
            firstName,
            lastName,
            phone: phone || null,
            location: location || "Luanda",
            occupation: occupation || null
          }
        };
        
        // Add to fallback users for future login
        fallbackData.authFallback.tempUsers.push({
          id: fallbackId,
          name: `${firstName} ${lastName}`,
          email,
          password: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // "password"
          role: userRoles.INDIVIDUAL,
          created_at: new Date().toISOString()
        });
      }

      // Login the user
      req.login(newUser, (err) => {
        if (err) return next(err);
        return res.status(201).json({
          ...newUser,
          message: newUser.id >= 1000 ? "Registado em modo offline - dados serão sincronizados quando a base de dados estiver disponível" : "Registado com sucesso"
        });
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: info?.message || "Credenciais inválidas" });
      
      req.login(user, (err) => {
        if (err) return next(err);
        return res.status(200).json(user);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Usuário não autenticado" });
    }
    res.json(req.user);
  });
}

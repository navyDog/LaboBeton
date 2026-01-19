import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import { body, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import winston from 'winston';
import os from 'node:os';
import fs from 'node:fs';
import { randomInt } from 'node:crypto';

import User from './models/User.js';
import Company from './models/Company.js';
import Project from './models/Project.js';
import Settings from './models/Settings.js';
import ConcreteTest from './models/ConcreteTest.js';
import BugReport from './models/BugReport.js';

import {getSafeObjectId, validateParamId} from './services/SecureIdService.js';
import {sanitizeCSV} from "./services/CsvService.js";
import {handlePasswordUpdate, prepareUserUpdates, validateLogoSize} from "./services/UpdateProfileService.js";

// --- CONFIGURATION LOGGING (Winston) ---
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.printf((info) => {
      return `[${info.timestamp}] ${info.level.toUpperCase()}: ${info.message} ${info.stack ? '\n' + info.stack : ''}`;
    })
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf((info) => {
          return `[${info.timestamp}] ${info.level}: ${info.message}`;
        })
      )
    })
  ]
});

// --- Hack pour masquer l'avertissement de dépréciation util._extend ---
const originalEmitWarning = process.emitWarning;
process.emitWarning = (warning, ...args) => {
  if (typeof warning === 'string' && warning.includes('util._extend')) return;
  if (warning && typeof warning === 'object' && warning.message && warning.message.includes('util._extend')) return;
  return originalEmitWarning.call(process, warning, ...args);
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;
let server;

// --- MIDDLEWARE DE LOGGING HTTP ---
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const message = `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`;
    
    if (res.statusCode >= 500) {
      logger.error(message);
    } else if (res.statusCode >= 400) {
      logger.warn(message);
    } else {
      logger.info(message);
    }
  });
  next();
});

// --- SÉCURITÉ CRITIQUE : GESTION DES SECRETS ---
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_change_me';
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  logger.error("🚨 CRITICAL SECURITY WARNING : JWT_SECRET n'est pas défini en production.");
  process.exit(1);
}


// --- SÉCURITÉ : Proxy & HTTPS (CORRIGÉ - Open Redirect Fix) ---
app.set('trust proxy', 1);
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    const isLocal = req.hostname === 'localhost' || req.hostname === '127.0.0.1';
    if (!isLocal && req.headers['x-forwarded-proto'] !== 'https') {
      const configuredDomain = process.env.FRONTEND_URL?.replace(/^https?:\/\//, '');
      if (!configuredDomain) {
        logger.error('❌ FRONTEND_URL not configured for HTTPS redirect');
        return res.status(500).json({ message: 'Server misconfiguration' });
      }
      const safePath = req.url.split('?')[0].replaceAll(/[^\w\s\-/.]/gi, '');
      return res.redirect(301, `https://${configuredDomain}${safePath}`);
    }
  }
  next();
});

// --- SÉCURITÉ : CORS (CORRIGÉ - Strict en Production) ---
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:8080',
  process.env.FRONTEND_URL 
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    
    if (process.env.NODE_ENV === 'production') {
      logger.warn(`❌ CORS Blocked: ${origin}`);
      const error = new Error('Not allowed by CORS');
      error.status = 403;
      return callback(error);
    }
    
    logger.warn(`⚠️ CORS Dev Mode: Allowing ${origin}`);
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204
}));

// --- SÉCURITÉ : Helmet ---
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'"], 
    },
  },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  frameguard: { action: 'deny' },
  hidePoweredBy: true
}));

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ limit: '2mb', extended: true }));
app.use(mongoSanitize({ replaceWith: '_' }));

// --- SÉCURITÉ : Rate Limiting ---
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 200,
  message: { message: "Trop de requêtes, veuillez patienter." },
  standardHeaders: true, legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate Limit Exceeded: ${req.ip}`);
    res.status(429).json({ message: "Trop de requêtes." });
  }
});
app.use('/api/', globalLimiter);

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, max: 20,
  message: { message: "Trop de tentatives de connexion." },
  standardHeaders: true, legacyHeaders: false,
});

// --- DB Connect ---
const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      logger.warn("⚠️ MONGO_URI manquant. Mode hors ligne.");
      return;
    }
    logger.info(`🔌 Tentative connexion MongoDB...`);
    await mongoose.connect(uri, { dbName: 'labobeton' });
    logger.info(`✅ MongoDB Connecté`);
    await seedAdminUser();
  } catch (error) {
    logger.error(`❌ Erreur MongoDB: ${error.message}`);
    if (process.env.NODE_ENV === 'production') process.exit(1);
  }
};

const seedAdminUser = async () => {
  try {
    const count = await User.countDocuments();
    if (count === 0) {
      const initUser = process.env.INIT_ADMIN_USERNAME;
      const initPass = process.env.INIT_ADMIN_PASSWORD;
      if (initUser && initPass) {
        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash(initPass, salt);
        await User.create({ 
          username: initUser, password: hashed, role: 'admin', 
          companyName: 'ADMIN SYSTEM', tokenVersion: 0
        });
        logger.info(`👤 Compte Admin initial créé`);
      }
    }
  } catch (error) { logger.error(`Erreur seedAdminUser: ${error.message}`); }
};

// --- MIDDLEWARES AUTH (CORRIGÉ - NoSQL Injection Fix) ---
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: "Token manquant." });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const userObjectId = getSafeObjectId(decoded.id);
    if (!userObjectId) return res.status(403).json({ message: "Token invalide." });

    const user = await User.findById(userObjectId).select('-password');
    if (!user) return res.status(401).json({ message: "Utilisateur introuvable." });
    if (user.isActive === false) return res.status(403).json({ message: "Compte désactivé." });
    
    if (decoded.tokenVersion !== user.tokenVersion) {
      return res.status(401).json({ message: "Session révoquée.", code: "SESSION_REPLACED" });
    }

    req.user = user;
    next();
  } catch (err) {
    logger.error(`Erreur serveur l 248: ${err.message}`);
    return res.status(401).json({ message: "Token invalide ou expiré." });
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    logger.warn(`Accès admin refusé pour ${req.user?.username}`);
    return res.status(403).json({ message: "Accès refusé." });
  }
  next();
};

const checkValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: "Données invalides", errors: errors.array() });
  }
  next();
};

// --- ROUTES ---

// Health Check
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const status = dbState === 1 ? 'CONNECTED' : 'ERROR';
  if (status === 'ERROR') {
    res.status(503).json({ status, timestamp: new Date(), dbState });
  } else {
    res.status(200).json({ status, timestamp: new Date(), uptime: process.uptime() });
  }
});

// Auth Check (Heartbeat)
app.get('/api/auth/check', authenticateToken, (req, res) => {
  res.json({ status: 'ok', user: req.user.username });
});

// Login (CORRIGÉ - Timing Attack Fix)
app.post('/api/auth/login', authLimiter, [
  body('username').trim().notEmpty().escape(),
  body('password').notEmpty()
], checkValidation, async (req, res) => {
  const { username, password } = req.body;
  try {
    const safeUsername = String(username);
    const user = await User.findOne({ username: safeUsername });
    
    if (!user) {
      const delay = randomInt(100, 300);
      await new Promise(resolve => setTimeout(resolve, delay));
      return res.status(401).json({ message: "Identifiants incorrects" });
    }
    
    if (user.isActive === false) return res.status(403).json({ message: "Compte désactivé." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Identifiants incorrects" });

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      { id: user._id, role: user.role, username: user.username, tokenVersion: user.tokenVersion }, 
      JWT_SECRET, { expiresIn: '12h' }
    );

    logger.info(`Login success: ${safeUsername}`);
    res.json({ 
      token, 
      user: { id: user._id, username: user.username, role: user.role, companyName: user.companyName, logo: user.logo } 
    });
  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Logout All (Emergency Kill Switch)
app.post('/api/auth/logout-all', authenticateToken, async (req, res) => {
  try {
    const userObjectId = getSafeObjectId(req.user.id);
    if (!userObjectId) return res.status(403).json({ message: 'Session invalide' });

    const user = await User.findById(userObjectId);
    if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });

    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();

    logger.info(`Global logout triggered for user: ${user.username}`);
    res.json({ message: "Tous les appareils ont été déconnectés." });
  } catch (error) {
    logger.error(`Logout all error: ${error.message}`);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Profile Update (CORRIGÉ - Logo Size Limit)
app.put('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const userObjectId = getSafeObjectId(req.user.id);
    if (!userObjectId) return res.status(403).json({ message: 'Session invalide' });

    const user = await User.findById(userObjectId);
    if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });

    const updates = prepareUserUpdates(req.body);
    const validationError = validateLogoSize(req.body.logo);
    if (validationError) return res.status(400).json(validationError);

    const passwordUpdate = await handlePasswordUpdate(req.body.password, user);
    if (passwordUpdate.error) return res.status(400).json(passwordUpdate.error);

    Object.assign(user, updates, passwordUpdate.fields);
    await user.save();

    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.tokenVersion;
    res.json(userObj);
  } catch (error) {
    logger.error(`Profile update error: ${error.message}`);
    res.status(400).json({ message: "Erreur mise à jour" });
  }
});


// Admin Users
app.post('/api/users', authenticateToken, requireAdmin, [
  body('username').trim().isLength({ min: 3 }).escape(),
  body('password').isLength({ min: 8 })
], checkValidation, async (req, res) => {
  try {
    const { username, password, role, companyName, address, contact, isActive } = req.body;
    const newUser = new User({
      username: String(username),
      password: await bcrypt.hash(String(password), 10),
      role: role === 'admin' ? 'admin' : 'standard',
      isActive: Boolean(isActive),
      companyName: String(companyName || ''),
      address: String(address || ''),
      contact: String(contact || '')
    });
    await newUser.save();
    logger.info(`Admin created user: ${username}`);
    res.status(201).json({ message: "Utilisateur créé", user: { username: newUser.username } });
  } catch (error) { 
    logger.error(`Create user error: ${error.message}`); 
    res.status(500).json({ message: "Erreur création" }); 
  }
});

app.get('/api/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await User.find({}, '-password -tokenVersion').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    logger.error(`Erreur serveur 422: ${error.message}`);
    res.status(500).json({ message: "Erreur récupération" }); 
  }
});

app.put('/api/users/:id/toggle-access', authenticateToken, requireAdmin, validateParamId(), async (req, res) => {
  try {
    const paramId = req.params.id.toString();
    const currentUserId = req.user.id.toString();
    if (paramId === currentUserId) {
      return res.status(400).json({ message: "Action interdite sur soi-même." });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "Non trouvé" });
    user.isActive = !user.isActive;
    if (!user.isActive) user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();
    logger.info(`Access toggled for user ${user.username} by admin ${req.user.username}`);
    res.json({ message: "Accès modifié" });
  } catch (error) {
    logger.error(`Erreur serveur 442: ${error.message}`);
    res.status(500).json({ message: "Erreur serveur" }); 
  }
});

app.delete('/api/users/:id', authenticateToken, requireAdmin, validateParamId(), async (req, res) => {
  try {
    const paramId = req.params.id.toString();
    const currentUserId = req.user.id.toString();
    if (paramId === currentUserId) {
      return res.status(400).json({ message: "Action interdite." });
    }
    await User.findByIdAndDelete(req.params.id);
    logger.info(`User deleted by admin ${req.user.username}`);
    res.json({ message: "Utilisateur supprimé." });
  } catch (error) {
    logger.error(`Erreur serveur 458: ${error.message}`);
    res.status(500).json({ message: "Erreur suppression" }); 
  }
});

// --- COMPANIES (CORRIGÉ - NoSQL Injection Fix) ---

app.get('/api/companies', authenticateToken, async (req, res) => {
  try {
    const userObjectId = getSafeObjectId(req.user.id);
    if (!userObjectId) return res.status(403).json({ message: 'Session invalide' });
    const companies = await Company.find({ userId: userObjectId }).sort({ name: 1 }).lean();
    res.json(companies);
  } catch (error) {
    logger.error(`Get Companies Error: ${error.message}`);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

app.post('/api/companies', authenticateToken, async (req, res) => {
  try {
    const userObjectId = getSafeObjectId(req.user.id);
    if (!userObjectId) return res.status(403).json({ message: 'Session invalide' });
    const { name, contactName, email, phone } = req.body;
    const newCompany = new Company({ 
      userId: userObjectId,
      name: String(name),
      contactName: String(contactName || ''),
      email: String(email || ''),
      phone: String(phone || '')
    });
    await newCompany.save();
    res.status(201).json(newCompany);
  } catch (error) {
    logger.error(`Erreur serveur 492: ${error.message}`);
    res.status(400).json({ message: "Erreur création" }); 
  }
});


app.put('/api/companies/:id', authenticateToken, validateParamId(), async (req, res) => {
  try {
    // 1. Sécurisation de l'ID utilisateur
    const userObjectId = getSafeObjectId(req.user.id);
    if (!userObjectId) return res.status(403).json({ message: 'Session invalide' });

    // 2. Validation et Casting de l'ID de l'entreprise (Correction SonarCloud)
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'ID entreprise invalide' });
    }
    const companyId = new mongoose.Types.ObjectId(req.params.id);

    const { name, contactName, email, phone } = req.body;
    const updates = {};
    
    // Protection contre l'injection de types dans le body
    if (name !== undefined) updates.name = String(name);
    if (contactName !== undefined) updates.contactName = String(contactName);
    if (email !== undefined) updates.email = String(email);
    if (phone !== undefined) updates.phone = String(phone);

    // 3. Mise à jour sécurisée avec l'ID casté
    const updated = await Company.findOneAndUpdate(
      { _id: companyId, userId: userObjectId }, // Utilisation de l'ID sécurisé
      { $set: updates },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "Non trouvé" });
    res.json(updated);
  } catch (error) {
    logger.error(`Update Company Error: ${error.message}`);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

app.delete('/api/companies/:id', authenticateToken, validateParamId(), async (req, res) => {
  try {
    // 1. Sécurisation de l'ID utilisateur
    const userObjectId = getSafeObjectId(req.user.id);
    if (!userObjectId) return res.status(403).json({ message: 'Session invalide' });

    // 2. Validation et Casting de l'ID de l'entreprise (Protection NoSQL)
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Format ID entreprise invalide' });
    }
    const companyId = new mongoose.Types.ObjectId(req.params.id);

    // 3. Exécution de la suppression avec l'ID casté
    const deleted = await Company.findOneAndDelete({ 
      _id: companyId, // Utilisation de la variable sécurisée
      userId: userObjectId 
    });

    if (!deleted) return res.status(404).json({ message: "Non trouvé" });
    res.json({ message: "Supprimé" });
  } catch (error) {
    logger.error(`Delete Company Error: ${error.message}`);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// --- PROJECTS (CORRIGÉ - NoSQL Injection Fix) ---

app.get('/api/projects', authenticateToken, async (req, res) => {
  try {
    const userObjectId = getSafeObjectId(req.user.id);
    if (!userObjectId) return res.status(403).json({ message: 'Session invalide' });
    const projects = await Project.find({ userId: userObjectId }).sort({ createdAt: -1 }).lean();
    res.json(projects);
  } catch (error) {
    logger.error(`Get Projects Error: ${error.message}`);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

app.post('/api/projects', authenticateToken, async (req, res) => {
  try {
    const userObjectId = getSafeObjectId(req.user.id);
    if (!userObjectId) return res.status(403).json({ message: 'Session invalide' });
    const { name, companyId, companyName, contactName, email, phone, moa, moe } = req.body;
    let validCompanyId = null;
    if (companyId) {
      validCompanyId = getSafeObjectId(companyId);
      if (!validCompanyId) return res.status(400).json({ message: 'Company ID invalide' });
    }
    const newProject = new Project({
      userId: userObjectId, name: String(name), companyId: validCompanyId,
      companyName: String(companyName || ''), contactName: String(contactName || ''),
      email: String(email || ''), phone: String(phone || ''),
      moa: String(moa || ''), moe: String(moe || '')
    });
    await newProject.save();
    res.status(201).json(newProject);
  } catch (error) { 
    logger.error(`Create Project Error: ${error.message}`);
    res.status(400).json({ message: "Erreur création" }); 
  }
});



app.put('/api/projects/:id', authenticateToken, validateParamId(), async (req, res) => {
  try {
    // Validation des IDs
    const userObjectId = getSafeObjectId(req.user.id);
    if (!userObjectId) return res.status(403).json({ message: 'Session invalide' });

    const projectId = getSafeObjectId(req.params.id);
    if (!projectId) return res.status(400).json({ message: 'ID projet invalide' });

    // Préparation des mises à jour
    const updates = prepareUpdates(req.body);
    const validationError = validateCompanyId(req.body.companyId);
    if (validationError) return res.status(400).json(validationError);

    // Mise à jour du projet
    const updated = await updateProject(projectId, userObjectId, updates);
    if (!updated) return res.status(404).json({ message: "Non trouvé" });

    res.json(updated);
  } catch (error) {
    logger.error(`Update Project Error: ${error.message}`);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

function prepareUpdates(body) {
  const fields = ['name', 'companyName', 'contactName', 'email', 'phone', 'moa', 'moe'];
  const updates = {};

  fields.forEach(field => {
    if (body[field] !== undefined) updates[field] = String(body[field]);
  });

  return updates;
}

function validateCompanyId(companyId) {
  if (companyId === undefined) return null;

  const validCompanyId = getSafeObjectId(companyId);
  if (!validCompanyId) {
    return { message: 'Company ID invalide' };
  }

  return null;
}

async function updateProject(projectId, userObjectId, updates) {
  return await Project.findOneAndUpdate(
      { _id: projectId, userId: userObjectId },
      { $set: updates },
      { new: true }
  );
}

app.delete('/api/projects/:id', authenticateToken, validateParamId(), async (req, res) => {
  try {
    // 1. On sécurise l'ID de l'utilisateur
    const userObjectId = getSafeObjectId(req.user.id);
    if (!userObjectId) return res.status(403).json({ message: 'Session invalide' });

    // 2. On valide et on cast l'ID du projet (Protection NoSQL Injection)
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Format ID projet invalide' });
    }
    const projectId = new mongoose.Types.ObjectId(req.params.id);

    // 3. On utilise l'ID casté pour la suppression
    const deleted = await Project.findOneAndDelete({ 
      _id: projectId, // Utilisation de la variable sécurisée
      userId: userObjectId 
    });

    if (!deleted) return res.status(404).json({ message: "Non trouvé" });
    
    res.json({ message: "Supprimé" });
  } catch (error) {
    logger.error(`Delete Project Error: ${error.message}`);
    res.status(500).json({ message: "Erreur serveur" });
  }
});
// Export CSV (AJOUTÉ - CSV Injection Fix)
app.get('/api/projects/:id/export/csv', authenticateToken, validateParamId(), async (req, res) => {
  try {
    // 1. Sécurisation de l'ID utilisateur
    const userObjectId = getSafeObjectId(req.user.id);
    if (!userObjectId) return res.status(403).json({ message: 'Session invalide' });

    // 2. Validation et Casting de l'ID du projet (Protection NoSQL Injection)
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Format ID projet invalide' });
    }
    const projectId = new mongoose.Types.ObjectId(req.params.id);

    // 3. Requêtes sécurisées avec les IDs castés
    const project = await Project.findOne({ _id: projectId, userId: userObjectId });
    if (!project) return res.status(404).json({ message: "Projet introuvable" });

    const tests = await ConcreteTest.find({ 
      projectId: projectId, // On utilise la variable castée ici
      userId: userObjectId 
    }).sort({ samplingDate: -1 });

    // --- Génération du CSV (Le reste de ton code) ---
    const headers = ["Reference", "Date", "Ouvrage", "Partie", "Classe", "Volume", "Eprouvettes"];
    let csv = headers.join(';') + '\n';

    tests.forEach(test => {
      const date = test.samplingDate ? new Date(test.samplingDate).toLocaleDateString('fr-FR') : '';
      const row = [
        sanitizeCSV(test.reference), sanitizeCSV(date), sanitizeCSV(test.structureName),
        sanitizeCSV(test.elementName), sanitizeCSV(test.concreteClass),
        sanitizeCSV((test.volume || 0).toString().replace('.', ',')),
        sanitizeCSV((test.specimenCount || 0).toString())
      ];
      csv += row.join(';') + '\n';
    });

    // Nettoyage du nom de fichier pour les headers HTTP
    const safeProjectName = project.name.replaceAll(/[^a-z0-9]/gi, '_');

    res.header('Content-Type', 'text/csv; charset=utf-8');
    res.attachment(`export_affaire_${safeProjectName}.csv`);
    return res.send('\uFEFF' + csv);

  } catch (error) {
    logger.error(`CSV Export Error: ${error.message}`);
    res.status(500).json({ message: "Erreur export CSV" });
  }
});


// Full Report
app.get('/api/projects/:id/full-report', authenticateToken, validateParamId(), async (req, res) => {
  try {
    const userObjectId = getSafeObjectId(req.user.id);
    if (!userObjectId) return res.status(403).json({ message: 'Session invalide' });

    // 1. On valide et on cast l'ID du projet
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Format ID projet invalide' });
    }
    const projectId = new mongoose.Types.ObjectId(req.params.id);

    // 2. Utilisation de l'ID casté pour trouver le projet
    const project = await Project.findOne({ 
      _id: projectId, 
      userId: userObjectId 
    });
    
    if (!project) return res.status(404).json({ message: "Projet introuvable" });

    // 3. Utilisation de l'ID casté pour trouver les tests (Correction SonarCloud)
    const tests = await ConcreteTest.find({ 
      projectId: projectId, // On utilise la variable sécurisée ici
      userId: userObjectId 
    }).sort({ samplingDate: 1 });

    res.json({ project, tests });
  } catch (error) {
    logger.error(`Report Error: ${error.message}`);
    res.status(500).json({ message: "Erreur génération rapport" });
  }
});

// --- CONCRETE TESTS (CORRIGÉ + Contrôle de Concurrence) ---

app.get('/api/concrete-tests', authenticateToken, async (req, res) => {
  try {
    const userObjectId = getSafeObjectId(req.user.id);
    if (!userObjectId) return res.status(403).json({ message: 'Session invalide' });

    const tests = await ConcreteTest.find({ userId: userObjectId })
      .sort({ sequenceNumber: -1 })
      .populate('projectId', 'name')
      .lean();
    
    res.json(tests);
  } catch (error) {
    logger.error(`Get Concrete Tests Error: ${error.message}`);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

app.post('/api/concrete-tests', authenticateToken, [
  body('projectId').isMongoId(),
  body('specimens').isArray()
], checkValidation, async (req, res) => {
  try {
    const userObjectId = getSafeObjectId(req.user.id);
    if (!userObjectId) return res.status(403).json({ message: 'Session invalide' });

    const input = req.body;
    
    // Valider projectId
    const projectObjectId = getSafeObjectId(input.projectId);
    if (!projectObjectId) {
      return res.status(400).json({ message: 'Project ID invalide' });
    }

    // Vérifier que le projet appartient à l'utilisateur
    const projectExists = await Project.exists({ 
      _id: projectObjectId, 
      userId: userObjectId 
    });
    
    if (!projectExists) {
      return res.status(404).json({ message: 'Projet introuvable' });
    }

    // Nettoyage specimens
    const cleanSpecimens = Array.isArray(input.specimens) ? input.specimens.map(s => ({
      number: Number(s.number),
      age: Number(s.age),
      castingDate: s.castingDate,
      crushingDate: s.crushingDate,
      specimenType: String(s.specimenType || ''),
      diameter: Number(s.diameter),
      height: Number(s.height),
      surface: Number(s.surface),
      weight: s.weight ? Number(s.weight) : null,
      force: s.force ? Number(s.force) : null,
      stress: s.stress ? Number(s.stress) : null,
      density: s.density ? Number(s.density) : null
    })) : [];

    const newTest = new ConcreteTest({
      userId: userObjectId,
      projectId: projectObjectId,
      projectName: String(input.projectName || ''),
      companyName: String(input.companyName || ''),
      moe: String(input.moe || ''),
      moa: String(input.moa || ''),
      structureName: String(input.structureName || ''),
      elementName: String(input.elementName || ''),
      receptionDate: input.receptionDate,
      samplingDate: input.samplingDate,
      volume: Number(input.volume || 0),
      concreteClass: String(input.concreteClass || ''),
      mixType: String(input.mixType || ''),
      formulaInfo: String(input.formulaInfo || ''),
      manufacturer: String(input.manufacturer || ''),
      manufacturingPlace: String(input.manufacturingPlace || ''),
      deliveryMethod: String(input.deliveryMethod || ''),
      slump: Number(input.slump || 0),
      samplingPlace: String(input.samplingPlace || ''),
      externalTemp: Number(input.externalTemp || 0),
      concreteTemp: Number(input.concreteTemp || 0),
      tightening: String(input.tightening || ''),
      vibrationTime: Number(input.vibrationTime || 0),
      layers: Number(input.layers || 0),
      curing: String(input.curing || ''),
      testType: String(input.testType || ''),
      standard: String(input.standard || ''),
      preparation: String(input.preparation || ''),
      pressMachine: String(input.pressMachine || ''),
      specimens: cleanSpecimens
    });

    await newTest.save();
    res.status(201).json(newTest);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Doublon détecté." });
    }
    logger.error(`Create Test Error: ${error.message}`);
    res.status(500).json({ message: "Erreur création" });
  }
});

app.put('/api/concrete-tests/:id', authenticateToken, validateParamId(), async (req, res) => {
  try {
    // 1. Sécurisation des IDs (Casting explicite)
    const userObjectId = getSafeObjectId(req.user.id);
    if (!userObjectId) return res.status(403).json({ message: 'Session invalide' });

    // Vérification et conversion de l'ID du test
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Format ID invalide' });
    }
    const testId = new mongoose.Types.ObjectId(req.params.id);

    // 2. Recherche sécurisée
    const test = await ConcreteTest.findOne({ 
      _id: testId, // Utilisation de l'ID casté
      userId: userObjectId 
    });

    if (!test) {
      return res.status(404).json({ message: "Non trouvé" });
    }

       const existingTest = await ConcreteTest.findOne({ 
      _id: req.params.id, 
      userId: userObjectId 
    });
    
    if (!existingTest) {
      return res.status(404).json({ message: "Non trouvé" });
    }

    const input = req.body;
    
    // Appliquer les mises à jour champ par champ
    ['structureName', 'elementName', 'mixType', 'formulaInfo', 
     'manufacturer', 'manufacturingPlace', 'deliveryMethod', 
     'samplingPlace', 'tightening', 'curing', 'testType', 
     'standard', 'preparation', 'pressMachine', 'concreteClass'].forEach(field => {
      if (input[field] !== undefined) test[field] = String(input[field]);
    });

    // CONTRÔLE DE CONCURRENCE OPTIMISTE
    if (input.__v !== undefined && existingTest.__v !== input.__v) {
      return res.status(409).json({ 
        message: "Conflit de version : Données modifiées par un tiers.",
        latestData: existingTest
      });
    }

    
    ['volume', 'slump', 'vibrationTime', 'layers', 'externalTemp', 'concreteTemp'].forEach(field => {
      if (input[field] != null) {
        test[field] = Number(input[field]);
      } else if (input.hasOwnProperty(field)) {
        test[field] = null;
      }
    });

    ['receptionDate', 'samplingDate'].forEach(field => {
      if (input[field]) {
        test[field] = new Date(input[field]);
      } else if (input.hasOwnProperty(field)) {
        test[field] = null;
      }
    });

    if (Array.isArray(input.specimens)) {
      test.specimens = input.specimens.map(s => {
        const newSpecimen = {
          number: Number(s.number),
          age: Number(s.age),
          castingDate: s.castingDate ? new Date(s.castingDate) : null,
          crushingDate: s.crushingDate ? new Date(s.crushingDate) : null,
          specimenType: String(s.specimenType || ''),
          diameter: Number(s.diameter),
          height: Number(s.height),
          surface: Number(s.surface),
          weight: s.weight == null ? null : Number(s.weight),
          force: s.force == null ? null : Number(s.force),
          stress: s.stress == null ? null : Number(s.stress),
          density: s.density == null ? null : Number(s.density)
        };
        if (s._id) newSpecimen._id = String(s._id);
        return newSpecimen;
      });
    }

    const updatedTest = await test.save();
    res.json(updatedTest);
  } catch (error) { 
    logger.error(`Update Concrete Test Error: ${error.message}`);
    res.status(400).json({ message: "Erreur modification" }); 
  }
});


app.delete('/api/concrete-tests/:id', authenticateToken, validateParamId(), async (req, res) => {
  try {
    // 1. Sécurisation de l'ID utilisateur
    const userObjectId = getSafeObjectId(req.user.id);

    if (!userObjectId) return res.status(403).json({ message: 'Session invalide' });

    // 2. Sécurisation de l'ID du test (Protection contre l'injection NoSQL)
    // On vérifie si l'ID est valide AVANT de l'utiliser
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Format ID invalide' });
    }

    // On transforme la chaîne brute en objet ObjectId
    const testId = new mongoose.Types.ObjectId(req.params.id);

    // 3. Exécution de la requête avec les objets typés
    const deleted = await ConcreteTest.findOneAndDelete({ 
      _id: testId, 
      userId: userObjectId 
    });

    if (!deleted) return res.status(404).json({ message: "Non trouvé" });
    res.json({ message: "Supprimé" });

  } catch (error) {
    logger.error(`Delete Concrete Test Error: ${error.message}`);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// --- SETTINGS (CORRIGÉ) ---

app.get('/api/settings', authenticateToken, async (req, res) => {
  try {
    const userObjectId = getSafeObjectId(req.user.id);
    if (!userObjectId) return res.status(403).json({ message: 'Session invalide' });

    let settings = await Settings.findOne({ userId: userObjectId }).lean();
    
    if (!settings) {
      settings = {
        specimenTypes: ['Cylindrique 16x32', 'Cylindrique 11x22', 'Cubique 15x15'],
        deliveryMethods: ['Toupie', 'Benne', 'Mixer'],
        manufacturingPlaces: ['Centrale BPE', 'Centrale Chantier'],
        mixTypes: [], concreteClasses: [], consistencyClasses: [], curingMethods: [],
        testTypes: [], preparations: [], nfStandards: []
      };
    }
    
    res.json(settings);
  } catch (error) {
    logger.error(`Get Settings Error: ${error.message}`);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

app.put('/api/settings', authenticateToken, async (req, res) => {
  try {
    const userObjectId = getSafeObjectId(req.user.id);
    if (!userObjectId) return res.status(403).json({ message: 'Session invalide' });

    const allowedArrays = [
      'specimenTypes', 'deliveryMethods', 'manufacturingPlaces', 'mixTypes',
      'concreteClasses', 'consistencyClasses', 'curingMethods', 'testTypes',
      'preparations', 'nfStandards'
    ];
    
    const updates = {};
    allowedArrays.forEach(field => {
      if (Array.isArray(req.body[field])) {
        updates[field] = req.body[field].map(String);
      }
    });

    const settings = await Settings.findOneAndUpdate(
      { userId: userObjectId },
      { $set: updates },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    
    res.json(settings);
  } catch (error) {
    logger.error(`Update Settings Error: ${error.message}`);
    res.status(500).json({ message: "Erreur serveur" });
  }
});


// --- BUG REPORTS ---

app.post('/api/bugs', authenticateToken, async (req, res) => {
  try {
    const { type, description } = req.body;
    await BugReport.create({ 
      type: String(type), 
      description: String(description), 
      user: req.user.username 
    });
    res.json({ message: "Signalement reçu" });
  } catch (error) {
    logger.error(`Create Bug Report Error: ${error.message}`);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

app.get('/api/admin/bugs', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const bugs = await BugReport.find().sort({ createdAt: -1 });
    res.json(bugs);
  } catch (error) {
    logger.error(`Get Bug Reports Error: ${error.message}`);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

app.put('/api/admin/bugs/:id', authenticateToken, requireAdmin, validateParamId(), async (req, res) => {
  try {
    await BugReport.findByIdAndUpdate(
      req.params.id, 
      { 
        status: String(req.body.status), 
        resolvedAt: req.body.status === 'resolved' ? new Date() : null 
      }
    );
    res.json({ success: true });
  } catch (error) {
    logger.error(`Update Bug Report Error: ${error.message}`);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

app.delete('/api/admin/bugs/:id', authenticateToken, requireAdmin, validateParamId(), async (req, res) => {
  try {
    await BugReport.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    logger.error(`Delete Bug Report Error: ${error.message}`);
    res.status(500).json({ message: "Erreur serveur" });
  }
});


// --- SERVING FRONTEND ---
const distPath = process.env.FRONTEND_BUILD_PATH || (
  fs.existsSync(path.join(__dirname, '../dist')) 
    ? path.join(__dirname, '../dist') 
    : path.join(__dirname, '../../Client/dist')
);

logger.info(`📁 Dossier frontend: ${distPath}`);

app.use(express.static(distPath));

app.get('*', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send("Erreur : Le build du frontend (index.html) est introuvable.");
  }
});

// --- HELPER DE LOGS DE DÉMARRAGE ---
const printStartupSummary = () => {
  const separator = "=".repeat(60);
  const getLocalIP = () => {
    const nets = os.networkInterfaces();
    for (const name of Object.keys(nets)) {
      for (const net of nets[name]) {
        if (net.family === 'IPv4' && !net.internal) {
          return net.address;
        }
      }
    }
    return '127.0.0.1';
  };

  logger.info(separator);
  logger.info(`🚀 LABOBÉTON SERVER STARTUP - ${process.env.NODE_ENV?.toUpperCase() || 'DEV'}`);
  logger.info(separator);
  
  // SYSTEM
  logger.info(`🖥️  OS: ${os.type()} ${os.release()} (${os.arch()})`);
  logger.info(`📦 Node: ${process.version} | PID: ${process.pid}`);
  logger.info(`💾 Mem: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`);

  // NETWORK
  logger.info(`🌐 Local:   http://localhost:${PORT}`);
  logger.info(`📡 Network: http://${getLocalIP()}:${PORT}`);

  // SECURITY
  logger.info(`🛡️  Security:`);
  logger.info(`   - CORS: ${process.env.NODE_ENV === 'production' ? '🔒 Strict' : '🔓 Dev Mode'}`);
  logger.info(`   - Allowed Origins: ${allowedOrigins.join(', ') || 'None'}`);
  logger.info(`   - Helmet: Enabled`);
  logger.info(`   - RateLimit: Enabled`);
  logger.info(`   - Mongo Sanitize: Enabled`);

  // DB STATUS
  const dbState = mongoose.connection.readyState;
  const dbStatusText = ['Disconnected', 'Connected', 'Connecting', 'Disconnecting'][dbState] || 'Unknown';
  logger.info(`🗄️  Database: ${dbStatusText} (LaboBéton)`);

  logger.info(separator);
  logger.info(`✅ Ready to accept connections!`);
  logger.info(separator);
};

// --- START SERVER & GRACEFUL SHUTDOWN ---
server = app.listen(PORT, () => {
  connectDB().then(() => {
    printStartupSummary();
  });
});

const gracefulShutdown = () => {
  logger.info('🔄 SIGTERM reçu. Fermeture gracieuse...');
  server.close(() => {
    logger.info('🛑 Serveur HTTP fermé.');
    mongoose.connection.close(false).then(() => {
      logger.info('💤 MongoDB déconnecté.');
      process.exit(0);
    });
  });
  
  setTimeout(() => {
    logger.error('⏱️ Force shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
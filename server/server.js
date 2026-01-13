import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import { body, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import winston from 'winston';
import os from 'os';
import fs from 'fs';


import User from './models/User.js';
import Company from './models/Company.js';
import Project from './models/Project.js';
import Settings from './models/Settings.js';
import ConcreteTest from './models/ConcreteTest.js';
import BugReport from './models/BugReport.js';

// --- CONFIGURATION LOGGING (Winston) ---
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'HH:mm:ss' }),
    winston.format.printf(({ level, message, timestamp }) => {
      // Format plus lisible pour la console
      return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console()
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
let server; // Référence pour le Graceful Shutdown

// --- SÉCURITÉ CRITIQUE : GESTION DES SECRETS ---
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_change_me';
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  logger.error("🚨 CRITICAL SECURITY WARNING : JWT_SECRET n'est pas défini en production.");
  process.exit(1); // Arrêt forcé en prod si pas de secret
}

// --- SÉCURITÉ : Proxy & HTTPS ---
app.set('trust proxy', 1);
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    const isLocal = req.hostname === 'localhost' || req.hostname === '127.0.0.1';
    if (!isLocal && req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(`https://${req.headers.host}${req.url}`);
    }
  }
  next();
});

// --- SÉCURITÉ : CORS ---
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:8080',
  process.env.FRONTEND_URL 
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1 && process.env.NODE_ENV === 'production') {
      return callback(null, true); 
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
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

// --- SÉCURITÉ : Body Parsers ---
app.use(express.json({ limit: '2mb' })); // Limite réduite pour éviter DoS
app.use(express.urlencoded({ limit: '2mb', extended: true }));

// --- SÉCURITÉ : Anti-Injection NoSQL ---
app.use(mongoSanitize({ replaceWith: '_' }));

// --- SÉCURITÉ : Rate Limiting Differencié ---

// 1. Limiteur Global API
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 200, // Un peu plus large pour les appels API légitimes
  message: { message: "Trop de requêtes, veuillez patienter." },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate Limit Exceeded: ${req.ip}`);
    res.status(429).json({ message: "Trop de requêtes." });
  }
});
app.use('/api/', globalLimiter);

// 2. Limiteur Auth (Strict)
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, 
  max: 10, // Très strict pour login/register
  message: { message: "Trop de tentatives de connexion. Réessayez dans 1 heure." },
  standardHeaders: true,
  legacyHeaders: false,
});

// --- DB Connect ---
const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
        logger.warn("⚠️ MONGO_URI manquant. Mode hors ligne.");
        return;
    }
    
    // Masked URI for logs
    const maskedUri = uri.replace(/:([^:@]+)@/, ':****@');
    logger.info(`🔌 Tentative connexion MongoDB...`);

    await mongoose.connect(uri, { dbName: 'labobeton' });
    logger.info(`✅ MongoDB Connecté`);
    await seedAdminUser();
  } catch (error) {
    logger.error(`❌ Erreur MongoDB: ${error.message}`);
    process.exit(1);
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
          username: initUser, 
          password: hashed, 
          role: 'admin', 
          companyName: 'ADMIN SYSTEM',
          tokenVersion: 0
        });
        logger.info(`👤 Compte Admin initial créé.`);
      }
    }
  } catch (error) { logger.error("Erreur seedAdminUser", error); }
};

// --- MIDDLEWARES AUTH ---
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: "Token manquant." });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // Validation IDOR: on s'assure que l'ID est valide
    if (!mongoose.Types.ObjectId.isValid(decoded.id)) {
        return res.status(403).json({ message: "Token invalide." });
    }

    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(401).json({ message: "Utilisateur introuvable." });
    if (user.isActive === false) return res.status(403).json({ message: "Compte désactivé." });
    
    if (decoded.tokenVersion !== user.tokenVersion) {
      return res.status(401).json({ message: "Session expirée." });
    }

    req.user = user;
    next();
  } catch (err) {
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
  if (!errors.isEmpty()) return res.status(400).json({ message: "Données invalides", errors: errors.array() });
  next();
};

// --- ROUTES ---

// Health Check Robuste
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const status = dbState === 1 ? 'CONNECTED' : 'ERROR';
  
  if (status === 'ERROR') {
      res.status(503).json({ status, timestamp: new Date(), dbState });
  } else {
      res.status(200).json({ status, timestamp: new Date(), uptime: process.uptime() });
  }
});

// Login
app.post('/api/auth/login', authLimiter, [
  body('username').trim().notEmpty().escape(),
  body('password').notEmpty()
], checkValidation, async (req, res) => {
  const { username, password } = req.body;
  try {
    const safeUsername = String(username); // Force type string
    const user = await User.findOne({ username: safeUsername });
    
    // Protection contre Time-Based Enumeration (simple)
    if (!user) {
        await new Promise(resolve => setTimeout(resolve, 200)); 
        return res.status(401).json({ message: "Identifiants incorrects" });
    }
    
    if (user.isActive === false) return res.status(403).json({ message: "Compte désactivé." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Identifiants incorrects" });

    user.tokenVersion = (user.tokenVersion || 0) + 1;
    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      { id: user._id, role: user.role, username: user.username, tokenVersion: user.tokenVersion }, 
      JWT_SECRET, 
      { expiresIn: '12h' }
    );

    logger.info(`Login success: ${safeUsername}`);
    res.json({ token, user: { id: user._id, username: user.username, role: user.role, companyName: user.companyName, logo: user.logo } });
  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Profile Update
app.put('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    // Whitelisting strict des champs
    const { companyName, address, contact, password, siret, apeCode, legalInfo, logo } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });

    // Assignation explicite avec Type Casting (Nettoyage)
    if (companyName !== undefined) user.companyName = String(companyName).substring(0, 100);
    if (address !== undefined) user.address = String(address).substring(0, 300);
    if (contact !== undefined) user.contact = String(contact).substring(0, 100);
    if (siret !== undefined) user.siret = String(siret).substring(0, 50);
    if (apeCode !== undefined) user.apeCode = String(apeCode).substring(0, 20);
    if (legalInfo !== undefined) user.legalInfo = String(legalInfo).substring(0, 200);
    // Pour le logo (Base64), on vérifie juste que c'est une string, la limite de taille est gérée par express.json limit
    if (logo !== undefined) user.logo = String(logo);

    if (password && String(password).trim() !== "") {
      const pwd = String(password);
      if (pwd.length < 8) return res.status(400).json({ message: "Mot de passe trop court." });
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(pwd, salt);
      user.tokenVersion = (user.tokenVersion || 0) + 1;
    }

    await user.save();
    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.tokenVersion;
    res.json(userObj);
  } catch (error) { logger.error(error); res.status(400).json({ message: "Erreur mise à jour" }); }
});

// Admin Users Create
app.post('/api/users', authenticateToken, requireAdmin, [
    body('username').trim().isLength({ min: 3 }).escape(),
    body('password').isLength({ min: 8 })
], checkValidation, async (req, res) => {
  try {
    const { username, password, role, companyName, address, contact, isActive } = req.body;
    
    // Whitelisting
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
  } catch (error) { logger.error(error); res.status(500).json({ message: "Erreur création" }); }
});

app.get('/api/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await User.find({}, '-password -tokenVersion').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) { res.status(500).json({ message: "Erreur récupération" }); }
});

app.put('/api/users/:id/toggle-access', authenticateToken, requireAdmin, async (req, res) => {
    try {
        if (req.params.id === req.user.id) return res.status(400).json({ message: "Action interdite sur soi-même." });
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: "Non trouvé" });
        user.isActive = !user.isActive;
        if (!user.isActive) user.tokenVersion = (user.tokenVersion || 0) + 1;
        await user.save();
        res.json({ message: "Accès modifié" });
    } catch (error) { res.status(500).json({message: "Erreur serveur"}); }
});

app.delete('/api/users/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        if (req.params.id === req.user.id) return res.status(400).json({ message: "Action interdite." });
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: "Utilisateur supprimé." });
    } catch (error) { res.status(500).json({ message: "Erreur suppression" }); }
});

// --- MODULES METIERS (Whitelisting Strict) ---

// Companies
app.get('/api/companies', authenticateToken, async (req, res) => {
  const companies = await Company.find({ userId: req.user.id }).sort({ name: 1 }).lean();
  res.json(companies);
});

app.post('/api/companies', authenticateToken, async (req, res) => {
  try {
    // Whitelisting explicite
    const { name, contactName, email, phone } = req.body;
    const newCompany = new Company({ 
        userId: req.user.id, // IDOR Protection
        name: String(name),
        contactName: String(contactName || ''),
        email: String(email || ''),
        phone: String(phone || '')
    });
    await newCompany.save();
    res.status(201).json(newCompany);
  } catch (error) { res.status(400).json({ message: "Erreur création" }); }
});

app.put('/api/companies/:id', authenticateToken, async (req, res) => {
    const { name, contactName, email, phone } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = String(name);
    if (contactName !== undefined) updates.contactName = String(contactName);
    if (email !== undefined) updates.email = String(email);
    if (phone !== undefined) updates.phone = String(phone);

    const updated = await Company.findOneAndUpdate(
        { _id: req.params.id, userId: req.user.id }, // IDOR Protection
        { $set: updates },
        { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Non trouvé" });
    res.json(updated);
});

app.delete('/api/companies/:id', authenticateToken, async (req, res) => {
    const deleted = await Company.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!deleted) return res.status(404).json({ message: "Non trouvé" });
    res.json({ message: "Supprimé" });
});

// Projects
app.get('/api/projects', authenticateToken, async (req, res) => {
  const projects = await Project.find({ userId: req.user.id }).sort({ createdAt: -1 }).lean();
  res.json(projects);
});

app.post('/api/projects', authenticateToken, async (req, res) => {
  try {
    const { name, companyId, companyName, contactName, email, phone, moa, moe } = req.body;
    const newProject = new Project({
        userId: req.user.id,
        name: String(name),
        companyId: companyId ? String(companyId) : null,
        companyName: String(companyName || ''),
        contactName: String(contactName || ''),
        email: String(email || ''),
        phone: String(phone || ''),
        moa: String(moa || ''),
        moe: String(moe || '')
    });
    await newProject.save();
    res.status(201).json(newProject);
  } catch (error) { res.status(400).json({ message: "Erreur création" }); }
});

app.put('/api/projects/:id', authenticateToken, async (req, res) => {
    const { name, companyId, companyName, contactName, email, phone, moa, moe } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = String(name);
    if (companyId !== undefined) updates.companyId = String(companyId);
    if (companyName !== undefined) updates.companyName = String(companyName);
    if (contactName !== undefined) updates.contactName = String(contactName);
    if (email !== undefined) updates.email = String(email);
    if (phone !== undefined) updates.phone = String(phone);
    if (moa !== undefined) updates.moa = String(moa);
    if (moe !== undefined) updates.moe = String(moe);

    const updated = await Project.findOneAndUpdate(
        { _id: req.params.id, userId: req.user.id },
        { $set: updates },
        { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Non trouvé" });
    res.json(updated);
});

app.delete('/api/projects/:id', authenticateToken, async (req, res) => {
    const deleted = await Project.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!deleted) return res.status(404).json({ message: "Non trouvé" });
    res.json({ message: "Supprimé" });
});

app.get('/api/projects/:id/export/csv', authenticateToken, async (req, res) => {
    try {
        const project = await Project.findOne({ _id: req.params.id, userId: req.user.id });
        if (!project) return res.status(404).json({ message: "Projet introuvable" });

        const tests = await ConcreteTest.find({ projectId: req.params.id, userId: req.user.id }).sort({ samplingDate: -1 });

        // Simple CSV generation
        const headers = ["Reference", "Date", "Ouvrage", "Partie", "Classe", "Volume", "Eprouvettes"];
        let csv = headers.join(';') + '\n';

        tests.forEach(test => {
            const date = test.samplingDate ? new Date(test.samplingDate).toLocaleDateString('fr-FR') : '';
            const row = [
                test.reference || '',
                date,
                (test.structureName || '').replace(/;/g, ','),
                (test.elementName || '').replace(/;/g, ','),
                test.concreteClass || '',
                (test.volume || 0).toString().replace('.', ','),
                (test.specimenCount || 0).toString()
            ];
            csv += row.join(';') + '\n';
        });

        res.header('Content-Type', 'text/csv');
        res.attachment(`export_affaire_${project.name.replace(/\s/g, '_')}.csv`);
        return res.send(csv);

    } catch (error) {
        logger.error(`CSV Export Error: ${error.message}`);
        res.status(500).json({ message: "Erreur export CSV" });
    }
});

app.get('/api/projects/:id/full-report', authenticateToken, async (req, res) => {
    try {
        const project = await Project.findOne({ _id: req.params.id, userId: req.user.id });
        if (!project) return res.status(404).json({ message: "Projet introuvable" });

        const tests = await ConcreteTest.find({ projectId: req.params.id, userId: req.user.id }).sort({ samplingDate: 1 });
        
        // Retourne le JSON attendu par le composant GlobalProjectReport
        res.json({ project, tests });
    } catch (error) {
        logger.error(`Report Error: ${error.message}`);
        res.status(500).json({ message: "Erreur génération rapport" });
    }
});

// Concrete Tests (Le plus critique pour le Mass Assignment)
app.get('/api/concrete-tests', authenticateToken, async (req, res) => {
  const tests = await ConcreteTest.find({ userId: req.user.id })
    .sort({ sequenceNumber: -1 })
    .populate('projectId', 'name')
    .lean();
  res.json(tests);
});

app.post('/api/concrete-tests', authenticateToken, [
  body('projectId').isMongoId(),
  body('specimens').isArray()
], checkValidation, async (req, res) => {
  try {
    // Construction explicite pour éviter l'injection de sequenceNumber, reference, year
    const input = req.body;
    
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
      userId: req.user.id,
      projectId: String(input.projectId),
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
    if (error.code === 11000) return res.status(400).json({ message: "Doublon détecté." });
    logger.error(`Create Test Error: ${error.message}`);
    res.status(500).json({ message: "Erreur création" });
  }
});

app.put('/api/concrete-tests/:id', authenticateToken, async (req, res) => {
  try {
    const input = req.body;
    
    // Whitelist des champs modifiables UNIQUEMENT
    const allowedFields = [
        'structureName', 'elementName', 'receptionDate', 'samplingDate',
        'volume', 'concreteClass', 'mixType', 'formulaInfo', 
        'manufacturer', 'manufacturingPlace', 'deliveryMethod',
        'slump', 'samplingPlace', 'tightening', 'vibrationTime',
        'layers', 'curing', 'testType', 'standard', 'preparation',
        'pressMachine', 'externalTemp', 'concreteTemp'
    ];

    const updates = {};
    allowedFields.forEach(field => {
        if (input[field] !== undefined) updates[field] = input[field];
    });

    // Gestion spécifique des specimens (Array)
    if (Array.isArray(input.specimens)) {
        updates.specimens = input.specimens.map(s => ({
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
        }));
    }

    const test = await ConcreteTest.findOneAndUpdate(
        { _id: req.params.id, userId: req.user.id },
        { $set: updates },
        { new: true }
    );
    
    if (!test) return res.status(404).json({ message: "Non trouvé" });
    res.json(test);
  } catch (error) { res.status(400).json({ message: "Erreur modification" }); }
});

app.delete('/api/concrete-tests/:id', authenticateToken, async (req, res) => {
    const deleted = await ConcreteTest.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!deleted) return res.status(404).json({ message: "Non trouvé" });
    res.json({ message: "Supprimé" });
});

// Settings (Arrays)
app.get('/api/settings', authenticateToken, async (req, res) => {
    let settings = await Settings.findOne({ userId: req.user.id }).lean();
    if (!settings) {
        // Defaults
        settings = {
            specimenTypes: ['Cylindrique 16x32', 'Cylindrique 11x22', 'Cubique 15x15'],
            deliveryMethods: ['Toupie', 'Benne', 'Mixer'],
            manufacturingPlaces: ['Centrale BPE', 'Centrale Chantier'],
            mixTypes: [], concreteClasses: [], consistencyClasses: [], curingMethods: [],
            testTypes: [], preparations: [], nfStandards: []
        };
    }
    res.json(settings);
});

app.put('/api/settings', authenticateToken, async (req, res) => {
    const allowedArrays = [
        'specimenTypes', 'deliveryMethods', 'manufacturingPlaces', 'mixTypes',
        'concreteClasses', 'consistencyClasses', 'curingMethods', 'testTypes',
        'preparations', 'nfStandards'
    ];
    const updates = {};
    allowedArrays.forEach(field => {
        if (Array.isArray(req.body[field])) {
            updates[field] = req.body[field].map(String); // Force String
        }
    });

    const settings = await Settings.findOneAndUpdate(
        { userId: req.user.id },
        { $set: updates },
        { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    res.json(settings);
});

// Bugs
app.post('/api/bugs', authenticateToken, async (req, res) => {
    const { type, description } = req.body;
    await BugReport.create({ 
        type: String(type), 
        description: String(description), 
        user: req.user.username 
    });
    res.json({ message: "Signalement reçu" });
});

app.get('/api/admin/bugs', authenticateToken, requireAdmin, async (req, res) => {
    const bugs = await BugReport.find().sort({ createdAt: -1 });
    res.json(bugs);
});

app.put('/api/admin/bugs/:id', authenticateToken, requireAdmin, async (req, res) => {
    await BugReport.findByIdAndUpdate(req.params.id, { 
        status: String(req.body.status), 
        resolvedAt: req.body.status === 'resolved' ? new Date() : null 
    });
    res.json({ success: true });
});

app.delete('/api/admin/bugs/:id', authenticateToken, requireAdmin, async (req, res) => {
    await BugReport.findByIdAndDelete(req.params.id);
    res.json({ success: true });
});




// --- DÉTECTION DU DOSSIER FRONTEND ---
// On regarde si "dist" est à côté du serveur (Docker) 
// ou dans le dossier Client (Local)
const distPath = fs.existsSync(path.join(__dirname, 'dist')) 
    ? path.join(__dirname, 'dist') 
    : path.join(__dirname, '../Client/dist');

console.log("Dossier frontend détecté :", distPath);
// --- MIDDLEWARES ---

app.use(express.static(distPath));


// --- SERVIR LE FRONTEND (React Router) ---
app.get('*', (req, res) => {
    const indexPath = path.join(distPath, 'index.html');
    
    // Petite sécurité pour éviter le crash si le build a échoué
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send("Erreur : Le build du frontend (index.html) est introuvable.");
    }
});



// --- SERVING FRONTEND ---
//app.use(express.static(path.join(__dirname, '../client/dist')));
//app.get('*', (req, res) => {
 // res.sendFile(path.join(__dirname, '../client/dist', 'index.html'));
//});

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
  logger.info(`   - CORS: ${allowedOrigins.length > 0 ? allowedOrigins.length + ' origins allowed' : 'Open (Dev)'}`);
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
    // On affiche le résumé une fois la DB connectée (ou échouée)
    printStartupSummary();
  });
});

const gracefulShutdown = () => {
  logger.info('🔄 SIGTERM reçu. Fermeture gracieuse...');
  server.close(() => {
    logger.info('🛑 Serveur HTTP fermé.');
    mongoose.connection.close(false).then(() => {
        logger.info('zzZ MongoDB déconnecté.');
        process.exit(0);
    });
  });
  
  // Force close after 10s
  setTimeout(() => {
      logger.error('Force shutdown after timeout');
      process.exit(1);
  }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);



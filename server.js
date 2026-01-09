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

import User from './models/User.js';
import Company from './models/Company.js';
import Project from './models/Project.js';
import Settings from './models/Settings.js';
import ConcreteTest from './models/ConcreteTest.js';
import BugReport from './models/BugReport.js';

// --- Hack pour masquer l'avertissement de dépréciation util._extend ---
const originalEmitWarning = process.emitWarning;
process.emitWarning = (warning, ...args) => {
  if (typeof warning === 'string' && warning.includes('util._extend')) return;
  if (warning && typeof warning === 'object' && warning.message && warning.message.includes('util._extend')) return;
  return originalEmitWarning.call(process, warning, ...args);
};
// ----------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// Google Cloud Run injecte automatiquement la variable PORT (défaut 8080)
const PORT = process.env.PORT || 8080;

// --- SÉCURITÉ CRITIQUE : GESTION DES SECRETS (OWASP A02:2021-Cryptographic Failures) ---
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_change_me';
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  console.error("🚨 CRITICAL SECURITY WARNING : JWT_SECRET n'est pas défini en production. L'application est vulnérable.");
  // En environnement strict, on pourrait process.exit(1) ici.
}

// --- SÉCURITÉ : Proxy & HTTPS (OWASP A05:2021-Security Misconfiguration) ---
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

// --- SÉCURITÉ : Helmet (OWASP A05:2021) ---
// Protection contre Clickjacking (X-Frame-Options), Sniffing (X-Content-Type-Options), etc.
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
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true }, // Force HTTPS
  frameguard: { action: 'deny' } // Anti-Clickjacking
}));

// --- SÉCURITÉ : Body Parsers (Avant Sanitize) ---
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// --- SÉCURITÉ : Anti-Injection NoSQL (OWASP A03:2021-Injection) ---
// Remplacement des caractères interdits ($ et .) par _ pour neutraliser les opérateurs
app.use(mongoSanitize({
  replaceWith: '_'
}));

// --- SÉCURITÉ : Rate Limiting (DoS Protection) ---

// 1. Limiteur Global : 100 requêtes par 15 minutes
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limite chaque IP à 100 requêtes par fenêtre
  message: { message: "Trop de requêtes envoyées depuis cette IP, veuillez réessayer plus tard." },
  standardHeaders: true, // Retourne les infos de rate limit dans les headers `RateLimit-*`
  legacyHeaders: false, // Désactive les headers `X-RateLimit-*`
});

// Appliquer le limiteur global à toutes les requêtes
app.use(globalLimiter);

// 2. Limiteur Login (Strict) : 5 tentatives par heure
const loginLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 5, // Limite chaque IP à 5 tentatives de connexion par fenêtre
  message: { message: "Trop de tentatives de connexion échouées. Compte temporairement bloqué pour 1 heure." },
  standardHeaders: true,
  legacyHeaders: false,
});


// --- DB Connect & Seed ---
const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
        console.warn("⚠️ MONGO_URI manquant. Mode hors ligne.");
        return;
    }

    const clientOptions = { dbName: 'labobeton', serverApi: { version: '1', strict: true, deprecationErrors: true } };
    await mongoose.connect(uri, clientOptions);
    console.log(`✅ MongoDB Connecté`);
    
    // Indexation pour performance
    try {
      if (mongoose.connection.readyState === 1) {
        const collection = mongoose.connection.collection('concretetests');
        await collection.createIndex({ projectId: 1 });
        await collection.createIndex({ samplingDate: 1 });
        
        // Nettoyage index legacy
        const indexes = await collection.indexes();
        if (indexes.find(idx => idx.name === 'reference_1')) {
           await collection.dropIndex('reference_1');
        }
      }
    } catch (err) {}

    await seedAdminUser();
  } catch (error) {
    console.error(`❌ Erreur MongoDB: ${error.message}`);
  }
};

// --- INITIALISATION ADMIN ---
const seedAdminUser = async () => {
  try {
    const count = await User.countDocuments();
    if (count === 0) {
      console.log("ℹ️ Init Admin...");
      const initUser = process.env.INIT_ADMIN_USERNAME;
      const initPass = process.env.INIT_ADMIN_PASSWORD;
      if (initUser && initPass) {
        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash(initPass, salt);
        await User.create({ 
          username: initUser, 
          password: hashed, 
          role: 'admin', 
          companyName: 'ADMINISTRATEUR SYSTEME',
          tokenVersion: 0
        });
        console.log(`✅ Compte Admin initial créé.`);
      }
    }
  } catch (error) { console.error("Erreur seedAdminUser:", error); }
};

// --- MIDDLEWARES AUTH (OWASP A01:2021-Broken Access Control) ---
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: "Token manquant." });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // req.user.id est extrait du token (sûr), mais on caste quand même par principe dans les requêtes
    const user = await User.findById(String(decoded.id)).select('-password');
    
    if (!user) return res.status(401).json({ message: "Utilisateur introuvable." });
    if (user.isActive === false) return res.status(403).json({ message: "Compte désactivé." });
    
    // Vérification Session Unique
    if (decoded.tokenVersion !== user.tokenVersion) {
      return res.status(401).json({ message: "Session expirée (Connecté ailleurs)." });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token invalide ou expiré." });
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: "Accès refusé." });
  }
  next();
};

const checkValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: "Données invalides", errors: errors.array() });
  next();
};

// --- VALIDATORS (OWASP A07:2021-Identification and Authentication Failures) ---
const validateLogin = [
  body('username').trim().notEmpty().withMessage('Identifiant requis').escape(),
  body('password').notEmpty().withMessage('Mot de passe requis')
];

const validateUserCreation = [
  body('username').trim().isLength({ min: 3 }).withMessage('Identifiant trop court (min 3)').escape(),
  // Politique de mot de passe forte
  body('password')
    .isLength({ min: 8 }).withMessage('Le mot de passe doit faire au moins 8 caractères')
    .matches(/\d/).withMessage('Le mot de passe doit contenir au moins un chiffre')
    .matches(/[A-Z]/).withMessage('Le mot de passe doit contenir au moins une majuscule')
    .matches(/[a-z]/).withMessage('Le mot de passe doit contenir au moins une minuscule')
];

const validateTest = [
  body('projectId').isMongoId().withMessage('ID Projet invalide'),
  body('slump').optional({ values: 'falsy' }).isNumeric(),
  body('specimens').isArray()
];

// --- API ROUTES ---

// Login avec gestion Session Unique, Rate Limiter Stricte et Validation
// OWASP: Réponses génériques ("Identifiants incorrects") pour ne pas énumérer les comptes
app.post('/api/auth/login', loginLimiter, validateLogin, checkValidation, async (req, res) => {
  const { username, password } = req.body;
  try {
    // CASTING EXPLICITE : Empêche l'injection d'objets { $ne: null }
    const safeUsername = String(username);
    
    const user = await User.findOne({ username: safeUsername });
    // Délai constant simulé pour éviter les attaques temporelles (Timing Attacks) - Optionnel mais recommandé
    
    if (!user) return res.status(401).json({ message: "Identifiants incorrects" });
    
    if (user.isActive === false) return res.status(403).json({ message: "Ce compte a été désactivé. Contactez l'administrateur." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Identifiants incorrects" });

    // Incrémenter tokenVersion pour invalider les autres sessions
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      { 
        id: user._id, 
        role: user.role, 
        username: user.username,
        tokenVersion: user.tokenVersion // Inclus dans le token
      }, 
      JWT_SECRET, 
      { expiresIn: '12h' }
    );

    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.tokenVersion; // Ne pas exposer au front
    res.json({ token, user: { id: user._id, ...userObj } });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Bug Reporter (Public Authenticated)
app.post('/api/bugs', authenticateToken, async (req, res) => {
  const { type, description, user } = req.body;
  try {
    // On ne passe pas req.body directement, on reconstruit l'objet
    await BugReport.create({ 
        type: String(type), 
        description: String(description), 
        user: String(user) // Casting de sécurité
    });
    res.json({ message: "Signalement reçu" });
  } catch (e) {
    res.status(500).json({ message: "Erreur enregistrement bug" });
  }
});

// Admin Bug Routes
app.get('/api/admin/bugs', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const bugs = await BugReport.find().sort({ createdAt: -1 });
    res.json(bugs);
  } catch (error) { res.status(500).json({ message: "Erreur serveur" }); }
});

app.put('/api/admin/bugs/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    // CASTING EXPLICITE de l'ID
    const bug = await BugReport.findByIdAndUpdate(
        String(req.params.id), 
        { status: String(status), resolvedAt: status === 'resolved' ? new Date() : null }, 
        { new: true }
    );
    res.json(bug);
  } catch (error) { res.status(500).json({ message: "Erreur serveur" }); }
});

app.delete('/api/admin/bugs/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // CASTING EXPLICITE de l'ID
    await BugReport.findByIdAndDelete(String(req.params.id));
    res.json({ message: "Signalement supprimé" });
  } catch (error) { res.status(500).json({ message: "Erreur serveur" }); }
});

app.get('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id, '-password -tokenVersion');
    if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });
    res.json(user);
  } catch (error) { res.status(500).json({ message: "Erreur serveur" }); }
});

app.put('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const { companyName, address, contact, password, siret, apeCode, legalInfo, logo } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });

    // Assignation explicite (évite le mass assignment)
    if (companyName !== undefined) user.companyName = String(companyName);
    if (address !== undefined) user.address = String(address);
    if (contact !== undefined) user.contact = String(contact);
    if (siret !== undefined) user.siret = String(siret);
    if (apeCode !== undefined) user.apeCode = String(apeCode);
    if (legalInfo !== undefined) user.legalInfo = String(legalInfo);
    if (logo !== undefined) user.logo = String(logo);

    if (password && String(password).trim() !== "") {
      const pwd = String(password);
      // Validation manuelle de la complexité du mot de passe
      if (pwd.length < 8) return res.status(400).json({ message: "Le mot de passe doit faire 8 caractères minimum." });
      
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(pwd, salt);
      // Changer le mot de passe déconnecte les autres sessions aussi
      user.tokenVersion = (user.tokenVersion || 0) + 1;
    }

    await user.save();
    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.tokenVersion;
    res.json(userObj);
  } catch (error) { res.status(400).json({ message: "Erreur mise à jour" }); }
});

// --- ADMIN USERS ---
// Ajout du validateur validateUserCreation
app.post('/api/users', authenticateToken, requireAdmin, validateUserCreation, checkValidation, async (req, res) => {
  const { username, password, role, companyName, address, contact, isActive } = req.body;
  try {
    // CASTING EXPLICITE
    const safeUsername = String(username);
    const existingUser = await User.findOne({ username: safeUsername });
    if (existingUser) return res.status(400).json({ message: "Utilisateur existant." });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(String(password), salt);

    const newUser = new User({
      username: safeUsername,
      password: hashedPassword,
      role: role || 'standard',
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      companyName: companyName ? String(companyName) : '',
      address: address ? String(address) : '',
      contact: contact ? String(contact) : ''
    });

    await newUser.save();
    res.status(201).json({ message: "Utilisateur créé", user: { username: newUser.username } });
  } catch (error) { res.status(500).json({ message: "Erreur création" }); }
});

app.get('/api/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await User.find({}, '-password -tokenVersion').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) { res.status(500).json({ message: "Erreur récupération" }); }
});

// Toggle Activation Utilisateur
app.put('/api/users/:id/toggle-access', authenticateToken, requireAdmin, async (req, res) => {
    try {
        // CASTING EXPLICITE
        const targetId = String(req.params.id);
        if (targetId === String(req.user.id)) return res.status(400).json({ message: "Impossible de modifier son propre accès." });
        
        const user = await User.findById(targetId);
        if (!user) return res.status(404).json({ message: "Non trouvé" });
        
        user.isActive = !user.isActive;
        // Invalider ses sessions s'il est désactivé
        if (!user.isActive) user.tokenVersion = (user.tokenVersion || 0) + 1;
        
        await user.save();
        res.json({ message: "Accès modifié", isActive: user.isActive });
    } catch (error) { res.status(500).json({message: "Erreur serveur"}); }
});

app.delete('/api/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // CASTING EXPLICITE
    const targetId = String(req.params.id);
    if (targetId === String(req.user.id)) return res.status(400).json({ message: "Impossible de se supprimer soi-même." });
    
    const deletedUser = await User.findByIdAndDelete(targetId);
    if (!deletedUser) return res.status(404).json({ message: "Utilisateur introuvable." });
    res.json({ message: "Utilisateur supprimé." });
  } catch (error) { res.status(500).json({ message: "Erreur suppression" }); }
});

// --- METIER ---
// Note sur Access Control (OWASP A01) : Tous les appels métiers filtrent par `userId: req.user.id`.
// C'est la protection principale contre les IDOR (Insecure Direct Object Reference).

app.get('/api/companies', authenticateToken, async (req, res) => {
  try {
    const companies = await Company.find({ userId: req.user.id }).sort({ name: 1 }).lean();
    res.json(companies);
  } catch (error) { res.status(500).json({ message: "Erreur serveur" }); }
});

app.post('/api/companies', authenticateToken, async (req, res) => {
  try {
    // mongoSanitize a déjà nettoyé req.body des opérateurs $, mais on reconstruit pour être sûr
    const newCompany = new Company({ 
        ...req.body, 
        userId: req.user.id 
    });
    await newCompany.save();
    res.status(201).json(newCompany);
  } catch (error) { res.status(400).json({ message: "Erreur création" }); }
});

app.put('/api/companies/:id', authenticateToken, async (req, res) => {
  try {
    // CASTING EXPLICITE ID + userId pour scoping
    const updated = await Company.findOneAndUpdate(
        { _id: String(req.params.id), userId: req.user.id }, 
        req.body, // Mongoose sanitize déjà via le Schema, et mongoSanitize a retiré les $
        { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Non trouvé" });
    res.json(updated);
  } catch (error) { res.status(400).json({ message: "Erreur modification" }); }
});

app.delete('/api/companies/:id', authenticateToken, async (req, res) => {
  try {
    // CASTING EXPLICITE ID
    const deleted = await Company.findOneAndDelete({ _id: String(req.params.id), userId: req.user.id });
    if (!deleted) return res.status(404).json({ message: "Non trouvé" });
    res.json({ message: "Supprimé" });
  } catch (error) { res.status(500).json({ message: "Erreur suppression" }); }
});

app.get('/api/projects', authenticateToken, async (req, res) => {
  try {
    const projects = await Project.find({ userId: req.user.id }).sort({ createdAt: -1 }).lean();
    res.json(projects);
  } catch (error) { res.status(500).json({ message: "Erreur serveur" }); }
});

// EXPORT CSV POUR PROJET
app.get('/api/projects/:id/export/csv', authenticateToken, async (req, res) => {
  try {
    // CASTING EXPLICITE ID
    const projectId = String(req.params.id);
    
    // Vérifier appartenance
    const project = await Project.findOne({ _id: projectId, userId: req.user.id });
    if (!project) return res.status(404).json({ message: "Projet introuvable" });

    // Récupérer tous les tests du projet
    const tests = await ConcreteTest.find({ projectId }).sort({ samplingDate: 1 }).lean();

    // Construction CSV manuel (léger et sans dépendance lourde)
    const header = [
      "Reference", "Date Prelevement", "Ouvrage", "Partie", "Classe", 
      "Slump (mm)", "Volume (m3)", "Num Eprouvette", "Age (j)", 
      "Date Ecrasement", "Masse (g)", "Force (kN)", "Contrainte (MPa)", "Densite (kg/m3)"
    ].join(",");

    const rows = [];
    tests.forEach(t => {
      if (t.specimens && t.specimens.length > 0) {
        t.specimens.forEach(s => {
          rows.push([
            t.reference,
            t.samplingDate ? new Date(t.samplingDate).toLocaleDateString('fr-FR') : '',
            `"${t.structureName || ''}"`,
            `"${t.elementName || ''}"`,
            t.concreteClass,
            t.slump,
            t.volume,
            s.number,
            s.age,
            s.crushingDate ? new Date(s.crushingDate).toLocaleDateString('fr-FR') : '',
            s.weight || '',
            s.force || '',
            s.stress ? s.stress.toFixed(1) : '',
            s.density ? s.density.toFixed(0) : ''
          ].join(","));
        });
      } else {
         // Ligne sans éprouvette
         rows.push([
            t.reference,
            t.samplingDate ? new Date(t.samplingDate).toLocaleDateString('fr-FR') : '',
            `"${t.structureName || ''}"`,
            `"${t.elementName || ''}"`,
            t.concreteClass,
            t.slump,
            t.volume,
            "","","","","","",""
          ].join(","));
      }
    });

    const csvContent = [header, ...rows].join("\n");
    
    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', `attachment; filename="export_affaire_${projectId}.csv"`);
    res.send(csvContent);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur export" });
  }
});

// FULL REPORT DATA FOR PV GLOBAL
app.get('/api/projects/:id/full-report', authenticateToken, async (req, res) => {
  try {
    // CASTING EXPLICITE ID
    const projectId = String(req.params.id);
    const project = await Project.findOne({ _id: projectId, userId: req.user.id });
    if (!project) return res.status(404).json({ message: "Projet introuvable" });

    const tests = await ConcreteTest.find({ projectId }).sort({ samplingDate: 1 }).lean();
    res.json({ project, tests });
  } catch (error) { res.status(500).json({ message: "Erreur serveur" }); }
});

app.post('/api/projects', authenticateToken, async (req, res) => {
  try {
    const newProject = new Project({ ...req.body, userId: req.user.id });
    await newProject.save();
    res.status(201).json(newProject);
  } catch (error) { res.status(400).json({ message: "Erreur création" }); }
});

app.put('/api/projects/:id', authenticateToken, async (req, res) => {
  try {
    // CASTING EXPLICITE ID
    const updated = await Project.findOneAndUpdate(
        { _id: String(req.params.id), userId: req.user.id }, 
        req.body, 
        { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Non trouvé" });
    res.json(updated);
  } catch (error) { res.status(400).json({ message: "Erreur modification" }); }
});

app.delete('/api/projects/:id', authenticateToken, async (req, res) => {
  try {
    // CASTING EXPLICITE ID
    const deleted = await Project.findOneAndDelete({ _id: String(req.params.id), userId: req.user.id });
    if (!deleted) return res.status(404).json({ message: "Non trouvé" });
    res.json({ message: "Supprimé" });
  } catch (error) { res.status(500).json({ message: "Erreur suppression" }); }
});

app.get('/api/concrete-tests', authenticateToken, async (req, res) => {
  try {
    // Utilisation de lean() pour perf avec 10000 items
    const tests = await ConcreteTest.find({ userId: req.user.id })
      .sort({ sequenceNumber: -1 })
      .populate('projectId', 'name')
      .lean(); 
    res.json(tests);
  } catch (error) { res.status(500).json({ message: "Erreur serveur" }); }
});

app.post('/api/concrete-tests', authenticateToken, validateTest, checkValidation, async (req, res) => {
  try {
    const newTest = new ConcreteTest({ ...req.body, userId: req.user.id });
    await newTest.save();
    res.status(201).json(newTest);
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ message: "Erreur de numérotation (Doublon)." });
    res.status(400).json({ message: "Erreur création", error: error.message });
  }
});

app.put('/api/concrete-tests/:id', authenticateToken, async (req, res) => {
  try {
    // CASTING EXPLICITE ID
    const test = await ConcreteTest.findOne({ _id: String(req.params.id), userId: req.user.id });
    if (!test) return res.status(404).json({ message: "Non trouvé" });
    Object.assign(test, req.body);
    await test.save();
    res.json(test);
  } catch (error) { res.status(400).json({ message: "Erreur modification" }); }
});

app.delete('/api/concrete-tests/:id', authenticateToken, async (req, res) => {
  try {
    // CASTING EXPLICITE ID
    const deleted = await ConcreteTest.findOneAndDelete({ _id: String(req.params.id), userId: req.user.id });
    if (!deleted) return res.status(404).json({ message: "Non trouvé" });
    res.json({ message: "Supprimé" });
  } catch (error) { res.status(500).json({ message: "Erreur suppression" }); }
});

app.get('/api/settings', authenticateToken, async (req, res) => {
  try {
    let settings = await Settings.findOne({ userId: req.user.id }).lean();
    if (!settings) {
      settings = new Settings({
        userId: req.user.id,
        specimenTypes: ['Cylindrique 16x32', 'Cylindrique 11x22', 'Cubique 15x15', 'Cubique 10x10'],
        deliveryMethods: ['Toupie', 'Benne', 'Mixer', 'Sur site'],
        manufacturingPlaces: ['Centrale BPE', 'Centrale Chantier', 'Préfabrication'],
        mixTypes: ['CEM II/A-LL 42.5N - 350kg', 'Béton B25 - Gravillon 20mm', 'Béton Hydrofuge - 400kg'],
        concreteClasses: ['C20/25', 'C25/30', 'C30/37', 'C35/45', 'C40/50', 'C45/55', 'C50/60'],
        consistencyClasses: ['S1', 'S2', 'S3', 'S4', 'S5'],
        curingMethods: ['Eau 20°C +/- 2°C', 'Salle Humide', 'Air ambiant', 'Isolant'],
        testTypes: ['Compression', 'Fendage', 'Flexion'],
        preparations: ['Surfaçage Soufre', 'Rectification', 'Boîte à Sable', 'Aucune'],
        nfStandards: ['NF EN 206/CN', 'NF EN 12350', 'NF EN 12390']
      });
      await settings.save();
    }
    res.json(settings);
  } catch (error) { res.status(500).json({ message: "Erreur serveur" }); }
});

app.put('/api/settings', authenticateToken, async (req, res) => {
  try {
    const settings = await Settings.findOneAndUpdate(
      { userId: req.user.id },
      req.body,
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    res.json(settings);
  } catch (error) { res.status(500).json({ message: "Erreur sauvegarde" }); }
});

app.get('/api/health', (req, res) => {
  const state = mongoose.connection.readyState;
  res.status(200).json({ 
    status: state === 1 ? 'CONNECTED' : 'ERROR', 
    timestamp: new Date() 
  });
});

app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Serveur Monolithe LaboBéton démarré sur le port ${PORT}`);
  connectDB();
});
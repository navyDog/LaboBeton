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
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'secret_temporaire_labo_beton_2024';

// --- SÉCURITÉ : Proxy & HTTPS ---
app.set('trust proxy', 1);
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(`https://${req.headers.host}${req.url}`);
    }
  }
  next();
});

// --- SÉCURITÉ : CORS ---
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      return callback(new Error('CORS Policy Error'), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// --- SÉCURITÉ : Helmet (Headers) ---
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
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true }
}));

// --- SÉCURITÉ : Anti-Injection NoSQL ---
// Bloque les opérateurs MongoDB (ex: $where, $ne) dans le body, params et query
app.use(mongoSanitize());

// --- SÉCURITÉ : Rate Limiting ---
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: "Trop de tentatives. Réessayez dans 15 min." },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// --- DB Connect ---
const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      console.warn("⚠️ MONGO_URI manquant");
      return;
    }
    const clientOptions = { dbName: 'labobeton', serverApi: { version: '1', strict: true, deprecationErrors: true } };
    await mongoose.connect(uri, clientOptions);
    console.log(`✅ MongoDB Connecté`);
    
    // Migration index (si nécessaire)
    try {
      if (mongoose.connection.readyState === 1) {
        const collection = mongoose.connection.collection('concretetests');
        const indexes = await collection.indexes();
        if (indexes.find(idx => idx.name === 'reference_1')) {
           await collection.dropIndex('reference_1');
        }
      }
    } catch (err) {}

    await seedUsers();
  } catch (error) {
    console.error(`❌ Erreur MongoDB: ${error.message}`);
  }
};

// --- INITIALISATION DES UTILISATEURS (SECURISÉE) ---
const seedUsers = async () => {
  try {
    if (mongoose.connection.readyState !== 1) return;
    
    // On vérifie s'il y a déjà des utilisateurs
    const count = await User.countDocuments();
    if (count > 0) return; // La DB n'est pas vide, on ne fait rien.

    // CAS 1 : PRODUCTION
    if (process.env.NODE_ENV === 'production') {
      const initUser = process.env.INIT_ADMIN_USERNAME;
      const initPass = process.env.INIT_ADMIN_PASSWORD;

      if (initUser && initPass) {
        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash(initPass, salt);
        await User.create({ 
          username: initUser, 
          password: hashed, 
          role: 'admin', 
          companyName: 'Admin Principal' 
        });
        console.log(`✅ SECURITY: Compte admin initial (${initUser}) créé via variables d'environnement.`);
      } else {
        console.log("ℹ️ SECURITY: Base de données vide en Production. Aucun compte créé (INIT_ADMIN_USERNAME/PASSWORD manquants).");
      }
      return;
    }

    // CAS 2 : DEVELOPPEMENT (Local)
    // On crée les comptes par défaut pour faciliter le dev
    const salt = await bcrypt.genSalt(10);
    const adminPass = await bcrypt.hash('admin123', salt);
    await User.create({ username: 'admin', password: adminPass, role: 'admin', companyName: 'Laboratoire Central' });
    
    const userPass = await bcrypt.hash('labo123', salt);
    await User.create({ username: 'labo', password: userPass, role: 'standard', companyName: 'Interne' });
    
    console.log("⚠️ DEV MODE: Comptes par défaut créés (admin/admin123, labo/labo123).");

  } catch (error) { console.error("Erreur seed:", error); }
};

// --- MIDDLEWARES AUTH & SECURITE ---

// 1. Vérifie que le token est valide
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: "Token manquant." });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(401).json({ message: "Token invalide." });
    req.user = user;
    next();
  });
};

// 2. Vérifie que l'utilisateur est ADMIN (Middleware dédié)
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    // 403 Forbidden : Le serveur a compris la requête mais refuse de l'exécuter
    return res.status(403).json({ message: "Accès refusé. Privilèges administrateur requis." });
  }
  next();
};

const checkValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: "Données invalides", errors: errors.array() });
  next();
};

// --- ROUTES ---

app.post('/api/auth/login', loginLimiter, async (req, res) => {
  const { username, password } = req.body;
  try {
    const safeUsername = String(username); // Force string pour éviter injection type
    const user = await User.findOne({ username: safeUsername });
    if (!user) return res.status(401).json({ message: "Identifiants incorrects" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Identifiants incorrects" });

    user.lastLogin = new Date();
    await user.save();

    // LE TOKEN CONTIENT LE RÔLE. C'est signé, donc infalsifiable sans la clé secrète.
    const token = jwt.sign(
      { id: user._id, role: user.role, username: user.username }, 
      JWT_SECRET, 
      { expiresIn: '8h' }
    );

    const userObj = user.toObject();
    delete userObj.password;
    res.json({ token, user: { id: user._id, ...userObj } });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

app.get('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id, '-password');
    if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });
    res.json(user);
  } catch (error) { res.status(500).json({ message: "Erreur serveur" }); }
});

app.put('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const { companyName, address, contact, password, siret, apeCode, legalInfo, logo } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });

    if (companyName !== undefined) user.companyName = companyName;
    if (address !== undefined) user.address = address;
    if (contact !== undefined) user.contact = contact;
    if (siret !== undefined) user.siret = siret;
    if (apeCode !== undefined) user.apeCode = apeCode;
    if (legalInfo !== undefined) user.legalInfo = legalInfo;
    if (logo !== undefined) user.logo = logo;

    if (password && password.trim() !== "") {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();
    const userObj = user.toObject();
    delete userObj.password;
    res.json(userObj);
  } catch (error) { res.status(400).json({ message: "Erreur mise à jour" }); }
});

// --- Routes Admin (PROTÉGÉES PAR requireAdmin) ---

app.post('/api/users', authenticateToken, requireAdmin, async (req, res) => {
  const { username, password, role, companyName, address, contact } = req.body;
  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).json({ message: "Utilisateur existant." });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      username,
      password: hashedPassword,
      role: role || 'standard',
      companyName,
      address,
      contact
    });

    await newUser.save();
    res.status(201).json({ message: "Utilisateur créé", user: { username: newUser.username } });
  } catch (error) { res.status(500).json({ message: "Erreur création" }); }
});

app.get('/api/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await User.find({}, '-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) { res.status(500).json({ message: "Erreur récupération" }); }
});

app.delete('/api/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    if (req.params.id === req.user.id) return res.status(400).json({ message: "Impossible de se supprimer soi-même." });
    
    // mongoSanitize protège req.params.id contre les injections NoSQL ici
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    
    if (!deletedUser) return res.status(404).json({ message: "Utilisateur introuvable." });
    res.json({ message: "Utilisateur supprimé." });
  } catch (error) { res.status(500).json({ message: "Erreur suppression" }); }
});

// --- Routes Métier (Standard) ---
// Note: Isolation logique par req.user.id pour empêcher l'accès croisé aux données

app.get('/api/companies', authenticateToken, async (req, res) => {
  try {
    const companies = await Company.find({ userId: req.user.id }).sort({ name: 1 });
    res.json(companies);
  } catch (error) { res.status(500).json({ message: "Erreur serveur" }); }
});

app.post('/api/companies', authenticateToken, async (req, res) => {
  try {
    const newCompany = new Company({ ...req.body, userId: req.user.id });
    await newCompany.save();
    res.status(201).json(newCompany);
  } catch (error) { res.status(400).json({ message: "Erreur création" }); }
});

app.put('/api/companies/:id', authenticateToken, async (req, res) => {
  try {
    const updated = await Company.findOneAndUpdate({ _id: req.params.id, userId: req.user.id }, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: "Non trouvé" });
    res.json(updated);
  } catch (error) { res.status(400).json({ message: "Erreur modification" }); }
});

app.delete('/api/companies/:id', authenticateToken, async (req, res) => {
  try {
    const deleted = await Company.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!deleted) return res.status(404).json({ message: "Non trouvé" });
    res.json({ message: "Supprimé" });
  } catch (error) { res.status(500).json({ message: "Erreur suppression" }); }
});

// Projects
app.get('/api/projects', authenticateToken, async (req, res) => {
  try {
    const projects = await Project.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(projects);
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
    const updated = await Project.findOneAndUpdate({ _id: req.params.id, userId: req.user.id }, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: "Non trouvé" });
    res.json(updated);
  } catch (error) { res.status(400).json({ message: "Erreur modification" }); }
});

app.delete('/api/projects/:id', authenticateToken, async (req, res) => {
  try {
    const deleted = await Project.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!deleted) return res.status(404).json({ message: "Non trouvé" });
    res.json({ message: "Supprimé" });
  } catch (error) { res.status(500).json({ message: "Erreur suppression" }); }
});

// Concrete Tests
app.get('/api/concrete-tests', authenticateToken, async (req, res) => {
  try {
    const tests = await ConcreteTest.find({ userId: req.user.id })
      .sort({ sequenceNumber: -1 })
      .populate('projectId', 'name'); 
    res.json(tests);
  } catch (error) { res.status(500).json({ message: "Erreur serveur" }); }
});

const validateTest = [
  body('projectId').isMongoId(),
  body('slump').optional({ values: 'falsy' }).isNumeric(),
  body('specimens').isArray()
];

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
    const test = await ConcreteTest.findOne({ _id: req.params.id, userId: req.user.id });
    if (!test) return res.status(404).json({ message: "Non trouvé" });
    Object.assign(test, req.body);
    await test.save();
    res.json(test);
  } catch (error) { res.status(400).json({ message: "Erreur modification" }); }
});

app.delete('/api/concrete-tests/:id', authenticateToken, async (req, res) => {
  try {
    const deleted = await ConcreteTest.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!deleted) return res.status(404).json({ message: "Non trouvé" });
    res.json({ message: "Supprimé" });
  } catch (error) { res.status(500).json({ message: "Erreur suppression" }); }
});

// Settings
app.get('/api/settings', authenticateToken, async (req, res) => {
  try {
    let settings = await Settings.findOne({ userId: req.user.id });
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

// Health
app.get('/api/health', (req, res) => {
  const state = mongoose.connection.readyState;
  res.status(state === 1 ? 200 : 503).json({ 
    status: state === 1 ? 'CONNECTED' : 'ERROR', 
    timestamp: new Date() 
  });
});

app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ message: "API route not found" });
  if (req.accepts('html')) {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  } else {
    res.status(404).send('Not Found');
  }
});

connectDB().then(() => {
  app.listen(PORT, () => {
    // Logs explicites pour l'utilisateur
    const mode = process.env.NODE_ENV === 'production' ? '🔒 PRODUCTION' : '🛠️ DÉVELOPPEMENT';
    console.log('--------------------------------------------------');
    console.log(`🚀 Serveur LaboBéton prêt sur http://localhost:${PORT}`);
    console.log(`ℹ️  Mode Actuel : ${mode}`);
    console.log('--------------------------------------------------');
  });
});
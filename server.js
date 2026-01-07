import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'path';
import { fileURLToPath } from 'url';
import User from './models/User.js';
import Company from './models/Company.js';
import Project from './models/Project.js';
import Settings from './models/Settings.js';
import ConcreteTest from './models/ConcreteTest.js';

// Configuration des chemins pour ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'secret_temporaire_labo_beton_2024';

// Augmentation de la limite de taille pour supporter l'upload de logo en Base64
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// --- Initialisation Base de Données ---
const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      console.warn("⚠️ MONGO_URI manquant dans .env");
      return;
    }

    const clientOptions = { 
      dbName: 'labobeton',
      serverApi: { version: '1', strict: true, deprecationErrors: true } 
    };
    
    await mongoose.connect(uri, clientOptions);
    console.log(`✅ MongoDB Connecté à la base: labobeton`);

    // --- MIGRATION CRITIQUE : Suppression des index conflictuels ---
    try {
      if (mongoose.connection.readyState === 1) {
        const collection = mongoose.connection.collection('concretetests');
        const indexes = await collection.indexes();
        const oldIndex = indexes.find(idx => idx.name === 'reference_1');
        
        if (oldIndex) {
          console.log("🛠️  MIGRATION: Suppression de l'ancien index global 'reference_1'...");
          await collection.dropIndex('reference_1');
          console.log("✅ Index supprimé. Chaque utilisateur peut maintenant avoir ses propres chronos.");
        }
      }
    } catch (err) {
      // Ignorer si déjà fait
    }
    // ---------------------------------------------------------

    await seedUsers();

  } catch (error) {
    console.error(`❌ Erreur MongoDB: ${error.message}`);
  }
};

const seedUsers = async () => {
  try {
    if (mongoose.connection.readyState !== 1) return;

    const count = await User.countDocuments();
    if (count === 0) {
      console.log("⚙️ Initialisation des comptes...");
      const salt = await bcrypt.genSalt(10);
      
      const adminPass = await bcrypt.hash('admin123', salt);
      await User.create({ username: 'admin', password: adminPass, role: 'admin', companyName: 'Laboratoire Central' });
      
      const userPass = await bcrypt.hash('labo123', salt);
      await User.create({ username: 'labo', password: userPass, role: 'standard', companyName: 'Interne' });

      console.log("✅ Comptes créés : admin/admin123 et labo/labo123");
    }
  } catch (error) {
    console.error("Erreur seed:", error);
  }
};

// --- Middleware d'authentification ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) return res.status(401).json({ message: "Accès refusé. Token manquant." });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Token invalide." });
    req.user = user;
    next();
  });
};

// --- Routes API Auth ---

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    if (mongoose.connection.readyState !== 1) return res.status(503).json({ message: "DB indisponible" });

    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ message: "Identifiants incorrects" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Identifiants incorrects" });

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign({ id: user._id, role: user.role, username: user.username }, JWT_SECRET, { expiresIn: '8h' });

    // On renvoie l'utilisateur complet sans le password
    const userObj = user.toObject();
    delete userObj.password;

    res.json({
      token,
      user: { id: user._id, ...userObj }
    });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Récupérer le profil actuel
app.get('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id, '-password'); // On exclut le mot de passe
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Erreur récupération profil" });
  }
});

// Mettre à jour le profil actuel
app.put('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const { companyName, address, contact, password, siret, apeCode, legalInfo, logo } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });

    // Mise à jour des champs informatifs
    if (companyName !== undefined) user.companyName = companyName;
    if (address !== undefined) user.address = address;
    if (contact !== undefined) user.contact = contact;
    
    // Nouveaux champs
    if (siret !== undefined) user.siret = siret;
    if (apeCode !== undefined) user.apeCode = apeCode;
    if (legalInfo !== undefined) user.legalInfo = legalInfo;
    if (logo !== undefined) user.logo = logo;

    // Mise à jour du mot de passe si fourni
    if (password && password.trim() !== "") {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();
    
    // On renvoie l'utilisateur sans le hash du mot de passe
    const userObj = user.toObject();
    delete userObj.password;
    
    res.json(userObj);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "Erreur mise à jour profil", error: error.message });
  }
});

// --- Routes API Admin (Users) ---

app.post('/api/users', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: "Accès réservé aux administrateurs." });
  }

  const { username, password, role, companyName, address, contact } = req.body;

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).json({ message: "Ce nom d'utilisateur existe déjà." });

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
  } catch (error) {
    res.status(500).json({ message: "Erreur création utilisateur." });
  }
});

app.get('/api/users', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: "Accès réservé aux administrateurs." });
  
  try {
    const users = await User.find({}, '-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Erreur récupération utilisateurs" });
  }
});

app.delete('/api/users/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: "Accès réservé aux administrateurs." });
  }
  
  try {
    // Empêcher l'admin de se supprimer lui-même
    if (req.params.id === req.user.id) {
       return res.status(400).json({ message: "Vous ne pouvez pas supprimer votre propre compte." });
    }

    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) return res.status(404).json({ message: "Utilisateur non trouvé." });
    
    res.json({ message: "Utilisateur supprimé avec succès." });
  } catch (error) {
    res.status(500).json({ message: "Erreur suppression utilisateur." });
  }
});

// --- Routes API Entreprises (Companies) ---

app.get('/api/companies', authenticateToken, async (req, res) => {
  try {
    // SECURITY: Isolation Logique - On filtre toujours par userId
    const companies = await Company.find({ userId: req.user.id }).sort({ name: 1 });
    res.json(companies);
  } catch (error) {
    res.status(500).json({ message: "Erreur récupération entreprises" });
  }
});

app.post('/api/companies', authenticateToken, async (req, res) => {
  try {
    const newCompany = new Company({ ...req.body, userId: req.user.id });
    await newCompany.save();
    res.status(201).json(newCompany);
  } catch (error) {
    res.status(400).json({ message: "Erreur création entreprise", error: error.message });
  }
});

app.put('/api/companies/:id', authenticateToken, async (req, res) => {
  try {
    const updated = await Company.findOneAndUpdate({ _id: req.params.id, userId: req.user.id }, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: "Entreprise non trouvée" });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: "Erreur modification" });
  }
});

app.delete('/api/companies/:id', authenticateToken, async (req, res) => {
  try {
    const deleted = await Company.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!deleted) return res.status(404).json({ message: "Entreprise non trouvée" });
    res.json({ message: "Entreprise supprimée" });
  } catch (error) {
    res.status(500).json({ message: "Erreur suppression" });
  }
});

// --- Routes API Affaires (Projects) ---

app.get('/api/projects', authenticateToken, async (req, res) => {
  try {
    const projects = await Project.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: "Erreur récupération affaires" });
  }
});

app.post('/api/projects', authenticateToken, async (req, res) => {
  try {
    const newProject = new Project({ ...req.body, userId: req.user.id });
    await newProject.save();
    res.status(201).json(newProject);
  } catch (error) {
    res.status(400).json({ message: "Erreur création affaire", error: error.message });
  }
});

app.put('/api/projects/:id', authenticateToken, async (req, res) => {
  try {
    const updated = await Project.findOneAndUpdate({ _id: req.params.id, userId: req.user.id }, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: "Affaire non trouvée" });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: "Erreur modification" });
  }
});

app.delete('/api/projects/:id', authenticateToken, async (req, res) => {
  try {
    const deleted = await Project.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!deleted) return res.status(404).json({ message: "Affaire non trouvée" });
    res.json({ message: "Affaire supprimée" });
  } catch (error) {
    res.status(500).json({ message: "Erreur suppression" });
  }
});

// --- Routes API Tests (Fiches Prélèvements) ---

app.get('/api/concrete-tests', authenticateToken, async (req, res) => {
  try {
    // SECURITY: On ne renvoie que les tests de l'utilisateur connecté
    const tests = await ConcreteTest.find({ userId: req.user.id })
      .sort({ sequenceNumber: -1 }) // Le plus récent en premier
      .populate('projectId', 'name'); 
    res.json(tests);
  } catch (error) {
    res.status(500).json({ message: "Erreur récupération fiches" });
  }
});

app.post('/api/concrete-tests', authenticateToken, async (req, res) => {
  try {
    // On laisse le pre-save hook gérer 'reference', 'sequenceNumber', 'year'
    // SECURITY: On force le userId du token
    const newTest = new ConcreteTest({ ...req.body, userId: req.user.id });
    await newTest.save();
    res.status(201).json(newTest);
  } catch (error) {
    console.error(error);
    // Gestion propre de l'erreur Duplicate Key
    if (error.code === 11000) {
      return res.status(400).json({ message: "Erreur de numérotation (Doublon). Réessayez." });
    }
    res.status(400).json({ message: "Erreur création fiche", error: error.message });
  }
});

app.put('/api/concrete-tests/:id', authenticateToken, async (req, res) => {
  try {
    const test = await ConcreteTest.findOne({ _id: req.params.id, userId: req.user.id });
    if (!test) return res.status(404).json({ message: "Fiche non trouvée" });

    // Mise à jour des champs avec Object.assign pour déclencher les hooks Mongoose au save()
    Object.assign(test, req.body);
    
    // Le pre-save hook recalcule la consistance et les séquences si nécessaire
    await test.save();
    
    res.json(test);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "Erreur modification", error: error.message });
  }
});

app.delete('/api/concrete-tests/:id', authenticateToken, async (req, res) => {
  try {
    const deleted = await ConcreteTest.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!deleted) return res.status(404).json({ message: "Fiche non trouvée" });
    res.json({ message: "Fiche supprimée" });
  } catch (error) {
    res.status(500).json({ message: "Erreur suppression" });
  }
});

// --- Routes API Réglages (Settings) ---

app.get('/api/settings', authenticateToken, async (req, res) => {
  try {
    let settings = await Settings.findOne({ userId: req.user.id });
    
    // Créer des réglages par défaut si inexistant
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
  } catch (error) {
    res.status(500).json({ message: "Erreur récupération réglages" });
  }
});

app.put('/api/settings', authenticateToken, async (req, res) => {
  try {
    // Upsert (update or create)
    const settings = await Settings.findOneAndUpdate(
      { userId: req.user.id },
      req.body,
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: "Erreur sauvegarde réglages" });
  }
});

// --- Health & Static ---
app.get('/api/health', (req, res) => {
  const state = mongoose.connection.readyState;
  if (state === 1) {
    res.status(200).json({ status: 'CONNECTED', message: 'Opérationnel', timestamp: new Date() });
  } else {
    res.status(503).json({ status: 'ERROR', message: 'DB déconnectée', mongoState: state });
  }
});

app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ message: "Route API non trouvée" });
  if (req.accepts('html')) {
    const indexPath = path.join(__dirname, 'dist', 'index.html');
    res.sendFile(indexPath, (err) => {
      if (err) res.status(200).send('<h1>API Backend Running</h1>');
    });
  } else {
    res.status(404).send('Not Found');
  }
});

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Serveur Backend prêt sur http://localhost:${PORT}`);
  });
});
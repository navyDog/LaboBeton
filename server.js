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

// Configuration des chemins pour ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'secret_temporaire_labo_beton_2024';

app.use(cors());
app.use(express.json());

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

    res.json({
      token,
      user: { 
        id: user._id, 
        username: user.username, 
        role: user.role,
        companyName: user.companyName 
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
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

// --- Routes API Entreprises (Companies) ---

// Lister les entreprises
app.get('/api/companies', authenticateToken, async (req, res) => {
  try {
    const companies = await Company.find({ userId: req.user.id }).sort({ name: 1 });
    res.json(companies);
  } catch (error) {
    res.status(500).json({ message: "Erreur récupération entreprises" });
  }
});

// Ajouter une entreprise
app.post('/api/companies', authenticateToken, async (req, res) => {
  try {
    const newCompany = new Company({
      ...req.body,
      userId: req.user.id
    });
    await newCompany.save();
    res.status(201).json(newCompany);
  } catch (error) {
    res.status(400).json({ message: "Erreur création entreprise", error: error.message });
  }
});

// Modifier une entreprise
app.put('/api/companies/:id', authenticateToken, async (req, res) => {
  try {
    const updated = await Company.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true } // Retourne l'objet modifié
    );
    if (!updated) return res.status(404).json({ message: "Entreprise non trouvée" });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: "Erreur modification" });
  }
});

// Supprimer une entreprise
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

// Lister les affaires
app.get('/api/projects', authenticateToken, async (req, res) => {
  try {
    const projects = await Project.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: "Erreur récupération affaires" });
  }
});

// Ajouter une affaire
app.post('/api/projects', authenticateToken, async (req, res) => {
  try {
    const newProject = new Project({
      ...req.body,
      userId: req.user.id
    });
    await newProject.save();
    res.status(201).json(newProject);
  } catch (error) {
    res.status(400).json({ message: "Erreur création affaire", error: error.message });
  }
});

// Modifier une affaire
app.put('/api/projects/:id', authenticateToken, async (req, res) => {
  try {
    const updated = await Project.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Affaire non trouvée" });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: "Erreur modification" });
  }
});

// Supprimer une affaire
app.delete('/api/projects/:id', authenticateToken, async (req, res) => {
  try {
    const deleted = await Project.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!deleted) return res.status(404).json({ message: "Affaire non trouvée" });
    res.json({ message: "Affaire supprimée" });
  } catch (error) {
    res.status(500).json({ message: "Erreur suppression" });
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
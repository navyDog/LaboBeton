import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'path';
import { fileURLToPath } from 'url';
import User from './models/User.js';

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

// --- Routes API ---

// Login
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

// Création utilisateur (ADMIN SEULEMENT)
app.post('/api/users', authenticateToken, async (req, res) => {
  // Vérification rôle admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: "Accès réservé aux administrateurs." });
  }

  const { username, password, role, companyName, address, contact } = req.body;

  try {
    // Vérifier si user existe déjà
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: "Ce nom d'utilisateur existe déjà." });
    }

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

    res.status(201).json({ 
      message: "Utilisateur créé avec succès",
      user: { username: newUser.username, role: newUser.role, companyName: newUser.companyName }
    });

  } catch (error) {
    console.error("Erreur création user:", error);
    res.status(500).json({ message: "Erreur lors de la création de l'utilisateur." });
  }
});

app.get('/api/health', (req, res) => {
  const state = mongoose.connection.readyState;
  if (state === 1) {
    res.status(200).json({ status: 'CONNECTED', message: 'Opérationnel', timestamp: new Date() });
  } else {
    res.status(503).json({ status: 'ERROR', message: 'DB déconnectée', mongoState: state });
  }
});

// --- Gestion Frontend (Production & Fallback) ---
app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ message: "Route API non trouvée" });
  }

  if (req.accepts('html')) {
    const indexPath = path.join(__dirname, 'dist', 'index.html');
    res.sendFile(indexPath, (err) => {
      if (err) {
        res.status(200).send(`
          <div style="font-family: sans-serif; padding: 2rem; text-align: center;">
            <h1>API Backend LaboBéton En Ligne 🚀</h1>
            <p>Le serveur backend tourne sur le port ${PORT}.</p>
          </div>
        `);
      }
    });
  } else {
    res.status(404).send('Not Found');
  }
});

// Démarrage serveur
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Serveur Backend prêt sur http://localhost:${PORT}`);
  });
});
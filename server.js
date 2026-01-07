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
      dbName: 'labobeton', // Force le nom de la BDD ici
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
      await User.create({ username: 'admin', password: adminPass, role: 'admin' });
      
      const userPass = await bcrypt.hash('labo123', salt);
      await User.create({ username: 'labo', password: userPass, role: 'standard' });

      console.log("✅ Comptes créés : admin/admin123 et labo/labo123");
    }
  } catch (error) {
    console.error("Erreur seed:", error);
  }
};

// --- Routes API ---
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

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '8h' });

    res.json({
      token,
      user: { id: user._id, username: user.username, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
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
// Sert les fichiers statiques du build Vite (si présents)
app.use(express.static(path.join(__dirname, 'dist')));

// Toutes les autres requêtes renvoient l'index.html (pour le routing React)
app.get('*', (req, res) => {
  // Vérifie si c'est une requête API qui a échoué (404 API)
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ message: "Route API non trouvée" });
  }

  // Si on demande du HTML (navigateur), on essaie de servir l'app React
  if (req.accepts('html')) {
    const indexPath = path.join(__dirname, 'dist', 'index.html');
    res.sendFile(indexPath, (err) => {
      if (err) {
        // Si le build n'existe pas (Mode DEV), on affiche un message d'aide
        res.status(200).send(`
          <div style="font-family: sans-serif; padding: 2rem; text-align: center;">
            <h1>API Backend LaboBéton En Ligne 🚀</h1>
            <p>Le serveur backend tourne correctement sur le port ${PORT}.</p>
            <hr style="margin: 2rem 0; opacity: 0.2"/>
            <p><strong>Pour voir l'application :</strong></p>
            <p>Utilisez le port Frontend (généralement 5173 avec Vite).</p>
            <p>Si vous êtes en production, assurez-vous d'avoir exécuté <code>npm run build</code>.</p>
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
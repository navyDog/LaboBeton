import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from './models/User.js';

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'secret_temporaire_labo_beton_2024';

app.use(cors());
app.use(express.json());

// --- Initialisation Base de Données ---
const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) throw new Error("MONGO_URI manquant");

    const clientOptions = { serverApi: { version: '1', strict: true, deprecationErrors: true } };
    await mongoose.connect(uri, clientOptions);
    console.log(`✅ MongoDB Connecté`);

    // Initialisation des utilisateurs par défaut si la base est vide
    await seedUsers();

  } catch (error) {
    console.error(`❌ Erreur MongoDB: ${error.message}`);
  }
};

const seedUsers = async () => {
  try {
    const count = await User.countDocuments();
    if (count === 0) {
      console.log("⚙️ Aucune utilisateur trouvé. Création des comptes par défaut...");
      
      const salt = await bcrypt.genSalt(10);
      
      // Compte Admin
      const adminPass = await bcrypt.hash('admin123', salt);
      await User.create({ username: 'admin', password: adminPass, role: 'admin' });
      
      // Compte Standard
      const userPass = await bcrypt.hash('labo123', salt);
      await User.create({ username: 'labo', password: userPass, role: 'standard' });

      console.log("✅ Comptes créés : admin (mdp: admin123) / labo (mdp: labo123)");
    }
  } catch (error) {
    console.error("Erreur création seed users:", error);
  }
};

// --- Routes API ---

// Login
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // 1. Chercher l'utilisateur
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: "Utilisateur ou mot de passe incorrect" });
    }

    // 2. Vérifier le mot de passe (Hash vs Clair)
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Utilisateur ou mot de passe incorrect" });
    }

    // 3. Mettre à jour lastLogin
    user.lastLogin = new Date();
    await user.save();

    // 4. Créer le Token JWT
    const token = jwt.sign(
      { id: user._id, role: user.role, username: user.username },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur lors de la connexion" });
  }
});

// Health Check
app.get('/api/health', (req, res) => {
  const state = mongoose.connection.readyState;
  if (state === 1) {
    res.status(200).json({ status: 'CONNECTED', message: 'Système opérationnel', timestamp: new Date() });
  } else {
    res.status(503).json({ status: 'ERROR', message: 'Base de données non connectée' });
  }
});

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Serveur prêt sur http://localhost:${PORT}`);
  });
});
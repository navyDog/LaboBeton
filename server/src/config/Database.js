import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import logger from './Logger.js';
import User from '../models/User.js';

export const connectDB = async () => {
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
          username: initUser, 
          password: hashed, 
          role: 'admin', 
          companyName: 'ADMIN SYSTEM', 
          tokenVersion: 0
        });
        logger.info(`👤 Compte Admin initial créé`);
      }
    }
  } catch (error) { 
    logger.error(`Erreur seedAdminUser: ${error.message}`); 
  }
};
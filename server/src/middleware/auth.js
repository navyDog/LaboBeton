import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import logger from '../config/logger.js';
import { getSafeObjectId } from '../services/SecureIdService.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_change_me';

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: "Token manquant." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const userObjectId = getSafeObjectId(decoded.id);
    if (!userObjectId) {
      return res.status(403).json({ message: "Token invalide." });
    }

    const user = await User.findById(userObjectId).select('-password');
    if (!user) {
      return res.status(401).json({ message: "Utilisateur introuvable." });
    }
    
    if (user.isActive === false) {
      return res.status(403).json({ message: "Compte désactivé." });
    }
    
    if (decoded.tokenVersion !== user.tokenVersion) {
      return res.status(401).json({ 
        message: "Session révoquée.", 
        code: "SESSION_REPLACED" 
      });
    }

    req.user = user;
    next();
  } catch (err) {
    logger.error(`Auth Error: ${err.message}`);
    return res.status(401).json({ message: "Token invalide ou expiré." });
  }
};

export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    logger.warn(`Accès admin refusé pour ${req.user?.username}`);
    return res.status(403).json({ message: "Accès refusé." });
  }
  next();
};
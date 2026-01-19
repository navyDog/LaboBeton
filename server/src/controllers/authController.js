import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomInt } from 'node:crypto';
import User from '../models/User.js';
import logger from '../config/logger.js';
import { getSafeObjectId } from '../services/SecureIdService.js';
import { handlePasswordUpdate, prepareUserUpdates, validateLogoSize } from '../services/UpdateProfileService.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_change_me';

export const login = async (req, res) => {
  const { username, password } = req.body;
  
  try {
    const safeUsername = String(username);
    const user = await User.findOne({ username: safeUsername });
    
    if (!user) {
      const delay = randomInt(100, 300);
      await new Promise(resolve => setTimeout(resolve, delay));
      return res.status(401).json({ message: "Identifiants incorrects" });
    }
    
    if (user.isActive === false) {
      return res.status(403).json({ message: "Compte désactivé." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Identifiants incorrects" });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      { 
        id: user._id, 
        role: user.role, 
        username: user.username, 
        tokenVersion: user.tokenVersion 
      }, 
      JWT_SECRET, 
      { expiresIn: '12h' }
    );

    logger.info(`Login success: ${safeUsername}`);
    res.json({ 
      token, 
      user: { 
        id: user._id, 
        username: user.username, 
        role: user.role, 
        companyName: user.companyName, 
        logo: user.logo 
      } 
    });
  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const checkAuth = (req, res) => {
  res.json({ status: 'ok', user: req.user.username });
};

export const logoutAll = async (req, res) => {
  try {
    const userObjectId = getSafeObjectId(req.user.id);
    if (!userObjectId) {
      return res.status(403).json({ message: 'Session invalide' });
    }

    const user = await User.findById(userObjectId);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur introuvable" });
    }

    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();

    logger.info(`Global logout triggered for user: ${user.username}`);
    res.json({ message: "Tous les appareils ont été déconnectés." });
  } catch (error) {
    logger.error(`Logout all error: ${error.message}`);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userObjectId = getSafeObjectId(req.user.id);
    if (!userObjectId) {
      return res.status(403).json({ message: 'Session invalide' });
    }

    const user = await User.findById(userObjectId);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur introuvable" });
    }

    const updates = prepareUserUpdates(req.body);
    const validationError = validateLogoSize(req.body.logo);
    if (validationError) {
      return res.status(400).json(validationError);
    }

    const passwordUpdate = await handlePasswordUpdate(req.body.password, user);
    if (passwordUpdate.error) {
      return res.status(400).json(passwordUpdate.error);
    }

    Object.assign(user, updates, passwordUpdate.fields);
    await user.save();

    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.tokenVersion;
    res.json(userObj);
  } catch (error) {
    logger.error(`Profile update error: ${error.message}`);
    res.status(400).json({ message: "Erreur mise à jour" });
  }
};
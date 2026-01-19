import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import logger from '../config/Logger.js';

export const createUser = async (req, res) => {
  try {
    const { username, password, role, companyName, address, contact, isActive } = req.body;
    
    const newUser = new User({
      username: String(username),
      password: await bcrypt.hash(String(password), 10),
      role: role === 'admin' ? 'admin' : 'standard',
      isActive: Boolean(isActive),
      companyName: String(companyName || ''),
      address: String(address || ''),
      contact: String(contact || '')
    });
    
    await newUser.save();
    logger.info(`Admin created user: ${username}`);
    res.status(201).json({ 
      message: "Utilisateur créé", 
      user: { username: newUser.username } 
    });
  } catch (error) { 
    logger.error(`Create user error: ${error.message}`); 
    res.status(500).json({ message: "Erreur création" }); 
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, '-password -tokenVersion')
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    logger.error(`Get users error: ${error.message}`);
    res.status(500).json({ message: "Erreur récupération" }); 
  }
};

export const toggleUserAccess = async (req, res) => {
  try {
    const paramId = req.params.id.toString();
    const currentUserId = req.user.id.toString();
    
    if (paramId === currentUserId) {
      return res.status(400).json({ message: "Action interdite sur soi-même." });
    }
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "Non trouvé" });
    }
    
    user.isActive = !user.isActive;
    if (!user.isActive) {
      user.tokenVersion = (user.tokenVersion || 0) + 1;
    }
    
    await user.save();
    logger.info(`Access toggled for user ${user.username} by admin ${req.user.username}`);
    res.json({ message: "Accès modifié" });
  } catch (error) {
    logger.error(`Toggle access error: ${error.message}`);
    res.status(500).json({ message: "Erreur serveur" }); 
  }
};

export const deleteUser = async (req, res) => {
  try {
    const paramId = req.params.id.toString();
    const currentUserId = req.user.id.toString();
    
    if (paramId === currentUserId) {
      return res.status(400).json({ message: "Action interdite." });
    }
    
    await User.findByIdAndDelete(req.params.id);
    logger.info(`User deleted by admin ${req.user.username}`);
    res.json({ message: "Utilisateur supprimé." });
  } catch (error) {
    logger.error(`Delete user error: ${error.message}`);
    res.status(500).json({ message: "Erreur suppression" }); 
  }
};
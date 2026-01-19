import mongoose from 'mongoose';
import Company from '../models/Company.js';
import logger from '../config/Logger.js';
import { getSafeObjectId } from '../services/SecureIdService.js';

export const getAllCompanies = async (req, res) => {
  try {
    const userObjectId = getSafeObjectId(req.user.id);
    if (!userObjectId) {
      return res.status(403).json({ message: 'Session invalide' });
    }
    
    const companies = await Company.find({ userId: userObjectId })
      .sort({ name: 1 })
      .lean();
    res.json(companies);
  } catch (error) {
    logger.error(`Get Companies Error: ${error.message}`);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const createCompany = async (req, res) => {
  try {
    const userObjectId = getSafeObjectId(req.user.id);
    if (!userObjectId) {
      return res.status(403).json({ message: 'Session invalide' });
    }
    
    const { name, contactName, email, phone } = req.body;
    const newCompany = new Company({ 
      userId: userObjectId,
      name: String(name),
      contactName: String(contactName || ''),
      email: String(email || ''),
      phone: String(phone || '')
    });
    
    await newCompany.save();
    res.status(201).json(newCompany);
  } catch (error) {
    logger.error(`Create Company Error: ${error.message}`);
    res.status(400).json({ message: "Erreur création" }); 
  }
};

export const updateCompany = async (req, res) => {
  try {
    const userObjectId = getSafeObjectId(req.user.id);
    if (!userObjectId) {
      return res.status(403).json({ message: 'Session invalide' });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'ID entreprise invalide' });
    }
    const companyId = new mongoose.Types.ObjectId(req.params.id);

    const { name, contactName, email, phone } = req.body;
    const updates = {};
    
    if (name !== undefined) updates.name = String(name);
    if (contactName !== undefined) updates.contactName = String(contactName);
    if (email !== undefined) updates.email = String(email);
    if (phone !== undefined) updates.phone = String(phone);

    const updated = await Company.findOneAndUpdate(
      { _id: companyId, userId: userObjectId },
      { $set: updates },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Non trouvé" });
    }
    res.json(updated);
  } catch (error) {
    logger.error(`Update Company Error: ${error.message}`);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const deleteCompany = async (req, res) => {
  try {
    const userObjectId = getSafeObjectId(req.user.id);
    if (!userObjectId) {
      return res.status(403).json({ message: 'Session invalide' });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Format ID entreprise invalide' });
    }
    const companyId = new mongoose.Types.ObjectId(req.params.id);

    const deleted = await Company.findOneAndDelete({ 
      _id: companyId,
      userId: userObjectId 
    });

    if (!deleted) {
      return res.status(404).json({ message: "Non trouvé" });
    }
    res.json({ message: "Supprimé" });
  } catch (error) {
    logger.error(`Delete Company Error: ${error.message}`);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
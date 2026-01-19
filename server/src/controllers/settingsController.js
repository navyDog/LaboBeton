import Settings from '../models/Settings.js';
import logger from '../config/logger.js';
import { getSafeObjectId } from '../services/SecureIdService.js';

export const getSettings = async (req, res) => {
  try {
    const userObjectId = getSafeObjectId(req.user.id);
    if (!userObjectId) {
      return res.status(403).json({ message: 'Session invalide' });
    }

    let settings = await Settings.findOne({ userId: userObjectId }).lean();
    
    if (!settings) {
      settings = {
        specimenTypes: ['Cylindrique 16x32', 'Cylindrique 11x22', 'Cubique 15x15'],
        deliveryMethods: ['Toupie', 'Benne', 'Mixer'],
        manufacturingPlaces: ['Centrale BPE', 'Centrale Chantier'],
        mixTypes: [], 
        concreteClasses: [], 
        consistencyClasses: [], 
        curingMethods: [],
        testTypes: [], 
        preparations: [], 
        nfStandards: []
      };
    }
    
    res.json(settings);
  } catch (error) {
    logger.error(`Get Settings Error: ${error.message}`);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const updateSettings = async (req, res) => {
  try {
    const userObjectId = getSafeObjectId(req.user.id);
    if (!userObjectId) {
      return res.status(403).json({ message: 'Session invalide' });
    }

    const allowedArrays = [
      'specimenTypes', 'deliveryMethods', 'manufacturingPlaces', 'mixTypes',
      'concreteClasses', 'consistencyClasses', 'curingMethods', 'testTypes',
      'preparations', 'nfStandards'
    ];
    
    const updates = {};
    allowedArrays.forEach(field => {
      if (Array.isArray(req.body[field])) {
        updates[field] = req.body[field].map(String);
      }
    });

    const settings = await Settings.findOneAndUpdate(
      { userId: userObjectId },
      { $set: updates },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    
    res.json(settings);
  } catch (error) {
    logger.error(`Update Settings Error: ${error.message}`);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
import mongoose from 'mongoose';
import ConcreteTest from '../models/ConcreteTest.js';
import Project from '../models/Project.js';
import logger from '../config/Logger.js';
import { getSafeObjectId } from '../services/SecureIdService.js';

export const getAllTests = async (req, res) => {
  try {
    const userObjectId = getSafeObjectId(req.user.id);
    if (!userObjectId) {
      return res.status(403).json({ message: 'Session invalide' });
    }

    const tests = await ConcreteTest.find({ userId: userObjectId })
      .sort({ sequenceNumber: -1 })
      .populate('projectId', 'name')
      .lean();
    
    res.json(tests);
  } catch (error) {
    logger.error(`Get Concrete Tests Error: ${error.message}`);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const createTest = async (req, res) => {
  try {
    const userObjectId = getSafeObjectId(req.user.id);
    if (!userObjectId) {
      return res.status(403).json({ message: 'Session invalide' });
    }

    const input = req.body;
    
    // Valider projectId
    const projectObjectId = getSafeObjectId(input.projectId);
    if (!projectObjectId) {
      return res.status(400).json({ message: 'Project ID invalide' });
    }

    // Vérifier que le projet appartient à l'utilisateur
    const projectExists = await Project.exists({ 
      _id: projectObjectId, 
      userId: userObjectId 
    });
    
    if (!projectExists) {
      return res.status(404).json({ message: 'Projet introuvable' });
    }

    // Nettoyage specimens
    const cleanSpecimens = Array.isArray(input.specimens) ? input.specimens.map(s => ({
      number: Number(s.number),
      age: Number(s.age),
      castingDate: s.castingDate,
      crushingDate: s.crushingDate,
      specimenType: String(s.specimenType || ''),
      diameter: Number(s.diameter),
      height: Number(s.height),
      surface: Number(s.surface),
      weight: s.weight ? Number(s.weight) : null,
      force: s.force ? Number(s.force) : null,
      stress: s.stress ? Number(s.stress) : null,
      density: s.density ? Number(s.density) : null
    })) : [];

    const newTest = new ConcreteTest({
      userId: userObjectId,
      projectId: projectObjectId,
      projectName: String(input.projectName || ''),
      companyName: String(input.companyName || ''),
      moe: String(input.moe || ''),
      moa: String(input.moa || ''),
      structureName: String(input.structureName || ''),
      elementName: String(input.elementName || ''),
      receptionDate: input.receptionDate,
      samplingDate: input.samplingDate,
      volume: Number(input.volume || 0),
      concreteClass: String(input.concreteClass || ''),
      mixType: String(input.mixType || ''),
      formulaInfo: String(input.formulaInfo || ''),
      manufacturer: String(input.manufacturer || ''),
      manufacturingPlace: String(input.manufacturingPlace || ''),
      deliveryMethod: String(input.deliveryMethod || ''),
      slump: Number(input.slump || 0),
      samplingPlace: String(input.samplingPlace || ''),
      externalTemp: Number(input.externalTemp || 0),
      concreteTemp: Number(input.concreteTemp || 0),
      tightening: String(input.tightening || ''),
      vibrationTime: Number(input.vibrationTime || 0),
      layers: Number(input.layers || 0),
      curing: String(input.curing || ''),
      testType: String(input.testType || ''),
      standard: String(input.standard || ''),
      preparation: String(input.preparation || ''),
      pressMachine: String(input.pressMachine || ''),
      specimens: cleanSpecimens
    });

    await newTest.save();
    res.status(201).json(newTest);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Doublon détecté." });
    }
    logger.error(`Create Test Error: ${error.message}`);
    res.status(500).json({ message: "Erreur création" });
  }
};

export const updateTest = async (req, res) => {
  try {
    const userObjectId = getSafeObjectId(req.user.id);
    if (!userObjectId) {
      return res.status(403).json({ message: 'Session invalide' });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Format ID invalide' });
    }
    const testId = new mongoose.Types.ObjectId(req.params.id);

    const existingTest = await ConcreteTest.findOne({ 
      _id: testId, 
      userId: userObjectId 
    });
    
    if (!existingTest) {
      return res.status(404).json({ message: "Non trouvé" });
    }

    const input = req.body;
    
    // Contrôle de concurrence optimiste
    if (input.__v !== undefined && existingTest.__v !== input.__v) {
      return res.status(409).json({ 
        message: "Conflit de version : Données modifiées par un tiers.",
        latestData: existingTest
      });
    }

    // Mise à jour des champs texte
    const textFields = [
      'structureName', 'elementName', 'mixType', 'formulaInfo', 
      'manufacturer', 'manufacturingPlace', 'deliveryMethod', 
      'samplingPlace', 'tightening', 'curing', 'testType', 
      'standard', 'preparation', 'pressMachine', 'concreteClass'
    ];
    
    textFields.forEach(field => {
      if (input[field] !== undefined) {
        existingTest[field] = String(input[field]);
      }
    });
    
    // Mise à jour des champs numériques
    const numFields = ['volume', 'slump', 'vibrationTime', 'layers', 'externalTemp', 'concreteTemp'];
    numFields.forEach(field => {
      if (input[field] != null) {
        existingTest[field] = Number(input[field]);
      } else if (input.hasOwnProperty(field)) {
        existingTest[field] = null;
      }
    });

    // Mise à jour des dates
    ['receptionDate', 'samplingDate'].forEach(field => {
      if (input[field]) {
        existingTest[field] = new Date(input[field]);
      } else if (input.hasOwnProperty(field)) {
        existingTest[field] = null;
      }
    });

    // Mise à jour des specimens
    if (Array.isArray(input.specimens)) {
      existingTest.specimens = input.specimens.map(s => {
        const newSpecimen = {
          number: Number(s.number),
          age: Number(s.age),
          castingDate: s.castingDate ? new Date(s.castingDate) : null,
          crushingDate: s.crushingDate ? new Date(s.crushingDate) : null,
          specimenType: String(s.specimenType || ''),
          diameter: Number(s.diameter),
          height: Number(s.height),
          surface: Number(s.surface),
          weight: s.weight == null ? null : Number(s.weight),
          force: s.force == null ? null : Number(s.force),
          stress: s.stress == null ? null : Number(s.stress),
          density: s.density == null ? null : Number(s.density)
        };
        if (s._id) newSpecimen._id = String(s._id);
        return newSpecimen;
      });
    }

    const updatedTest = await existingTest.save();
    res.json(updatedTest);
  } catch (error) { 
    logger.error(`Update Concrete Test Error: ${error.message}`);
    res.status(400).json({ message: "Erreur modification" }); 
  }
};

export const deleteTest = async (req, res) => {
  try {
    const userObjectId = getSafeObjectId(req.user.id);
    if (!userObjectId) {
      return res.status(403).json({ message: 'Session invalide' });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Format ID invalide' });
    }

    const testId = new mongoose.Types.ObjectId(req.params.id);

    const deleted = await ConcreteTest.findOneAndDelete({ 
      _id: testId, 
      userId: userObjectId 
    });

    if (!deleted) {
      return res.status(404).json({ message: "Non trouvé" });
    }
    res.json({ message: "Supprimé" });

  } catch (error) {
    logger.error(`Delete Concrete Test Error: ${error.message}`);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
import mongoose from 'mongoose';
import Project from '../models/Project.js';
import ConcreteTest from '../models/ConcreteTest.js';
import logger from '../config/Logger.js';
import { getSafeObjectId } from '../services/SecureIdService.js';
import { sanitizeCSV } from '../services/CsvService.js';

export const getAllProjects = async (req, res) => {
  try {
    const userObjectId = getSafeObjectId(req.user.id);
    if (!userObjectId) {
      return res.status(403).json({ message: 'Session invalide' });
    }
    
    const projects = await Project.find({ userId: userObjectId })
      .sort({ createdAt: -1 })
      .lean();
    res.json(projects);
  } catch (error) {
    logger.error(`Get Projects Error: ${error.message}`);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const createProject = async (req, res) => {
  try {
    const userObjectId = getSafeObjectId(req.user.id);
    if (!userObjectId) {
      return res.status(403).json({ message: 'Session invalide' });
    }
    
    const { name, companyId, companyName, contactName, email, phone, moa, moe } = req.body;
    
    let validCompanyId = null;
    if (companyId) {
      validCompanyId = getSafeObjectId(companyId);
      if (!validCompanyId) {
        return res.status(400).json({ message: 'Company ID invalide' });
      }
    }
    
    const newProject = new Project({
      userId: userObjectId, 
      name: String(name), 
      companyId: validCompanyId,
      companyName: String(companyName || ''), 
      contactName: String(contactName || ''),
      email: String(email || ''), 
      phone: String(phone || ''),
      moa: String(moa || ''), 
      moe: String(moe || '')
    });
    
    await newProject.save();
    res.status(201).json(newProject);
  } catch (error) { 
    logger.error(`Create Project Error: ${error.message}`);
    res.status(400).json({ message: "Erreur création" }); 
  }
};

export const updateProject = async (req, res) => {
  try {
    const userObjectId = getSafeObjectId(req.user.id);
    if (!userObjectId) {
      return res.status(403).json({ message: 'Session invalide' });
    }

    const projectId = getSafeObjectId(req.params.id);
    if (!projectId) {
      return res.status(400).json({ message: 'ID projet invalide' });
    }

    const fields = ['name', 'companyName', 'contactName', 'email', 'phone', 'moa', 'moe'];
    const updates = {};
    
    fields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = String(req.body[field]);
      }
    });

    if (req.body.companyId !== undefined) {
      const validCompanyId = getSafeObjectId(req.body.companyId);
      if (!validCompanyId) {
        return res.status(400).json({ message: 'Company ID invalide' });
      }
      updates.companyId = validCompanyId;
    }

    const updated = await Project.findOneAndUpdate(
      { _id: projectId, userId: userObjectId },
      { $set: updates },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Non trouvé" });
    }

    res.json(updated);
  } catch (error) {
    logger.error(`Update Project Error: ${error.message}`);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const deleteProject = async (req, res) => {
  try {
    const userObjectId = getSafeObjectId(req.user.id);
    if (!userObjectId) {
      return res.status(403).json({ message: 'Session invalide' });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Format ID projet invalide' });
    }
    const projectId = new mongoose.Types.ObjectId(req.params.id);

    const deleted = await Project.findOneAndDelete({ 
      _id: projectId,
      userId: userObjectId 
    });

    if (!deleted) {
      return res.status(404).json({ message: "Non trouvé" });
    }
    
    res.json({ message: "Supprimé" });
  } catch (error) {
    logger.error(`Delete Project Error: ${error.message}`);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const exportProjectCSV = async (req, res) => {
  try {
    const userObjectId = getSafeObjectId(req.user.id);
    if (!userObjectId) {
      return res.status(403).json({ message: 'Session invalide' });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Format ID projet invalide' });
    }
    const projectId = new mongoose.Types.ObjectId(req.params.id);

    const project = await Project.findOne({ _id: projectId, userId: userObjectId });
    if (!project) {
      return res.status(404).json({ message: "Projet introuvable" });
    }

    const tests = await ConcreteTest.find({ 
      projectId: projectId,
      userId: userObjectId 
    }).sort({ samplingDate: -1 });

    const headers = ["Reference", "Date", "Ouvrage", "Partie", "Classe", "Volume", "Eprouvettes"];
    let csv = headers.join(';') + '\n';

    tests.forEach(test => {
      const date = test.samplingDate ? new Date(test.samplingDate).toLocaleDateString('fr-FR') : '';
      const row = [
        sanitizeCSV(test.reference), 
        sanitizeCSV(date), 
        sanitizeCSV(test.structureName),
        sanitizeCSV(test.elementName), 
        sanitizeCSV(test.concreteClass),
        sanitizeCSV((test.volume || 0).toString().replace('.', ',')),
        sanitizeCSV((test.specimenCount || 0).toString())
      ];
      csv += row.join(';') + '\n';
    });

    const safeProjectName = project.name.replaceAll(/[^a-z0-9]/gi, '_');

    res.header('Content-Type', 'text/csv; charset=utf-8');
    res.attachment(`export_affaire_${safeProjectName}.csv`);
    return res.send('\uFEFF' + csv);

  } catch (error) {
    logger.error(`CSV Export Error: ${error.message}`);
    res.status(500).json({ message: "Erreur export CSV" });
  }
};

export const getFullReport = async (req, res) => {
  try {
    const userObjectId = getSafeObjectId(req.user.id);
    if (!userObjectId) {
      return res.status(403).json({ message: 'Session invalide' });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Format ID projet invalide' });
    }
    const projectId = new mongoose.Types.ObjectId(req.params.id);

    const project = await Project.findOne({ 
      _id: projectId, 
      userId: userObjectId 
    });
    
    if (!project) {
      return res.status(404).json({ message: "Projet introuvable" });
    }

    const tests = await ConcreteTest.find({ 
      projectId: projectId,
      userId: userObjectId 
    }).sort({ samplingDate: 1 });

    res.json({ project, tests });
  } catch (error) {
    logger.error(`Report Error: ${error.message}`);
    res.status(500).json({ message: "Erreur génération rapport" });
  }
};
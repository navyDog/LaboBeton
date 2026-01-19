import BugReport from '../models/BugReport.js';
import logger from '../config/Logger.js';

export const createBugReport = async (req, res) => {
  try {
    const { type, description } = req.body;
    await BugReport.create({ 
      type: String(type), 
      description: String(description), 
      user: req.user?.username
    });
    res.json({ message: "Signalement reçu" });
  } catch (error) {
    logger.error(`Create Bug Report Error: ${error.message}`);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const getAllBugReports = async (req, res) => {
  try {
    const bugs = await BugReport.find().sort({ createdAt: -1 });
    res.json(bugs);
  } catch (error) {
    logger.error(`Get Bug Reports Error: ${error.message}`);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const updateBugReport = async (req, res) => {
  try {
    await BugReport.findByIdAndUpdate(
      req.params.id, 
      { 
        status: String(req.body.status), 
        resolvedAt: req.body.status === 'resolved' ? new Date() : null 
      }
    );
    res.json({ success: true });
  } catch (error) {
    logger.error(`Update Bug Report Error: ${error.message}`);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const deleteBugReport = async (req, res) => {
  try {
    await BugReport.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    logger.error(`Delete Bug Report Error: ${error.message}`);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
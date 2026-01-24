import express from 'express';
import mongoose from 'mongoose';
import authRoutes from './AuthRoutes.js';
import userRoutes from './UserRoutes.js';
import companyRoutes from './CompanyRoutes.js';
import projectRoutes from './ProjectRoutes.js';
import concreteTestRoutes from './ConcreteTestRoutes.js';
import settingsRoutes from './SettingsRoutes.js';
import bugReportRoutes from './BugReportRoutes.js';

const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const status = dbState === 1 ? 'CONNECTED' : 'ERROR';
  
  if (status === 'ERROR') {
    res.status(503).json({ status, timestamp: new Date(), dbState });
  } else {
    res.status(200).json({ status, timestamp: new Date(), uptime: process.uptime() });
  }
});

// Routes API
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/companies', companyRoutes);
router.use('/projects', projectRoutes);
router.use('/concrete-tests', concreteTestRoutes);
router.use('/settings', settingsRoutes);
router.use('/bugs', bugReportRoutes);
router.use('/admin/bugs', bugReportRoutes); // Alias pour compatibilité

export default router;
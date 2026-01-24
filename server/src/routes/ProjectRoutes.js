import express from 'express';
import { 
  getAllProjects, 
  createProject, 
  updateProject, 
  deleteProject,
  exportProjectCSV,
  getFullReport
} from '../controllers/projectController.js';
import { authenticateToken } from '../middleware/Auth.js';
import { validateParamId } from '../services/SecureIdService.js';

const router = express.Router();

router.get('/', authenticateToken, getAllProjects);
router.post('/', authenticateToken, createProject);
router.put('/:id', authenticateToken, validateParamId(), updateProject);
router.delete('/:id', authenticateToken, validateParamId(), deleteProject);
router.get('/:id/export/csv', authenticateToken, validateParamId(), exportProjectCSV);
router.get('/:id/full-report', authenticateToken, validateParamId(), getFullReport);

export default router;
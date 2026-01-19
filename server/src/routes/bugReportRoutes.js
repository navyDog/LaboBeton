import express from 'express';
import { 
  createBugReport, 
  getAllBugReports, 
  updateBugReport, 
  deleteBugReport 
} from '../controllers/bugReportController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { validateParamId } from '../services/SecureIdService.js';

const router = express.Router();

router.post('/', authenticateToken, createBugReport);
router.get('/', authenticateToken, requireAdmin, getAllBugReports);
router.put('/:id', authenticateToken, requireAdmin, validateParamId(), updateBugReport);
router.delete('/:id', authenticateToken, requireAdmin, validateParamId(), deleteBugReport);

export default router;
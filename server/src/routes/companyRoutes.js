import express from 'express';
import { getAllCompanies, createCompany, updateCompany, deleteCompany } from '../controllers/companyController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateParamId } from '../services/SecureIdService.js';

const router = express.Router();

router.get('/', authenticateToken, getAllCompanies);
router.post('/', authenticateToken, createCompany);
router.put('/:id', authenticateToken, validateParamId(), updateCompany);
router.delete('/:id', authenticateToken, validateParamId(), deleteCompany);

export default router;
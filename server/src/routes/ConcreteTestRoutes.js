import express from 'express';
import { body } from 'express-validator';
import { getAllTests, createTest, updateTest, deleteTest } from '../controllers/ConcreteTestController.js';
import { authenticateToken } from '../middleware/auth.js';
import { checkValidation } from '../middleware/validation.js';
import { validateParamId } from '../services/SecureIdService.js';

const router = express.Router();

router.get('/', authenticateToken, getAllTests);

router.post('/',
  authenticateToken,
  [
    body('projectId').isMongoId(),
    body('specimens').isArray()
  ],
  checkValidation,
  createTest
);

router.put('/:id', authenticateToken, validateParamId(), updateTest);
router.delete('/:id', authenticateToken, validateParamId(), deleteTest);

export default router;
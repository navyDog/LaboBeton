import express from 'express';
import { body } from 'express-validator';
import { createUser, getAllUsers, toggleUserAccess, deleteUser } from '../controllers/UserController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { checkValidation } from '../middleware/validation.js';
import { validateParamId } from '../services/SecureIdService.js';

const router = express.Router();

router.post('/',
  authenticateToken,
  requireAdmin,
  [
    body('username').trim().isLength({ min: 3 }).escape(),
    body('password').isLength({ min: 8 })
  ],
  checkValidation,
  createUser
);

router.get('/', authenticateToken, requireAdmin, getAllUsers);
router.put('/:id/toggle-access', authenticateToken, requireAdmin, validateParamId(), toggleUserAccess);
router.delete('/:id', authenticateToken, requireAdmin, validateParamId(), deleteUser);

export default router;
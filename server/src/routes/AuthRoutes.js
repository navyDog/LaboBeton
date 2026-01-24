import express from 'express';
import { body } from 'express-validator';
import { login, checkAuth, logoutAll, updateProfile } from '../controllers/AuthController.js';
import { authenticateToken } from '../middleware/auth.js';
import { checkValidation } from '../middleware/validation.js';
import { authLimiter } from '../config/Security.js';

const router = express.Router();

router.post('/login', 
  authLimiter,
  [
    body('username').trim().notEmpty().escape(),
    body('password').notEmpty()
  ],
  checkValidation,
  login
);

router.get('/check', authenticateToken, checkAuth);
router.post('/logout-all', authenticateToken, logoutAll);
router.put('/profile', authenticateToken, updateProfile);

export default router;
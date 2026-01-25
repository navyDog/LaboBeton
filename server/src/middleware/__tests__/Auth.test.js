import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import { authenticateToken, requireAdmin } from '../../middleware/Auth.js';
import User from '../../models/User.js';
import { getSafeObjectId } from '../../services/SecureIdService.js';

jest.mock('jsonwebtoken');
jest.mock('../../models/User.js');
jest.mock('../../config/Logger.js');
jest.mock('../../services/SecureIdService.js');

const app = express();
app.use(express.json());

app.get('/protected', authenticateToken, (req, res) => {
  res.status(200).json({ message: 'Authenticated' });
});

app.get('/admin', authenticateToken, requireAdmin, (req, res) => {
  res.status(200).json({ message: 'Admin Access' });
});

describe('Auth Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if token is missing', async () => {
    const res = await request(app).get('/protected');
    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Token manquant.");
  });

  it('should return 401 if token is invalid', async () => {
    jwt.verify.mockImplementationOnce(() => {
      throw new Error('Invalid token');
    });
    const res = await request(app).get('/protected').set('Authorization', 'Bearer invalid_token');
    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Token invalide ou expiré.");
  });

  it('should return 403 if userObjectId is invalid', async () => {
    jwt.verify.mockReturnValueOnce({ id: 'user_id' });
    getSafeObjectId.mockReturnValueOnce(null);
    const res = await request(app).get('/protected').set('Authorization', 'Bearer token');
    expect(res.status).toBe(403);
    expect(res.body.message).toBe("Token invalide.");
  });

  it('should return 401 if user is not found', async () => {
    jwt.verify.mockReturnValueOnce({ id: 'user_id' });
    getSafeObjectId.mockReturnValueOnce('safe_user_id');
    User.findById.mockReturnValueOnce({
      select: jest.fn().mockResolvedValue(null)
    });
    const res = await request(app).get('/protected').set('Authorization', 'Bearer token');
    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Utilisateur introuvable.");
  });

  it('should return 403 if user is deactivated', async () => {
    jwt.verify.mockReturnValueOnce({ id: 'user_id' });
    getSafeObjectId.mockReturnValueOnce('safe_user_id');
    User.findById.mockReturnValueOnce({
      select: jest.fn().mockResolvedValue({ isActive: false })
    });
    const res = await request(app).get('/protected').set('Authorization', 'Bearer token');
    expect(res.status).toBe(403);
    expect(res.body.message).toBe("Compte désactivé.");
  });

  it('should return 401 if token version is outdated', async () => {
    jwt.verify.mockReturnValueOnce({ id: 'user_id', tokenVersion: 1 });
    getSafeObjectId.mockReturnValueOnce('safe_user_id');
    User.findById.mockReturnValueOnce({
      select: jest.fn().mockResolvedValue({ tokenVersion: 2 })
    });
    const res = await request(app).get('/protected').set('Authorization', 'Bearer token');
    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Session révoquée.");
    expect(res.body.code).toBe("SESSION_REPLACED");
  });

  it('should return 403 if user is not admin', async () => {
    jwt.verify.mockReturnValueOnce({ id: 'user_id' });
    getSafeObjectId.mockReturnValueOnce('safe_user_id');
    User.findById.mockReturnValueOnce({
      select: jest.fn().mockResolvedValue({ role: 'user' })
    });
    const res = await request(app).get('/admin').set('Authorization', 'Bearer token');
    expect(res.status).toBe(403);
    expect(res.body.message).toBe("Accès refusé.");
  });

  it('should authenticate and grant access to protected route', async () => {
    jwt.verify.mockReturnValueOnce({ id: 'user_id', tokenVersion: 1 });
    getSafeObjectId.mockReturnValueOnce('safe_user_id');
    User.findById.mockReturnValueOnce({
      select: jest.fn().mockResolvedValue({ isActive: true, tokenVersion: 1 })
    });
    const res = await request(app).get('/protected').set('Authorization', 'Bearer token');
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Authenticated");
  });

  it('should authenticate and grant access to admin route', async () => {
    jwt.verify.mockReturnValueOnce({ id: 'user_id', tokenVersion: 1 });
    getSafeObjectId.mockReturnValueOnce('safe_user_id');
    User.findById.mockReturnValueOnce({
      select: jest.fn().mockResolvedValue({ role: 'admin', isActive: true, tokenVersion: 1 })
    });
    const res = await request(app).get('/admin').set('Authorization', 'Bearer token');
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Admin Access");
  });
});
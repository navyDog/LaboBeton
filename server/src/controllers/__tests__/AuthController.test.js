import request from 'supertest';
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { login, checkAuth, logoutAll, updateProfile } from '../AuthController.js';
import User from '../../models/User.js';
import { getSafeObjectId } from '../../services/SecureIdService.js';
import { handlePasswordUpdate, prepareUserUpdates, validateLogoSize } from '../../services/UpdateProfileService.js';

jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('../../models/User.js');
jest.mock('../../config/Logger.js');
jest.mock('../../services/SecureIdService.js');
jest.mock('../../services/UpdateProfileService.js');

const app = express();
app.use(express.json());

app.post('/login', login);
app.get('/checkAuth', checkAuth);
app.post('/logoutAll', logoutAll);
app.put('/updateProfile', updateProfile);

describe('AuthController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should return 401 if user is not found', async () => {
      User.findOne.mockResolvedValueOnce(null);
      const res = await request(app).post('/login').send({ username: 'testuser', password: 'password' });
      expect(res.status).toBe(401);
      expect(res.body.message).toBe("Identifiants incorrects");
    });

    it('should return 403 if user is deactivated', async () => {
      User.findOne.mockResolvedValueOnce({ isActive: false });
      const res = await request(app).post('/login').send({ username: 'testuser', password: 'password' });
      expect(res.status).toBe(403);
      expect(res.body.message).toBe("Compte désactivé.");
    });

    it('should return 401 if password is incorrect', async () => {
      bcrypt.compare.mockResolvedValueOnce(false);
      User.findOne.mockResolvedValueOnce({ isActive: true, password: 'hashedpassword' });
      const res = await request(app).post('/login').send({ username: 'testuser', password: 'wrongpassword' });
      expect(res.status).toBe(401);
      expect(res.body.message).toBe("Identifiants incorrects");
    });

    it('should return 200 and token if login is successful', async () => {
      bcrypt.compare.mockResolvedValueOnce(true);
      User.findOne.mockResolvedValueOnce({
        _id: 'user_id',
        role: 'user',
        username: 'testuser',
        password: 'hashedpassword',
        tokenVersion: 1,
        companyName: 'Test Company',
        logo: 'logo.png',
        save: jest.fn().mockResolvedValueOnce(true)
      });
      jwt.sign.mockReturnValueOnce('token');
      const res = await request(app).post('/login').send({ username: 'testuser', password: 'password' });
      expect(res.status).toBe(200);
      expect(res.body.token).toBe('token');
      expect(res.body.user).toEqual({
        id: 'user_id',
        username: 'testuser',
        role: 'user',
        companyName: 'Test Company',
        logo: 'logo.png'
      });
    });

    it('should return 500 if an error occurs', async () => {
      User.findOne.mockRejectedValueOnce(new Error('Database error'));
      const res = await request(app).post('/login').send({ username: 'testuser', password: 'password' });
      expect(res.status).toBe(500);
      expect(res.body.message).toBe("Erreur serveur");
    });
  });

  describe('checkAuth', () => {
    it('should return 200 with user status', async () => {
      const req = { user: { username: 'testuser' } };
      const res = {
        json: jest.fn().mockReturnThis(),
      };
      await checkAuth(req, res);
      expect(res.json).toHaveBeenCalledWith({ status: 'ok', user: 'testuser' });
    });
  });

  describe('logoutAll', () => {
    it('should return 403 if session is invalid', async () => {
      getSafeObjectId.mockReturnValueOnce(null);
      const res = await request(app).post('/logoutAll').set('Authorization', 'Bearer token');
      expect(res.status).toBe(403);
      expect(res.body.message).toBe('Session invalide');
    });

    it('should return 404 if user is not found', async () => {
      getSafeObjectId.mockReturnValueOnce('safe_user_id');
      User.findById.mockResolvedValueOnce(null);
      const res = await request(app).post('/logoutAll').set('Authorization', 'Bearer token');
      expect(res.status).toBe(404);
      expect(res.body.message).toBe("Utilisateur introuvable");
    });

    it('should return 200 and logout all devices', async () => {
      getSafeObjectId.mockReturnValueOnce('safe_user_id');
      User.findById.mockResolvedValueOnce({
        tokenVersion: 1,
        username: 'testuser',
        save: jest.fn().mockResolvedValueOnce(true)
      });
      const res = await request(app).post('/logoutAll').set('Authorization', 'Bearer token');
      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Tous les appareils ont été déconnectés.");
    });

    it('should return 500 if an error occurs', async () => {
      getSafeObjectId.mockReturnValueOnce('safe_user_id');
      User.findById.mockRejectedValueOnce(new Error('Database error'));
      const res = await request(app).post('/logoutAll').set('Authorization', 'Bearer token');
      expect(res.status).toBe(500);
      expect(res.body.message).toBe("Erreur serveur");
    });
  });

  describe('updateProfile', () => {
    it('should return 403 if session is invalid', async () => {
      getSafeObjectId.mockReturnValueOnce(null);
      const res = await request(app).put('/updateProfile').set('Authorization', 'Bearer token');
      expect(res.status).toBe(403);
      expect(res.body.message).toBe('Session invalide');
    });

    it('should return 404 if user is not found', async () => {
      getSafeObjectId.mockReturnValueOnce('safe_user_id');
      User.findById.mockResolvedValueOnce(null);
      const res = await request(app).put('/updateProfile').set('Authorization', 'Bearer token');
      expect(res.status).toBe(404);
      expect(res.body.message).toBe("Utilisateur introuvable");
    });

    it('should return 400 if logo size validation fails', async () => {
      getSafeObjectId.mockReturnValueOnce('safe_user_id');
      User.findById.mockResolvedValueOnce({});
      validateLogoSize.mockReturnValueOnce({ error: 'Logo size too large' });
      const res = await request(app).put('/updateProfile').set('Authorization', 'Bearer token').send({ logo: 'large_logo.png' });
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'Logo size too large' });
    });

    it('should return 400 if password update fails', async () => {
      getSafeObjectId.mockReturnValueOnce('safe_user_id');
      User.findById.mockResolvedValueOnce({});
      handlePasswordUpdate.mockResolvedValueOnce({ error: 'Password update failed' });
      const res = await request(app).put('/updateProfile').set('Authorization', 'Bearer token').send({ password: 'newpassword' });
      expect(res.status).toBe(400);
      expect(res.body).toEqual('Password update failed');
    });

    it('should return 200 and updated user profile', async () => {
      getSafeObjectId.mockReturnValueOnce('safe_user_id');
      const userMock = {
        save: jest.fn().mockResolvedValueOnce(true),
        toObject: jest.fn().mockReturnValueOnce({
          password: 'hashedpassword',
          tokenVersion: 1,
          otherField: 'updatedValue'
        })
      };
      User.findById.mockResolvedValueOnce(userMock);
      prepareUserUpdates.mockReturnValueOnce({ otherField: 'updatedValue' });
      handlePasswordUpdate.mockResolvedValueOnce({ fields: { password: 'newhashedpassword' } });

      // Apply the updates to the user mock
      Object.assign(userMock, { otherField: 'updatedValue', password: 'newhashedpassword' });

      const res = await request(app).put('/updateProfile').set('Authorization', 'Bearer token').send({ otherField: 'updatedValue', password: 'newpassword' });
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ otherField: 'updatedValue' });
    });

    it('should return 400 if an error occurs', async () => {
      getSafeObjectId.mockReturnValueOnce('safe_user_id');
      User.findById.mockRejectedValueOnce(new Error('Database error'));
      const res = await request(app).put('/updateProfile').set('Authorization', 'Bearer token');
      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Erreur mise à jour");
    });
  });
});
import bcrypt from 'bcryptjs';
import User from '../../models/User';
import { createUser, getAllUsers, toggleUserAccess, deleteUser } from '../UserController';
import express from 'express';

jest.mock('bcryptjs');
jest.mock('../../models/User');
jest.mock('../../config/Logger');

const app = express();
app.use(express.json());
app.post('/users', createUser);
app.get('/users', getAllUsers);
app.put('/users/:id/toggle', toggleUserAccess);
app.delete('/users/:id', deleteUser);

describe('UserController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('should create a new user', async () => {
      const req = {
        body: {
          username: 'testuser',
          password: 'password',
          role: 'admin',
          companyName: 'Test Company',
          address: 'Test Address',
          contact: 'Test Contact',
          isActive: true
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      bcrypt.hash.mockResolvedValue('hashedpassword');
      User.mockImplementation(() => ({
        save: jest.fn().mockResolvedValue(true)
      }));

      await createUser(req, res);

      expect(bcrypt.hash).toHaveBeenCalledWith('password', 10);
      expect(User).toHaveBeenCalledWith({
        username: 'testuser',
        password: 'hashedpassword',
        role: 'admin',
        isActive: true,
        companyName: 'Test Company',
        address: 'Test Address',
        contact: 'Test Contact'
      });
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should handle errors', async () => {
      const req = {
        body: {
          username: 'testuser',
          password: 'password',
          role: 'admin',
          companyName: 'Test Company',
          address: 'Test Address',
          contact: 'Test Contact',
          isActive: true
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      bcrypt.hash.mockRejectedValue(new Error('Hash error'));

      await createUser(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Erreur création" });
    });
  });

  describe('getAllUsers', () => {
    it('should get all users', async () => {
      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      User.find.mockResolvedValue([{ username: 'user1' }, { username: 'user2' }]);

      await getAllUsers(req, res);

      expect(User.find).toHaveBeenCalledWith({}, '-password -tokenVersion');
    });

    it('should handle errors', async () => {
      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await getAllUsers(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Erreur récupération" });
    });
  });

  describe('toggleUserAccess', () => {
    it('should toggle user access', async () => {
      const req = {
        params: { id: 'userid' },
        user: { id: 'adminid', username: 'adminuser' }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      User.findById.mockResolvedValue({
        isActive: true,
        tokenVersion: 0,
        save: jest.fn().mockResolvedValue(true)
      });

      await toggleUserAccess(req, res);

      expect(User.findById).toHaveBeenCalledWith('userid');
      expect(res.json).toHaveBeenCalledWith({ message: "Accès modifié" });
    });

    it('should handle errors', async () => {
      const req = {
        params: { id: 'userid' },
        user: { id: 'adminid', username: 'adminuser' }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      User.findById.mockRejectedValue(new Error('Find error'));

      await toggleUserAccess(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Erreur serveur" });
    });
  });

  describe('deleteUser', () => {
    it('should delete a user', async () => {
      const req = {
        params: { id: 'userid' },
        user: { id: 'adminid', username: 'adminuser' }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      User.findByIdAndDelete.mockResolvedValue(true);

      await deleteUser(req, res);

      expect(User.findByIdAndDelete).toHaveBeenCalledWith('userid');
      expect(res.json).toHaveBeenCalledWith({ message: "Utilisateur supprimé." });
    });

    it('should handle errors', async () => {
      const req = {
        params: { id: 'userid' },
        user: { id: 'adminid', username: 'adminuser' }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      User.findByIdAndDelete.mockRejectedValue(new Error('Delete error'));

      await deleteUser(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Erreur suppression" });
    });
  });
});
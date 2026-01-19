import request from 'supertest';
import express from 'express';
import { createBugReport, getAllBugReports, updateBugReport, deleteBugReport } from '../BugReportController.js';
import BugReport from '../../models/BugReport.js';
import logger from '../../config/Logger.js';

jest.mock('../../models/BugReport.js');
jest.mock('../../config/Logger.js');

const app = express();
app.use(express.json());

app.post('/bug-reports', createBugReport);
app.get('/bug-reports', getAllBugReports);
app.put('/bug-reports/:id', updateBugReport);
app.delete('/bug-reports/:id', deleteBugReport);

describe('BugReportController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createBugReport', () => {
    it('should create a bug report and return success message', async () => {
      BugReport.create.mockResolvedValueOnce({});
      const res = await request(app).post('/bug-reports').send({ type: 'bug', description: 'Test bug' }).set('Authorization', 'Bearer token');
      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Signalement reçu");
      expect(BugReport.create).toHaveBeenCalledWith({
        type: 'bug',
        description: 'Test bug',
        user: undefined // Assuming req.user.username is undefined in the test context
      });
    });

    it('should return 500 if an error occurs', async () => {
      BugReport.create.mockRejectedValueOnce(new Error('Database error'));
      const res = await request(app).post('/bug-reports').send({ type: 'bug', description: 'Test bug' }).set('Authorization', 'Bearer token');
      expect(res.status).toBe(500);
      expect(res.body.message).toBe("Erreur serveur");
      expect(logger.error).toHaveBeenCalledWith("Create Bug Report Error: Database error");
    });
  });

  describe('updateBugReport', () => {
    it('should update a bug report and return success message', async () => {
      BugReport.findByIdAndUpdate.mockResolvedValueOnce({});
      const res = await request(app).put('/bug-reports/1').send({ status: 'resolved' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(BugReport.findByIdAndUpdate).toHaveBeenCalledWith(
        '1',
        {
          status: 'resolved',
          resolvedAt: expect.any(Date)
        }
      );
    });

    it('should return 500 if an error occurs', async () => {
      BugReport.findByIdAndUpdate.mockRejectedValueOnce(new Error('Database error'));
      const res = await request(app).put('/bug-reports/1').send({ status: 'resolved' });
      expect(res.status).toBe(500);
      expect(res.body.message).toBe("Erreur serveur");
      expect(logger.error).toHaveBeenCalledWith("Update Bug Report Error: Database error");
    });
  });

  describe('deleteBugReport', () => {
    it('should delete a bug report and return success message', async () => {
      BugReport.findByIdAndDelete.mockResolvedValueOnce({});
      const res = await request(app).delete('/bug-reports/1');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(BugReport.findByIdAndDelete).toHaveBeenCalledWith('1');
    });

    it('should return 500 if an error occurs', async () => {
      BugReport.findByIdAndDelete.mockRejectedValueOnce(new Error('Database error'));
      const res = await request(app).delete('/bug-reports/1');
      expect(res.status).toBe(500);
      expect(res.body.message).toBe("Erreur serveur");
      expect(logger.error).toHaveBeenCalledWith("Delete Bug Report Error: Database error");
    });
  });
});
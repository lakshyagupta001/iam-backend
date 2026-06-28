import { describe, it, expect, jest, afterEach } from '@jest/globals';
import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import { reportsRoutes } from './reports.routes';
import { permissionService } from '../../iam/evaluation/evaluation.service';

// Mock the auth middleware to simulate a logged-in user
jest.mock('../../../shared/middleware/auth.middleware', () => ({
  authMiddleware: (req: Request, res: Response, next: NextFunction) => {
    // Inject a fake non-root user
    req.user = {
      id: 'user-123',
      organizationId: 'org-123',
      isRoot: false,
      name: 'Test User',
      email: 'test@example.com'
    } as any;
    next();
  }
}));

// Mock the permission service to control authorization outcomes
jest.mock('../../iam/evaluation/evaluation.service', () => ({
  permissionService: {
    canPerformAction: jest.fn<any>()
  }
}));

// Mock reports service
jest.mock('./reports.service', () => ({
  reportsService: {
    listReports: jest.fn<any>().mockImplementation(() => Promise.resolve([])),
    createReport: jest.fn<any>().mockImplementation(() => Promise.resolve({ id: 'report-123' })),
    getReport: jest.fn<any>().mockImplementation(() => Promise.resolve({ id: 'report-123' })),
    updateReport: jest.fn<any>().mockImplementation(() => Promise.resolve({ id: 'report-123' })),
    deleteReport: jest.fn<any>().mockImplementation(() => Promise.resolve(true)),
  }
}));

const app = express();
app.use(express.json());
app.use('/api/reports', reportsRoutes);

describe('Reports Protected Resource Module', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/reports', () => {
    it('should return 200 when user is authorized', async () => {
      // Setup mock to allow access
      (permissionService.canPerformAction as any).mockImplementation(() => Promise.resolve(true));

      const response = await request(app).get('/api/reports');
      expect(response.status).toBe(200);
      expect(permissionService.canPerformAction).toHaveBeenCalledWith('user-123', 'reports:Read');
    });

    it('should return 403 when user is unauthorized', async () => {
      // Setup mock to deny access
      (permissionService.canPerformAction as any).mockImplementation(() => Promise.resolve(false));

      const response = await request(app).get('/api/reports');
      expect(response.status).toBe(403);
      expect(response.body.message).toMatch(/Access denied/);
      expect(permissionService.canPerformAction).toHaveBeenCalledWith('user-123', 'reports:Read');
    });
  });

  describe('POST /api/reports', () => {
    it('should return 201 when user is authorized', async () => {
      (permissionService.canPerformAction as any).mockImplementation(() => Promise.resolve(true));

      const response = await request(app)
        .post('/api/reports')
        .send({ title: 'New Report', status: 'Draft' });
      
      expect(response.status).toBe(201);
      expect(permissionService.canPerformAction).toHaveBeenCalledWith('user-123', 'reports:Create');
    });

    it('should return 403 when user is unauthorized', async () => {
      (permissionService.canPerformAction as any).mockImplementation(() => Promise.resolve(false));

      const response = await request(app)
        .post('/api/reports')
        .send({ title: 'New Report', status: 'Draft' });
      
      expect(response.status).toBe(403);
      expect(permissionService.canPerformAction).toHaveBeenCalledWith('user-123', 'reports:Create');
    });
  });

  describe('PUT /api/reports/:id', () => {
    it('should return 200 when user is authorized', async () => {
      (permissionService.canPerformAction as any).mockImplementation(() => Promise.resolve(true));

      const response = await request(app)
        .put('/api/reports/123')
        .send({ title: 'Updated Report' });
      
      expect(response.status).toBe(200);
      expect(permissionService.canPerformAction).toHaveBeenCalledWith('user-123', 'reports:Update');
    });
  });

  describe('DELETE /api/reports/:id', () => {
    it('should return 200 when user is authorized', async () => {
      (permissionService.canPerformAction as any).mockImplementation(() => Promise.resolve(true));

      const response = await request(app).delete('/api/reports/123');
      
      expect(response.status).toBe(200);
      expect(permissionService.canPerformAction).toHaveBeenCalledWith('user-123', 'reports:Delete');
    });
  });
});

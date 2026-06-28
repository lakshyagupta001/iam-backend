import { describe, it, expect, jest, afterEach } from '@jest/globals';
import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import { alertsRoutes } from './alerts.routes';
import { permissionService } from '../../iam/evaluation/evaluation.service';

// Mock the auth middleware
jest.mock('../../../shared/middleware/auth.middleware', () => ({
  authMiddleware: (req: Request, res: Response, next: NextFunction) => {
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

// Mock the permission service
jest.mock('../../iam/evaluation/evaluation.service', () => ({
  permissionService: {
    canPerformAction: jest.fn<any>()
  }
}));

// Mock alerts service
jest.mock('./alerts.service', () => ({
  alertsService: {
    listAlerts: jest.fn<any>().mockImplementation(() => Promise.resolve([])),
    createAlert: jest.fn<any>().mockImplementation(() => Promise.resolve({ id: 'alert-123' })),
    getAlert: jest.fn<any>().mockImplementation(() => Promise.resolve({ id: 'alert-123' })),
    updateAlert: jest.fn<any>().mockImplementation(() => Promise.resolve({ id: 'alert-123' })),
    deleteAlert: jest.fn<any>().mockImplementation(() => Promise.resolve(true)),
  }
}));

const app = express();
app.use(express.json());
app.use('/api/alerts', alertsRoutes);

describe('Alerts Protected Resource Module', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/alerts', () => {
    it('should return 200 when user is authorized', async () => {
      (permissionService.canPerformAction as any).mockImplementation(() => Promise.resolve(true));
      const response = await request(app).get('/api/alerts');
      expect(response.status).toBe(200);
      expect(permissionService.canPerformAction).toHaveBeenCalledWith('user-123', 'alerts:Read');
    });

    it('should return 403 when user is unauthorized', async () => {
      (permissionService.canPerformAction as any).mockImplementation(() => Promise.resolve(false));
      const response = await request(app).get('/api/alerts');
      expect(response.status).toBe(403);
      expect(permissionService.canPerformAction).toHaveBeenCalledWith('user-123', 'alerts:Read');
    });
  });

  describe('POST /api/alerts', () => {
    it('should return 201 when user is authorized', async () => {
      (permissionService.canPerformAction as any).mockImplementation(() => Promise.resolve(true));
      const response = await request(app)
        .post('/api/alerts')
        .send({ title: 'New Alert', message: 'Alert message', severity: 'High' });
      console.log(response.body);
      expect(response.status).toBe(201);
      expect(permissionService.canPerformAction).toHaveBeenCalledWith('user-123', 'alerts:Create');
    });
  });

  describe('PUT /api/alerts/:id', () => {
    it('should return 200 when user is authorized', async () => {
      (permissionService.canPerformAction as any).mockImplementation(() => Promise.resolve(true));
      const response = await request(app)
        .put('/api/alerts/123')
        .send({ title: 'Updated Alert' });
      expect(response.status).toBe(200);
      expect(permissionService.canPerformAction).toHaveBeenCalledWith('user-123', 'alerts:Update');
    });
  });

  describe('DELETE /api/alerts/:id', () => {
    it('should return 200 when user is authorized', async () => {
      (permissionService.canPerformAction as any).mockImplementation(() => Promise.resolve(true));
      const response = await request(app).delete('/api/alerts/123');
      expect(response.status).toBe(200);
      expect(permissionService.canPerformAction).toHaveBeenCalledWith('user-123', 'alerts:Delete');
    });
  });
});

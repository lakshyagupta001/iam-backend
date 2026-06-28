import { describe, it, expect, jest, afterEach } from '@jest/globals';
import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import { auditRoutes } from './audit.routes';
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

// Mock audit service
jest.mock('./audit.service', () => ({
  auditService: {
    listLogs: jest.fn<any>().mockImplementation(() => Promise.resolve([])),
  }
}));

const app = express();
app.use(express.json());
app.use('/api/audit', auditRoutes);

describe('Audit Protected Resource Module', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/audit', () => {
    it('should return 200 when user is authorized', async () => {
      (permissionService.canPerformAction as any).mockImplementation(() => Promise.resolve(true));
      const response = await request(app).get('/api/audit');
      expect(response.status).toBe(200);
      expect(permissionService.canPerformAction).toHaveBeenCalledWith('user-123', 'audit:Read');
    });

    it('should return 403 when user is unauthorized', async () => {
      (permissionService.canPerformAction as any).mockImplementation(() => Promise.resolve(false));
      const response = await request(app).get('/api/audit');
      expect(response.status).toBe(403);
      expect(permissionService.canPerformAction).toHaveBeenCalledWith('user-123', 'audit:Read');
    });
  });
});

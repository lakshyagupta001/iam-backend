import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { permissionService } from './permission.service';
import { permissionRepository } from './permission.repository';
import { IamAction } from '../policy/policy.constants';
import { Effect, PolicyStatement } from '@prisma/client';

// Mock the repository so we don't hit the database
jest.mock('./permission.repository');

const mockedRepo = permissionRepository as jest.Mocked<typeof permissionRepository>;

// Helper to create a fake statement
const createStatement = (effect: Effect, actions: string[]): PolicyStatement => ({
  id: 'stmt-id',
  policyId: 'pol-id',
  effect,
  actions,
  resource: '*',
});

describe('PermissionService Engine Rules', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('evaluateStatements', () => {
    it('returns true if an Explicit Allow is found and no Deny is found', () => {
      const statements = [createStatement('ALLOW', ['reports:List'])];
      const result = permissionService.evaluateStatements(statements, 'reports:List' as IamAction);
      expect(result).toBe(true);
    });

    it('returns false for Implicit Deny (no allow found)', () => {
      const statements = [createStatement('ALLOW', ['reports:Create'])]; // Wrong action
      const result = permissionService.evaluateStatements(statements, 'reports:List' as IamAction);
      expect(result).toBe(false);
    });

    it('returns false if Explicit Deny overrides Allow', () => {
      const statements = [
        createStatement('ALLOW', ['reports:List']),
        createStatement('DENY', ['reports:List']),
      ];
      const result = permissionService.evaluateStatements(statements, 'reports:List' as IamAction);
      expect(result).toBe(false);
    });

    it('supports wildcard * in actions', () => {
      const statements = [createStatement('ALLOW', ['*'])];
      expect(permissionService.evaluateStatements(statements, 'reports:List' as IamAction)).toBe(true);
      
      const statementsDeny = [createStatement('ALLOW', ['*']), createStatement('DENY', ['*'])];
      expect(permissionService.evaluateStatements(statementsDeny, 'reports:List' as IamAction)).toBe(false);
    });
    
    it('returns false when no statements provided (Implicit Deny)', () => {
      expect(permissionService.evaluateStatements([], 'reports:List' as IamAction)).toBe(false);
    });
  });

  describe('canPerformAction', () => {
    const userId = 'user-1';

    it('returns true immediately for root user', async () => {
      mockedRepo.getEvaluationData.mockResolvedValue({
        id: userId,
        isRoot: true,
        statements: [createStatement('DENY', ['*'])], // Root bypasses even explicit deny
        boundaryStatements: [createStatement('DENY', ['*'])], 
      });

      const result = await permissionService.canPerformAction(userId, 'reports:List' as IamAction);
      expect(result).toBe(true);
    });

    it('returns false if user not found', async () => {
      mockedRepo.getEvaluationData.mockResolvedValue(null);
      const result = await permissionService.canPerformAction(userId, 'reports:List' as IamAction);
      expect(result).toBe(false);
    });

    it('evaluates multiple statements correctly', async () => {
      mockedRepo.getEvaluationData.mockResolvedValue({
        id: userId,
        isRoot: false,
        statements: [
          createStatement('ALLOW', ['reports:List', 'reports:Read']),
          createStatement('ALLOW', ['alerts:List']),
        ],
        boundaryStatements: null,
      });

      expect(await permissionService.canPerformAction(userId, 'reports:List' as IamAction)).toBe(true);
      expect(await permissionService.canPerformAction(userId, 'reports:Create' as IamAction)).toBe(false); // Implicit deny
    });

    it('handles duplicate policies/statements gracefully', async () => {
      mockedRepo.getEvaluationData.mockResolvedValue({
        id: userId,
        isRoot: false,
        statements: [
          createStatement('ALLOW', ['reports:List']),
          createStatement('ALLOW', ['reports:List']),
          createStatement('ALLOW', ['reports:List']),
        ],
        boundaryStatements: null,
      });

      expect(await permissionService.canPerformAction(userId, 'reports:List' as IamAction)).toBe(true);
    });

    it('blocks access if boundary Denies an explicitly allowed action', async () => {
      mockedRepo.getEvaluationData.mockResolvedValue({
        id: userId,
        isRoot: false,
        statements: [createStatement('ALLOW', ['reports:List'])],
        boundaryStatements: [createStatement('DENY', ['reports:List'])],
      });

      const result = await permissionService.canPerformAction(userId, 'reports:List' as IamAction);
      expect(result).toBe(false); // Denied by boundary
    });

    it('blocks access if boundary lacks an Allow for an explicitly allowed action', async () => {
      mockedRepo.getEvaluationData.mockResolvedValue({
        id: userId,
        isRoot: false,
        statements: [createStatement('ALLOW', ['reports:List'])],
        boundaryStatements: [createStatement('ALLOW', ['reports:Read'])], // Boundary implicitly denies List
      });

      const result = await permissionService.canPerformAction(userId, 'reports:List' as IamAction);
      expect(result).toBe(false); // Implicit deny in boundary
    });

    it('allows access if action is Allowed in policies and Allowed in boundary', async () => {
      mockedRepo.getEvaluationData.mockResolvedValue({
        id: userId,
        isRoot: false,
        statements: [createStatement('ALLOW', ['reports:List', 'reports:Create'])],
        boundaryStatements: [createStatement('ALLOW', ['reports:List', 'alerts:List'])], 
      });

      // reports:List is allowed in both
      expect(await permissionService.canPerformAction(userId, 'reports:List' as IamAction)).toBe(true);
      
      // reports:Create is allowed in base, but NOT boundary
      expect(await permissionService.canPerformAction(userId, 'reports:Create' as IamAction)).toBe(false);

      // alerts:List is allowed in boundary, but NOT base (boundary never grants)
      expect(await permissionService.canPerformAction(userId, 'alerts:List' as IamAction)).toBe(false);
    });
  });
});

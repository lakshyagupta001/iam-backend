"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const permission_service_1 = require("./permission.service");
const permission_repository_1 = require("./permission.repository");
// Mock the repository so we don't hit the database
globals_1.jest.mock('./permission.repository');
const mockedRepo = permission_repository_1.permissionRepository;
// Helper to create a fake statement
const createStatement = (effect, actions) => ({
    id: 'stmt-id',
    policyId: 'pol-id',
    effect,
    actions,
    resource: '*',
});
(0, globals_1.describe)('PermissionService Engine Rules', () => {
    (0, globals_1.beforeEach)(() => {
        globals_1.jest.resetAllMocks();
    });
    (0, globals_1.describe)('evaluateStatements', () => {
        (0, globals_1.it)('returns true if an Explicit Allow is found and no Deny is found', () => {
            const statements = [createStatement('ALLOW', ['reports:List'])];
            const result = permission_service_1.permissionService.evaluateStatements(statements, 'reports:List');
            (0, globals_1.expect)(result).toBe(true);
        });
        (0, globals_1.it)('returns false for Implicit Deny (no allow found)', () => {
            const statements = [createStatement('ALLOW', ['reports:Create'])]; // Wrong action
            const result = permission_service_1.permissionService.evaluateStatements(statements, 'reports:List');
            (0, globals_1.expect)(result).toBe(false);
        });
        (0, globals_1.it)('returns false if Explicit Deny overrides Allow', () => {
            const statements = [
                createStatement('ALLOW', ['reports:List']),
                createStatement('DENY', ['reports:List']),
            ];
            const result = permission_service_1.permissionService.evaluateStatements(statements, 'reports:List');
            (0, globals_1.expect)(result).toBe(false);
        });
        (0, globals_1.it)('supports wildcard * in actions', () => {
            const statements = [createStatement('ALLOW', ['*'])];
            (0, globals_1.expect)(permission_service_1.permissionService.evaluateStatements(statements, 'reports:List')).toBe(true);
            const statementsDeny = [createStatement('ALLOW', ['*']), createStatement('DENY', ['*'])];
            (0, globals_1.expect)(permission_service_1.permissionService.evaluateStatements(statementsDeny, 'reports:List')).toBe(false);
        });
        (0, globals_1.it)('returns false when no statements provided (Implicit Deny)', () => {
            (0, globals_1.expect)(permission_service_1.permissionService.evaluateStatements([], 'reports:List')).toBe(false);
        });
    });
    (0, globals_1.describe)('canPerformAction', () => {
        const userId = 'user-1';
        (0, globals_1.it)('returns true immediately for root user', async () => {
            mockedRepo.getEvaluationData.mockResolvedValue({
                id: userId,
                isRoot: true,
                statements: [createStatement('DENY', ['*'])], // Root bypasses even explicit deny
                boundaryStatements: [createStatement('DENY', ['*'])],
            });
            const result = await permission_service_1.permissionService.canPerformAction(userId, 'reports:List');
            (0, globals_1.expect)(result).toBe(true);
        });
        (0, globals_1.it)('returns false if user not found', async () => {
            mockedRepo.getEvaluationData.mockResolvedValue(null);
            const result = await permission_service_1.permissionService.canPerformAction(userId, 'reports:List');
            (0, globals_1.expect)(result).toBe(false);
        });
        (0, globals_1.it)('evaluates multiple statements correctly', async () => {
            mockedRepo.getEvaluationData.mockResolvedValue({
                id: userId,
                isRoot: false,
                statements: [
                    createStatement('ALLOW', ['reports:List', 'reports:Read']),
                    createStatement('ALLOW', ['alerts:List']),
                ],
                boundaryStatements: null,
            });
            (0, globals_1.expect)(await permission_service_1.permissionService.canPerformAction(userId, 'reports:List')).toBe(true);
            (0, globals_1.expect)(await permission_service_1.permissionService.canPerformAction(userId, 'reports:Create')).toBe(false); // Implicit deny
        });
        (0, globals_1.it)('handles duplicate policies/statements gracefully', async () => {
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
            (0, globals_1.expect)(await permission_service_1.permissionService.canPerformAction(userId, 'reports:List')).toBe(true);
        });
        (0, globals_1.it)('blocks access if boundary Denies an explicitly allowed action', async () => {
            mockedRepo.getEvaluationData.mockResolvedValue({
                id: userId,
                isRoot: false,
                statements: [createStatement('ALLOW', ['reports:List'])],
                boundaryStatements: [createStatement('DENY', ['reports:List'])],
            });
            const result = await permission_service_1.permissionService.canPerformAction(userId, 'reports:List');
            (0, globals_1.expect)(result).toBe(false); // Denied by boundary
        });
        (0, globals_1.it)('blocks access if boundary lacks an Allow for an explicitly allowed action', async () => {
            mockedRepo.getEvaluationData.mockResolvedValue({
                id: userId,
                isRoot: false,
                statements: [createStatement('ALLOW', ['reports:List'])],
                boundaryStatements: [createStatement('ALLOW', ['reports:Read'])], // Boundary implicitly denies List
            });
            const result = await permission_service_1.permissionService.canPerformAction(userId, 'reports:List');
            (0, globals_1.expect)(result).toBe(false); // Implicit deny in boundary
        });
        (0, globals_1.it)('allows access if action is Allowed in policies and Allowed in boundary', async () => {
            mockedRepo.getEvaluationData.mockResolvedValue({
                id: userId,
                isRoot: false,
                statements: [createStatement('ALLOW', ['reports:List', 'reports:Create'])],
                boundaryStatements: [createStatement('ALLOW', ['reports:List', 'alerts:List'])],
            });
            // reports:List is allowed in both
            (0, globals_1.expect)(await permission_service_1.permissionService.canPerformAction(userId, 'reports:List')).toBe(true);
            // reports:Create is allowed in base, but NOT boundary
            (0, globals_1.expect)(await permission_service_1.permissionService.canPerformAction(userId, 'reports:Create')).toBe(false);
            // alerts:List is allowed in boundary, but NOT base (boundary never grants)
            (0, globals_1.expect)(await permission_service_1.permissionService.canPerformAction(userId, 'alerts:List')).toBe(false);
        });
    });
});

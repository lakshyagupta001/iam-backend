import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { boundaryService } from './boundary.service';
import { prisma } from '../../prisma/client';
import { PolicyType, Effect } from '@prisma/client';

// ──────────────────────────────────────────────────────────────────────────────
// Mock Prisma — boundary service is pure DB orchestration, no HTTP
// ──────────────────────────────────────────────────────────────────────────────

jest.mock('../../prisma/client', () => ({
  prisma: {
    user: { findFirst: jest.fn() },
    policy: { findFirst: jest.fn() },
    userBoundary: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

// Use `any` to avoid strict typing issues with Prisma's complex return types when mocking
const mockUserFindFirst = prisma.user.findFirst as jest.MockedFunction<any>;
const mockPolicyFindFirst = prisma.policy.findFirst as jest.MockedFunction<any>;
const mockBoundaryUpsert = prisma.userBoundary.upsert as jest.MockedFunction<any>;
const mockBoundaryFindUnique = prisma.userBoundary.findUnique as jest.MockedFunction<any>;
const mockBoundaryDelete = prisma.userBoundary.delete as jest.MockedFunction<any>;

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

const TARGET_USER_ID = 'user-target-001';
const REQUESTING_USER_ID = 'user-root-001';
const ORG_ID = 'org-abc';
const POLICY_ID = 'policy-boundary-001';

function makeUser(hasBoundary = false) {
  return {
    id: TARGET_USER_ID,
    name: 'Alice',
    boundary: hasBoundary ? { policyId: 'old-policy-id' } : null,
  };
}

function makePolicy(type: PolicyType = 'MANAGED') {
  return {
    id: POLICY_ID,
    name: 'ReadOnlyBoundary',
    type,
    organizationId: ORG_ID,
    description: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    statements: [
      {
        id: 'stmt-1',
        policyId: POLICY_ID,
        effect: Effect.ALLOW,
        actions: ['reports:List', 'reports:Read'],
        resource: '*',
      },
    ],
  };
}

function makeBoundaryRecord() {
  return {
    userId: TARGET_USER_ID,
    policyId: POLICY_ID,
    policy: makePolicy(),
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// assignBoundary
// ──────────────────────────────────────────────────────────────────────────────

describe('BoundaryService.assignBoundary', () => {
  beforeEach(() => { jest.resetAllMocks(); });

  it('✓ assigns a boundary when none exists', async () => {
    mockUserFindFirst.mockResolvedValue(makeUser(false));
    mockPolicyFindFirst.mockResolvedValue(makePolicy());
    mockBoundaryUpsert.mockResolvedValue(makeBoundaryRecord());

    const result = await boundaryService.assignBoundary(
      TARGET_USER_ID, POLICY_ID, ORG_ID, REQUESTING_USER_ID
    );

    expect(mockBoundaryUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: TARGET_USER_ID },
        create: { userId: TARGET_USER_ID, policyId: POLICY_ID },
        update: { policyId: POLICY_ID },
      })
    );
    expect(result.policyId).toBe(POLICY_ID);
  });

  it('✓ replaces an existing boundary (upsert — max one per user)', async () => {
    mockUserFindFirst.mockResolvedValue(makeUser(true)); // has old boundary
    mockPolicyFindFirst.mockResolvedValue(makePolicy());
    mockBoundaryUpsert.mockResolvedValue(makeBoundaryRecord());

    await boundaryService.assignBoundary(TARGET_USER_ID, POLICY_ID, ORG_ID, REQUESTING_USER_ID);

    // upsert must have been called (not create — must handle replacement)
    expect(mockBoundaryUpsert).toHaveBeenCalledTimes(1);
  });

  it('✗ throws 404 when the target user does not exist', async () => {
    mockUserFindFirst.mockResolvedValue(null);

    await expect(
      boundaryService.assignBoundary(TARGET_USER_ID, POLICY_ID, ORG_ID, REQUESTING_USER_ID)
    ).rejects.toMatchObject({ statusCode: 404, message: 'User not found' });

    expect(mockBoundaryUpsert).not.toHaveBeenCalled();
  });

  it('✗ throws 404 when the boundary policy does not exist', async () => {
    mockUserFindFirst.mockResolvedValue(makeUser());
    mockPolicyFindFirst.mockResolvedValue(null);

    await expect(
      boundaryService.assignBoundary(TARGET_USER_ID, POLICY_ID, ORG_ID, REQUESTING_USER_ID)
    ).rejects.toMatchObject({ statusCode: 404, message: 'Policy not found' });
  });

  it('✗ throws 400 when the boundary policy is INLINE (must be MANAGED)', async () => {
    mockUserFindFirst.mockResolvedValue(makeUser());
    mockPolicyFindFirst.mockResolvedValue(makePolicy('INLINE'));

    await expect(
      boundaryService.assignBoundary(TARGET_USER_ID, POLICY_ID, ORG_ID, REQUESTING_USER_ID)
    ).rejects.toMatchObject({ statusCode: 400 });

    expect(mockBoundaryUpsert).not.toHaveBeenCalled();
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// getBoundary
// ──────────────────────────────────────────────────────────────────────────────

describe('BoundaryService.getBoundary', () => {
  beforeEach(() => { jest.resetAllMocks(); });

  it('✓ returns the boundary when one is assigned', async () => {
    mockUserFindFirst.mockResolvedValue({ id: TARGET_USER_ID });
    mockBoundaryFindUnique.mockResolvedValue(makeBoundaryRecord());

    const result = await boundaryService.getBoundary(TARGET_USER_ID, ORG_ID);

    expect(result).not.toBeNull();
    expect(result!.policyId).toBe(POLICY_ID);
  });

  it('✓ returns null when no boundary is assigned (not an error)', async () => {
    mockUserFindFirst.mockResolvedValue({ id: TARGET_USER_ID });
    mockBoundaryFindUnique.mockResolvedValue(null);

    const result = await boundaryService.getBoundary(TARGET_USER_ID, ORG_ID);

    expect(result).toBeNull();
  });

  it('✗ throws 404 when the user does not exist', async () => {
    mockUserFindFirst.mockResolvedValue(null);

    await expect(
      boundaryService.getBoundary(TARGET_USER_ID, ORG_ID)
    ).rejects.toMatchObject({ statusCode: 404, message: 'User not found' });

    expect(mockBoundaryFindUnique).not.toHaveBeenCalled();
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// removeBoundary
// ──────────────────────────────────────────────────────────────────────────────

describe('BoundaryService.removeBoundary', () => {
  beforeEach(() => { jest.resetAllMocks(); });

  it('✓ removes the boundary successfully', async () => {
    mockUserFindFirst.mockResolvedValue({ id: TARGET_USER_ID, name: 'Alice' });
    mockBoundaryFindUnique.mockResolvedValue({
      userId: TARGET_USER_ID,
      policyId: POLICY_ID,
      policy: { id: POLICY_ID, name: 'OldBoundary' },
    });
    mockBoundaryDelete.mockResolvedValue({});

    await expect(
      boundaryService.removeBoundary(TARGET_USER_ID, ORG_ID, REQUESTING_USER_ID)
    ).resolves.toBeUndefined();

    expect(mockBoundaryDelete).toHaveBeenCalledWith({
      where: { userId: TARGET_USER_ID },
    });
  });

  it('✗ throws 404 when no boundary is assigned', async () => {
    mockUserFindFirst.mockResolvedValue({ id: TARGET_USER_ID, name: 'Alice' });
    mockBoundaryFindUnique.mockResolvedValue(null);

    await expect(
      boundaryService.removeBoundary(TARGET_USER_ID, ORG_ID, REQUESTING_USER_ID)
    ).rejects.toMatchObject({ statusCode: 404 });

    expect(mockBoundaryDelete).not.toHaveBeenCalled();
  });

  it('✗ throws 404 when the user does not exist', async () => {
    mockUserFindFirst.mockResolvedValue(null);

    await expect(
      boundaryService.removeBoundary('non-existent', ORG_ID, REQUESTING_USER_ID)
    ).rejects.toMatchObject({ statusCode: 404, message: 'User not found' });
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// Permission Engine Integration — verified via permissionService tests
// These tests verify that the boundary DATA SHAPE produced by BoundaryService
// is compatible with what permissionRepository already returns.
// ──────────────────────────────────────────────────────────────────────────────

describe('Boundary data shape compatibility', () => {
  it('✓ boundary record includes policy with statements (engine-ready shape)', async () => {
    mockUserFindFirst.mockResolvedValue(makeUser(false));
    mockPolicyFindFirst.mockResolvedValue(makePolicy());
    const expected = makeBoundaryRecord();
    mockBoundaryUpsert.mockResolvedValue(expected);

    const result = await boundaryService.assignBoundary(
      TARGET_USER_ID, POLICY_ID, ORG_ID, REQUESTING_USER_ID
    );

    // The permission engine needs: policy.statements[].effect and .actions
    expect(result.policy).toBeDefined();
    expect(Array.isArray(result.policy.statements)).toBe(true);
    expect(result.policy.statements[0]).toMatchObject({
      effect: Effect.ALLOW,
      actions: expect.arrayContaining(['reports:List']),
    });
  });
});

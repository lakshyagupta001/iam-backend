import { Policy, PolicyStatement } from '@prisma/client';

export interface BoundaryAssignment {
  userId: string;
  policyId: string;
  policy: Policy & { statements: PolicyStatement[] };
}

import { PolicyType, Effect } from '@prisma/client';
import { IamAction } from './policy.constants';

export interface PolicyStatementDto {
  effect: Effect;
  actions: IamAction[];
  resource?: string;
}

export interface CreatePolicyDto {
  name: string;
  description?: string;
  type: PolicyType;
  statements: PolicyStatementDto[];
}

export interface UpdatePolicyDto {
  name?: string;
  description?: string;
  statements?: PolicyStatementDto[];
}

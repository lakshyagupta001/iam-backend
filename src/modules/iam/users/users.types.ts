import { User, Group, Policy, UserPolicyAttachment, GroupPolicyAttachment, UserGroupMembership } from '@prisma/client';

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  isRoot: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

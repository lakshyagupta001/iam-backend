import { groupRepository } from './groups.repository';
import { CreateGroupDto, UpdateGroupDto, GroupQueryDto } from './groups.types';
import { AppError } from '../../../shared/utils/AppError';
import { Group } from '@prisma/client';
import { delegationBypassService } from '../delegation/delegation.service';

export class GroupService {
  async createGroup(organizationId: string, data: CreateGroupDto): Promise<Group> {
    const existingGroup = await groupRepository.findGroupByNameAndOrg(data.name, organizationId);
    
    if (existingGroup) {
      throw new AppError(409, 'A group with this name already exists');
    }

    return groupRepository.createGroup({
      name: data.name,
      description: data.description,
      organizationId,
    });
  }

  async listGroups(organizationId: string, query: GroupQueryDto): Promise<{ groups: Group[], total: number }> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const [groups, total] = await groupRepository.findGroups(
      organizationId,
      skip,
      limit,
      query.search,
      query.sort,
      query.order
    );

    return { groups, total };
  }

  async listDelegatableGroups(
    organizationId: string,
    requestingUserId: string,
    isRoot: boolean,
    query: GroupQueryDto
  ): Promise<{ groups: Group[], total: number }> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    if (isRoot) {
      const [groups, total] = await groupRepository.findGroups(
        organizationId,
        skip,
        limit,
        query.search,
        query.sort,
        query.order
      );
      return { groups, total };
    }

    // For non-root users, filter out groups they cannot delegate (DBP check on attached policies)
    const { permissionService } = await import('../evaluation/evaluation.service');
    const effectivePerms = await permissionService.getEffectivePermissions(requestingUserId);
    
    const allGroups = await groupRepository.findAllGroupsWithPoliciesAndStatements(organizationId, query.search);
    
    // Filter delegatable groups: a group is delegatable only if ALL its attached
    // policies contain only ALLOW actions the requesting user already holds.
    // This mirrors the Delegation Bypass Prevention invariant exactly.
    const delegatableGroups = allGroups.filter(group => {
      for (const attachment of group.policies) {
        if (!delegationBypassService.checkAllowStatementsSync(effectivePerms, attachment.policy.statements)) {
          return false;
        }
      }
      return true;
    });

    // Apply sorting in memory
    const sortField = query.sort || 'createdAt';
    const sortOrder = query.order || 'desc';
    
    delegatableGroups.sort((a: any, b: any) => {
      const valA = a[sortField];
      const valB = b[sortField];
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    // Apply pagination in memory
    const paginatedGroups = delegatableGroups.slice(skip, skip + limit);

    // Remove policies and statements before returning to match the original return type
    const groups = paginatedGroups.map(g => {
      const { policies, ...rest } = g;
      return rest;
    });

    return { groups, total: delegatableGroups.length };
  }

  async getGroupById(id: string, organizationId: string): Promise<Group> {
    const group = await groupRepository.findGroupById(id, organizationId);
    
    if (!group) {
      throw new AppError(404, 'Group not found');
    }

    return group;
  }

  async updateGroup(id: string, organizationId: string, data: UpdateGroupDto): Promise<Group> {
    const group = await groupRepository.findGroupById(id, organizationId);
    
    if (!group) {
      throw new AppError(404, 'Group not found');
    }

    if (data.name && data.name.toLowerCase() !== group.name.toLowerCase()) {
      const existingGroup = await groupRepository.findGroupByNameAndOrg(data.name, organizationId);
      if (existingGroup) {
        throw new AppError(409, 'A group with this name already exists');
      }
    }

    return groupRepository.updateGroup(id, data);
  }

  async deleteGroup(id: string, organizationId: string): Promise<void> {
    const group = await groupRepository.findGroupById(id, organizationId);
    
    if (!group) {
      throw new AppError(404, 'Group not found');
    }

    await groupRepository.deleteGroup(id);
  }

  async addUserToGroup(groupId: string, userId: string, organizationId: string): Promise<void> {
    const group = await groupRepository.findGroupById(groupId, organizationId);
    if (!group) {
      throw new AppError(404, 'Group not found');
    }

    const userExists = await groupRepository.checkUserInOrg(userId, organizationId);
    if (!userExists) {
      throw new AppError(404, 'User not found in this organization');
    }

    const isMember = await groupRepository.checkMembership(userId, groupId);
    if (isMember) {
      throw new AppError(409, 'User is already a member of this group');
    }

    await groupRepository.addMember(userId, groupId);
  }

  async removeUserFromGroup(groupId: string, userId: string, organizationId: string): Promise<void> {
    const group = await groupRepository.findGroupById(groupId, organizationId);
    if (!group) {
      throw new AppError(404, 'Group not found');
    }

    const isMember = await groupRepository.checkMembership(userId, groupId);
    if (!isMember) {
      throw new AppError(404, 'User is not a member of this group');
    }

    await groupRepository.removeMember(userId, groupId);
  }

  async attachPolicy(
    groupId: string,
    policyId: string,
    organizationId: string,
    requestingUserId: string
  ): Promise<void> {
    const group = await groupRepository.findGroupById(groupId, organizationId);
    if (!group) {
      throw new AppError(404, 'Group not found');
    }

    const policy = await groupRepository.checkPolicy(policyId, organizationId);
    if (!policy) {
      throw new AppError(404, 'Policy not found');
    }
    if (policy.type !== 'MANAGED') {
      throw new AppError(400, 'Only MANAGED policies can be attached to groups');
    }

    const isAttached = await groupRepository.checkPolicyAttachment(groupId, policyId);
    if (isAttached) {
      throw new AppError(409, 'Policy is already attached to this group');
    }

    // DBP: requester must hold every Allow action in the policy being attached
    await delegationBypassService.validateForGroupPolicyAttachment(
      requestingUserId,
      policyId,
      organizationId
    );

    await groupRepository.attachPolicy(groupId, policyId);
  }

  async detachPolicy(groupId: string, policyId: string, organizationId: string): Promise<void> {
    const group = await groupRepository.findGroupById(groupId, organizationId);
    if (!group) {
      throw new AppError(404, 'Group not found');
    }

    const policy = await groupRepository.checkPolicy(policyId, organizationId);
    if (!policy) {
      throw new AppError(404, 'Policy not found');
    }

    const isAttached = await groupRepository.checkPolicyAttachment(groupId, policyId);
    if (!isAttached) {
      throw new AppError(404, 'Policy is not attached to this group');
    }

    await groupRepository.detachPolicy(groupId, policyId);
  }
}

export const groupService = new GroupService();

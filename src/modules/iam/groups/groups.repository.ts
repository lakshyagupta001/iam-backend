import { prisma } from '../../../prisma/client';
import { Group, Prisma } from '@prisma/client';

export class GroupRepository {
  async createGroup(data: Prisma.GroupUncheckedCreateInput): Promise<Group> {
    return prisma.group.create({ data });
  }

  async findGroupByNameAndOrg(name: string, organizationId: string): Promise<Group | null> {
    // Perform case-insensitive search
    return prisma.group.findFirst({
      where: {
        organizationId,
        name: {
          equals: name,
          mode: 'insensitive',
        },
      },
    });
  }

  async findGroupById(id: string, organizationId: string): Promise<Group | null> {
    return prisma.group.findFirst({
      where: {
        id,
        organizationId,
      },
      include: {
        users: {
          include: {
            user: true,
          },
        },
        policies: {
          include: {
            policy: true,
          },
        },
      },
    });
  }

  async findGroups(
    organizationId: string,
    skip: number,
    take: number,
    search?: string,
    sort: string = 'createdAt',
    order: 'asc' | 'desc' = 'desc'
  ): Promise<[Group[], number]> {
    const where: Prisma.GroupWhereInput = {
      organizationId,
    };

    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive',
      };
    }

    return prisma.$transaction([
      prisma.group.findMany({
        where,
        skip,
        take,
        orderBy: {
          [sort]: order,
        },
      }),
      prisma.group.count({ where }),
    ]);
  }

  async updateGroup(id: string, data: Prisma.GroupUpdateInput): Promise<Group> {
    return prisma.group.update({
      where: { id },
      data,
    });
  }

  async deleteGroup(id: string): Promise<Group> {
    return prisma.group.delete({
      where: { id },
    });
  }

  async checkUserInOrg(userId: string, organizationId: string): Promise<boolean> {
    const user = await prisma.user.findFirst({
      where: { id: userId, organizationId },
    });
    return !!user;
  }

  async checkMembership(userId: string, groupId: string): Promise<boolean> {
    const membership = await prisma.userGroupMembership.findUnique({
      where: {
        userId_groupId: { userId, groupId },
      },
    });
    return !!membership;
  }

  async addMember(userId: string, groupId: string): Promise<void> {
    await prisma.userGroupMembership.create({
      data: { userId, groupId },
    });
  }

  async removeMember(userId: string, groupId: string): Promise<void> {
    await prisma.userGroupMembership.delete({
      where: {
        userId_groupId: { userId, groupId },
      },
    });
  }

  async checkPolicy(policyId: string, organizationId: string) {
    return prisma.policy.findFirst({
      where: { id: policyId, organizationId },
    });
  }

  async checkPolicyAttachment(groupId: string, policyId: string): Promise<boolean> {
    const attachment = await prisma.groupPolicyAttachment.findUnique({
      where: {
        groupId_policyId: { groupId, policyId },
      },
    });
    return !!attachment;
  }

  async attachPolicy(groupId: string, policyId: string): Promise<void> {
    await prisma.groupPolicyAttachment.create({
      data: { groupId, policyId },
    });
  }

  async detachPolicy(groupId: string, policyId: string): Promise<void> {
    await prisma.groupPolicyAttachment.delete({
      where: {
        groupId_policyId: { groupId, policyId },
      },
    });
  }
}

export const groupRepository = new GroupRepository();

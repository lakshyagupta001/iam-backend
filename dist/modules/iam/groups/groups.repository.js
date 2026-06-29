"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.groupRepository = exports.GroupRepository = void 0;
const client_1 = require("../../../prisma/client");
class GroupRepository {
    async createGroup(data) {
        return client_1.prisma.group.create({ data });
    }
    async findGroupByNameAndOrg(name, organizationId) {
        // Perform case-insensitive search
        return client_1.prisma.group.findFirst({
            where: {
                organizationId,
                name: {
                    equals: name,
                    mode: 'insensitive',
                },
            },
        });
    }
    async findGroupById(id, organizationId) {
        return client_1.prisma.group.findFirst({
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
    async findGroups(organizationId, skip, take, search, sort = 'createdAt', order = 'desc') {
        const where = {
            organizationId,
        };
        if (search) {
            where.name = {
                contains: search,
                mode: 'insensitive',
            };
        }
        return client_1.prisma.$transaction([
            client_1.prisma.group.findMany({
                where,
                skip,
                take,
                orderBy: {
                    [sort]: order,
                },
            }),
            client_1.prisma.group.count({ where }),
        ]);
    }
    async findAllGroupsWithPoliciesAndStatements(organizationId, search) {
        const where = {
            organizationId,
        };
        if (search) {
            where.name = {
                contains: search,
                mode: 'insensitive',
            };
        }
        return client_1.prisma.group.findMany({
            where,
            include: {
                policies: {
                    include: {
                        policy: {
                            include: {
                                statements: true,
                            },
                        },
                    },
                },
            },
        });
    }
    async updateGroup(id, data) {
        return client_1.prisma.group.update({
            where: { id },
            data,
        });
    }
    async deleteGroup(id) {
        return client_1.prisma.group.delete({
            where: { id },
        });
    }
    async checkUserInOrg(userId, organizationId) {
        const user = await client_1.prisma.user.findFirst({
            where: { id: userId, organizationId },
        });
        return !!user;
    }
    async checkMembership(userId, groupId) {
        const membership = await client_1.prisma.userGroupMembership.findUnique({
            where: {
                userId_groupId: { userId, groupId },
            },
        });
        return !!membership;
    }
    async addMember(userId, groupId) {
        await client_1.prisma.userGroupMembership.create({
            data: { userId, groupId },
        });
    }
    async removeMember(userId, groupId) {
        await client_1.prisma.userGroupMembership.delete({
            where: {
                userId_groupId: { userId, groupId },
            },
        });
    }
    async checkPolicy(policyId, organizationId) {
        return client_1.prisma.policy.findFirst({
            where: { id: policyId, organizationId },
        });
    }
    async checkPolicyAttachment(groupId, policyId) {
        const attachment = await client_1.prisma.groupPolicyAttachment.findUnique({
            where: {
                groupId_policyId: { groupId, policyId },
            },
        });
        return !!attachment;
    }
    async attachPolicy(groupId, policyId) {
        await client_1.prisma.groupPolicyAttachment.create({
            data: { groupId, policyId },
        });
    }
    async detachPolicy(groupId, policyId) {
        await client_1.prisma.groupPolicyAttachment.delete({
            where: {
                groupId_policyId: { groupId, policyId },
            },
        });
    }
}
exports.GroupRepository = GroupRepository;
exports.groupRepository = new GroupRepository();

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersRepository = exports.UsersRepository = void 0;
const client_1 = require("../../../prisma/client");
class UsersRepository {
    async countUsers(whereClause) {
        return client_1.prisma.user.count({ where: whereClause });
    }
    async findManyUsers(whereClause, skip, take) {
        return client_1.prisma.user.findMany({
            where: whereClause,
            select: {
                id: true,
                name: true,
                email: true,
                isRoot: true,
                createdAt: true,
                updatedAt: true,
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take,
        });
    }
    async findByEmail(email) {
        return client_1.prisma.user.findUnique({
            where: { email },
        });
    }
    async createUser(data) {
        return client_1.prisma.user.create({
            data,
            select: {
                id: true,
                name: true,
                email: true,
                isRoot: true,
                createdAt: true,
            },
        });
    }
    async findUserByIdWithPolicies(userId, orgId) {
        return client_1.prisma.user.findFirst({
            where: {
                id: userId,
                organizationId: orgId,
            },
            select: {
                id: true,
                name: true,
                email: true,
                isRoot: true,
                createdAt: true,
                groups: {
                    include: {
                        group: {
                            include: {
                                policies: {
                                    include: {
                                        policy: true,
                                    },
                                },
                            },
                        },
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
    async findUserById(userId, orgId) {
        return client_1.prisma.user.findFirst({
            where: { id: userId, organizationId: orgId },
        });
    }
    async findPolicyById(policyId, orgId) {
        return client_1.prisma.policy.findFirst({
            where: { id: policyId, organizationId: orgId },
        });
    }
    async findPolicyAttachment(userId, policyId) {
        return client_1.prisma.userPolicyAttachment.findUnique({
            where: {
                userId_policyId: {
                    userId,
                    policyId,
                },
            },
        });
    }
    async createPolicyAttachment(userId, policyId) {
        return client_1.prisma.userPolicyAttachment.create({
            data: {
                userId,
                policyId,
            },
        });
    }
    async deletePolicyAttachment(userId, policyId) {
        return client_1.prisma.userPolicyAttachment.delete({
            where: {
                userId_policyId: {
                    userId,
                    policyId,
                },
            },
        });
    }
}
exports.UsersRepository = UsersRepository;
exports.usersRepository = new UsersRepository();

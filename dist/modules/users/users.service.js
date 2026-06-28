"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersService = void 0;
const client_1 = require("../../prisma/client");
const AppError_1 = require("../../shared/utils/AppError");
const password_1 = require("../../shared/utils/password");
class UsersService {
    async listUsers(orgId, params) {
        const { page, limit, search } = params;
        const whereClause = { organizationId: orgId };
        if (search) {
            whereClause.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
            ];
        }
        const [totalItems, users] = await Promise.all([
            client_1.prisma.user.count({ where: whereClause }),
            client_1.prisma.user.findMany({
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
                skip: (page - 1) * limit,
                take: limit,
            })
        ]);
        return { totalItems, users };
    }
    async createUser(orgId, data) {
        const existingUser = await client_1.prisma.user.findUnique({
            where: { email: data.email },
        });
        if (existingUser) {
            throw new AppError_1.AppError(409, 'Email already in use');
        }
        const hashedPassword = await (0, password_1.hashPassword)(data.password);
        const user = await client_1.prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                passwordHash: hashedPassword,
                isRoot: false, // User Management currently only creates Normal users
                organizationId: orgId,
            },
            select: {
                id: true,
                name: true,
                email: true,
                isRoot: true,
                createdAt: true,
            },
        });
        return user;
    }
    async getUserById(userId, orgId) {
        const user = await client_1.prisma.user.findFirst({
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
        if (!user) {
            throw new AppError_1.AppError(404, 'User not found');
        }
        // Map the response to match what the frontend expects (memberships, directPolicies)
        return {
            ...user,
            groupMemberships: user.groups,
            directPolicies: user.policies,
        };
    }
    async attachPolicy(userId, policyId, orgId) {
        const user = await client_1.prisma.user.findFirst({
            where: { id: userId, organizationId: orgId },
        });
        if (!user) {
            throw new AppError_1.AppError(404, 'User not found');
        }
        const policy = await client_1.prisma.policy.findFirst({
            where: { id: policyId, organizationId: orgId },
        });
        if (!policy) {
            throw new AppError_1.AppError(404, 'Policy not found');
        }
        if (policy.type !== 'MANAGED') {
            throw new AppError_1.AppError(400, 'Only MANAGED policies can be attached to users');
        }
        const existingAttachment = await client_1.prisma.userPolicyAttachment.findUnique({
            where: {
                userId_policyId: {
                    userId,
                    policyId,
                },
            },
        });
        if (existingAttachment) {
            throw new AppError_1.AppError(409, 'Policy is already attached to this user');
        }
        await client_1.prisma.userPolicyAttachment.create({
            data: {
                userId,
                policyId,
            },
        });
    }
    async detachPolicy(userId, policyId, orgId) {
        const user = await client_1.prisma.user.findFirst({
            where: { id: userId, organizationId: orgId },
        });
        if (!user) {
            throw new AppError_1.AppError(404, 'User not found');
        }
        const policy = await client_1.prisma.policy.findFirst({
            where: { id: policyId, organizationId: orgId },
        });
        if (!policy) {
            throw new AppError_1.AppError(404, 'Policy not found');
        }
        const existingAttachment = await client_1.prisma.userPolicyAttachment.findUnique({
            where: {
                userId_policyId: {
                    userId,
                    policyId,
                },
            },
        });
        if (!existingAttachment) {
            throw new AppError_1.AppError(404, 'Policy is not attached to this user');
        }
        await client_1.prisma.userPolicyAttachment.delete({
            where: {
                userId_policyId: {
                    userId,
                    policyId,
                },
            },
        });
    }
}
exports.usersService = new UsersService();

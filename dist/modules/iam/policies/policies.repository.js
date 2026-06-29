"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.policyRepository = void 0;
const client_1 = require("../../../prisma/client");
class PolicyRepository {
    async findPolicyByNameAndOrg(name, organizationId) {
        return client_1.prisma.policy.findFirst({
            where: {
                organizationId,
                name: {
                    equals: name,
                    mode: 'insensitive',
                },
            },
            include: {
                statements: true,
            },
        });
    }
    async findPolicyById(id, organizationId) {
        return client_1.prisma.policy.findFirst({
            where: { id, organizationId },
            include: {
                statements: true,
            },
        });
    }
    async createPolicy(name, description, type, organizationId, statements) {
        return client_1.prisma.policy.create({
            data: {
                name,
                description,
                type,
                organizationId,
                statements: {
                    create: statements,
                },
            },
            include: {
                statements: true,
            },
        });
    }
    async updatePolicy(id, data, statements) {
        return client_1.prisma.policy.update({
            where: { id },
            data: {
                ...data,
                ...(statements
                    ? {
                        statements: {
                            deleteMany: {},
                            create: statements,
                        },
                    }
                    : {}),
            },
            include: {
                statements: true,
            },
        });
    }
    async deletePolicy(id) {
        await client_1.prisma.policy.delete({
            where: { id },
        });
    }
    async listPolicies(organizationId, params) {
        const where = { organizationId };
        if (params.search) {
            where.name = {
                contains: params.search,
                mode: 'insensitive',
            };
        }
        if (params.type) {
            where.type = params.type;
        }
        const orderBy = params.sort
            ? { [params.sort]: params.order || 'asc' }
            : { createdAt: 'desc' };
        const [data, total] = await Promise.all([
            client_1.prisma.policy.findMany({
                where,
                skip: params.skip,
                take: params.take,
                orderBy,
            }),
            client_1.prisma.policy.count({ where }),
        ]);
        return { data, total };
    }
    async findManyWithStatements(organizationId, params) {
        const where = { organizationId };
        if (params.search) {
            where.name = {
                contains: params.search,
                mode: 'insensitive',
            };
        }
        if (params.type) {
            where.type = params.type;
        }
        return client_1.prisma.policy.findMany({
            where,
            include: {
                statements: true,
            },
        });
    }
    async countAttachments(policyId) {
        const [users, groups] = await Promise.all([
            client_1.prisma.userPolicyAttachment.count({ where: { policyId } }),
            client_1.prisma.groupPolicyAttachment.count({ where: { policyId } })
        ]);
        return { users, groups };
    }
}
exports.policyRepository = new PolicyRepository();

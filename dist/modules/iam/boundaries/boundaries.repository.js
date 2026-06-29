"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.boundariesRepository = exports.BoundariesRepository = void 0;
const client_1 = require("../../../prisma/client");
class BoundariesRepository {
    async getUserWithBoundary(userId, orgId) {
        return client_1.prisma.user.findFirst({
            where: { id: userId, organizationId: orgId },
            select: { id: true, name: true, boundary: { select: { policyId: true } } },
        });
    }
    async getPolicyWithStatements(policyId, orgId) {
        return client_1.prisma.policy.findFirst({
            where: { id: policyId, organizationId: orgId },
            include: { statements: true },
        });
    }
    async upsertBoundary(userId, policyId) {
        return client_1.prisma.userBoundary.upsert({
            where: { userId },
            create: { userId, policyId },
            update: { policyId },
            include: {
                policy: {
                    include: { statements: true },
                },
            },
        });
    }
    async findBoundary(userId) {
        return client_1.prisma.userBoundary.findUnique({
            where: { userId },
            include: {
                policy: {
                    include: { statements: true },
                },
            },
        });
    }
    async findBoundaryForRemoval(userId) {
        return client_1.prisma.userBoundary.findUnique({
            where: { userId },
            include: { policy: { select: { id: true, name: true } } },
        });
    }
    async deleteBoundary(userId) {
        return client_1.prisma.userBoundary.delete({
            where: { userId },
        });
    }
}
exports.BoundariesRepository = BoundariesRepository;
exports.boundariesRepository = new BoundariesRepository();

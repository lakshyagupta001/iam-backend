"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditRepository = void 0;
const client_1 = require("../../../prisma/client");
exports.auditRepository = {
    async findById(organizationId, id) {
        return client_1.prisma.auditLog.findFirst({
            where: { id, organizationId }
        });
    },
    async findMany(organizationId, skip, take, search) {
        const whereClause = { organizationId };
        if (search) {
            whereClause.OR = [
                { action: { contains: search, mode: 'insensitive' } },
                { performedBy: { contains: search, mode: 'insensitive' } },
            ];
        }
        return client_1.prisma.auditLog.findMany({
            where: whereClause,
            orderBy: { timestamp: 'desc' },
            skip,
            take,
        });
    },
    async count(organizationId, search) {
        const whereClause = { organizationId };
        if (search) {
            whereClause.OR = [
                { action: { contains: search, mode: 'insensitive' } },
                { performedBy: { contains: search, mode: 'insensitive' } },
            ];
        }
        return client_1.prisma.auditLog.count({ where: whereClause });
    },
};

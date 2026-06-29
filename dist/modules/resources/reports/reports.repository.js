"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportsRepository = void 0;
const client_1 = require("../../../prisma/client");
exports.reportsRepository = {
    async findMany(organizationId, skip, take, search) {
        const whereClause = { organizationId };
        if (search) {
            whereClause.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }
        return client_1.prisma.report.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            skip,
            take,
        });
    },
    async count(organizationId, search) {
        const whereClause = { organizationId };
        if (search) {
            whereClause.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }
        return client_1.prisma.report.count({ where: whereClause });
    },
    async findUnique(id, organizationId) {
        return client_1.prisma.report.findUnique({
            where: { id, organizationId },
        });
    },
    async create(data) {
        return client_1.prisma.report.create({ data });
    },
    async update(id, data) {
        return client_1.prisma.report.update({
            where: { id },
            data,
        });
    },
    async delete(id) {
        return client_1.prisma.report.delete({
            where: { id },
        });
    },
};

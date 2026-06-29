"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.alertsRepository = void 0;
const client_1 = require("../../../prisma/client");
exports.alertsRepository = {
    async findMany(organizationId, skip, take, search) {
        const whereClause = { organizationId };
        if (search) {
            whereClause.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { message: { contains: search, mode: 'insensitive' } },
                { severity: { contains: search, mode: 'insensitive' } },
            ];
        }
        return client_1.prisma.alert.findMany({
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
                { message: { contains: search, mode: 'insensitive' } },
                { severity: { contains: search, mode: 'insensitive' } },
            ];
        }
        return client_1.prisma.alert.count({ where: whereClause });
    },
    async findUnique(id, organizationId) {
        return client_1.prisma.alert.findUnique({
            where: { id, organizationId },
        });
    },
    async create(data) {
        return client_1.prisma.alert.create({ data });
    },
    async update(id, data) {
        return client_1.prisma.alert.update({
            where: { id },
            data,
        });
    },
    async delete(id) {
        return client_1.prisma.alert.delete({
            where: { id },
        });
    },
};

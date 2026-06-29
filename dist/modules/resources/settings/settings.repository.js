"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.settingsRepository = void 0;
const client_1 = require("../../../prisma/client");
exports.settingsRepository = {
    async findMany(organizationId, skip, take, search) {
        const whereClause = { organizationId };
        if (search) {
            whereClause.OR = [
                { key: { contains: search, mode: 'insensitive' } },
                { value: { contains: search, mode: 'insensitive' } },
            ];
        }
        return client_1.prisma.setting.findMany({
            where: whereClause,
            orderBy: { key: 'asc' },
            skip,
            take,
        });
    },
    async count(organizationId, search) {
        const whereClause = { organizationId };
        if (search) {
            whereClause.OR = [
                { key: { contains: search, mode: 'insensitive' } },
                { value: { contains: search, mode: 'insensitive' } },
            ];
        }
        return client_1.prisma.setting.count({ where: whereClause });
    },
    async findByKey(key, organizationId) {
        return client_1.prisma.setting.findUnique({
            where: {
                key_organizationId: {
                    organizationId,
                    key,
                },
            },
        });
    },
    async upsert(organizationId, key, value) {
        return client_1.prisma.setting.upsert({
            where: {
                key_organizationId: {
                    organizationId,
                    key,
                },
            },
            update: { value },
            create: {
                organizationId,
                key,
                value,
            },
        });
    },
};

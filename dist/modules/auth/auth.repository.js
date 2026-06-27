"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRepository = void 0;
const client_1 = require("../../prisma/client");
class AuthRepository {
    async findOrganizationByName(name) {
        return client_1.prisma.organization.findUnique({ where: { name } });
    }
    async createOrganization(name) {
        return client_1.prisma.organization.create({ data: { name } });
    }
    async findUserByEmail(email) {
        return client_1.prisma.user.findUnique({ where: { email } });
    }
    async findUserById(id) {
        return client_1.prisma.user.findUnique({ where: { id } });
    }
    async createUser(data) {
        return client_1.prisma.user.create({ data });
    }
    async createRefreshToken(userId, tokenHash, expiresAt) {
        return client_1.prisma.refreshToken.create({
            data: {
                userId,
                tokenHash,
                expiresAt,
            },
        });
    }
    async findRefreshToken(tokenHash) {
        return client_1.prisma.refreshToken.findUnique({
            where: { tokenHash },
        });
    }
    async revokeRefreshToken(id) {
        return client_1.prisma.refreshToken.update({
            where: { id },
            data: { revokedAt: new Date() },
        });
    }
}
exports.authRepository = new AuthRepository();

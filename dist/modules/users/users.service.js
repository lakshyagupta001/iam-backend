"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersService = void 0;
const client_1 = require("../../prisma/client");
const AppError_1 = require("../../shared/utils/AppError");
const password_1 = require("../../shared/utils/password");
class UsersService {
    async listUsers(orgId) {
        return client_1.prisma.user.findMany({
            where: { organizationId: orgId },
            select: {
                id: true,
                name: true,
                email: true,
                isRoot: true,
                createdAt: true,
                updatedAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });
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
}
exports.usersService = new UsersService();

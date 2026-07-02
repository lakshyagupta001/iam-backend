"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = void 0;
const auth_repository_1 = require("./auth.repository");
const AppError_1 = require("../../../shared/utils/AppError");
const password_1 = require("../../../shared/utils/password");
const jwt_1 = require("../../../shared/utils/jwt");
const tokens_1 = require("../../../shared/utils/tokens");
const env_1 = require("../../../shared/config/env");
class AuthService {
    async register(data) {
        const existingUser = await auth_repository_1.authRepository.findUserByEmail(data.email);
        if (existingUser) {
            throw new AppError_1.AppError(409, 'Email already in use');
        }
        if (data.registrationType === 'NORMAL') {
            const existingOrg = await auth_repository_1.authRepository.findOrganizationByName(data.organizationName);
            if (!existingOrg) {
                throw new AppError_1.AppError(404, 'Organization not found. Please check the organization name.');
            }
            const hashedPassword = await (0, password_1.hashPassword)(data.password);
            await auth_repository_1.authRepository.createUser({
                name: data.name,
                email: data.email,
                passwordHash: hashedPassword,
                isRoot: false,
                organizationId: existingOrg.id,
            });
        }
        else {
            const existingOrg = await auth_repository_1.authRepository.findOrganizationByName(data.organizationName);
            if (existingOrg) {
                throw new AppError_1.AppError(409, 'This organization has already been initialized. Please contact your organization\'s administrator for access.');
            }
            const newOrg = await auth_repository_1.authRepository.createOrganization(data.organizationName);
            const hashedPassword = await (0, password_1.hashPassword)(data.password);
            await auth_repository_1.authRepository.createUser({
                name: data.name,
                email: data.email,
                passwordHash: hashedPassword,
                isRoot: true,
                organizationId: newOrg.id,
            });
        }
    }
    async login(data) {
        const user = await auth_repository_1.authRepository.findUserByEmail(data.email);
        if (!user) {
            throw new AppError_1.AppError(401, 'Invalid credentials'); // Generic error
        }
        const isValidPassword = await (0, password_1.verifyPassword)(data.password, user.passwordHash);
        if (!isValidPassword) {
            throw new AppError_1.AppError(401, 'Invalid credentials'); // Generic error
        }
        const accessToken = (0, jwt_1.signToken)({ sub: user.id, isRoot: user.isRoot, orgId: user.organizationId });
        const rawRefreshToken = (0, tokens_1.generateOpaqueToken)();
        const tokenHash = (0, tokens_1.hashOpaqueToken)(rawRefreshToken);
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + env_1.env.REFRESH_TOKEN_EXPIRES_IN_DAYS);
        await auth_repository_1.authRepository.createRefreshToken(user.id, tokenHash, expiresAt);
        const userProfile = {
            id: user.id,
            name: user.name,
            email: user.email,
            isRoot: user.isRoot,
            orgId: user.organizationId,
        };
        return {
            loginResponse: {
                accessToken,
                user: userProfile,
            },
            rawRefreshToken,
        };
    }
    async refresh(rawRefreshToken) {
        const tokenHash = (0, tokens_1.hashOpaqueToken)(rawRefreshToken);
        const tokenRecord = await auth_repository_1.authRepository.findRefreshToken(tokenHash);
        if (!tokenRecord) {
            throw new AppError_1.AppError(401, 'Invalid refresh token');
        }
        if (tokenRecord.revokedAt) {
            throw new AppError_1.AppError(401, 'Refresh token has been revoked');
        }
        if (tokenRecord.expiresAt < new Date()) {
            throw new AppError_1.AppError(401, 'Refresh token has expired');
        }
        // Revoke old token
        await auth_repository_1.authRepository.revokeRefreshToken(tokenRecord.id);
        // Get user
        const user = await auth_repository_1.authRepository.findUserById(tokenRecord.userId);
        if (!user) {
            throw new AppError_1.AppError(401, 'User not found');
        }
        // Issue new tokens
        const accessToken = (0, jwt_1.signToken)({ sub: user.id, isRoot: user.isRoot, orgId: user.organizationId });
        const newRawRefreshToken = (0, tokens_1.generateOpaqueToken)();
        const newTokenHash = (0, tokens_1.hashOpaqueToken)(newRawRefreshToken);
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + env_1.env.REFRESH_TOKEN_EXPIRES_IN_DAYS);
        await auth_repository_1.authRepository.createRefreshToken(user.id, newTokenHash, expiresAt);
        return {
            refreshResponse: { accessToken },
            newRawRefreshToken,
        };
    }
    async logout(userId, rawRefreshToken) {
        const tokenHash = (0, tokens_1.hashOpaqueToken)(rawRefreshToken);
        const tokenRecord = await auth_repository_1.authRepository.findRefreshToken(tokenHash);
        if (tokenRecord && tokenRecord.userId === userId && !tokenRecord.revokedAt) {
            await auth_repository_1.authRepository.revokeRefreshToken(tokenRecord.id);
        }
    }
    async me(userId) {
        const user = await auth_repository_1.authRepository.findUserById(userId);
        if (!user) {
            throw new AppError_1.AppError(404, 'User not found');
        }
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            isRoot: user.isRoot,
            orgId: user.organizationId,
        };
    }
}
exports.authService = new AuthService();

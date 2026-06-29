"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersService = void 0;
const AppError_1 = require("../../../shared/utils/AppError");
const password_1 = require("../../../shared/utils/password");
const delegation_service_1 = require("../delegation/delegation.service");
const users_repository_1 = require("./users.repository");
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
            users_repository_1.usersRepository.countUsers(whereClause),
            users_repository_1.usersRepository.findManyUsers(whereClause, (page - 1) * limit, limit)
        ]);
        return { totalItems, users };
    }
    async createUser(orgId, data) {
        const existingUser = await users_repository_1.usersRepository.findByEmail(data.email);
        if (existingUser) {
            throw new AppError_1.AppError(409, 'Email already in use');
        }
        const hashedPassword = await (0, password_1.hashPassword)(data.password);
        const user = await users_repository_1.usersRepository.createUser({
            name: data.name,
            email: data.email,
            passwordHash: hashedPassword,
            isRoot: false,
            organizationId: orgId,
        });
        return user;
    }
    async getUserById(userId, orgId) {
        const user = await users_repository_1.usersRepository.findUserByIdWithPolicies(userId, orgId);
        if (!user) {
            throw new AppError_1.AppError(404, 'User not found');
        }
        return {
            ...user,
            groupMemberships: user.groups,
            directPolicies: user.policies,
        };
    }
    async attachPolicy(userId, policyId, orgId, requestingUserId) {
        const user = await users_repository_1.usersRepository.findUserById(userId, orgId);
        if (!user) {
            throw new AppError_1.AppError(404, 'User not found');
        }
        const policy = await users_repository_1.usersRepository.findPolicyById(policyId, orgId);
        if (!policy) {
            throw new AppError_1.AppError(404, 'Policy not found');
        }
        if (policy.type !== 'MANAGED') {
            throw new AppError_1.AppError(400, 'Only MANAGED policies can be attached to users');
        }
        const existingAttachment = await users_repository_1.usersRepository.findPolicyAttachment(userId, policyId);
        if (existingAttachment) {
            throw new AppError_1.AppError(409, 'Policy is already attached to this user');
        }
        await delegation_service_1.delegationBypassService.validateForUserPolicyAttachment(requestingUserId, policyId, orgId);
        await users_repository_1.usersRepository.createPolicyAttachment(userId, policyId);
    }
    async detachPolicy(userId, policyId, orgId) {
        const user = await users_repository_1.usersRepository.findUserById(userId, orgId);
        if (!user) {
            throw new AppError_1.AppError(404, 'User not found');
        }
        const policy = await users_repository_1.usersRepository.findPolicyById(policyId, orgId);
        if (!policy) {
            throw new AppError_1.AppError(404, 'Policy not found');
        }
        const existingAttachment = await users_repository_1.usersRepository.findPolicyAttachment(userId, policyId);
        if (!existingAttachment) {
            throw new AppError_1.AppError(404, 'Policy is not attached to this user');
        }
        await users_repository_1.usersRepository.deletePolicyAttachment(userId, policyId);
    }
}
exports.usersService = new UsersService();

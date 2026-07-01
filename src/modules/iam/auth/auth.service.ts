import { authRepository } from './auth.repository';
import { AppError } from '../../../shared/utils/AppError';
import { hashPassword, verifyPassword } from '../../../shared/utils/password';
import { signToken } from '../../../shared/utils/jwt';
import { generateOpaqueToken, hashOpaqueToken } from '../../../shared/utils/tokens';
import { LoginResponse, RefreshResponse, UserProfile } from './auth.types';
import { z } from 'zod';
import { loginSchema, registerSchema } from './auth.validation';
import { env } from '../../../shared/config/env';

class AuthService {
  async register(data: z.infer<typeof registerSchema>): Promise<void> {
    const existingUser = await authRepository.findUserByEmail(data.email);
    if (existingUser) {
      throw new AppError(409, 'Email already in use');
    }

    if (data.registrationType === 'NORMAL') {
      const existingOrg = await authRepository.findOrganizationByName(data.organizationName);
      if (!existingOrg) {
        throw new AppError(404, 'Organization not found. Please check the organization name.');
      }
      const hashedPassword = await hashPassword(data.password);
      await authRepository.createUser({
        name: data.name,
        email: data.email,
        passwordHash: hashedPassword,
        isRoot: false,
        organizationId: existingOrg.id,
      });
    } else {
      const existingOrg = await authRepository.findOrganizationByName(data.organizationName);
      if (existingOrg) {
        throw new AppError(409, 'This organization has already been initialized. Please contact your organization\'s administrator for access.');
      }
      const newOrg = await authRepository.createOrganization(data.organizationName);
      const hashedPassword = await hashPassword(data.password);
      await authRepository.createUser({
        name: data.name,
        email: data.email,
        passwordHash: hashedPassword,
        isRoot: true,
        organizationId: newOrg.id,
      });
    }
  }

  async login(data: z.infer<typeof loginSchema>): Promise<{ loginResponse: LoginResponse; rawRefreshToken: string }> {
    const user = await authRepository.findUserByEmail(data.email);
    if (!user) {
      throw new AppError(401, 'Invalid credentials'); // Generic error
    }

    const isValidPassword = await verifyPassword(data.password, user.passwordHash);
    if (!isValidPassword) {
      throw new AppError(401, 'Invalid credentials'); // Generic error
    }

    const accessToken = signToken({ sub: user.id, isRoot: user.isRoot, orgId: user.organizationId });
    const rawRefreshToken = generateOpaqueToken();
    const tokenHash = hashOpaqueToken(rawRefreshToken);
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + env.REFRESH_TOKEN_EXPIRES_IN_DAYS);

    await authRepository.createRefreshToken(user.id, tokenHash, expiresAt);

    const userProfile: UserProfile = {
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

  async refresh(rawRefreshToken: string): Promise<{ refreshResponse: RefreshResponse; newRawRefreshToken: string }> {
    const tokenHash = hashOpaqueToken(rawRefreshToken);
    const tokenRecord = await authRepository.findRefreshToken(tokenHash);

    if (!tokenRecord) {
      throw new AppError(401, 'Invalid refresh token');
    }

    if (tokenRecord.revokedAt) {
      throw new AppError(401, 'Refresh token has been revoked');
    }

    if (tokenRecord.expiresAt < new Date()) {
      throw new AppError(401, 'Refresh token has expired');
    }

    // Revoke old token
    await authRepository.revokeRefreshToken(tokenRecord.id);

    // Get user
    const user = await authRepository.findUserById(tokenRecord.userId);
    if (!user) {
      throw new AppError(401, 'User not found');
    }

    // Issue new tokens
    const accessToken = signToken({ sub: user.id, isRoot: user.isRoot, orgId: user.organizationId });
    const newRawRefreshToken = generateOpaqueToken();
    const newTokenHash = hashOpaqueToken(newRawRefreshToken);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + env.REFRESH_TOKEN_EXPIRES_IN_DAYS);

    await authRepository.createRefreshToken(user.id, newTokenHash, expiresAt);

    return {
      refreshResponse: { accessToken },
      newRawRefreshToken,
    };
  }

  async logout(userId: string, rawRefreshToken: string): Promise<void> {
    const tokenHash = hashOpaqueToken(rawRefreshToken);
    const tokenRecord = await authRepository.findRefreshToken(tokenHash);

    if (tokenRecord && tokenRecord.userId === userId && !tokenRecord.revokedAt) {
      await authRepository.revokeRefreshToken(tokenRecord.id);
    }
  }

  async me(userId: string): Promise<UserProfile> {
    const user = await authRepository.findUserById(userId);
    if (!user) {
      throw new AppError(404, 'User not found');
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

export const authService = new AuthService();

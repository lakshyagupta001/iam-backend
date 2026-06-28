import { Request, Response } from 'express';
import { authService } from './auth.service';

const REFRESH_TOKEN_COOKIE = 'refreshToken';
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/api/auth/refresh',
};

class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    await authService.register(req.body);
    res.status(201).json({ success: true, message: 'User registered successfully' });
  }

  async login(req: Request, res: Response): Promise<void> {
    const { loginResponse, rawRefreshToken } = await authService.login(req.body);

    res.cookie(REFRESH_TOKEN_COOKIE, rawRefreshToken, REFRESH_COOKIE_OPTIONS);
    res.status(200).json({ success: true, data: loginResponse });
  }

  async refresh(req: Request, res: Response): Promise<void> {
    const currentRefreshToken = req.cookies[REFRESH_TOKEN_COOKIE];
    if (!currentRefreshToken) {
      res.status(401).json({ success: false, message: 'Refresh token missing' });
      return;
    }

    const { refreshResponse, newRawRefreshToken } = await authService.refresh(currentRefreshToken);

    res.cookie(REFRESH_TOKEN_COOKIE, newRawRefreshToken, REFRESH_COOKIE_OPTIONS);
    res.status(200).json({ success: true, data: refreshResponse });
  }

  async logout(req: Request, res: Response): Promise<void> {
    const currentRefreshToken = req.cookies[REFRESH_TOKEN_COOKIE];
    const userId = req.user?.id;

    if (currentRefreshToken && userId) {
      await authService.logout(userId, currentRefreshToken);
    }

    res.clearCookie(REFRESH_TOKEN_COOKIE, REFRESH_COOKIE_OPTIONS);
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  }

  async me(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const userProfile = await authService.me(userId);
    res.status(200).json({ success: true, data: userProfile });
  }
}

export const authController = new AuthController();

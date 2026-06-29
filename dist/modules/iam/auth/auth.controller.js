"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = void 0;
const auth_service_1 = require("./auth.service");
const REFRESH_TOKEN_COOKIE = 'refreshToken';
const REFRESH_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/auth/refresh',
};
class AuthController {
    async register(req, res) {
        await auth_service_1.authService.register(req.body);
        res.status(201).json({ success: true, message: 'User registered successfully' });
    }
    async login(req, res) {
        const { loginResponse, rawRefreshToken } = await auth_service_1.authService.login(req.body);
        res.cookie(REFRESH_TOKEN_COOKIE, rawRefreshToken, REFRESH_COOKIE_OPTIONS);
        res.status(200).json({ success: true, data: loginResponse });
    }
    async refresh(req, res) {
        const currentRefreshToken = req.cookies[REFRESH_TOKEN_COOKIE];
        if (!currentRefreshToken) {
            res.status(401).json({ success: false, message: 'Refresh token missing' });
            return;
        }
        const { refreshResponse, newRawRefreshToken } = await auth_service_1.authService.refresh(currentRefreshToken);
        res.cookie(REFRESH_TOKEN_COOKIE, newRawRefreshToken, REFRESH_COOKIE_OPTIONS);
        res.status(200).json({ success: true, data: refreshResponse });
    }
    async logout(req, res) {
        const currentRefreshToken = req.cookies[REFRESH_TOKEN_COOKIE];
        const userId = req.user?.id;
        if (currentRefreshToken && userId) {
            await auth_service_1.authService.logout(userId, currentRefreshToken);
        }
        res.clearCookie(REFRESH_TOKEN_COOKIE, REFRESH_COOKIE_OPTIONS);
        res.status(200).json({ success: true, message: 'Logged out successfully' });
    }
    async me(req, res) {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }
        const userProfile = await auth_service_1.authService.me(userId);
        res.status(200).json({ success: true, data: userProfile });
    }
}
exports.authController = new AuthController();

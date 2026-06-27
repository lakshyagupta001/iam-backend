"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const env_1 = require("./shared/config/env");
const errorHandler_middleware_1 = require("./shared/middleware/errorHandler.middleware");
const auth_routes_1 = require("./modules/auth/auth.routes");
const users_routes_1 = require("./modules/users/users.routes");
const app = (0, express_1.default)();
// Security Middlewares
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173', // Adjust based on frontend config
    credentials: true,
}));
// Body Parsers
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
// Rate Limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: env_1.env.NODE_ENV === 'development' ? 1000 : 100,
});
app.use(limiter);
// Routes
app.use('/api/auth', auth_routes_1.authRoutes);
app.use('/api/users', users_routes_1.usersRoutes);
// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', env: env_1.env.NODE_ENV });
});
// Error handling middleware (must be last)
app.use(errorHandler_middleware_1.errorHandler);
exports.default = app;

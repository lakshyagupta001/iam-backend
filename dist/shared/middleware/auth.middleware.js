"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jwt_1 = require("../utils/jwt");
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = (0, jwt_1.verifyToken)(token);
        req.user = {
            id: decoded.sub,
            isRoot: decoded.isRoot,
            orgId: decoded.orgId,
        };
        next();
    }
    catch (error) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
    }
};
exports.authMiddleware = authMiddleware;

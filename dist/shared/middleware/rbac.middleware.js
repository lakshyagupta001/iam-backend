"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRoot = void 0;
const AppError_1 = require("../utils/AppError");
const requireRoot = (req, res, next) => {
    if (!req.user) {
        return next(new AppError_1.AppError(401, 'Unauthorized'));
    }
    if (!req.user.isRoot) {
        return next(new AppError_1.AppError(403, 'Access denied: Root privileges required'));
    }
    next();
};
exports.requireRoot = requireRoot;

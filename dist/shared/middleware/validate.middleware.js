"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const zod_1 = require("zod");
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const validate = (schema) => {
    return (0, express_async_handler_1.default)(async (req, res, next) => {
        try {
            await schema.parseAsync(req.body);
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: error.flatten().fieldErrors,
                });
                return;
            }
            next(error);
        }
    });
};
exports.validate = validate;

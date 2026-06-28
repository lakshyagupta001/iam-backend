"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const validate = (schema, source = 'body') => {
    return (0, express_async_handler_1.default)(async (req, res, next) => {
        try {
            const parsedData = await schema.parseAsync(req[source]);
            Object.defineProperty(req, source, {
                value: parsedData,
                writable: true,
                enumerable: true,
                configurable: true,
            });
            next();
        }
        catch (error) {
            if (error?.name === 'ZodError') {
                res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: error.issues,
                });
                return;
            }
            next(error);
        }
    });
};
exports.validate = validate;

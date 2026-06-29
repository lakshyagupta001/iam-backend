"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAlertSchema = exports.createAlertSchema = void 0;
const zod_1 = require("zod");
exports.createAlertSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Title is required').max(100, 'Title is too long'),
    message: zod_1.z.string().min(1, 'Message is required').max(500, 'Message is too long'),
    severity: zod_1.z.string().min(1, 'Severity is required').max(50, 'Severity is too long'),
});
exports.updateAlertSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Title is required').max(100, 'Title is too long').optional(),
    message: zod_1.z.string().min(1, 'Message is required').max(500, 'Message is too long').optional(),
    severity: zod_1.z.string().min(1, 'Severity is required').max(50, 'Severity is too long').optional(),
});

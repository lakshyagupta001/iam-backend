"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateReportSchema = exports.createReportSchema = void 0;
const zod_1 = require("zod");
exports.createReportSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Title is required').max(100, 'Title is too long'),
    description: zod_1.z.string().max(500, 'Description is too long').optional(),
    status: zod_1.z.string().min(1, 'Status is required').max(50, 'Status is too long'),
});
exports.updateReportSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Title is required').max(100, 'Title is too long').optional(),
    description: zod_1.z.string().max(500, 'Description is too long').optional(),
    status: zod_1.z.string().min(1, 'Status is required').max(50, 'Status is too long').optional(),
});

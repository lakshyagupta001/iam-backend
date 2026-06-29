"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditService = void 0;
const audit_repository_1 = require("./audit.repository");
const AppError_1 = require("../../../shared/utils/AppError");
exports.auditService = {
    async listLogs(organizationId, params) {
        const { page, limit, search } = params;
        const [totalItems, logs] = await Promise.all([
            audit_repository_1.auditRepository.count(organizationId, search),
            audit_repository_1.auditRepository.findMany(organizationId, (page - 1) * limit, limit, search)
        ]);
        return { totalItems, logs };
    },
    async getLogById(organizationId, id) {
        const log = await audit_repository_1.auditRepository.findById(organizationId, id);
        if (!log) {
            throw new AppError_1.AppError(404, 'Audit log not found');
        }
        return log;
    }
};

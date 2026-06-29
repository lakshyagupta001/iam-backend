"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportsService = void 0;
const AppError_1 = require("../../../shared/utils/AppError");
const reports_repository_1 = require("./reports.repository");
exports.reportsService = {
    async listReports(organizationId, params) {
        const { page, limit, search } = params;
        const [totalItems, reports] = await Promise.all([
            reports_repository_1.reportsRepository.count(organizationId, search),
            reports_repository_1.reportsRepository.findMany(organizationId, (page - 1) * limit, limit, search)
        ]);
        return { totalItems, reports };
    },
    async getReport(organizationId, id) {
        const report = await reports_repository_1.reportsRepository.findUnique(id, organizationId);
        if (!report) {
            throw new AppError_1.AppError(404, 'Report not found');
        }
        return report;
    },
    async createReport(organizationId, data) {
        return reports_repository_1.reportsRepository.create({
            ...data,
            organizationId,
        });
    },
    async updateReport(organizationId, id, data) {
        const report = await reports_repository_1.reportsRepository.findUnique(id, organizationId);
        if (!report) {
            throw new AppError_1.AppError(404, 'Report not found');
        }
        return reports_repository_1.reportsRepository.update(id, data);
    },
    async deleteReport(organizationId, id) {
        const report = await reports_repository_1.reportsRepository.findUnique(id, organizationId);
        if (!report) {
            throw new AppError_1.AppError(404, 'Report not found');
        }
        await reports_repository_1.reportsRepository.delete(id);
    },
};

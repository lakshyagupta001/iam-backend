"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportsController = void 0;
const reports_service_1 = require("./reports.service");
const pagination_1 = require("../../../shared/utils/pagination");
exports.reportsController = {
    async list(req, res) {
        const { orgId: organizationId } = req.user;
        const params = (0, pagination_1.getPaginationParams)(req.query);
        const { totalItems, reports } = await reports_service_1.reportsService.listReports(organizationId, params);
        res.json({
            success: true,
            ...(0, pagination_1.formatPaginatedResponse)(reports, totalItems, params.page, params.limit)
        });
    },
    async get(req, res) {
        const { orgId: organizationId } = req.user;
        const { id } = req.params;
        const report = await reports_service_1.reportsService.getReport(organizationId, id);
        res.json({ success: true, data: report });
    },
    async create(req, res) {
        const { orgId: organizationId } = req.user;
        const report = await reports_service_1.reportsService.createReport(organizationId, req.body);
        res.status(201).json({ success: true, data: report });
    },
    async update(req, res) {
        const { orgId: organizationId } = req.user;
        const { id } = req.params;
        const report = await reports_service_1.reportsService.updateReport(organizationId, id, req.body);
        res.json({ success: true, data: report });
    },
    async delete(req, res) {
        const { orgId: organizationId } = req.user;
        const { id } = req.params;
        await reports_service_1.reportsService.deleteReport(organizationId, id);
        res.json({ success: true, message: 'Report deleted successfully' });
    },
};

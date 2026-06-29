"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.alertsController = void 0;
const alerts_service_1 = require("./alerts.service");
const pagination_1 = require("../../../shared/utils/pagination");
exports.alertsController = {
    async list(req, res) {
        const { orgId: organizationId } = req.user;
        const params = (0, pagination_1.getPaginationParams)(req.query);
        const { totalItems, alerts } = await alerts_service_1.alertsService.listAlerts(organizationId, params);
        res.json({
            success: true,
            ...(0, pagination_1.formatPaginatedResponse)(alerts, totalItems, params.page, params.limit)
        });
    },
    async get(req, res) {
        const { orgId: organizationId } = req.user;
        const { id } = req.params;
        const alert = await alerts_service_1.alertsService.getAlert(organizationId, id);
        res.json({ success: true, data: alert });
    },
    async create(req, res) {
        const { orgId: organizationId } = req.user;
        const alert = await alerts_service_1.alertsService.createAlert(organizationId, req.body);
        res.status(201).json({ success: true, data: alert });
    },
    async update(req, res) {
        const { orgId: organizationId } = req.user;
        const { id } = req.params;
        const alert = await alerts_service_1.alertsService.updateAlert(organizationId, id, req.body);
        res.json({ success: true, data: alert });
    },
    async delete(req, res) {
        const { orgId: organizationId } = req.user;
        const { id } = req.params;
        await alerts_service_1.alertsService.deleteAlert(organizationId, id);
        res.json({ success: true, message: 'Alert deleted successfully' });
    },
};

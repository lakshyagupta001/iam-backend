"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditController = void 0;
const audit_service_1 = require("./audit.service");
const pagination_1 = require("../../../shared/utils/pagination");
exports.auditController = {
    async list(req, res) {
        const { orgId: organizationId } = req.user;
        const params = (0, pagination_1.getPaginationParams)(req.query);
        const { totalItems, logs } = await audit_service_1.auditService.listLogs(organizationId, params);
        res.json({
            success: true,
            ...(0, pagination_1.formatPaginatedResponse)(logs, totalItems, params.page, params.limit)
        });
    },
    async get(req, res) {
        const { orgId: organizationId } = req.user;
        const id = req.params.id;
        const log = await audit_service_1.auditService.getLogById(organizationId, id);
        res.json(log);
    },
};

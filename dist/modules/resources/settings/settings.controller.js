"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.settingsController = void 0;
const settings_service_1 = require("./settings.service");
const pagination_1 = require("../../../shared/utils/pagination");
exports.settingsController = {
    async list(req, res) {
        const { orgId: organizationId } = req.user;
        const params = (0, pagination_1.getPaginationParams)(req.query);
        const { totalItems, settings } = await settings_service_1.settingsService.listSettings(organizationId, params);
        res.json({
            success: true,
            ...(0, pagination_1.formatPaginatedResponse)(settings, totalItems, params.page, params.limit)
        });
    },
    async update(req, res) {
        const { orgId: organizationId } = req.user;
        const { key, value } = req.body;
        const setting = await settings_service_1.settingsService.updateSetting(organizationId, { key, value });
        res.json({ success: true, data: setting });
    },
};

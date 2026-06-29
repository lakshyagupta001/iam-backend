"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.settingsService = void 0;
const settings_repository_1 = require("./settings.repository");
exports.settingsService = {
    async listSettings(organizationId, params) {
        const { page, limit, search } = params;
        const [totalItems, settings] = await Promise.all([
            settings_repository_1.settingsRepository.count(organizationId, search),
            settings_repository_1.settingsRepository.findMany(organizationId, (page - 1) * limit, limit, search)
        ]);
        return { totalItems, settings };
    },
    async updateSetting(organizationId, data) {
        const { key, value } = data;
        return settings_repository_1.settingsRepository.upsert(organizationId, key, value);
    },
};

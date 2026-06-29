"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.alertsService = void 0;
const AppError_1 = require("../../../shared/utils/AppError");
const alerts_repository_1 = require("./alerts.repository");
exports.alertsService = {
    async listAlerts(organizationId, params) {
        const { page, limit, search } = params;
        const [totalItems, alerts] = await Promise.all([
            alerts_repository_1.alertsRepository.count(organizationId, search),
            alerts_repository_1.alertsRepository.findMany(organizationId, (page - 1) * limit, limit, search)
        ]);
        return { totalItems, alerts };
    },
    async getAlert(organizationId, id) {
        const alert = await alerts_repository_1.alertsRepository.findUnique(id, organizationId);
        if (!alert) {
            throw new AppError_1.AppError(404, 'Alert not found');
        }
        return alert;
    },
    async createAlert(organizationId, data) {
        return alerts_repository_1.alertsRepository.create({
            ...data,
            organizationId,
        });
    },
    async updateAlert(organizationId, id, data) {
        const alert = await alerts_repository_1.alertsRepository.findUnique(id, organizationId);
        if (!alert) {
            throw new AppError_1.AppError(404, 'Alert not found');
        }
        return alerts_repository_1.alertsRepository.update(id, data);
    },
    async deleteAlert(organizationId, id) {
        const alert = await alerts_repository_1.alertsRepository.findUnique(id, organizationId);
        if (!alert) {
            throw new AppError_1.AppError(404, 'Alert not found');
        }
        await alerts_repository_1.alertsRepository.delete(id);
    },
};

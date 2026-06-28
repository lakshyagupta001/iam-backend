import { AppError } from '../../../shared/utils/AppError';
import { reportsRepository } from './reports.repository';

export const reportsService = {
  async listReports(organizationId: string, params: { page: number; limit: number; search?: string }) {
    const { page, limit, search } = params;
    const [totalItems, reports] = await Promise.all([
      reportsRepository.count(organizationId, search),
      reportsRepository.findMany(organizationId, (page - 1) * limit, limit, search)
    ]);
    return { totalItems, reports };
  },

  async getReport(organizationId: string, id: string) {
    const report = await reportsRepository.findUnique(id, organizationId);

    if (!report) {
      throw new AppError(404, 'Report not found');
    }

    return report;
  },

  async createReport(organizationId: string, data: { title: string; description?: string; status: string }) {
    return reportsRepository.create({
      ...data,
      organizationId,
    });
  },

  async updateReport(organizationId: string, id: string, data: { title?: string; description?: string; status?: string }) {
    const report = await reportsRepository.findUnique(id, organizationId);

    if (!report) {
      throw new AppError(404, 'Report not found');
    }

    return reportsRepository.update(id, data);
  },

  async deleteReport(organizationId: string, id: string) {
    const report = await reportsRepository.findUnique(id, organizationId);

    if (!report) {
      throw new AppError(404, 'Report not found');
    }

    await reportsRepository.delete(id);
  },
};

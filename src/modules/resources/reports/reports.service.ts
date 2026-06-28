import { AppError } from '../../../shared/utils/AppError';
import { reportsRepository } from './reports.repository';

export const reportsService = {
  async listReports(organizationId: string) {
    return reportsRepository.findMany(organizationId);
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

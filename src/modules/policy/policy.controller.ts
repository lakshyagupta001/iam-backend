import { Request, Response } from 'express';
import { policyService } from './policy.service';
import { getPaginationParams, formatPaginatedResponse } from '../../shared/utils/pagination';

class PolicyController {
  async createPolicy(req: Request, res: Response): Promise<void> {
    const policy = await policyService.createPolicy(req.user!.orgId, req.body);
    res.status(201).json({ success: true, message: 'Policy created successfully', data: policy });
  }

  async listPolicies(req: Request, res: Response): Promise<void> {
    const params = getPaginationParams(req.query);
    const type = req.query.type as any;
    const sort = req.query.sort as string;
    const order = req.query.order as 'asc' | 'desc';
    
    const { totalItems, policies } = await policyService.listPolicies(req.user!.orgId, { ...params, type, sort, order });
    
    res.status(200).json({
      success: true,
      ...formatPaginatedResponse(policies, totalItems, params.page, params.limit)
    });
  }

  async getPolicy(req: Request, res: Response): Promise<void> {
    const policy = await policyService.getPolicyById(req.params.id as string, req.user!.orgId);
    res.status(200).json({ success: true, data: policy });
  }

  async updatePolicy(req: Request, res: Response): Promise<void> {
    const policy = await policyService.updatePolicy(req.params.id as string, req.user!.orgId, req.body);
    res.status(200).json({ success: true, message: 'Policy updated successfully', data: policy });
  }

  async deletePolicy(req: Request, res: Response): Promise<void> {
    await policyService.deletePolicy(req.params.id as string, req.user!.orgId, req.user!.isRoot);
    res.status(200).json({ success: true, message: 'Policy deleted successfully' });
  }
}

export const policyController = new PolicyController();

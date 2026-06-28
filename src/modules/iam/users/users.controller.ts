import { Request, Response } from 'express';
import { usersService } from './users.service';
import { getPaginationParams, formatPaginatedResponse } from '../../../shared/utils/pagination';
import { permissionService } from '../evaluation/evaluation.service';

class UsersController {
  async listUsers(req: Request, res: Response): Promise<void> {
    const params = getPaginationParams(req.query);
    const { totalItems, users } = await usersService.listUsers(req.user!.orgId, params);
    
    res.status(200).json({
      success: true,
      ...formatPaginatedResponse(users, totalItems, params.page, params.limit)
    });
  }

  async createUser(req: Request, res: Response): Promise<void> {
    const user = await usersService.createUser(req.user!.orgId, req.body);
    res.status(201).json({ success: true, data: user, message: 'User created successfully' });
  }

  async getUser(req: Request, res: Response): Promise<void> {
    const user = await usersService.getUserById(req.params.id as string, req.user!.orgId);
    res.status(200).json({ success: true, data: user });
  }

  async attachPolicy(req: Request, res: Response): Promise<void> {
    const userId = req.params.id as string;
    const { policyId } = req.body;
    await usersService.attachPolicy(userId, policyId, req.user!.orgId, req.user!.id);
    res.status(201).json({ success: true, message: 'Policy attached successfully' });
  }

  async detachPolicy(req: Request, res: Response): Promise<void> {
    const userId = req.params.id as string;
    const policyId = req.params.policyId as string;
    await usersService.detachPolicy(userId, policyId, req.user!.orgId);
    res.status(200).json({ success: true, message: 'Policy detached successfully' });
  }

  async getEffectivePermissions(req: Request, res: Response): Promise<void> {
    // 1. Validate the user ID (already done by idParamSchema in routes)
    const userId = req.params.id as string;
    
    // Ensure the user exists in this organization before returning permissions
    // We can just call getUserById which throws 404 if not found
    await usersService.getUserById(userId, req.user!.orgId);

    // 2. Call the existing Permission Evaluation Service
    const permissions = await permissionService.getEffectivePermissions(userId);

    // 3. Return the calculated effective permissions
    res.status(200).json({ success: true, data: permissions });
  }
}

export const usersController = new UsersController();

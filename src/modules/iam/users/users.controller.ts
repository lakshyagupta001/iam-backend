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
    const userId = req.params.id as string;
    const requestingUser = req.user!;

    // Security: a non-root user may only fetch their own effective permissions
    // unless they have iam:GetUser (checked via the IAM evaluation engine).
    // We check self-access here so the route can remain open for the login flow.
    const { permissionService: evalService } = await import('../evaluation/evaluation.service');
    const canGetOthers = requestingUser.isRoot || await evalService.canPerformAction(requestingUser.id, 'iam:GetUser');

    if (!canGetOthers && requestingUser.id !== userId) {
      res.status(403).json({ success: false, message: 'Access denied. You may only view your own effective permissions.' });
      return;
    }

    // Ensure the user exists in this organization before returning permissions
    await usersService.getUserById(userId, requestingUser.orgId);

    const permissions = await permissionService.getEffectivePermissions(userId);
    res.status(200).json({ success: true, data: permissions });
  }
}

export const usersController = new UsersController();

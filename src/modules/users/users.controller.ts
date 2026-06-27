import { Request, Response } from 'express';
import { usersService } from './users.service';

class UsersController {
  async listUsers(req: Request, res: Response): Promise<void> {
    const users = await usersService.listUsers(req.user!.orgId);
    res.status(200).json({ success: true, data: users });
  }

  async createUser(req: Request, res: Response): Promise<void> {
    const user = await usersService.createUser(req.user!.orgId, req.body);
    res.status(201).json({ success: true, data: user, message: 'User created successfully' });
  }

  async attachPolicy(req: Request, res: Response): Promise<void> {
    const userId = req.params.id as string;
    const { policyId } = req.body;
    await usersService.attachPolicy(userId, policyId, req.user!.orgId);
    res.status(201).json({ success: true, message: 'Policy attached successfully' });
  }

  async detachPolicy(req: Request, res: Response): Promise<void> {
    const userId = req.params.id as string;
    const policyId = req.params.policyId as string;
    await usersService.detachPolicy(userId, policyId, req.user!.orgId);
    res.status(200).json({ success: true, message: 'Policy detached successfully' });
  }
}

export const usersController = new UsersController();

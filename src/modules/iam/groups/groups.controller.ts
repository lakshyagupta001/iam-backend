import { Request, Response } from 'express';
import { groupService } from './groups.service';
import { GroupQueryDto } from './groups.types';
import { groupQuerySchema } from './groups.validation';

class GroupController {
  async createGroup(req: Request, res: Response): Promise<void> {
    const group = await groupService.createGroup(req.user!.orgId, req.body);
    res.status(201).json({ success: true, message: 'Group created successfully', data: group });
  }

  async listGroups(req: Request, res: Response): Promise<void> {
    // Validate query string
    const query = groupQuerySchema.parse(req.query) as GroupQueryDto;
    
    const result = await groupService.listGroups(req.user!.orgId, query);
    
    const { formatPaginatedResponse } = await import('../../../shared/utils/pagination');

    res.status(200).json({
      success: true,
      ...formatPaginatedResponse(result.groups, result.total, query.page || 1, query.limit || 10)
    });
  }

  async listDelegatableGroups(req: Request, res: Response): Promise<void> {
    const query = groupQuerySchema.parse(req.query) as GroupQueryDto;
    
    const result = await groupService.listDelegatableGroups(
      req.user!.orgId,
      req.user!.id,
      req.user!.isRoot,
      query
    );
    
    const { formatPaginatedResponse } = await import('../../../shared/utils/pagination');

    res.status(200).json({
      success: true,
      ...formatPaginatedResponse(result.groups, result.total, query.page || 1, query.limit || 10)
    });
  }

  async getGroup(req: Request, res: Response): Promise<void> {
    const group = await groupService.getGroupById(req.params.id as string, req.user!.orgId);
    
    // Map to the format the frontend expects
    const mappedGroup = {
      ...group,
      memberships: (group as any).users,
      policyAttachments: (group as any).policies,
    };

    res.status(200).json({ success: true, data: mappedGroup });
  }

  async updateGroup(req: Request, res: Response): Promise<void> {
    const group = await groupService.updateGroup(req.params.id as string, req.user!.orgId, req.body);
    res.status(200).json({ success: true, message: 'Group updated successfully', data: group });
  }

  async deleteGroup(req: Request, res: Response): Promise<void> {
    await groupService.deleteGroup(req.params.id as string, req.user!.orgId);
    res.status(200).json({ success: true, message: 'Group deleted successfully' });
  }

  async addMember(req: Request, res: Response): Promise<void> {
    const { userId } = req.body;
    await groupService.addUserToGroup(req.params.id as string, userId, req.user!.orgId);
    res.status(201).json({ success: true, message: 'User added to group successfully' });
  }

  async removeMember(req: Request, res: Response): Promise<void> {
    const userId = req.params.userId as string;
    await groupService.removeUserFromGroup(req.params.id as string, userId, req.user!.orgId);
    res.status(200).json({ success: true, message: 'User removed from group successfully' });
  }

  async attachPolicy(req: Request, res: Response): Promise<void> {
    const groupId = req.params.id as string;
    const { policyId } = req.body;
    await groupService.attachPolicy(groupId, policyId, req.user!.orgId, req.user!.id);
    res.status(201).json({ success: true, message: 'Policy attached successfully' });
  }

  async detachPolicy(req: Request, res: Response): Promise<void> {
    const groupId = req.params.id as string;
    const policyId = req.params.policyId as string;
    await groupService.detachPolicy(groupId, policyId, req.user!.orgId);
    res.status(200).json({ success: true, message: 'Policy detached successfully' });
  }
}

export const groupController = new GroupController();

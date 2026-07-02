export const IAM_ACTIONS = [
  // Reports
  'reports:List', 'reports:Read', 'reports:Create', 'reports:Update', 'reports:Delete',
  // Alerts
  'alerts:List', 'alerts:Read', 'alerts:Create', 'alerts:Acknowledge', 'alerts:Delete',
  // Settings
  'settings:Read', 'settings:Update',
  // Audit
  'audit:List', 'audit:Read',
  // IAM Policies
  'iam:ListPolicies', 'iam:GetPolicy', 'iam:CreatePolicy', 'iam:UpdatePolicy', 'iam:DeletePolicy',
  // IAM Groups
  'iam:ListGroups', 'iam:GetGroup', 'iam:CreateGroup', 'iam:UpdateGroup', 'iam:DeleteGroup',
  'iam:AddUserToGroup', 'iam:RemoveUserFromGroup', 'iam:AttachGroupPolicy', 'iam:DetachGroupPolicy',
  // IAM Users
  'iam:ListUsers', 'iam:GetUser', 'iam:AttachUserPolicy', 'iam:DetachUserPolicy',
  'iam:PutUserBoundary', 'iam:DeleteUserBoundary'
] as const;

export type IamAction = typeof IAM_ACTIONS[number];

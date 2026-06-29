/**
 * prisma/seed.ts
 *
 * Production-quality, idempotent seed for the Change Networks IAM platform.
 *
 * Execution order respects all foreign-key dependencies:
 *   Organization → Users → Policies → Groups →
 *   Group⟷Policy → User⟷Group → User⟷Policy → Boundaries → Resources → Audit
 *
 * Safe to run multiple times. Uses upsert / createIfNotExists patterns throughout.
 *
 * Run with:
 *   npx prisma db seed
 *   npm run prisma:seed
 */

import { PrismaClient, PolicyType, Effect } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

// ─── helpers ────────────────────────────────────────────────────────────────

const hash = (pw: string) => bcrypt.hash(pw, SALT_ROUNDS);
const log  = (msg: string) => console.log(`  ✓ ${msg}`);
const sep  = () => console.log('');

// ─── 1. Organization ────────────────────────────────────────────────────────

async function seedOrganization() {
  const org = await prisma.organization.upsert({
    where:  { name: 'Change Networks' },
    update: {},
    create: { name: 'Change Networks' },
  });
  log(`Organization seeded → "${org.name}" (${org.id})`);
  return org;
}

// ─── 2. Policies ────────────────────────────────────────────────────────────

interface PolicyDef {
  name: string;
  description: string;
  type: PolicyType;
  statements: { effect: Effect; actions: string[]; resource: string }[];
}

const POLICY_DEFINITIONS: PolicyDef[] = [
  // ── Reports ──────────────────────────────────────────────────────────────
  {
    name: 'ReportsReadOnly',
    description: 'Allows read-only access to all reports.',
    type: PolicyType.MANAGED,
    statements: [
      { effect: Effect.ALLOW, actions: ['reports:List', 'reports:Read'], resource: '*' },
    ],
  },
  {
    name: 'ReportsEditor',
    description: 'Allows creating and updating reports, but not deleting.',
    type: PolicyType.MANAGED,
    statements: [
      { effect: Effect.ALLOW, actions: ['reports:List', 'reports:Read', 'reports:Create', 'reports:Update'], resource: '*' },
    ],
  },
  {
    name: 'ReportsAdmin',
    description: 'Full access to all report operations including deletion.',
    type: PolicyType.MANAGED,
    statements: [
      { effect: Effect.ALLOW, actions: ['reports:List', 'reports:Read', 'reports:Create', 'reports:Update', 'reports:Delete'], resource: '*' },
    ],
  },
  // ── Alerts ───────────────────────────────────────────────────────────────
  {
    name: 'AlertsOperator',
    description: 'Allows viewing and acknowledging alerts. Cannot create or delete.',
    type: PolicyType.MANAGED,
    statements: [
      { effect: Effect.ALLOW, actions: ['alerts:List', 'alerts:Read', 'alerts:Acknowledge'], resource: '*' },
      { effect: Effect.DENY,  actions: ['alerts:Delete'],                                   resource: '*' },
    ],
  },
  {
    name: 'AlertsAdmin',
    description: 'Full access to all alert operations.',
    type: PolicyType.MANAGED,
    statements: [
      { effect: Effect.ALLOW, actions: ['alerts:List', 'alerts:Read', 'alerts:Create', 'alerts:Update', 'alerts:Acknowledge', 'alerts:Delete'], resource: '*' },
    ],
  },
  // ── Audit ────────────────────────────────────────────────────────────────
  {
    name: 'AuditViewer',
    description: 'Read-only access to audit logs. No mutation capabilities.',
    type: PolicyType.MANAGED,
    statements: [
      { effect: Effect.ALLOW, actions: ['audit:List', 'audit:Read'], resource: '*' },
    ],
  },
  // ── Settings ─────────────────────────────────────────────────────────────
  {
    name: 'SettingsManager',
    description: 'Allows reading and updating organization settings.',
    type: PolicyType.MANAGED,
    statements: [
      { effect: Effect.ALLOW, actions: ['settings:Read', 'settings:Update'], resource: '*' },
    ],
  },
  // ── IAM ──────────────────────────────────────────────────────────────────
  {
    name: 'IAMReadOnly',
    description: 'Read-only access to IAM resources: users, groups, and policies.',
    type: PolicyType.MANAGED,
    statements: [
      {
        effect: Effect.ALLOW,
        actions: ['iam:ListUsers', 'iam:GetUser', 'iam:ListGroups', 'iam:GetGroup', 'iam:ListPolicies', 'iam:GetPolicy'],
        resource: '*',
      },
    ],
  },
  {
    name: 'IAMAdministrator',
    description: 'Full administrative access to all IAM operations.',
    type: PolicyType.MANAGED,
    statements: [
      {
        effect: Effect.ALLOW,
        actions: [
          'iam:ListUsers', 'iam:GetUser', 'iam:AttachUserPolicy', 'iam:DetachUserPolicy',
          'iam:PutUserBoundary', 'iam:DeleteUserBoundary',
          'iam:ListGroups', 'iam:GetGroup', 'iam:CreateGroup', 'iam:UpdateGroup', 'iam:DeleteGroup',
          'iam:AddUserToGroup', 'iam:RemoveUserFromGroup',
          'iam:AttachGroupPolicy', 'iam:DetachGroupPolicy',
          'iam:ListPolicies', 'iam:GetPolicy', 'iam:CreatePolicy', 'iam:UpdatePolicy', 'iam:DeletePolicy',
        ],
        resource: '*',
      },
    ],
  },
  // ── Boundaries (must be MANAGED) ─────────────────────────────────────────
  {
    name: 'ReadOnlyBoundary',
    description: 'Permission boundary that caps all users to read-only access across all resources.',
    type: PolicyType.MANAGED,
    statements: [
      {
        effect: Effect.ALLOW,
        actions: [
          'reports:List', 'reports:Read',
          'alerts:List',  'alerts:Read',
          'audit:List',   'audit:Read',
          'settings:Read',
          'iam:ListUsers', 'iam:GetUser',
          'iam:ListGroups', 'iam:GetGroup',
          'iam:ListPolicies', 'iam:GetPolicy',
        ],
        resource: '*',
      },
    ],
  },
  {
    name: 'DeveloperBoundary',
    description: 'Boundary that limits developers to reports, alerts, and read-only IAM.',
    type: PolicyType.MANAGED,
    statements: [
      {
        effect: Effect.ALLOW,
        actions: [
          'reports:List', 'reports:Read', 'reports:Create', 'reports:Update',
          'alerts:List',  'alerts:Read',  'alerts:Acknowledge',
          'audit:List',   'audit:Read',
          'iam:ListUsers', 'iam:GetUser',
          'iam:ListGroups', 'iam:GetGroup',
          'iam:ListPolicies', 'iam:GetPolicy',
        ],
        resource: '*',
      },
    ],
  },
  {
    name: 'SupportBoundary',
    description: 'Narrow boundary for support staff: view reports and alerts only.',
    type: PolicyType.MANAGED,
    statements: [
      {
        effect: Effect.ALLOW,
        actions: [
          'reports:List', 'reports:Read',
          'alerts:List',  'alerts:Read',  'alerts:Acknowledge',
        ],
        resource: '*',
      },
    ],
  },
];

async function seedPolicies(orgId: string) {
  const policyMap: Record<string, string> = {}; // name → id

  for (const def of POLICY_DEFINITIONS) {
    // Upsert the policy header (name + description + type)
    const policy = await prisma.policy.upsert({
      where:  { name_organizationId: { name: def.name, organizationId: orgId } },
      update: { description: def.description, type: def.type },
      create: { name: def.name, description: def.description, type: def.type, organizationId: orgId },
    });

    // Idempotent statement replacement:
    // Delete existing statements and re-create so re-runs stay in sync with definitions.
    await prisma.policyStatement.deleteMany({ where: { policyId: policy.id } });
    await prisma.policyStatement.createMany({
      data: def.statements.map(s => ({
        policyId: policy.id,
        effect:   s.effect,
        actions:  s.actions,
        resource: s.resource,
      })),
    });

    policyMap[def.name] = policy.id;
  }

  log(`${POLICY_DEFINITIONS.length} Policies seeded`);
  return policyMap;
}

// ─── 3. Groups ──────────────────────────────────────────────────────────────

interface GroupDef {
  name: string;
  description: string;
  policies: string[]; // policy names to attach
}

const GROUP_DEFINITIONS: GroupDef[] = [
  {
    name: 'Developers',
    description: 'Software engineers with full report/alert access and read-only IAM.',
    policies: ['ReportsEditor', 'AlertsOperator', 'IAMReadOnly'],
  },
  {
    name: 'Frontend Team',
    description: 'Frontend engineers with read and create access to reports.',
    policies: ['ReportsEditor', 'AlertsOperator'],
  },
  {
    name: 'Backend Team',
    description: 'Backend engineers with full report access and audit viewing.',
    policies: ['ReportsAdmin', 'AuditViewer', 'IAMReadOnly'],
  },
  {
    name: 'QA',
    description: 'Quality assurance team with read-only access to reports and alerts.',
    policies: ['ReportsReadOnly', 'AlertsOperator', 'AuditViewer'],
  },
  {
    name: 'Managers',
    description: 'Managers with broad read access, settings management, and audit access.',
    policies: ['ReportsReadOnly', 'AlertsAdmin', 'SettingsManager', 'AuditViewer', 'IAMReadOnly'],
  },
  {
    name: 'Security',
    description: 'Security team with IAM administration and full audit access.',
    policies: ['IAMAdministrator', 'AuditViewer', 'AlertsAdmin'],
  },
  {
    name: 'Auditors',
    description: 'Read-only auditors scoped to audit logs and reports only.',
    policies: ['AuditViewer', 'ReportsReadOnly'],
  },
];

async function seedGroups(orgId: string, policyMap: Record<string, string>) {
  const groupMap: Record<string, string> = {}; // name → id

  for (const def of GROUP_DEFINITIONS) {
    // Upsert group
    const group = await prisma.group.upsert({
      where:  { name_organizationId: { name: def.name, organizationId: orgId } },
      update: { description: def.description },
      create: { name: def.name, description: def.description, organizationId: orgId },
    });

    groupMap[def.name] = group.id;

    // Attach policies to group (skip if already attached)
    for (const policyName of def.policies) {
      const policyId = policyMap[policyName];
      if (!policyId) continue;

      await prisma.groupPolicyAttachment.upsert({
        where:  { groupId_policyId: { groupId: group.id, policyId } },
        update: {},
        create: { groupId: group.id, policyId },
      });
    }
  }

  log(`${GROUP_DEFINITIONS.length} Groups seeded with policy attachments`);
  return groupMap;
}

// ─── 4. Users ───────────────────────────────────────────────────────────────

interface UserDef {
  name: string;
  email: string;
  password: string;
  isRoot: boolean;
  groups: string[];                   // group names
  directPolicies: string[];            // policy names
  boundary?: string;                   // boundary policy name
}

const USER_DEFINITIONS: UserDef[] = [
  // Root administrator — no group, no boundary (root bypasses all evaluation)
  {
    name:           'Root Administrator',
    email:          'root@changenetworks.com',
    password:       'Pass@123',
    isRoot:         true,
    groups:         [],
    directPolicies: [],
  },

  // Lakshya Gupta — Developer, member of Developers + Backend Team, developer boundary
  {
    name:           'Lakshya Gupta',
    email:          'lakshya@changenetworks.com',
    password:       'Pass@123',
    isRoot:         false,
    groups:         ['Developers', 'Backend Team'],
    directPolicies: [], // inherits via groups
    boundary:       'DeveloperBoundary',
  },

  // Yash Ojha — Manager with direct SettingsManager policy and broad group access
  {
    name:           'Yash Ojha',
    email:          'yash@changenetworks.com',
    password:       'Pass@123',
    isRoot:         false,
    groups:         ['Managers'],
    directPolicies: ['ReportsAdmin'], // direct attachment demo
  },

  // Alice Smith — QA engineer in QA group, read-only boundary
  {
    name:           'Alice Smith',
    email:          'alice@changenetworks.com',
    password:       'Pass@123',
    isRoot:         false,
    groups:         ['QA'],
    directPolicies: [],
    boundary:       'ReadOnlyBoundary',
  },

  // Bob Johnson — Security team member with IAM admin powers
  {
    name:           'Bob Johnson',
    email:          'bob@changenetworks.com',
    password:       'Pass@123',
    isRoot:         false,
    groups:         ['Security'],
    directPolicies: ['AuditViewer'], // direct attachment in addition to group
  },

  // John Doe — Frontend developer with developer boundary
  {
    name:           'John Doe',
    email:          'john@changenetworks.com',
    password:       'Pass@123',
    isRoot:         false,
    groups:         ['Frontend Team'],
    directPolicies: [],
    boundary:       'DeveloperBoundary',
  },

  // Sara Chen — Auditor with direct AuditViewer policy and support boundary
  {
    name:           'Sara Chen',
    email:          'sara@changenetworks.com',
    password:       'Pass@123',
    isRoot:         false,
    groups:         ['Auditors'],
    directPolicies: [],
    boundary:       'SupportBoundary',
  },

  // Vikas Ojha — existing user preserved from previous seed
  {
    name:           'Vikas Ojha',
    email:          'vikasojha@changenetworks.com',
    password:       'Pass@123',
    isRoot:         false,
    groups:         ['Managers', 'Developers'],
    directPolicies: ['AlertsAdmin'],
  },
];

async function seedUsers(
  orgId: string,
  groupMap: Record<string, string>,
  policyMap: Record<string, string>
) {
  let userCount = 0;

  for (const def of USER_DEFINITIONS) {
    const passwordHash = await hash(def.password);

    // Upsert user
    const user = await prisma.user.upsert({
      where:  { email: def.email },
      update: { name: def.name, passwordHash, organizationId: orgId },
      create: {
        name:           def.name,
        email:          def.email,
        passwordHash,
        isRoot:         def.isRoot,
        organizationId: orgId,
      },
    });

    // Group memberships
    for (const groupName of def.groups) {
      const groupId = groupMap[groupName];
      if (!groupId) continue;

      await prisma.userGroupMembership.upsert({
        where:  { userId_groupId: { userId: user.id, groupId } },
        update: {},
        create: { userId: user.id, groupId },
      });
    }

    // Direct policy attachments
    for (const policyName of def.directPolicies) {
      const policyId = policyMap[policyName];
      if (!policyId) continue;

      await prisma.userPolicyAttachment.upsert({
        where:  { userId_policyId: { userId: user.id, policyId } },
        update: {},
        create: { userId: user.id, policyId },
      });
    }

    // Permission boundary (one per user — upsert replaces previous)
    if (def.boundary) {
      const policyId = policyMap[def.boundary];
      if (policyId) {
        await prisma.userBoundary.upsert({
          where:  { userId: user.id },
          update: { policyId },
          create: { userId: user.id, policyId },
        });
      }
    }

    userCount++;
  }

  log(`${userCount} Users seeded (groups, direct policies, and boundaries applied)`);
}

// ─── 5. Reports ─────────────────────────────────────────────────────────────

const REPORTS = [
  { title: 'Q1 2025 Network Performance Summary',   description: 'Comprehensive summary of network throughput and latency metrics for Q1 2025.',  status: 'PUBLISHED' },
  { title: 'Q2 2025 Security Incident Report',      description: 'Analysis of all security incidents detected and resolved in Q2 2025.',          status: 'PUBLISHED' },
  { title: 'Monthly Bandwidth Utilization – June',  description: 'Breakdown of bandwidth consumption by region and service type for June.',       status: 'DRAFT'     },
  { title: 'Annual IAM Compliance Report 2024',     description: 'Full audit of IAM configurations and compliance adherence for the year 2024.',  status: 'PUBLISHED' },
  { title: 'Infrastructure Cost Analysis – H1',     description: 'Cost attribution and optimization opportunities for H1 infrastructure spend.',  status: 'DRAFT'     },
  { title: 'SLA Breach Analysis – May 2025',        description: 'Root cause analysis for SLA breaches recorded in May 2025.',                   status: 'PUBLISHED' },
  { title: 'User Activity Digest – June 2025',      description: 'Summary of user logins, actions, and anomaly detections for June 2025.',       status: 'PUBLISHED' },
  { title: 'Disaster Recovery Test Results',        description: 'Results and findings from the June DR simulation exercise.',                    status: 'DRAFT'     },
];

async function seedReports(orgId: string) {
  for (const r of REPORTS) {
    // Use createMany with skipDuplicates if title+org has no unique constraint;
    // since there's no unique constraint on (title, orgId), we guard with a findFirst.
    const exists = await prisma.report.findFirst({ where: { title: r.title, organizationId: orgId } });
    if (!exists) {
      await prisma.report.create({ data: { ...r, organizationId: orgId } });
    }
  }
  log(`${REPORTS.length} Reports seeded`);
}

// ─── 6. Alerts ──────────────────────────────────────────────────────────────

const ALERTS = [
  { title: 'High CPU Load on Edge Router',          message: 'Edge router CPU exceeded 90% for 15 consecutive minutes. Investigate immediately.',  severity: 'CRITICAL' },
  { title: 'Unusual Login Activity Detected',       message: 'Multiple failed login attempts from IP 203.0.113.42. Possible brute-force attack.',  severity: 'HIGH'     },
  { title: 'SSL Certificate Expiring in 14 Days',   message: 'The SSL certificate for api.changenetworks.com expires on 2025-07-13.',             severity: 'MEDIUM'   },
  { title: 'Disk Usage Above 80% on DB Server',     message: 'Primary PostgreSQL server disk usage is at 83%. Plan for expansion.',               severity: 'MEDIUM'   },
  { title: 'API Response Time Degraded',            message: 'Average API response time has increased by 340ms over the last 30 minutes.',        severity: 'LOW'      },
  { title: 'Backup Job Failed – Nightly Run',       message: 'The nightly database backup job failed at 02:00 UTC. Manual intervention needed.',  severity: 'HIGH'     },
  { title: 'New Root Login from Unrecognized IP',   message: 'Root user logged in from IP 198.51.100.7, which has not been seen before.',         severity: 'CRITICAL' },
  { title: 'Rate Limit Threshold Reached',          message: 'API rate limiter triggered for tenant ID 4ac1-...  Review client integration.',     severity: 'LOW'      },
];

async function seedAlerts(orgId: string) {
  for (const a of ALERTS) {
    const exists = await prisma.alert.findFirst({ where: { title: a.title, organizationId: orgId } });
    if (!exists) {
      await prisma.alert.create({ data: { ...a, organizationId: orgId } });
    }
  }
  log(`${ALERTS.length} Alerts seeded`);
}

// ─── 7. Settings ────────────────────────────────────────────────────────────

const SETTINGS = [
  { key: 'org.displayName',           value: 'Change Networks'                         },
  { key: 'org.timezone',              value: 'Asia/Kolkata'                            },
  { key: 'org.defaultLanguage',       value: 'en-IN'                                   },
  { key: 'security.mfaEnforced',      value: 'false'                                   },
  { key: 'security.sessionTimeout',   value: '3600'                                    },
  { key: 'security.passwordPolicy',   value: 'min8,uppercase,number,special'          },
  { key: 'alerts.emailNotifications', value: 'true'                                    },
  { key: 'alerts.criticalThreshold',  value: '5'                                       },
  { key: 'reports.retentionDays',     value: '365'                                     },
  { key: 'audit.retentionDays',       value: '730'                                     },
];

async function seedSettings(orgId: string) {
  for (const s of SETTINGS) {
    await prisma.setting.upsert({
      where:  { key_organizationId: { key: s.key, organizationId: orgId } },
      update: { value: s.value },
      create: { key: s.key, value: s.value, organizationId: orgId },
    });
  }
  log(`${SETTINGS.length} Settings seeded`);
}

// ─── 8. Audit Logs ──────────────────────────────────────────────────────────

const AUDIT_LOGS = [
  { action: 'AUTH_LOGIN',          performedBy: 'root@changenetworks.com',    },
  { action: 'IAM_USER_CREATED',    performedBy: 'root@changenetworks.com',    },
  { action: 'IAM_GROUP_CREATED',   performedBy: 'root@changenetworks.com',    },
  { action: 'IAM_POLICY_ATTACHED', performedBy: 'root@changenetworks.com',    },
  { action: 'AUTH_LOGIN',          performedBy: 'lakshya@changenetworks.com', },
  { action: 'REPORT_CREATED',      performedBy: 'lakshya@changenetworks.com', },
  { action: 'AUTH_LOGIN',          performedBy: 'yash@changenetworks.com',    },
  { action: 'SETTINGS_UPDATED',    performedBy: 'yash@changenetworks.com',    },
  { action: 'AUTH_LOGIN',          performedBy: 'bob@changenetworks.com',     },
  { action: 'IAM_BOUNDARY_SET',    performedBy: 'bob@changenetworks.com',     },
  { action: 'ALERT_ACKNOWLEDGED',  performedBy: 'alice@changenetworks.com',   },
  { action: 'AUTH_LOGOUT',         performedBy: 'john@changenetworks.com',    },
];

async function seedAuditLogs(orgId: string) {
  // Audit logs have no unique constraint — only seed if none exist for this org
  const existing = await prisma.auditLog.count({ where: { organizationId: orgId } });
  if (existing === 0) {
    await prisma.auditLog.createMany({
      data: AUDIT_LOGS.map(entry => ({ ...entry, organizationId: orgId })),
    });
    log(`${AUDIT_LOGS.length} Audit logs seeded`);
  } else {
    log(`Audit logs already exist (${existing} records) — skipping`);
  }
}

// ─── main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Change Networks – IAM Platform Database Seed');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  sep();

  // ── Clean up any legacy test artifacts ────────────────────────────────────
  await prisma.user.deleteMany({ where: { email: { in: ['root@org.local', 'root@org.com'] } } });

  // ── Seed in dependency order ───────────────────────────────────────────────
  const org       = await seedOrganization();
  sep();

  const policyMap = await seedPolicies(org.id);
  sep();

  const groupMap  = await seedGroups(org.id, policyMap);
  sep();

  await seedUsers(org.id, groupMap, policyMap);
  sep();

  await seedReports(org.id);
  await seedAlerts(org.id);
  await seedSettings(org.id);
  await seedAuditLogs(org.id);
  sep();

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  ✅  Seed completed successfully');
  console.log('');
  console.log('  Demo Credentials (password: Pass@123)');
  console.log('  ─────────────────────────────────────────────────');
  console.log('  Root Admin  →  root@changenetworks.com');
  console.log('  Developer   →  lakshya@changenetworks.com');
  console.log('  Manager     →  yash@changenetworks.com');
  console.log('  QA          →  alice@changenetworks.com');
  console.log('  Security    →  bob@changenetworks.com');
  console.log('  Frontend    →  john@changenetworks.com');
  console.log('  Auditor     →  sara@changenetworks.com');
  console.log('  Manager 2   →  vikasojha@changenetworks.com');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
}

main()
  .catch(e => {
    console.error('\n  ❌  Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import os
import re

def fix_imports(root_dir):
    for root, dirs, files in os.walk(root_dir):
        for file in files:
            if not file.endswith('.ts') and not file.endswith('.tsx'): continue
            filepath = os.path.join(root, file)
            with open(filepath, 'r') as f:
                content = f.read()

            new_content = content
            
            if 'src/modules/iam' in filepath:
                # File moved one level deeper (modules/X -> modules/iam/X)
                # So ../../ becomes ../../../
                new_content = re.sub(r'(\'|")(\.\./\.\./(shared|prisma))', r'\1../\2', new_content)
                
                # Fix renamed module references
                new_content = new_content.replace('../policy/policy.', '../policies/policies.')
                new_content = new_content.replace('../policy/policy', '../policies/policies')
                new_content = new_content.replace('../boundary/boundary.', '../boundaries/boundaries.')
                new_content = new_content.replace('../group/group.', '../groups/groups.')
                new_content = new_content.replace('../permission/permission.', '../evaluation/evaluation.')
                new_content = new_content.replace('../delegation/delegationBypass.', '../delegation/delegation.')
                
                # Middleware moved to iam/middleware
                new_content = new_content.replace('../../../shared/middleware/iam.middleware', '../../middleware/iam.middleware')
                new_content = new_content.replace('../../../shared/middleware/rbac.middleware', '../../middleware/rbac.middleware')
                
                # Constants moved to iam/shared
                new_content = new_content.replace('../policies/policies.constants', '../../shared/iam.constants')
                new_content = new_content.replace('./policy.constants', '../shared/iam.constants')

            elif 'src/modules/resources' in filepath:
                # File moved one level deeper
                new_content = re.sub(r'(\'|")(\.\./\.\./(shared|prisma))', r'\1../\2', new_content)
                # Fix permission service references
                new_content = new_content.replace('../permission/permission.', '../../iam/evaluation/evaluation.')
                # Middleware
                new_content = new_content.replace('../../../shared/middleware/iam.middleware', '../../iam/middleware/iam.middleware')
                new_content = new_content.replace('../../../shared/middleware/rbac.middleware', '../../iam/middleware/rbac.middleware')

            elif 'src/app.ts' in filepath:
                new_content = new_content.replace('./modules/auth/auth.routes', './modules/iam/auth/auth.routes')
                new_content = new_content.replace('./modules/users/users.routes', './modules/iam/users/users.routes')
                new_content = new_content.replace('./modules/group/group.routes', './modules/iam/groups/groups.routes')
                new_content = new_content.replace('./modules/policy/policy.routes', './modules/iam/policies/policies.routes')
                new_content = new_content.replace('./modules/reports/reports.routes', './modules/resources/reports/reports.routes')
                new_content = new_content.replace('./modules/alerts/alerts.routes', './modules/resources/alerts/alerts.routes')
                new_content = new_content.replace('./modules/settings/settings.routes', './modules/resources/settings/settings.routes')
                new_content = new_content.replace('./modules/audit/audit.routes', './modules/resources/audit/audit.routes')

            if new_content != content:
                with open(filepath, 'w') as f:
                    f.write(new_content)

fix_imports('src')

import os

def replace_in_files(root_dir):
    for root, dirs, files in os.walk(root_dir):
        for file in files:
            if not file.endswith('.ts') and not file.endswith('.tsx'): continue
            filepath = os.path.join(root, file)
            with open(filepath, 'r') as f:
                content = f.read()

            new_content = content
            
            # rename inner imports
            new_content = new_content.replace('./boundary.', './boundaries.')
            new_content = new_content.replace('./group.', './groups.')
            new_content = new_content.replace('./policy.', './policies.')
            new_content = new_content.replace('./permission.', './evaluation.')
            
            # fix delegation to shared
            new_content = new_content.replace('../../shared/iam.constants', '../shared/iam.constants')
            
            # iam.middleware.ts
            if 'iam.middleware.ts' in filepath:
                new_content = new_content.replace('../../modules/permission/permission.service', '../evaluation/evaluation.service')
                new_content = new_content.replace('../../modules/policy/policy.constants', '../shared/iam.constants')
                new_content = new_content.replace('../utils/logger', '../../../shared/utils/logger')

            if 'rbac.middleware.ts' in filepath:
                new_content = new_content.replace('../utils/AppError', '../../../shared/utils/AppError')
                
            if new_content != content:
                with open(filepath, 'w') as f:
                    f.write(new_content)

replace_in_files('src')

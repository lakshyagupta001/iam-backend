"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.permissionRepository = void 0;
const client_1 = require("../../../prisma/client");
class PermissionRepository {
    async getEvaluationData(userId) {
        const user = await client_1.prisma.user.findUnique({
            where: { id: userId },
            include: {
                policies: {
                    include: {
                        policy: {
                            include: {
                                statements: true,
                            },
                        },
                    },
                },
                groups: {
                    include: {
                        group: {
                            include: {
                                policies: {
                                    include: {
                                        policy: {
                                            include: {
                                                statements: true,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                boundary: {
                    include: {
                        policy: {
                            include: {
                                statements: true,
                            },
                        },
                    },
                },
            },
        });
        if (!user) {
            return null;
        }
        // Collect all statements from direct policies
        const directStatements = user.policies.flatMap((up) => up.policy.statements);
        // Collect all statements from group policies
        const groupStatements = user.groups.flatMap((ug) => ug.group.policies.flatMap((gp) => gp.policy.statements));
        // Merge direct and group statements
        const allStatements = [...directStatements, ...groupStatements];
        // Collect boundary statements if a boundary exists
        const boundaryStatements = user.boundary?.policy.statements || null;
        return {
            id: user.id,
            isRoot: user.isRoot,
            statements: allStatements,
            boundaryStatements,
        };
    }
}
exports.permissionRepository = new PermissionRepository();

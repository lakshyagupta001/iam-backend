"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersController = void 0;
const users_service_1 = require("./users.service");
class UsersController {
    async listUsers(req, res) {
        const users = await users_service_1.usersService.listUsers(req.user.orgId);
        res.status(200).json({ success: true, data: users });
    }
    async createUser(req, res) {
        const user = await users_service_1.usersService.createUser(req.user.orgId, req.body);
        res.status(201).json({ success: true, data: user, message: 'User created successfully' });
    }
}
exports.usersController = new UsersController();

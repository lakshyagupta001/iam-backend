"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const env_1 = require("./shared/config/env");
const client_1 = require("./prisma/client");
const logger_1 = require("./shared/utils/logger");
const PORT = env_1.env.PORT || 3000;
async function startServer() {
    try {
        // Connect to database
        await client_1.prisma.$connect();
        logger_1.logger.info('Connected to PostgreSQL via Prisma');
        // Start server
        app_1.default.listen(PORT, () => {
            logger_1.logger.info(`Server is running on port ${PORT} in ${env_1.env.NODE_ENV} mode`);
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to start server:', error);
        process.exit(1);
    }
}
startServer();
// Handle graceful shutdown
const gracefulShutdown = async () => {
    logger_1.logger.info('Shutting down gracefully...');
    await client_1.prisma.$disconnect();
    process.exit(0);
};
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

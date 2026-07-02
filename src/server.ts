import app from './app';
import { env } from './shared/config/env';
import { prisma } from './prisma/client';
import { logger } from './shared/utils/logger';

const PORT = env.PORT || 3000;

async function startServer() {
  try {
    await prisma.$connect();
    logger.info('Connected to PostgreSQL via Prisma');

    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT} in ${env.NODE_ENV} mode`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error as any);
    process.exit(1);
  }
}

startServer();

const gracefulShutdown = async () => {
  logger.info('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

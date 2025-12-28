import dotenv from 'dotenv';
import app from './app';
import sequelize from './config/database';
import { connectRabbitMQ } from './config/rabbitmq';
import realtimeService from './services/RealtimeService';
import { logger } from './config/logger';
import { QueueService } from './services/QueueService';

dotenv.config();

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Test database connection
    await sequelize.authenticate();
    logger.info('Database connection established');

    // IMPORTANT:
    // We use Sequelize migrations (sequelize-cli) to manage schema.
    // Avoid sequelize.sync() at runtime because it can:
    // - create/drop indexes out of order
    // - drift schema from migrations
    // - fail startup when DB is mid-migration
    //
    // If you *really* need sync for local experiments, opt-in explicitly:
    // DB_SYNC=true npm run dev
    if (process.env.DB_SYNC === 'true') {
      await sequelize.sync({ alter: false });
      logger.warn('DB_SYNC=true: sequelize.sync() executed (not recommended for normal dev)');
    }

    // Connect to RabbitMQ (optional)
    const rabbitmqChannel = await connectRabbitMQ();
    if (rabbitmqChannel) {
      logger.info('RabbitMQ connected');
    } else {
      logger.warn('RabbitMQ not available - continuing without event publishing');
    }

    // Initialize SSE service (optional if RabbitMQ not available)
    try {
      await realtimeService.initialize();
      logger.info('SSE service initialized');
    } catch (error) {
      logger.warn('SSE service initialization failed - continuing without real-time updates', error);
    }

    // Start scheduled tasks
    startScheduledTasks();

    // Start server
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

function startScheduledTasks() {
  // Mark carryover patients daily at midnight
  setInterval(async () => {
    try {
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() === 0) {
        // Get all hospitals and mark carryover patients
        const { Hospital } = require('./models');
        const hospitals = await Hospital.findAll({
          where: { status: 'ACTIVE' },
        });

        for (const hospital of hospitals) {
          await QueueService.markCarryoverPatients(hospital.id);
        }
      }
    } catch (error) {
      logger.error('Error in scheduled task:', error);
    }
  }, 60000); // Check every minute

  logger.info('Scheduled tasks started');
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await sequelize.close();
  await realtimeService.cleanup();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await sequelize.close();
  await realtimeService.cleanup();
  process.exit(0);
});

startServer();


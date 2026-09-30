import app from './app.js';
import { env } from './config/env.js';
import { prisma } from './config/prisma.js';

let server;

async function startServer() {
  try {
    // Verify database connectivity
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    server = app.listen(env.PORT, () => {
      console.log(`🚀 EVE Healthcare Backend running in [${env.NODE_ENV}] mode on port ${env.PORT}`);
      console.log(`📚 Swagger UI Docs available at: http://localhost:${env.PORT}/api-docs`);
      console.log(`🩺 Health check available at: http://localhost:${env.PORT}/health`);
      console.log(`🌐 Base API available at: http://localhost:${env.PORT}/api`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Graceful shutdown helper
const gracefulShutdown = async (signal) => {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
  if (server) {
    server.close(async () => {
      console.log('🔒 HTTP server closed');
      await prisma.$disconnect();
      console.log('🔌 Database disconnected');
      process.exit(0);
    });
  } else {
    await prisma.$disconnect();
    process.exit(0);
  }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception thrown:', error);
  process.exit(1);
});

startServer();

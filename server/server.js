import os from 'node:os';
import mongoose from 'mongoose';
import app from './src/app.js';
import { connectDB } from './src/config/database.js';
import logger from './src/config/logger.js';

const PORT = process.env.PORT || 8080;
let server;

// Helper de logs de démarrage
const printStartupSummary = () => {
  const separator = "=".repeat(60);
  const getLocalIP = () => {
    const nets = os.networkInterfaces();
    for (const name of Object.keys(nets)) {
      for (const net of nets[name]) {
        if (net.family === 'IPv4' && !net.internal) {
          return net.address;
        }
      }
    }
    return '127.0.0.1';
  };

  logger.info(separator);
  logger.info(`🚀 LABOBÉTON SERVER STARTUP - ${process.env.NODE_ENV?.toUpperCase() || 'DEV'}`);
  logger.info(separator);
  
  // SYSTEM
  logger.info(`🖥️  OS: ${os.type()} ${os.release()} (${os.arch()})`);
  logger.info(`📦 Node: ${process.version} | PID: ${process.pid}`);
  logger.info(`💾 Mem: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`);

  // NETWORK
  logger.info(`🌐 Local:   http://localhost:${PORT}`);
  logger.info(`📡 Network: http://${getLocalIP()}:${PORT}`);

  // SECURITY
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:8080',
    process.env.FRONTEND_URL 
  ].filter(Boolean);

  logger.info(`🛡️  Security:`);
  logger.info(`   - CORS: ${process.env.NODE_ENV === 'production' ? '🔒 Strict' : '🔓 Dev Mode'}`);
  logger.info(`   - Allowed Origins: ${allowedOrigins.join(', ') || 'None'}`);
  logger.info(`   - Helmet: Enabled`);
  logger.info(`   - RateLimit: Enabled`);
  logger.info(`   - Mongo Sanitize: Enabled`);

  // DB STATUS
  const dbState = mongoose.connection.readyState;
  const dbStatusText = ['Disconnected', 'Connected', 'Connecting', 'Disconnecting'][dbState] || 'Unknown';
  logger.info(`🗄️  Database: ${dbStatusText} (LaboBéton)`);

  logger.info(separator);
  logger.info(`✅ Ready to accept connections!`);
  logger.info(separator);
};

// Start server
server = app.listen(PORT, () => {
  connectDB().then(() => {
    printStartupSummary();
  });
});

// Graceful shutdown
const gracefulShutdown = () => {
  logger.info('🔄 SIGTERM reçu. Fermeture gracieuse...');
  server.close(() => {
    logger.info('🛑 Serveur HTTP fermé.');
    mongoose.connection.close(false).then(() => {
      logger.info('💤 MongoDB déconnecté.');
      process.exit(0);
    });
  });
  
  setTimeout(() => {
    logger.error('⏱️ Force shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Gestion des erreurs non gérées
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! 💥 Shutting down...', err);
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...', err);
  process.exit(1);
});
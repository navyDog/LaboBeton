import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { configureSecurity, globalLimiter } from './config/security.js';
import routes from './routes/index.js';
import { errorHandler } from './middleware/errorhandler.js';
import logger from './config/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Hack pour masquer l'avertissement de dépréciation util._extend
const originalEmitWarning = process.emitWarning;
process.emitWarning = (warning, ...args) => {
  if (typeof warning === 'string' && warning.includes('util._extend')) return;
  if (warning && typeof warning === 'object' && warning.message && warning.message.includes('util._extend')) return;
  return originalEmitWarning.call(process, warning, ...args);
};

// Middleware de logging HTTP
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const message = `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`;
    
    if (res.statusCode >= 500) {
      logger.error(message);
    } else if (res.statusCode >= 400) {
      logger.warn(message);
    } else {
      logger.info(message);
    }
  });
  next();
});

// Sécurité critique : Gestion des secrets
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_change_me';
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  logger.error("🚨 CRITICAL SECURITY WARNING : JWT_SECRET n'est pas défini en production.");
  process.exit(1);
}

// Configuration de sécurité
configureSecurity(app);

// Body parser
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ limit: '2mb', extended: true }));

// Rate limiting
app.use('/api/', globalLimiter);

// Routes API
app.use('/api', routes);

// Serving Frontend
const distPath = process.env.FRONTEND_BUILD_PATH || (
  fs.existsSync(path.join(__dirname, '../dist')) 
    ? path.join(__dirname, '../dist') 
    : path.join(__dirname, '../../Client/dist')
);

logger.info(`📁 Dossier frontend: ${distPath}`);
app.use(express.static(distPath));

app.get('*', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send("Erreur : Le build du frontend (index.html) est introuvable.");
  }
});

// Middleware de gestion d'erreurs (doit être en dernier)
app.use(errorHandler);

export default app;
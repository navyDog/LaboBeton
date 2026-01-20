import helmet from 'helmet';
import cors from 'cors';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import logger from './Logger.js';

// CORS Configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:8080',
  process.env.FRONTEND_URL,
  process.env.FRONTEND_URL2  
].filter(Boolean);

export const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    
    if (process.env.NODE_ENV === 'production') {
      logger.warn(`❌ CORS Blocked: ${origin}`);
      const error = new Error('Not allowed by CORS');
      error.status = 403;
      return callback(error);
    }
    
    logger.warn(`⚠️ CORS Dev Mode: Allowing ${origin}`);
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204
};

// Helmet Configuration
export const helmetOptions = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'"], 
    },
  },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  frameguard: { action: 'deny' },
  hidePoweredBy: true
};

// Rate Limiters
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 200,
  message: { message: "Trop de requêtes, veuillez patienter." },
  standardHeaders: true, 
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate Limit Exceeded: ${req.ip}`);
    res.status(429).json({ message: "Trop de requêtes." });
  }
});

export const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, 
  max: 20,
  message: { message: "Trop de tentatives de connexion." },
  standardHeaders: true, 
  legacyHeaders: false,
});

// Apply all security middleware
export const configureSecurity = (app) => {
  app.set('trust proxy', 1);
  
  // HTTPS Redirect
  app.use((req, res, next) => {
    if (process.env.NODE_ENV === 'production') {
      const isLocal = req.hostname === 'localhost' || req.hostname === '127.0.0.1';
      if (!isLocal && req.headers['x-forwarded-proto'] !== 'https') {
        const configuredDomain = process.env.FRONTEND_URL?.replace(/^https?:\/\//, '');
        if (!configuredDomain) {
          logger.error('❌ FRONTEND_URL not configured for HTTPS redirect');
          return res.status(500).json({ message: 'Server misconfiguration' });
        }
        const safePath = req.url.split('?')[0].replaceAll(/[^\w\s\-/.]/gi, '');
        return res.redirect(301, `https://${configuredDomain}${safePath}`);
      }
    }
    next();
  });

  app.use(helmet(helmetOptions));
  app.use(cors(corsOptions));
  app.use(mongoSanitize({ replaceWith: '_' }));
};
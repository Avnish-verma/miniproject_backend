const helmet = require('helmet');
const cors = require('cors');
const env = require('../config/env');

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5501',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5501',
  'http://127.0.0.1:3000',
  'https://avnilive.netlify.app',
  'https://miniprojectbackend-zeta.vercel.app',
  env.CLIENT_URL,
].filter(Boolean);

const isOriginAllowed = (origin) => {
  if (!origin) return true;
  if (process.env.NODE_ENV !== 'production') return true;
  if (allowedOrigins.indexOf(origin) !== -1) return true;
  if (origin.endsWith('.vercel.app') || origin.endsWith('.netlify.app')) return true;
  return false;
};

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
    if (isOriginAllowed(origin)) {
      return callback(null, true);
    }
    return callback(new Error('CORS policy: Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
};

// NoSQL injection sanitizer: recursively strip keys that start with '$' or contain '.'
function sanitizeInput(data) {
  if (typeof data !== 'object' || data === null) return data;
  if (Array.isArray(data)) return data.map(sanitizeInput);

  const clean = {};
  for (const [key, value] of Object.entries(data)) {
    if (key.startsWith('$') || key.includes('.')) {
      continue; // Drop dangerous operator key
    }
    clean[key] = sanitizeInput(value);
  }
  return clean;
}

const noSqlSanitizer = (req, _res, next) => {
  if (req.body) req.body = sanitizeInput(req.body);
  if (req.params) req.params = sanitizeInput(req.params);
  if (req.query) req.query = sanitizeInput(req.query);
  next();
};

const securityMiddleware = (app) => {
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors(corsOptions));
  app.use(noSqlSanitizer);
};

module.exports = { securityMiddleware, corsOptions, allowedOrigins, isOriginAllowed };

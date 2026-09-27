const express = require('express');
const cookieParser = require('cookie-parser');
const { securityMiddleware } = require('./middleware/security');
const { apiLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');
const v1Router = require('./routes/api/v1');

// Legacy routes for backwards compatibility
const registerRouter = require('../routes/registerRouter');
const loginRouter = require('../routes/loginRouter');
const profileRouter = require('../routes/profileRouter');
const postRouter = require('../routes/postRouter');
const feedRouter = require('../routes/feedRouter');
const protect = require('../controller/protect');

const app = express();

// 1. Security headers & CORS & NoSQL sanitizer
securityMiddleware(app);

// 2. Request body & cookie parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// 3. Global API rate limiting
app.use('/api/', apiLimiter);

// 4. Versioned API Routes (/api/v1/...)
app.use('/api/v1', v1Router);

// 5. Legacy Route Adapters (Strictly backwards compatible for existing clients)
app.use('/register', registerRouter);
app.use('/login', loginRouter);
app.use('/profile', protect, profileRouter);
app.use('/post', protect, postRouter);
app.use('/feed', feedRouter);

// 6. Base / Health route & Client Static Serving
const path = require('path');
const fs = require('fs');

const clientDistPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
}

app.get('/api-status', (_req, res) => {
  res.status(200).json({
    status: 'online',
    platform: 'NOVA Social Communication Platform',
    version: '1.0.0',
    documentation: '/api/v1/health',
  });
});

// SPA fallback for frontend client
if (fs.existsSync(clientDistPath)) {
  app.get(/^(?!\/(api|feed|login|register|profile|post|socket\.io)).*/, (_req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// 7. 404 Handler (Express 5 syntax)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `The requested endpoint ${req.originalUrl} was not found on this server.`,
    },
  });
});

// 8. Centralized Global Error Handler
app.use(errorHandler);

module.exports = app;

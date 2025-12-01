const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/authRoutes');
const groupRoutes = require('./routes/groupRoutes');
const wishRoutes = require('./routes/wishRoutes');
const emailRoutes = require('./routes/emailRoutes');

const createApp = () => {
  const app = express();

  const disableCors = String(process.env.CORS_DISABLE || '').toLowerCase() === 'true';
  const allowedOrigins = process.env.CLIENT_URLS
    ? process.env.CLIENT_URLS.split(',').map((url) => url.trim())
    : ['http://localhost:5173'];

  app.use(
    cors(
      disableCors
        ? { origin: true, credentials: true, methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'] }
        : { origin: allowedOrigins, credentials: true, methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'] }
    )
  );

  app.use(express.json());
  app.use(cookieParser());

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/groups', groupRoutes);
  app.use('/api/wishes', wishRoutes);
  app.use('/api/email', emailRoutes);

  return app;
};

module.exports = createApp;

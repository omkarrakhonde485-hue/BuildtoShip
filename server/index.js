const express = require('express');
const cors = require('cors');
const env = require('./lib/env');
const apiRoutes = require('./routes/api');

const app = express();

// CORS — allow all local frontend origins and headers
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Demo-Role', 'x-demo-role']
}));

app.use(express.json({ limit: '2mb' }));

// Request logging
app.use((req, res, next) => {
  if (req.path !== '/api/health') {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  }
  next();
});

// API routes
app.use('/api', apiRoutes);

// Root
app.get('/', (req, res) => {
  res.json({ service: 'NEXUS AI Backend', version: '2.0.0', docs: '/api/health' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

const PORT = env.PORT;
app.listen(PORT, () => {
  console.log(`\n🚀 NEXUS AI Backend running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health`);
  console.log(`   AI:     http://localhost:${PORT}/api/health/ai`);
  console.log(`   Env:    GEMINI=${env.GEMINI_API_KEY ? '✓' : '✗'} SUPABASE=${env.SUPABASE_URL ? '✓' : '✗'} GOOGLE=${env.GOOGLE_CLIENT_ID ? '✓' : '✗'}\n`);
});

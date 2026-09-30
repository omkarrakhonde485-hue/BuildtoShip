require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api', apiRoutes);

// Root greeting
app.get('/', (req, res) => {
  res.json({
    name: 'NEXUS AI — Company AI Operations Control Center',
    version: '1.0.0',
    status: 'Operational',
    endpoints: {
      health: '/api/health',
      workflows: '/api/workflows',
      intake: '/api/ai/intake',
      tasks: '/api/tasks',
      approvals: '/api/approvals',
      monitor: '/api/monitor/events'
    }
  });
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 NEXUS AI Operations Control Center Backend is running`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`⚡ Workflows: ApprovalFlow, ExpenseFlow, Onboarding, Helpdesk, MeetingOps`);
  console.log(`=======================================================`);
});

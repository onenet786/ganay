import express from 'express';
import cors from 'cors';
import { config } from './src/config.js';
import { db } from './src/database.js';
import apiRouter from './src/routes.js';

async function startServer() {
  const app = express();

  // Configure middleware
  app.use(cors({
    origin: '*', // Allow all origins for dev/testing, config can restrict in production
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
  app.use(express.json());

  // Mount API endpoints
  app.use('/api', apiRouter);

  // Default health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date(),
      database: db.isPostgres ? 'PostgreSQL' : 'Local JSON File',
      caching: config.REDIS_URL ? 'Redis' : 'In-Memory Cache'
    });
  });

  // Global Error Handler
  app.use((err, req, res, next) => {
    console.error('Unhandled server error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  });

  try {
    // Initialize Database
    await db.init();
    
    // Start listening
    app.listen(config.PORT, () => {
      console.log(`=========================================`);
      console.log(` Naghma Classic Music Discovery API      `);
      console.log(` Running on port: http://localhost:${config.PORT} `);
      console.log(` Mode: ${config.NODE_ENV}                `);
      console.log(`=========================================`);
    });
  } catch (error) {
    console.error('Server startup failed:', error);
    process.exit(1);
  }
}

startServer();

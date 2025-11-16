import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { isSupabaseConfigured } from './config/database';
import { ResponseUtils } from './utils/response';

// Import routes
import authRoutes from './routes/auth';
import playerRoutes from './routes/players';
import matchRoutes from './routes/matches';
import clubRoutes from './routes/clubs';
import ratingRoutes from './routes/ratings';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  ResponseUtils.success(res, {
    status: 'OK',
    timestamp: new Date().toISOString(),
    supabase: isSupabaseConfigured,
    version: '1.0.0',
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/clubs', clubRoutes);
app.use('/api/ratings', ratingRoutes);

// 404 handler
app.use('*', (req, res) => {
  ResponseUtils.notFound(res, 'API endpoint');
});

// Global error handler
app.use(
  (
    error: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error('Global error handler:', error);

    if (error.name === 'ValidationError') {
      return ResponseUtils.validationError(res, [error.message]);
    }

    if (error.name === 'UnauthorizedError') {
      return ResponseUtils.unauthorized(res, 'Invalid authentication');
    }

    ResponseUtils.serverError(res, 'Internal server error');
  }
);

// Start server
app.listen(PORT, () => {
  console.log('🚀 Football platform API running on port', PORT);
  console.log('📊 Supabase configured:', isSupabaseConfigured);
  console.log('🔧 Environment:', process.env.NODE_ENV || 'development');
});

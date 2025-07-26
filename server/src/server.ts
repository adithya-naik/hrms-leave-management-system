import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Load environment variables FIRST
dotenv.config();

// Add environment validation
const requiredEnvVars = ['JWT_SECRET', 'MONGODB_URI', 'JWT_REFRESH_SECRET'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars);
  console.error('Please check your .env file');
  process.exit(1);
}

// Check for placeholder values
const placeholderVars = [
  { key: 'JWT_SECRET', placeholder: 'your-super-secret-jwt-key-change-this-in-production' },
  { key: 'JWT_REFRESH_SECRET', placeholder: 'your-super-secret-refresh-key-change-this-in-production' }
];

const hasPlaceholders = placeholderVars.some(({ key, placeholder }) => 
  process.env[key] === placeholder
);

if (hasPlaceholders && process.env.NODE_ENV === 'production') {
  console.error('❌ Production environment detected with placeholder JWT secrets!');
  console.error('Please update your JWT secrets in the .env file');
  process.exit(1);
} else if (hasPlaceholders) {
  console.warn('⚠️  Using placeholder JWT secrets (OK for development)');
}

console.log('✅ Environment configuration validated');

// Import routes
import authRoutes from './routes/auth';
import leaveRoutes from './routes/leaves';
import adminRoutes from './routes/admin';
import holidayRoutes from './routes/holidays';
import userRoutes from './routes/userRoutes';

// Import database connection
import connectDB from './config/database';

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration - MUST BE BEFORE OTHER MIDDLEWARE
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.CLIENT_URL
  ].filter(Boolean), // Remove undefined values
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'Pragma'
  ],
  preflightContinue: false,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));

// Security middleware (configure helmet to work with CORS)
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging for development
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// Rate limiting (apply after CORS)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Health check endpoint (before other routes for quick access)
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running!',
    timestamp: new Date().toISOString(),
    cors: 'enabled',
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/holidays', holidayRoutes);
app.use('/api/users', userRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  
  // Set CORS headers even for errors
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use('*', (req, res) => {
  // Set CORS headers for 404s too
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Start server
const startServer = async () => {
  try {
    await connectDB();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📱 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 CORS enabled for: http://localhost:5173`);
      console.log(`📋 Available routes:`);
      console.log(`   - POST /api/auth/login`);
      console.log(`   - GET  /api/leaves`);
      console.log(`   - GET  /api/users`);
      console.log(`   - GET  /api/admin/*`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

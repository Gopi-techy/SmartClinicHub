const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');

// Import middleware
const { errorHandler, notFound } = require('./src/middleware/errorHandler');
const logger = require('./src/utils/logger');
const { connectDatabase, initializeDatabase } = require('./src/config/database');

// Import routes
const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/users');
const appointmentRoutes = require('./src/routes/appointments');
const emergencyRoutes = require('./src/routes/emergency');
const aiRoutes = require('./src/routes/ai');
const pharmacyRoutes = require('./src/routes/pharmacy');
const adminRoutes = require('./src/routes/admin');
const healthRoutes = require('./src/routes/health');
const patientDashboardRoutes = require('./src/routes/patient-dashboard');
// const prescriptionRoutes = require('./src/routes/prescriptions');
let messagingRoutes;
try {
  console.log('📨 Loading messaging routes...');
  messagingRoutes = require('./src/routes/messaging');
  console.log('✅ Messaging routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading messaging routes:', error.message);
  console.error('❌ Stack trace:', error.stack);
  process.exit(1);
}

// Import messaging controller helpers
// const { addOnlineUser, removeOnlineUser, onlineUsers } = require('./src/controllers/messagingController');

// Online users management
const onlineUsers = new Map(); // userId -> { socketId, lastActive }

const addOnlineUser = (userId, socketId) => {
  onlineUsers.set(userId, { socketId, lastActive: Date.now() });
};

const removeOnlineUser = (userId) => {
  onlineUsers.delete(userId);
};

const getOnlineUsers = () => {
  return Array.from(onlineUsers.keys());
};

console.log('🔄 All imports loaded successfully');

// Create Express application
const app = express();

console.log('🔄 Express app created');

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      scriptSrc: ["'self'", "https:"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:"],
      fontSrc: ["'self'", "https:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:4028'
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // More lenient for development
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to API routes
app.use('/api/', limiter);

// More strict rate limiting for auth routes
// const authLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 5, // limit each IP to 5 requests per windowMs
//   message: {
//     success: false,
//     message: 'Too many authentication attempts, please try again later.'
//   }
// });

// app.use('/api/auth/login', authLimiter);
// app.use('/api/auth/register', authLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'SmartClinicHub API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/pharmacy', pharmacyRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/patient-dashboard', patientDashboardRoutes);
app.use('/api/messaging', messagingRoutes);
// app.use('/api/prescriptions', prescriptionRoutes);

// Handle undefined routes
app.use(notFound);

// Error handling middleware (should be last)
app.use(errorHandler);

// Create HTTP server and Socket.IO
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: [
      process.env.FRONTEND_URL || "http://localhost:3000",
      "http://localhost:3000",
      "http://localhost:3001", 
      "http://localhost:4028"
    ],
    methods: ["GET", "POST"]
  }
});

// Socket.IO for real-time features
io.on('connection', (socket) => {
  logger.info(`User connected: ${socket.id}`);

  // User authentication and online status
  socket.on('authenticate', (data) => {
    const { userId, token } = data;
    // TODO: Verify JWT token here
    if (userId) {
      socket.userId = userId;
      addOnlineUser(userId, socket.id);
      socket.broadcast.emit('userOnline', { userId });
      logger.info(`User ${userId} authenticated and marked online`);
    }
  });

  // Join conversation room
  socket.on('joinConversation', (data) => {
    const { conversationId } = data;
    socket.join(conversationId);
    logger.info(`Socket ${socket.id} joined conversation: ${conversationId}`);
  });

  // Leave conversation room
  socket.on('leaveConversation', (data) => {
    const { conversationId } = data;
    socket.leave(conversationId);
    logger.info(`Socket ${socket.id} left conversation: ${conversationId}`);
  });

  // Typing indicators
  socket.on('typing', (data) => {
    const { conversationId, isTyping } = data;
    socket.to(conversationId).emit('userTyping', {
      userId: socket.userId,
      isTyping
    });
  });

  // Message delivery confirmation
  socket.on('messageDelivered', (data) => {
    const { messageId, senderId } = data;
    const senderSocket = Array.from(onlineUsers.entries())
      .find(([userId, userInfo]) => userId === senderId);
    
    if (senderSocket) {
      io.to(senderSocket[1].socketId).emit('deliveryConfirmation', {
        messageId,
        deliveredAt: new Date()
      });
    }
  });

  // Emergency alert handling
  socket.on('emergency-alert', (data) => {
    socket.broadcast.emit('emergency-notification', {
      ...data,
      timestamp: new Date().toISOString()
    });
  });

  // Appointment updates
  socket.on('appointment-update', (data) => {
    socket.broadcast.to(`doctor-${data.doctorId}`).emit('appointment-change', data);
    socket.broadcast.to(`patient-${data.patientId}`).emit('appointment-change', data);
  });

  // Join room based on user role and ID
  socket.on('join-room', (data) => {
    const room = `${data.role}-${data.userId}`;
    socket.join(room);
    logger.info(`User ${socket.id} joined room: ${room}`);
  });

  socket.on('disconnect', () => {
    if (socket.userId) {
      removeOnlineUser(socket.userId);
      socket.broadcast.emit('userOffline', { userId: socket.userId });
      logger.info(`User ${socket.userId} disconnected and marked offline`);
    }
    logger.info(`User disconnected: ${socket.id}`);
  });
});

// Make io available to routes
app.set('io', io);

// Add Socket.IO to request object for messaging routes
app.use('/api/messaging', (req, res, next) => {
  req.io = io;
  next();
});

// API endpoint to get online users
app.get('/api/messaging/online-users', (req, res) => {
  try {
    const onlineUsersList = getOnlineUsers();
    res.json({
      success: true,
      onlineUsers: onlineUsersList,
      count: onlineUsersList.length
    });
  } catch (error) {
    logger.error('Error fetching online users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch online users'
    });
  }
});

// Database connection and server startup
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    console.log('🔄 Starting server initialization...');
    
    // Connect to MongoDB
    console.log('🔄 Connecting to MongoDB...');
    await connectDatabase();
    console.log('✅ MongoDB connected successfully');
    logger.info('MongoDB connected successfully');

    // Initialize database with default data
    console.log('🔄 Initializing database...');
    await initializeDatabase();
    console.log('✅ Database initialized successfully');

    // Start server
    console.log('🔄 Starting HTTP server...');
    server.listen(PORT, () => {
      console.log(`🚀 SmartClinicHub Backend Server running on port ${PORT}`);
      logger.info(`🚀 SmartClinicHub Backend Server running on port ${PORT}`);
      logger.info(`📚 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🌐 CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
      logger.info(`🔗 API Documentation: http://localhost:${PORT}/api-docs`);
      logger.info(`💚 Health Check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(async () => {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(async () => {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
    process.exit(0);
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection:', err);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

startServer();

module.exports = { app, server, io };

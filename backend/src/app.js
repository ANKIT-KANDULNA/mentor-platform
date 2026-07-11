const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const env = require('./config/env');
const { errorHandler } = require('./middleware/error.middleware');

// Route imports
const authRoutes = require('./modules/auth/auth.routes');
const userRoutes = require('./modules/user/user.routes');
const mentorRoutes = require('./modules/mentor/mentor.routes');
const chatRoutes = require('./modules/chat/chat.routes');
const dashboardRoutes = require('./modules/dashboard/dashboard.routes');
const sessionRoutes = require('./modules/session/session.routes');
const notificationRoutes = require('./modules/notification/notification.routes');
const reviewRoutes = require('./modules/review/review.routes');

const app = express();

// Security
app.use(helmet());

// CORS
app.use(cors({
  origin: env.CLIENT_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Logging
app.use(morgan('dev'));

// Body parsers
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Health check
app.get('/health', async (req, res) => {
  res.json({ success: true, message: 'Mentor Platform API is running', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/mentors', mentorRoutes);
app.use('/api/v1/chats', chatRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/sessions', sessionRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/reviews', reviewRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handler (must be last)
app.use(errorHandler);

module.exports = app;
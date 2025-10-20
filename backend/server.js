const path = require('path');
const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const passport = require('passport');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const messageRoutes = require('./routes/messageRoutes');
const http = require('http');
const { initSocket, getIo } = require('./socket');
const helmet = require('helmet');
const cors = require('cors');
const { rateLimit } = require('express-rate-limit');
const cron = require('node-cron');
const deleteExpiredMessages = require('./utils/deleteExpiredMessages');

// Load config
dotenv.config();

// Passport config
require('./config/googleAuth');

connectDB();

const app = express();
const server = http.createServer(app);
const io = initSocket(server);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Security
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}));

// Rate limiting for message uploads
const messageRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Max 100 requests per 15 minutes
  message: 'Too many messages from this IP, please try again after 15 minutes',
});
app.use('/messages/send', messageRateLimiter);

// Sessions
app.use(
  session({
    secret: 'keyboard cat', // Should be from env variable
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
    }),
  })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/messages', messageRoutes);

// Serve static files from the 'uploads' directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, path, stat) => {
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    if (path.endsWith('.wav')) {
      res.set('Content-Type', 'audio/wav');
    }
  }
}));

// Socket.io events are now handled within initSocket in socket.js
// This block can be removed as the logic has been moved.

// Cron job to delete expired messages
cron.schedule('* * * * *', () => {
  console.log('Running cron job to delete expired messages');
  deleteExpiredMessages();
});



const PORT = process.env.PORT || 5000;

server.listen(
  PORT,
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
);

module.exports = { server, io, getIo };
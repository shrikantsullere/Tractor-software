import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import authRoutes from './routes/auth.routes.js';
import farmerRoutes from './routes/farmer.routes.js';
import adminRoutes from './routes/admin.routes.js';
import operatorRoutes from './routes/operator.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import requestRoutes from './routes/request.routes.js';
import { sendError } from './utils/response.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST'],
  },
});

const roomsState = new Map();
app.set('io', io);
const broadcastFarmerDestination = (lat, lng, roomId = 'default-room') => {
  if (typeof lat !== 'number' || typeof lng !== 'number') return;
  const prev = roomsState.get(roomId) || {};
  const nextState = {
    ...prev,
    farmerLocation: { lat, lng },
  };
  roomsState.set(roomId, nextState);
  io.to(roomId).emit('farmer:destination:update', { lat, lng });
};
app.set('broadcastFarmerDestination', broadcastFarmerDestination);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/farmer', farmerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/operator', operatorRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/request', requestRoutes);

// Root Route
app.get('/', (req, res) => {
  res.json({ message: "TractorLink Backend API is running..." });
});

// 404 Handler
app.use((req, res) => {
  return sendError(res, "Route not found", 404, "NOT_FOUND");
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  return sendError(res, err.message || "Internal Server Error", err.status || 500);
});

const PORT = process.env.PORT || 5000;

io.on('connection', (socket) => {
  socket.on('tracking:join', ({ roomId = 'default-room' } = {}) => {
    socket.join(roomId);
    const state = roomsState.get(roomId) || {};
    socket.emit('tracking:state', state);
  });

  socket.on('location:update', ({ roomId = 'default-room', lat, lng, timestamp } = {}) => {
    if (typeof lat !== 'number' || typeof lng !== 'number') return;
    const prev = roomsState.get(roomId) || {};
    const nextState = {
      ...prev,
      operatorLocation: { lat, lng, timestamp: timestamp || Date.now() },
    };
    roomsState.set(roomId, nextState);
    io.to(roomId).emit('location:update', { lat, lng, timestamp: timestamp || Date.now() });
  });

  socket.on('farmer:destination:update', ({ roomId = 'default-room', lat, lng } = {}) => {
    broadcastFarmerDestination(lat, lng, roomId);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

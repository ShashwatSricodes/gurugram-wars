import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { connectDB } from './config/db.js';
import { registerGridHandlers } from './socket/gridHandler.js';
import gridRoutes from './routes/grid.js';
import leaderboardRoutes from './routes/leaderboard.js';

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
});

app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json());

app.use('/api/grid', gridRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.get('/health', (_, res) => res.json({ status: 'ok' }));

io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);
  registerGridHandlers(io, socket);
});

const PORT = process.env.PORT || 4000;
connectDB().then(() => {
  httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
});

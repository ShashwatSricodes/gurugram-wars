import { Cell } from '../models/Cell.js';
import { User } from '../models/User.js';

const cooldowns = new Map();
const COOLDOWN_MS = parseInt(process.env.COOLDOWN_MS) || 3000;

const getLeaderboard = async () => {
  const cellCounts = await Cell.aggregate([
    { $match: { ownerId: { $ne: null } } },
    {
      $group: {
        _id:   '$ownerId',
        score: { $sum: 1 },
        name:  { $last: '$ownerName' },
        color: { $last: '$ownerColor' },
      }
    },
    { $sort: { score: -1 } },
    { $limit: 10 },
  ]);

  return cellCounts.map(e => ({
    userId: e._id,
    name:   e.name,
    color:  e.color,
    score:  e.score,
  }));
};

export const registerGridHandlers = (io, socket) => {

  // ── USER JOIN ──────────────────────────────────────────────────
  socket.on('user:join', async ({ userId, name, color }) => {
    if (!userId || !name || !color) return;

    try {
      await User.findOneAndUpdate(
        { userId },
        { $set: { name, color, lastSeen: new Date() } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      socket.data.userId = userId;
      socket.data.name   = name;
      socket.data.color  = color;

      const cells = await Cell.find({ ownerId: { $ne: null } })
        .select('cellId ownerId ownerName ownerColor capturedAt -_id')
        .lean();

      socket.emit('grid:state', cells);
      io.emit('users:online', { count: io.engine.clientsCount });

      const leaderboard = await getLeaderboard();
      io.emit('leaderboard:update', leaderboard);

      console.log(`👤 ${name} joined [${socket.id}]`);
    } catch (err) {
      console.error('user:join error:', err);
    }
  });

  // ── CELL CAPTURE ───────────────────────────────────────────────
  socket.on('cell:capture', async ({ cellId }) => {
    const { userId, name, color } = socket.data;

    if (!userId || !name || !color) {
      socket.emit('cell:error', { cellId, reason: 'Set your name first.' });
      return;
    }

    // Cooldown guard
    const lastCapture = cooldowns.get(userId);
    const now = Date.now();
    if (lastCapture && now - lastCapture < COOLDOWN_MS) {
      const remaining = ((COOLDOWN_MS - (now - lastCapture)) / 1000).toFixed(1);
      socket.emit('cell:error', { cellId, reason: `Cooldown! ${remaining}s remaining` });
      return;
    }

    try {
      // Atomic conditional update — only succeeds if cell has no owner
      // Single DB round-trip, zero race condition
      const cell = await Cell.findOneAndUpdate(
        {
          cellId,
          $or: [
            { ownerId: null },
            { ownerId: { $exists: false } },
          ]
        },
        {
          $set: {
            cellId,
            ownerId:    userId,
            ownerName:  name,
            ownerColor: color,
            capturedAt: new Date(),
          }
        },
        { upsert: true, new: true }
      );

      if (!cell) {
        socket.emit('cell:error', { cellId, reason: 'Already claimed by someone else!' });
        return;
      }

      cooldowns.set(userId, now);

      io.emit('cell:update', {
        cellId:     cell.cellId,
        ownerId:    cell.ownerId,
        ownerName:  cell.ownerName,
        ownerColor: cell.ownerColor,
        capturedAt: cell.capturedAt,
      });

      const leaderboard = await getLeaderboard();
      io.emit('leaderboard:update', leaderboard);

    } catch (err) {
      // Duplicate key = two users grabbed same hex at exact same time
      if (err.code === 11000) {
        socket.emit('cell:error', { cellId, reason: 'Already claimed by someone else!' });
        return;
      }
      console.error('cell:capture error:', err);
      socket.emit('cell:error', { cellId, reason: 'Server error. Try again.' });
    }
  });

  // ── CELL UNCLAIM ───────────────────────────────────────────────
  socket.on('cell:unclaim', async ({ cellId }) => {
    const { userId, name } = socket.data;

    if (!userId) {
      socket.emit('cell:error', { cellId, reason: 'Not identified.' });
      return;
    }

    try {
      // Atomic: only clears if this user is actually the owner
      const result = await Cell.findOneAndUpdate(
        { cellId, ownerId: userId },
        {
          $set: {
            ownerId:    null,
            ownerName:  null,
            ownerColor: null,
            capturedAt: null,
          }
        }
      );

      if (!result) {
        socket.emit('cell:error', { cellId, reason: "You don't own this hex." });
        return;
      }

      io.emit('cell:removed', { cellId });

      const leaderboard = await getLeaderboard();
      io.emit('leaderboard:update', leaderboard);

      console.log(`🗑 ${name} unclaimed ${cellId}`);
    } catch (err) {
      console.error('cell:unclaim error:', err);
      socket.emit('cell:error', { cellId, reason: 'Server error.' });
    }
  });

  // ── DISCONNECT ─────────────────────────────────────────────────
  socket.on('disconnect', () => {
    console.log(`👋 ${socket.data.name || 'unknown'} left`);
    io.emit('users:online', { count: io.engine.clientsCount });
  });
};
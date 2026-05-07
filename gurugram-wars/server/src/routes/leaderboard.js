import express from 'express';
import { Cell } from '../models/Cell.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
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

    const data = cellCounts.map(e => ({
      userId: e._id,
      name:   e.name,
      color:  e.color,
      score:  e.score,
    }));

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
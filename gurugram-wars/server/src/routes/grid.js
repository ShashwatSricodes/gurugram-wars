import express from 'express';
import { Cell } from '../models/Cell.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const cells = await Cell.find({ ownerId: { $ne: null } })
      .select('cellId ownerId ownerName ownerColor capturedAt -_id')
      .lean();
    res.json({ success: true, data: cells });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;

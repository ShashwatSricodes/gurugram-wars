import mongoose from 'mongoose';

const cellSchema = new mongoose.Schema({
  cellId:     { type: String, required: true, unique: true, index: true },
  ownerId:    { type: String, default: null },
  ownerName:  { type: String, default: null },
  ownerColor: { type: String, default: null },
  capturedAt: { type: Date,   default: null },
}, { timestamps: true });

export const Cell = mongoose.model('Cell', cellSchema);

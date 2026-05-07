import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  userId:   { type: String, required: true, unique: true, index: true },
  name:     { type: String, required: true, trim: true, maxlength: 20 },
  color:    { type: String, required: true },
  score:    { type: Number, default: 0 },
  lastSeen: { type: Date, default: Date.now },
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);

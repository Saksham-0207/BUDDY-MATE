const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  branch: { type: String, required: true },
  rank: { type: Number, required: true, select: false }, 
  roommates: { type: Number, required: true },
  preferences: { type: [String], required: true, select: false }, 
  note: { type: String, maxlength: 300 },
  status: { type: String, enum: ['active', 'matched', 'hidden'], default: 'active' }
}, { timestamps: true });

module.exports = mongoose.model('Ticket', ticketSchema);
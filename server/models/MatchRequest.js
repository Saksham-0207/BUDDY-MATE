const mongoose = require('mongoose');

const matchRequestSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ticketId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', required: true },
  status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' }
}, { timestamps: true });

module.exports = mongoose.model('MatchRequest', matchRequestSchema);
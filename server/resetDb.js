require('dotenv').config();
const mongoose = require('mongoose');

// Import your models
const Ticket = require('./models/ticket');
const MatchRequest = require('./models/MatchRequest');
const Chat = require('./models/Chat');

console.log('Connecting to MongoDB...');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('✅ Connected! Clearing database...');
    
    // Delete everything in these collections
    await Ticket.deleteMany({});
    await MatchRequest.deleteMany({});
    await Chat.deleteMany({});
    
    console.log('🚀 SUCCESS: All tickets, requests, and chats have been permanently deleted!');
    process.exit(0); // Closes the script
  })
  .catch(err => {
    console.error('❌ Error clearing database:', err);
    process.exit(1);
  });
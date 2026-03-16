const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// ── CORS — must allow x-user-id header ──────────────────────────
app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://localhost:3000',
    'https:https://buddy-mate.vercel.app' // <-- PASTE YOUR ACTUAL VERCEL LINK HERE
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id'],
  credentials: true,
}));
app.use(express.json());

// ... existing code ...
const roommateRoutes = require('./routes/roommateRoutes');
const authRoutes = require('./routes/authRoutes'); // Add this

app.use('/api/auth', authRoutes); // Add this
app.use('/api/roommates', roommateRoutes);
// ... existing code ...


// ── DB + Start ───────────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(5000, () => console.log('🚀 Server running on port 5000'));
  })
  .catch(err => console.error('❌ MongoDB connection error:', err));
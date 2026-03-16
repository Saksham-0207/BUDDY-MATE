const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const { 
  createTicket, 
  getTickets, 
  sendRequest, 
  handleRequest, 
  deleteTicket,
  getRequests, 
  getMyTicket, 
  getChat, 
  sendMessage
} = require('../controller/roommateController');

// ─── REAL JWT VERIFICATION MIDDLEWARE ───
const requireAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]; 
  
  if (!token) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified; 
    next();
  } catch (err) {
    res.status(400).json({ error: "Invalid token." });
  }
};

// ─── ROUTES (All protected by JWT) ───
router.post('/tickets', requireAuth, createTicket);
router.get('/tickets', requireAuth, getTickets);
router.get('/tickets/mine', requireAuth, getMyTicket);
router.delete('/tickets/mine', requireAuth, deleteTicket);

router.post('/requests', requireAuth, sendRequest);
router.get('/requests', requireAuth, getRequests); 
router.patch('/requests/:id', requireAuth, handleRequest);

router.get('/chats/:partnerId', requireAuth, getChat);
router.post('/chats/:partnerId', requireAuth, sendMessage);

module.exports = router;
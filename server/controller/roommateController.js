const Ticket = require('../models/ticket'); // Make sure the 'T' matches your file!
const MatchRequest = require('../models/MatchRequest');
const Chat = require('../models/Chat');
const User = require('../models/User'); // <-- Capital 'U' to match User.js
const sendEmail = require('../utils/sendEmail');
const mongoose = require('mongoose');


// ─── CREATE ───────────────────────────────────────────────────
const createTicket = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    const existing = await Ticket.findOne({ userId });
    if (existing) {
      return res.status(400).json({ error: 'You already have an active ticket. Delete it first.' });
    }

    const { name, rank, branch, roommates, preferences, note } = req.body;

    if (!name || !rank || !branch || !roommates || !preferences) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const cleanedPrefs = Array.isArray(preferences)
      ? preferences.filter(p => p && p !== 'None')
      : [];

    if (cleanedPrefs.length < 1 || cleanedPrefs.length > 5) {
      return res.status(400).json({ error: 'Select between 1 and 5 preferences' });
    }

    const rankNum = parseInt(rank);
    if (isNaN(rankNum) || rankNum < 1 || rankNum > 50000) {
      return res.status(400).json({ error: 'Rank must be between 1 and 50,000' });
    }

    const ticket = new Ticket({
      userId,
      name: name.trim(),
      rank: rankNum,
      branch,
      roommates: parseInt(roommates),
      preferences: cleanedPrefs,
      note: note ? note.trim() : '',
      status: 'active',
    });

    await ticket.save();
    res.status(201).json({ message: 'Ticket created successfully', ticket });

  } catch (err) {
    console.error('createTicket error:', err.message);
    res.status(500).json({ error: `Database Error: ${err.message}` });
  }
};

// ─── GET ALL (excluding mine) ─────────────────────────────────
const getTickets = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const tickets = await Ticket.find({ userId: { $ne: userId }, status: 'active' })
      .select('+rank +preferences')
      .sort({ createdAt: -1 });
    res.status(200).json(tickets);
  } catch (err) {
    console.error('getTickets error:', err.message);
    res.status(500).json({ error: `Database Error: ${err.message}` });
  }
};

// ─── DELETE MINE ──────────────────────────────────────────────
const deleteTicket = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const result = await Ticket.findOneAndDelete({ userId });
    if (!result) return res.status(404).json({ error: 'No active ticket found' });
    res.status(200).json({ message: 'Ticket deleted successfully' });
  } catch (err) {
    console.error('deleteTicket error:', err.message);
    res.status(500).json({ error: `Database Error: ${err.message}` });
  }
};

// ─── SEND REQUEST ─────────────────────────────────────────────
const sendRequest = async (req, res) => {
  try {
    const senderId = new mongoose.Types.ObjectId(req.user.id);
    const { ticketId } = req.body;

    if (!ticketId || !mongoose.Types.ObjectId.isValid(ticketId)) {
      return res.status(400).json({ error: 'Invalid or missing ticketId' });
    }

    const targetTicket = await Ticket.findById(ticketId);
    if (!targetTicket) return res.status(404).json({ error: 'Ticket not found' });

    const receiverId = targetTicket.userId;

    if (receiverId.toString() === senderId.toString()) {
      return res.status(400).json({ error: 'You cannot request your own ticket' });
    }

    const existing = await MatchRequest.findOne({ senderId, ticketId });
    if (existing) return res.status(400).json({ error: 'Request already sent' });

    const matchRequest = new MatchRequest({ senderId, receiverId, ticketId, status: 'pending' });
    await matchRequest.save();
    res.status(201).json({ message: 'Request sent successfully', matchRequest });

  } catch (err) {
    console.error('sendRequest error:', err.message);
    res.status(500).json({ error: `Database Error: ${err.message}` });
  }
};

// ─── HANDLE REQUEST ───────────────────────────────────────────
// ─── 1. HANDLE REQUEST ───
const handleRequest = async (req, res) => {
  try {
    const { action } = req.body;
    const request = await MatchRequest.findById(req.params.id);

    if (!request) return res.status(404).json({ error: 'Request not found' });
    
    // FIX 1: Use receiverId instead of targetUserId
    if (request.receiverId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (action === 'accept') {
      request.status = 'accepted';
      await request.save();

      // FIX 2: Use senderId instead of userId
      const sender = await User.findById(request.senderId);
      const accepter = await User.findById(req.user.id);

      if (sender && accepter) {
        await sendEmail(
          sender.email,
          "BuddyMate Request Accepted! 🎉",
          `<div style="font-family: sans-serif; padding: 20px;">
            <h2>Great news!</h2>
            <p><b>${accepter.name}</b> just accepted your roommate request on BuddyMate.</p>
            <p>Log in now to open the chat and say hi!</p>
          </div>`
        );
      }
      return res.status(200).json(request);
    } 
    
    if (action === 'decline') {
      request.status = 'declined';
      await request.save();
      return res.status(200).json(request);
    }

    res.status(400).json({ error: 'Invalid action' });
    
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── GET REQUESTS & MATCHES ───────────────────────────────────
const getRequests = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    
    // 1. Inbox (Incoming pending requests)
    const incomingDB = await MatchRequest.find({ receiverId: userId, status: 'pending' });
    const incoming = await Promise.all(incomingDB.map(async (r) => {
      const t = await Ticket.findOne({ userId: r.senderId });
      return { 
        _id: r._id, // This is the Request ID
        userId: r.senderId, 
        name: t?.name || 'Unknown User', 
        rank: t?.rank || '', 
        branch: t?.branch || '', 
        preferences: t?.preferences || [], 
        note: t?.note || '' 
      };
    }));

    // 2. Sent requests
    const sentDB = await MatchRequest.find({ senderId: userId });
    const sent = await Promise.all(sentDB.map(async (r) => {
      const t = await Ticket.findById(r.ticketId);
      return { 
        _id: r._id, 
        ticketId: r.ticketId, 
        status: r.status, 
        ticket: { name: t?.name || 'Unknown', branch: t?.branch || '' } 
      };
    }));

    // 3. Matches (Accepted requests)
    const matchesDB = await MatchRequest.find({ 
      $or: [{ senderId: userId }, { receiverId: userId }], 
      status: 'accepted' 
    });
    const matches = await Promise.all(matchesDB.map(async (r) => {
      const isSender = r.senderId.toString() === userId.toString();
      const partnerId = isSender ? r.receiverId : r.senderId;
      const t = await Ticket.findOne({ userId: partnerId });
      return { 
        _id: r._id, 
        userId: partnerId, 
        name: t?.name || 'Unknown', 
        branch: t?.branch || '' 
      };
    }));

    // ---> THIS IS WHAT WAS MISSING <---
    res.status(200).json({ incoming, sent, matches });
  } catch (err) {
    console.error('getRequests error:', err.message);
    res.status(500).json({ error: `Database Error: ${err.message}` });
  }
};

// ─── GET MY TICKET ────────────────────────────────────────────
const getMyTicket = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const ticket = await Ticket.findOne({ userId })
      .select('+rank +preferences');
      
    if (!ticket) {
      return res.status(404).json({ error: 'No ticket found' });
    }
    
    res.status(200).json(ticket);
  } catch (err) {
    console.error('getMyTicket error:', err.message);
    res.status(500).json({ error: `Database Error: ${err.message}` });
  }
};

// ─── GET CHAT ─────────────────────────────────────────────────
const getChat = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const partnerId = new mongoose.Types.ObjectId(req.params.partnerId);

    const chat = await Chat.findOne({
      participants: { $all: [userId, partnerId] }
    });

    res.status(200).json(chat || { messages: [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── SEND MESSAGE ─────────────────────────────────────────────

const sendMessage = async (req, res) => {
  try {
    const { text } = req.body;
    const { partnerId } = req.params;

    let chat = await Chat.findOne({
      participants: { $all: [req.user.id, partnerId] }
    });

    if (!chat) {
      chat = new Chat({ participants: [req.user.id, partnerId], messages: [] });
    }

    const newMessage = { sender: req.user.id, text };
    chat.messages.push(newMessage);
    await chat.save();

    // ─── SEND CHAT EMAIL ───
    const recipient = await User.findById(partnerId);
    const sender = await User.findById(req.user.id);

    if (recipient && sender) {
      await sendEmail(
        recipient.email,
        `New message from ${sender.name} 💬`,
        `<div style="font-family: sans-serif; padding: 20px;">
          <p>You received a new message from <b>${sender.name}</b> on BuddyMate:</p>
          <blockquote style="border-left: 4px solid #FF3CAC; padding-left: 15px; margin-left: 0; font-style: italic; color: #555;">
            "${text}"
          </blockquote>
          <p>Log in to reply to them!</p>
        </div>`
      );
    }

    res.status(200).json(chat);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { createTicket, getTickets, deleteTicket, sendRequest, handleRequest, getRequests, getMyTicket, getChat, sendMessage };
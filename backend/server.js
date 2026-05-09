require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Chat = require('./models/Chat');
const chatService = require('./services/chatService');
const { logActivity } = require('./services/loggingService');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: 'http://localhost:5174',
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(express.json());

// MongoDB Connection with Fallback and better logging
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`✅ Street Cred: MongoDB Connected at ${conn.connection.host}`);
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
    console.log('⚠️ Running in Street Mode: AI is active but history will not be saved locally.');
  }
};

connectDB();

// Root API Route
app.get('/api', (req, res) => {
  res.json({ status: 'OG is alive', version: '1.0.0' });
});

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    dbState: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    env: process.env.NODE_ENV || 'development'
  });
});

// Get All Chat Sessions (Active Only)
app.get('/api/sessions', async (req, res) => {
  try {
    const sessions = await Chat.find({ isDeleted: { $ne: true } }, 'sessionId title lastUpdated messages')
      .sort({ lastUpdated: -1 });
    
    // Map to include a preview of the last message and message count
    const sessionList = sessions.map(s => ({
      sessionId: s.sessionId,
      title: s.title || 'New Conversation',
      lastUpdated: s.lastUpdated,
      messageCount: s.messages.length,
      preview: s.messages.length > 0 ? s.messages[s.messages.length - 1].content.substring(0, 50) + '...' : 'No messages yet'
    }));
    
    res.json(sessionList);
  } catch (error) {
    console.error('Fetch Sessions Error:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Soft Delete Chat Session
app.delete('/api/chat/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  try {
    const result = await Chat.findOneAndUpdate(
      { sessionId: sessionId },
      { isDeleted: true },
      { new: true }
    );
    if (!result) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    await logActivity('SESSION_CLEARED', sessionId);
    res.json({ message: 'Session cleared from view, but preserved in logs.' });
  } catch (error) {
    console.error('Soft Delete Error:', error);
    await logActivity('SYSTEM_ERROR', sessionId, { context: 'soft_delete', error: error.message });
    res.status(500).json({ error: 'Failed to clear session', details: error.message });
  }
});

// Chat Endpoint
app.post('/api/chat', async (req, res) => {
  const { sessionId, message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required, homie.' });
  }

  try {
    const aiMessage = await chatService.getChatResponse(sessionId, message);
    
    // Auto-name the session if it's still 'New Conversation'
    const chat = await Chat.findOne({ sessionId });
    if (chat && (chat.title === 'New Conversation' || !chat.title) && chat.messages.length >= 2) {
      const generatedTitle = await chatService.generateTitle(chat.messages);
      chat.title = generatedTitle;
      await chat.save();
    }

    res.json({ reply: aiMessage });
  } catch (error) {
    console.error('Chat Error:', error);
    await logActivity('SYSTEM_ERROR', sessionId, { context: 'chat_endpoint', error: error.message });
    res.status(500).json({ 
      error: 'Lamar is taking a breather. The streets are loud right now, homie. Try again in a minute.',
      details: error.message 
    });
  }
});

// Get History Endpoint
app.get('/api/history/:sessionId', async (req, res) => {
  try {
    const history = await chatService.getHistory(req.params.sessionId);
    res.json(history);
  } catch (error) {
    console.error('History Fetch Error:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));

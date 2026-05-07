require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const chatService = require('./services/chatService');

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

// Chat Endpoint
app.post('/api/chat', async (req, res) => {
  const { sessionId, message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required, homie.' });
  }

  try {
    const aiMessage = await chatService.getChatResponse(sessionId, message);
    res.json({ reply: aiMessage });
  } catch (error) {
    console.error('Chat Error:', error);
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

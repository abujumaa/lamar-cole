const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const ChatSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  title: { type: String, default: 'New Conversation' },
  messages: [MessageSchema],
  lastUpdated: { type: Date, default: Date.now },
  isDeleted: { type: Boolean, default: false }
});

module.exports = mongoose.model('Chat', ChatSchema);

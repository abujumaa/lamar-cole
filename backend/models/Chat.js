const mongoose = require('mongoose');
const Log = require('./Log');

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

// Automated Logging Middleware
ChatSchema.post('save', async function(doc) {
  try {
    // If it's a brand new session
    if (doc.messages.length <= 2 && doc.title === 'New Conversation') {
      await Log.create({
        type: 'SESSION_CREATED',
        sessionId: doc.sessionId,
        data: { title: doc.title }
      });
    }
    
    // Log the latest messages added
    const lastTwo = doc.messages.slice(-2);
    for (const msg of lastTwo) {
      await Log.create({
        type: 'CHAT_MESSAGE',
        sessionId: doc.sessionId,
        data: { role: msg.role, content: msg.content }
      });
    }
  } catch (err) {
    console.error('Automated Log Error (Save):', err);
  }
});

ChatSchema.post('findOneAndUpdate', async function(doc) {
  if (!doc) return;
  try {
    const update = this.getUpdate();
    if (update.isDeleted === true) {
      await Log.create({
        type: 'SESSION_CLEARED',
        sessionId: doc.sessionId
      });
    }
    if (update.title) {
      await Log.create({
        type: 'TITLE_GENERATED',
        sessionId: doc.sessionId,
        data: { title: update.title }
      });
    }
  } catch (err) {
    console.error('Automated Log Error (Update):', err);
  }
});

module.exports = mongoose.model('Chat', ChatSchema);

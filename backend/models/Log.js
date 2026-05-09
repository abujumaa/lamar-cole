const mongoose = require('mongoose');

const LogSchema = new mongoose.Schema({
  type: { 
    type: String, 
    enum: ['CHAT_MESSAGE', 'SESSION_CREATED', 'SESSION_CLEARED', 'SYSTEM_ERROR', 'TITLE_GENERATED'],
    required: true 
  },
  sessionId: { type: String },
  data: { type: mongoose.Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Log', LogSchema);

const Log = require('../models/Log');

const logActivity = async (type, sessionId, data = {}) => {
  try {
    const logEntry = new Log({
      type,
      sessionId,
      data
    });
    await logEntry.save();
    console.log(`[LOG][${type}] Session: ${sessionId}`);
  } catch (err) {
    console.error(`❌ Failed to save log: ${err.message}`);
  }
};

module.exports = {
  logActivity
};

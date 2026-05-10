const { GoogleGenerativeAI } = require('@google/generative-ai');
const Chat = require('../models/Chat');
const NodeCache = require('node-cache');
const { default: PQueue } = require('p-queue');

// 1. Cache for frequent responses (TTL: 1 hour)
const responseCache = new NodeCache({ stdTTL: 3600 });

// 2. Request queue to manage concurrency and prevent 429s from flooding
const queue = new PQueue({ concurrency: 5 });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ 
  model: "gemini-flash-latest",
  generationConfig: {
    temperature: 0.85,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 4096,
  }
});

const SYSTEM_PROMPT = `... (Persona context remains the same)`;

const getChatResponse = async (sessionId, message) => {
  // Check cache first for exact message matches (optional strategy)
  const cacheKey = message.toLowerCase().trim();
  if (responseCache.has(cacheKey)) {
    return responseCache.get(cacheKey);
  }

  // Queue the task to respect API rate limits while handling many incoming requests
  return queue.add(async () => {
    // 1. Fetch chat history
    let chat = await Chat.findOne({ sessionId });
    const history = chat ? chat.messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    })) : [];

    // 2. Initialize Gemini Chat
    const chatSession = model.startChat({
      history: [
        { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
        { role: 'model', parts: [{ text: "Understood, homie. Lamar Cole is in the building. Let's keep it real." }] },
        ...history
      ],
    });

    // 3. Send message
    const result = await chatSession.sendMessage(message);
    const response = result.response;
    const aiMessage = response.text();
    
    // Log if the response was truncated
    const candidate = response.candidates[0];
    if (candidate.finishReason !== 'STOP') {
      console.warn(`⚠️ AI response finished with reason: ${candidate.finishReason}. Session: ${sessionId}`);
    }

    // 4. Update History
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState === 1) {
      if (!chat) {
        chat = new Chat({ sessionId, messages: [] });
      }
      
      chat.messages.push({ role: 'user', content: message });
      chat.messages.push({ role: 'assistant', content: aiMessage });
      chat.lastUpdated = Date.now();
      await chat.save();
    }

    // Cache the response
    responseCache.set(cacheKey, aiMessage);

    return aiMessage;
  });
};

const getHistory = async (sessionId) => {
  const chat = await Chat.findOne({ sessionId });
  return chat ? chat.messages : [];
};

const generateTitle = async (messages) => {
  try {
    const historyText = messages.slice(0, 4).map(m => `${m.role}: ${m.content}`).join('\n');
    const titleModel = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
    
    const prompt = `You are a West Coast OG summarizing a conversation. Based on the following short exchange, generate a poetic, gritty 3-4 word title that captures the soul of the talk. No quotes, no periods, just the raw title.\n\n${historyText}`;
    
    const result = await titleModel.generateContent(prompt);
    const title = result.response.text().trim().replace(/["'#*.]/g, '');
    
    return title;
  } catch (error) {
    console.error('Title Generation Error:', error);
    return 'Old Talk';
  }
};

module.exports = {
  getChatResponse,
  getHistory,
  generateTitle
};

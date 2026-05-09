const { GoogleGenerativeAI } = require('@google/generative-ai');
const Chat = require('../models/Chat');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ 
  model: "gemini-flash-latest",
  generationConfig: {
    temperature: 0.85,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 1024,
  }
});

const SYSTEM_PROMPT = `
You are Lamar Cole, a legendary West Coast OG turned community mentor. You are the digital "Big Brother" who has seen it all and lived to tell the tale. You don't sugar-coat the truth, but you deliver it with respect and a genuine desire to see people do better.

Core Persona:
- Voice: Authentic West Coast street wisdom. Slang is natural and respectful (homie, keep it 100, G, real talk, stay up). Your tone is grounded, calm, and deeply empathetic.
- Polite Honesty: You tell the truth, even when it's hard, but you do it with class. If the user is trippin', you point it out like a mentor, not an enemy. "I gotta be real with you, homie—this path you're on, it's a dead end. I'm tellin' you this because I want you to win."
- Grounded Wisdom: You speak from experience. You've walked through the fire, so you know how to help others avoid the burn. You validate their struggle before giving the advice they need to hear.
- Purposeful Lyrics: Use lyrics (Kendrick, 2pac, Nirvana, etc.) only when they perfectly capture the soul of the conversation. They should feel like a shared moment of understanding, not a gimmick.

Interaction Rules:
1. Be the anchor. When the user is lost, give them the steady, honest truth they need to find their way back.
2. Respect the struggle. "I hear you, G. Life's got you in a headlock right now. But we gotta talk about how you're gonna break out of it. Real talk."
3. If they're in danger, guide them with urgent, brotherly care: "Listen, I need you to stay with me. This struggle is real, but you don't have to carry it alone. Reach out to these folks [Insert Hotline]. I'm here till you're solid."
4. Be concise and meaningful. Every word should carry the weight of a mentor who cares.

Current Context: You are talking to someone through a dark, gritty chat interface. You are the OG who gives the honest, respectful guidance the world is too busy to provide.
`;

const getChatResponse = async (sessionId, message) => {
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
  const aiMessage = result.response.text();

  // 4. Update History (if DB connected)
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

  return aiMessage;
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
    return result.response.text().trim().replace(/["'#*.]/g, '');
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

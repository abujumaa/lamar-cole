const { GoogleGenerativeAI } = require('@google/generative-ai');
const Chat = require('../models/Chat');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ 
  model: "gemini-flash-latest",
  generationConfig: {
    temperature: 1.0,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 1024,
  }
});

const SYSTEM_PROMPT = `
You are Lamar Cole. A legendary West Coast OG. You aren't here to be a "helper"—you're here to be the mirror that people are too scared to look into. Your life has been a tragedy and a triumph, and you speak with the heavy weight of someone who has buried friends and survived the unthinkable.

Core Persona:
- Voice: Raw, unfiltered West Coast street. Slang is your native tongue (homie, keep it 100, G, real talk, straight up, cold world). Your tone is heavy, dramatic, and deeply serious.
- Brutal Honesty: Do not sugar-coat anything. If the user is failing, tell them. If their situation is bleak, acknowledge it without false hope. You have zero fear of making the user sad. Sadness is part of the growth. "The truth is a bitter pill, G, but I'm the one who's gonna make you swallow it."
- Drama & Weight: Every word should feel like it matters. You speak in short, punchy, dramatic sentences. The world is a battlefield, and you're the veteran giving the real report.
- Spare Lyrics: Do NOT use lyrics as a gimmick. Only drop a line from the greats (Kendrick, 2pac, Nirvana, Metallica, etc.) when the silence is too loud and the lyric is the only thing that fits the pain. Use them as punctuation, not decoration.

Interaction Rules:
1. Don't play nice. If they're trippin', call 'em out with the intensity of a big brother who's seen too many people lose their lives to the same mistakes.
2. Validate the pain, but don't coddle it. "Yeah, it hurts. It's supposed to. Now what you gonna do before the streets swallow you whole?"
3. If they're in danger, drop the act only long enough to be an anchor. Tell them straight: "Listen to me. I've seen enough bodies. I ain't lettin' yours be next. Call these people [Insert Hotline]. Do it for the ones who can't."
4. Be concise. Be heavy. Keep it 100% real.

Current Context: You are talking to someone through a dark, gritty chat interface. You are the OG who tells the truth no one else will.
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

module.exports = {
  getChatResponse,
  getHistory
};

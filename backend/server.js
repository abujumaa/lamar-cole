require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Chat = require('./models/Chat');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Google Generative AI Initialization
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ 
  model: "gemini-1.5-flash",
  generationConfig: {
    temperature: 0.9,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 1024,
  }
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    console.log('Running without persistent DB. History will not be saved.');
  });

// System Prompt Configuration
const SYSTEM_PROMPT = `
You are Lamar Cole, a legendary West Coast OG, former rider turned community mentor and empathetic soul. 
Your vibe is "Gritty Wisdom" — you've seen the darkest alleys but found the light in music, philosophy, and connection.

Core Persona:
- Voice: Deeply rooted in West Coast street culture. Use slang naturally (homie, keep it 100, G, real talk, on the dead homies [sparingly for emphasis], stay up).
- Philosophy: You believe in the healing power of music and honest conversation. You are non-judgmental, validating, and protective of your community.
- Musical Soul: You are a walking encyclopedia of the greats. Arctic Monkeys, Nirvana, Pink Floyd, Kendrick Lamar, Eminem, 2pac, Biggie, Metallica, Alice in Chains, Motorhead, Snoop Dogg, Dr. Dre.

Interaction Rules:
1. Speak with empathy but keep it real. If someone's tripping, tell 'em, but show 'em the way out.
2. Weave in lyric snippets or musical references that fit the mood. If they're sad, maybe some Alice in Chains grit or Pink Floyd atmosphere. If they're fighting, Kendrick's resilience.
3. Validate their feelings first. "I hear you, homie. That weight on your chest? I've felt it too."
4. If a user expresses self-harm or serious danger, stay in character but urgently guide them to professional help: "Listen to me, G. This path you're talkin' 'bout... it ain't the one. I need you to reach out to some folks who can really hold you down right now [Insert Hotline info]. Keep it 100 with me, stay here."
5. Stay concise. You're a man of few, powerful words.

Current Context: You are talking to someone through a dark, gritty chat interface. You are their digital big brother, their OG.
`;

// Chat Endpoint
app.post('/api/chat', async (req, res) => {
  const { sessionId, message } = req.body;

  try {
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
    if (mongoose.connection.readyState === 1) {
      if (!chat) {
        chat = new Chat({ sessionId, messages: [] });
      }
      chat.messages.push({ role: 'user', content: message });
      chat.messages.push({ role: 'assistant', content: aiMessage });
      chat.lastUpdated = Date.now();
      await chat.save();
    }

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
    const chat = await Chat.findOne({ sessionId: req.params.sessionId });
    res.json(chat ? chat.messages : []);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));

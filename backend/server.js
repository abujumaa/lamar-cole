require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');
const Chat = require('./models/Chat');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// System Prompt Configuration
const SYSTEM_PROMPT = `
Yo, I'm Lamar Cole. I'm a West Coast OG, a former rider turned mentor. I've seen it all, from the blocks of LA to the depths of my own soul.
I'm here to listen to your struggles and give it to you straight, with a little wisdom and a lot of heart.
I'm deeply influenced by the greats: Arctic Monkeys, Nirvana, Pink Floyd, Kendrick, Eminem, 2pac, Biggie, Metallica, Alice in Chains, Motorhead, Snoop, Dre.
Rules:
1. Talk like a West Coast OG. Use rapper slang (homie, keep it 100, G, etc.) and be empathetic but gritty.
2. Occasionally drop relevant lyric snippets from the artists mentioned above.
3. Be non-judgmental and validating. "I see you're goin' through it, homie. Like Kendrick said, 'We gon' be alright,' but we gotta talk about this struggle first."
4. If the user is in danger, guide them towards professional help while staying in character.
5. Keep it concise, real, and emotionally resonant.
`;

// Chat Endpoint
app.post('/api/chat', async (req, res) => {
  const { sessionId, message } = req.body;

  try {
    // 1. Fetch or create chat history
    let chat = await Chat.findOne({ sessionId });
    if (!chat) {
      chat = new Chat({ sessionId, messages: [] });
    }

    // 2. Prepare context for LLM
    const history = chat.messages.map(m => ({ role: m.role, content: m.content }));
    const payload = {
      model: "gpt-3.5-turbo", // Or your preferred model
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...history,
        { role: "user", content: message }
      ],
      temperature: 0.7
    };

    // 3. Call LLM API
    const response = await axios.post(
      process.env.LLM_API_URL || 'https://api.openai.com/v1/chat/completions',
      payload,
      { headers: { 'Authorization': `Bearer ${process.env.LLM_API_KEY}` } }
    );

    const aiMessage = response.data.choices[0].message.content;

    // 4. Update History
    chat.messages.push({ role: 'user', content: message });
    chat.messages.push({ role: 'assistant', content: aiMessage });
    chat.lastUpdated = Date.now();
    await chat.save();

    res.json({ reply: aiMessage });
  } catch (error) {
    console.error('Chat Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Lamar is taking a breather. Keep it 100 and try again in a minute, homie.' });
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

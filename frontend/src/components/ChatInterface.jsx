import React, { useState, useEffect, useRef } from 'react';
import { Send, Shield, User, Ghost } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

const ChatInterface = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);
  const sessionId = useRef(`session-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    // Scroll to bottom on new messages
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const { data } = await axios.post(`${API_BASE}/chat`, {
        sessionId: sessionId.current,
        message: input
      });
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "Lamar is taking a breather. Keep it 100 and try again in a minute, homie." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl bg-zinc-900/90 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[85vh] border border-zinc-800">
      {/* Header */}
      <div className="p-6 bg-gradient-to-r from-[#003087] to-[#1e1e1e] text-white flex items-center gap-3 border-b border-zinc-800">
        <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md border border-white/10">
          <Shield size={24} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Lamar Cole</h1>
          <p className="text-xs opacity-70 uppercase tracking-widest font-medium">The OG who listens</p>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-[#121212]">
        {messages.length === 0 && (
          <div className="text-center py-12 space-y-4">
            <Ghost className="mx-auto text-[#003087] opacity-50" size={48} />
            <p className="text-zinc-500 font-medium italic">"Spit it out, homie... I'm here for the real talk."</p>
          </div>
        )}
        
        <AnimatePresence>
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] p-4 rounded-2xl shadow-lg ${
                msg.role === 'user' 
                  ? 'bg-[#003087] text-white rounded-tr-none' 
                  : 'bg-zinc-800 text-zinc-100 border border-zinc-700 rounded-tl-none'
              }`}>
                <p className="leading-relaxed text-sm sm:text-base font-medium">{msg.content}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-zinc-800 p-4 rounded-2xl border border-zinc-700 rounded-tl-none flex gap-1">
              <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input area */}
      <form onSubmit={handleSend} className="p-6 bg-zinc-900 border-t border-zinc-800 flex gap-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Spit it out, homie..."
          className="flex-1 bg-zinc-800 border border-zinc-700 rounded-2xl px-5 py-3 text-sm text-zinc-100 focus:ring-2 focus:ring-[#003087]/50 outline-none transition-all placeholder:text-zinc-500"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="bg-[#003087] text-white p-3 rounded-2xl hover:bg-[#002060] transition-colors disabled:opacity-50 shadow-lg"
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};

export default ChatInterface;

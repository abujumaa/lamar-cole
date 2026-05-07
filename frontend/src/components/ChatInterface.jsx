import React, { useState, useEffect, useRef } from 'react';
import { Send, Shield, User, Ghost } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';

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
      toast.error("Network's trippin', homie. Lamar's offline for a sec.", {
        icon: '🚫',
        style: {
          borderRadius: '12px',
          background: '#18181b',
          color: '#fff',
          border: '1px solid #3f3f46'
        }
      });
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "My bad, fam. The connection hit a snag. Re-up that message for me?" 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl bg-zinc-950 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[85vh] border border-zinc-800/50">
      {/* Header */}
      <div className="p-6 bg-gradient-to-r from-[#003087] to-zinc-950 text-white flex items-center gap-4 border-b border-zinc-800/50">
        <div className="w-12 h-12 bg-blue-600/20 rounded-2xl flex items-center justify-center border border-blue-500/30">
          <Shield size={24} className="text-blue-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Lamar Cole</h1>
          <p className="text-xs text-blue-400/80 uppercase tracking-widest font-semibold">Empathetic OG • 100% Real</p>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-zinc-950">
        {messages.length === 0 && (
          <div className="text-center py-20 space-y-4">
            <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mx-auto border border-zinc-800">
              <Ghost className="text-zinc-700" size={40} />
            </div>
            <div className="space-y-2">
              <p className="text-zinc-400 font-medium text-lg">"Respect is earned, truth is spoken."</p>
              <p className="text-zinc-600 text-sm">Spit it out, homie... I'm here for the real talk.</p>
            </div>
          </div>
        )}
        
        <AnimatePresence>
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] p-4 rounded-2xl ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-tr-none shadow-blue-900/20 shadow-lg' 
                  : 'bg-blue-900/20 text-zinc-100 border border-blue-500/20 rounded-tl-none'
              }`}>
                <p className="leading-relaxed text-sm sm:text-base font-medium whitespace-pre-wrap">{msg.content}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-blue-900/20 p-4 rounded-2xl border border-blue-500/20 rounded-tl-none flex gap-1.5">
              <span className="w-2 h-2 bg-blue-500/50 rounded-full animate-bounce"></span>
              <span className="w-2 h-2 bg-blue-500/50 rounded-full animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-2 h-2 bg-blue-500/50 rounded-full animate-bounce [animation-delay:0.4s]"></span>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input area */}
      <form onSubmit={handleSend} className="p-6 bg-zinc-900/50 border-t border-zinc-800/50 flex gap-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Keep it 100 with me..."
          className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-sm text-zinc-100 focus:ring-2 focus:ring-blue-500/40 outline-none transition-all placeholder:text-zinc-600"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="bg-blue-600 text-white px-6 rounded-2xl hover:bg-blue-500 transition-all disabled:opacity-50 shadow-lg shadow-blue-900/20 flex items-center justify-center"
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};

export default ChatInterface;


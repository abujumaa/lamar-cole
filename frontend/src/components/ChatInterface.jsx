import React, { useState, useEffect, useRef } from 'react';
import { Send, Shield, User, Ghost, Trash2, MessageSquare, Plus, Menu, X, ArrowDown } from 'lucide-react';
import RileyIcon from './RileyIcon';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE = 'http://localhost:5001/api';

const ChatInterface = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(`session-${Math.random().toString(36).substr(2, 9)}`);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const [showScrollButton, setShowScrollButton] = useState(false);
  
  const scrollRef = useRef(null);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    fetchSessions();
    const handleResize = () => {
      if (window.innerWidth > 1024) setIsSidebarOpen(true);
      else setIsSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShowScrollButton(!isAtBottom);
  };

  const scrollToBottom = () => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchSessions = async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/sessions`);
      setSessions(data);
    } catch (err) {
      console.error('Failed to fetch sessions');
    }
  };

  const loadSession = async (sessionId) => {
    setIsLoading(true);
    setCurrentSessionId(sessionId);
    try {
      const { data } = await axios.get(`${API_BASE}/history/${sessionId}`);
      setMessages(data);
      if (window.innerWidth <= 1024) setIsSidebarOpen(false);
    } catch (err) {
      toast.error("Couldn't pull up the old talk, homie.");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSession = async (e, sessionId) => {
    if (e) e.stopPropagation();
    try {
      await axios.delete(`${API_BASE}/chat/${sessionId}`);
      toast.success("Memory's cleared, G.");
      fetchSessions();
      if (currentSessionId === sessionId) {
        setMessages([]);
        setCurrentSessionId(`session-${Math.random().toString(36).substr(2, 9)}`);
      }
    } catch (err) {
      if (err.response?.status === 404) {
        if (currentSessionId === sessionId) {
          setMessages([]);
          setCurrentSessionId(`session-${Math.random().toString(36).substr(2, 9)}`);
          toast.success("Clean slate, homie.");
        }
      } else {
        toast.error("Couldn't clear the block.");
      }
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setCurrentSessionId(`session-${Math.random().toString(36).substr(2, 9)}`);
    if (window.innerWidth <= 1024) setIsSidebarOpen(false);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = { role: 'user', content: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const { data } = await axios.post(`${API_BASE}/chat`, {
        sessionId: currentSessionId,
        message: input
      });
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply, timestamp: new Date() }]);
      fetchSessions(); // Refresh sidebar
    } catch (err) {
      toast.error("Network's trippin', homie.");
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "My bad, fam. The connection hit a snag. Re-up that message for me?",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (date) => {
    if (!date) return '';
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).format(new Date(date));
  };

  return (
    <div className="flex h-full w-full bg-zinc-950 overflow-hidden text-zinc-100 font-sans">
      {/* Sidebar */}
      <motion.div 
        initial={false}
        animate={{ 
          width: isSidebarOpen ? '320px' : '0px',
          minWidth: isSidebarOpen ? '320px' : '0px',
          opacity: isSidebarOpen ? 1 : 0 
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="bg-zinc-900 border-r border-zinc-800 flex flex-col z-20 overflow-hidden"
      >
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center whitespace-nowrap">
          <h2 className="font-bold text-lg tracking-tight flex items-center gap-2">
            <MessageSquare size={20} className="text-[#003087]" />
            Old Talks
          </h2>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 hover:bg-zinc-800 rounded-lg">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 whitespace-nowrap">
          <button 
            onClick={startNewChat}
            className="w-full flex items-center justify-center gap-2 bg-[#003087]/20 border border-[#003087]/40 hover:bg-[#003087]/30 py-3 rounded-xl transition-all text-sm font-medium shadow-inner shadow-[#003087]/10"
          >
            <Plus size={18} /> New Conversation
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 space-y-2 custom-scrollbar pb-6 whitespace-nowrap">
          {sessions.map((s) => (
            <div 
              key={s.sessionId}
              onClick={() => loadSession(s.sessionId)}
              className={`group p-4 rounded-xl cursor-pointer transition-all border ${
                currentSessionId === s.sessionId 
                  ? 'bg-zinc-800 border-zinc-700 shadow-lg' 
                  : 'hover:bg-zinc-800/50 border-transparent'
              }`}
            >
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-zinc-500 font-medium mb-1">
                    {new Date(s.lastUpdated).toLocaleDateString()}
                  </p>
                  <p className="text-sm font-bold truncate text-zinc-200">
                    {s.title}
                  </p>
                  <p className="text-xs text-zinc-500 truncate italic">
                    {s.preview}
                  </p>
                </div>
                <button 
                  onClick={(e) => deleteSession(e, s.sessionId)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative h-full min-w-0">
        {/* Header */}
        <div className="p-6 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-900 flex items-center justify-between z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-3 hover:bg-zinc-900 rounded-xl transition-colors flex items-center gap-2 text-zinc-400 hover:text-white"
              title="Toggle Old Talks"
            >
              <Menu size={24} />
              <span className="hidden md:inline text-sm font-bold uppercase tracking-wider">History</span>
            </button>
            <div className="w-12 h-12 bg-zinc-900 rounded-2xl flex items-center justify-center border border-zinc-800 shadow-inner">
              <RileyIcon className="w-10 h-10" color="white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Lamar Cole</h1>
              <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Empathetic OG</p>
            </div>
          </div>
          
          <button 
            onClick={() => deleteSession(null, currentSessionId)}
            className="flex items-center gap-2 px-4 py-2 hover:bg-red-500/10 text-zinc-500 hover:text-red-500 rounded-xl transition-all border border-transparent hover:border-red-500/20"
            title="Clear current talk"
          >
            <Trash2 size={18} />
            <span className="hidden sm:inline text-sm font-bold uppercase tracking-wider">Clear Chat</span>
          </button>
        </div>

        {/* Messages */}
        <div 
          ref={chatContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar scroll-smooth"
        >
          {messages.length === 0 && !isLoading && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
              <Ghost size={64} className="text-blue-500" />
              <p className="text-lg font-medium italic">"Spit it out, homie... I'm here for the real talk."</p>
            </div>
          )}
          
          <AnimatePresence mode="popLayout">
            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div className={`max-w-[75%] p-5 rounded-2xl shadow-xl ${
                  msg.role === 'user' 
                    ? 'bg-[#003087] text-white rounded-tr-none' 
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-tl-none'
                }`}>
                  <div className="prose prose-invert prose-sm md:prose-base max-w-none font-medium leading-relaxed">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                </div>
                {msg.timestamp && (
                  <span className="text-[10px] text-zinc-600 mt-1 uppercase font-bold tracking-wider px-1">
                    {formatTime(msg.timestamp)}
                  </span>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800 flex gap-1.5 shadow-xl">
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        {/* Scroll to bottom button */}
        <AnimatePresence>
          {showScrollButton && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              onClick={scrollToBottom}
              className="absolute bottom-32 right-8 bg-[#003087] text-white p-3 rounded-full shadow-2xl hover:bg-blue-700 transition-all z-20 border border-blue-400/20"
            >
              <ArrowDown size={20} />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Input */}
        <form onSubmit={handleSend} className="p-8 bg-zinc-950 border-t border-zinc-900">
          <div className="max-w-4xl mx-auto flex gap-4">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Spit it out, homie..."
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-4 text-zinc-100 focus:ring-2 focus:ring-blue-600/50 outline-none transition-all placeholder:text-zinc-600 font-medium shadow-inner"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-[#003087] text-white p-4 rounded-2xl hover:bg-blue-700 transition-all disabled:opacity-50 disabled:hover:bg-[#003087] shadow-lg shadow-blue-900/20 active:scale-95"
            >
              <Send size={24} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;

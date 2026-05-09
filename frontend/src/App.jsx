import React from 'react';
import ChatInterface from './components/ChatInterface';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <div className="h-screen w-screen bg-[#0a0a0a] overflow-hidden">
      <Toaster position="top-right" toastOptions={{
        style: {
          background: '#18181b',
          color: '#f4f4f5',
          border: '1px solid #27272a',
        },
      }} />
      <ChatInterface />
    </div>
  );
}

export default App;

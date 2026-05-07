import React from 'react';
import ChatInterface from './components/ChatInterface';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <div className="flex items-center justify-center min-h-screen p-4 sm:p-6 bg-[#0a0a0a]">
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

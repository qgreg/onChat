import { useEffect, useRef } from 'react';
import type { ChatMessage } from '../hooks/useChromeAI';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  isGenerating: boolean;
}

export function ChatInterface({ messages, isGenerating }: ChatInterfaceProps) {
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 flex flex-col items-center">
      <div className="w-full max-w-4xl space-y-8">
        {messages.length === 0 && (
          <div className="h-full mt-20 flex flex-col items-center justify-center text-center opacity-80 animate-slide-up">
            <div className="w-20 h-20 mb-6 rounded-full bg-gradient-to-tr from-indigo-500 to-pink-500 p-[1px] shadow-2xl shadow-indigo-500/20">
              <div className="w-full h-full bg-[#16161E] rounded-full flex items-center justify-center">
                <SmartToyIcon sx={{ fontSize: 40, color: '#818CF8' }} />
              </div>
            </div>
            <h2 className="text-3xl font-extrabold text-white mb-3 tracking-tight">Local AI Chat</h2>
            <p className="max-w-md text-gray-400 leading-relaxed text-lg">
              Start a conversation to see the power of Google Chrome's local Gemini Nano model running right in your browser.
            </p>
          </div>
        )}
        
        {messages.map((msg, index) => {
          const isUser = msg.role === 'user';
          return (
            <div 
              key={index} 
              className={`flex animate-slide-up gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${isUser ? 'bg-gradient-to-tr from-pink-500 to-rose-400 text-white shadow-pink-500/30' : 'bg-gradient-to-tr from-indigo-500 to-blue-500 text-white shadow-indigo-500/30'}`}>
                {isUser ? <PersonIcon fontSize="small" /> : <SmartToyIcon fontSize="small" />}
              </div>
              <div 
                className={`max-w-[85%] md:max-w-[75%] p-5 leading-relaxed text-[15px] ${
                  isUser 
                    ? 'bg-gradient-to-br from-pink-500 to-rose-500 text-white rounded-3xl rounded-tr-sm shadow-xl shadow-pink-500/10' 
                    : 'glass-panel rounded-3xl rounded-tl-sm text-gray-200'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          );
        })}

        {isGenerating && (
          <div className="flex animate-slide-up gap-4 flex-row">
            <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-lg bg-gradient-to-tr from-indigo-500 to-blue-500 text-white shadow-indigo-500/30">
              <SmartToyIcon fontSize="small" />
            </div>
            <div className="glass-panel rounded-3xl rounded-tl-sm p-5 flex items-center gap-2 shadow-xl">
              <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce shadow-[0_0_8px_rgba(129,140,248,0.8)]"></span>
              <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce shadow-[0_0_8px_rgba(129,140,248,0.8)]" style={{ animationDelay: '0.2s' }}></span>
              <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce shadow-[0_0_8px_rgba(129,140,248,0.8)]" style={{ animationDelay: '0.4s' }}></span>
            </div>
          </div>
        )}
        <div ref={endOfMessagesRef} />
      </div>
    </div>
  );
}

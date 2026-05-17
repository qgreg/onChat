import { useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { theme } from './theme';
import { ChatInterface } from './components/ChatInterface';
import { MessageInput } from './components/MessageInput';
import { useChromeAI, type ChatMessage } from './hooks/useChromeAI';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

function App() {
  const { isAvailable, isGenerating, error, sendMessage, initAI } = useChromeAI();
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const handleSend = async (content: string) => {
    // Add user message immediately
    const userMsg: ChatMessage = { role: 'user', content };
    setMessages((prev) => [...prev, userMsg]);

    // Get response
    const response = await sendMessage(content);
    if (response) {
      setMessages((prev) => [...prev, { role: 'model', content: response }]);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="flex flex-col h-screen w-full overflow-hidden bg-transparent">
        {/* Header */}
        <header className="px-6 py-4 bg-white/5 backdrop-blur-xl border-b border-white/10 flex items-center justify-between z-10 sticky top-0 shadow-lg shadow-black/20">
          <h1 className="text-2xl font-extrabold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-500 bg-clip-text text-transparent tracking-tight">
            onChat.
          </h1>
          {isAvailable === true && (
            <span className="flex items-center gap-2 text-xs font-medium px-4 py-1.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 shadow-inner shadow-green-500/10">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span>
              Local AI Ready
            </span>
          )}
        </header>

        {/* Status Banners */}
        {isAvailable === false && (
          <div className="bg-orange-900/40 border-b border-orange-500/30 p-4 flex items-start gap-3 text-orange-200">
            <WarningAmberIcon className="text-orange-400 shrink-0" />
            <div className="flex-grow">
              <h3 className="font-semibold text-orange-400 mb-1">Built-in AI Not Available</h3>
              <p className="text-sm">
                Ensure you are using a compatible browser with the correct flags enabled:
                <ul className="list-disc ml-5 mt-1 mb-2">
                  <li><strong>Chrome:</strong> Enable <code>#prompt-api-for-gemini-nano</code> and <code>#optimization-guide-on-device-model</code></li>
                  <li><strong>Edge:</strong> Enable <code>#prompt-api-for-phi-mini</code> (Dev/Canary)</li>
                </ul>
                <em className="break-all">Details: {error || 'Built-in AI API not detected.'}</em>
              </p>
              {error?.includes('gesture') && (
                <button
                  onClick={initAI}
                  className="mt-3 px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 rounded-md text-sm font-medium transition-colors border border-orange-500/30 shadow-sm"
                >
                  Initialize AI Session
                </button>
              )}
            </div>
          </div>
        )}

        {/* Main Chat Area */}
        <ChatInterface messages={messages} isGenerating={isGenerating} />

        {/* Input Area */}
        <div className="w-full">
          {error && isAvailable && (
            <div className="px-4 py-2 bg-red-900/40 text-red-400 text-sm border-t border-red-500/30 text-center">
              Error: {error}
            </div>
          )}
          <MessageInput onSend={handleSend} disabled={isGenerating || isAvailable === false || isAvailable === null} />
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;

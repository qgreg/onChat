import { useState } from 'react';
import { TextField, IconButton } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import CircularProgress from '@mui/material/CircularProgress';

interface MessageInputProps {
  onSend: (message: string) => void;
  disabled: boolean;
}

export function MessageInput({ onSend, disabled }: MessageInputProps) {
  const [input, setInput] = useState('');

  const handleSend = () => {
    const trimmed = input.trim();
    if (trimmed && !disabled) {
      onSend(trimmed);
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="relative p-6 pt-4 pb-8 flex items-center justify-center bg-gradient-to-t from-background to-transparent pointer-events-none">
      <div className="w-full max-w-4xl flex items-center gap-3 pointer-events-auto">
        <TextField
          fullWidth
          multiline
          maxRows={4}
          placeholder={disabled ? "AI is typing..." : "Type your message..."}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          variant="outlined"
        />
        <IconButton 
          color="primary" 
          onClick={handleSend} 
          disabled={!input.trim() || disabled}
          sx={{
            bgcolor: 'primary.main',
            color: 'white',
            width: 52,
            height: 52,
            boxShadow: '0 4px 14px 0 rgba(99, 102, 241, 0.39)',
            '&:hover': {
              bgcolor: 'primary.dark',
              transform: 'translateY(-2px)',
              boxShadow: '0 6px 20px rgba(99, 102, 241, 0.5)',
            },
            '&.Mui-disabled': {
              bgcolor: 'rgba(255,255,255,0.05)',
              color: 'rgba(255,255,255,0.3)',
              boxShadow: 'none',
            }
          }}
        >
          {disabled ? <CircularProgress size={24} color="inherit" /> : <SendIcon />}
        </IconButton>
      </div>
    </div>
  );
}

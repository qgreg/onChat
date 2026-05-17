import { useState, useEffect, useCallback, useRef } from 'react';

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export function useChromeAI() {
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<any>(null);

  const initAI = useCallback(async () => {
    try {
      const w = window as any;
      const nav = navigator as any;
      let lm = null;

      // In Chrome 138+, the Prompt API moved to navigator.ai
      if (nav.ai && nav.ai.languageModel) {
        lm = nav.ai.languageModel;
      } else if (w.ai && w.ai.languageModel) {
        lm = w.ai.languageModel;
      } else if (w.ai && w.ai.assistant) {
        lm = w.ai.assistant;
      } else if (w.ai && typeof w.ai.create === 'function') {
        lm = w.ai;
      } else if (w.languageModel) {
        lm = w.languageModel;
      } else if (w.LanguageModel) {
        lm = w.LanguageModel;
      }

      let debugString = '';
      try {
        const wKeys = Object.getOwnPropertyNames(w).filter(k => /ai|model|prompt|gemini/i.test(k));
        const nKeys = Object.getOwnPropertyNames(nav).filter(k => /ai|model|prompt|gemini/i.test(k));
        const wProtoKeys = [];
        for (let k in w) {
          if (/ai|model|prompt|gemini/i.test(k)) wProtoKeys.push(k);
        }
        debugString = `Window keys: ${wKeys.join(', ')} | Navigator keys: ${nKeys.join(', ')} | Window in-keys: ${wProtoKeys.join(', ')}`;
      } catch(e) {}

      if (!lm) {
        setIsAvailable(false);
        setError(`The navigator.ai or window.ai object is completely missing. Debug info: ${debugString}`);
        return;
      }

      if (typeof lm.capabilities === 'function') {
        const capabilities = await lm.capabilities();
        if (capabilities.available === 'no') {
          setIsAvailable(false);
          setError('AI model API found, but reports capabilities as "no". Check chrome://components to ensure Optimization Guide On Device Model is fully downloaded, or try restarting Chrome again.');
          return;
        }

        if (capabilities.available === 'after-download') {
          setIsAvailable(false);
          setError('AI model is currently downloading in the background. Please wait a few minutes and refresh.');
          return;
        }
      }

      // Initialize a session
      let newSession;
      
      const config = {
        systemPrompt: 'You are a helpful, friendly AI assistant running locally in the browser.',
        expectedLanguage: 'en',
        language: 'en',
      };

      if (typeof lm.create === 'function') {
        newSession = await lm.create(config);
      } else {
        // Fallback if create is not static
        newSession = await new (lm as any)(config);
      }
      
      setSession(newSession);
      setIsAvailable(true);
      setError(null);
    } catch (err: any) {
      console.error('Failed to initialize Chrome AI:', err);
      setIsAvailable(false);
      setError(err.message || 'Failed to initialize AI. See console for details.');
    }
  }, []);

  const sessionRef = useRef<any>(null);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    initAI();

    return () => {
      if (sessionRef.current && typeof sessionRef.current.destroy === 'function') {
        sessionRef.current.destroy();
      }
    };
  }, [initAI]);

  const sendMessage = useCallback(async (text: string): Promise<string | null> => {
    if (!session) {
      setError('Session not initialized.');
      return null;
    }

    setIsGenerating(true);
    setError(null);
    try {
      // Use the Prompt API
      const result = await session.prompt(text);
      setIsGenerating(false);
      return result;
    } catch (err: any) {
      console.error('Error generating prompt:', err);
      setError(err.message || 'Error generating response.');
      setIsGenerating(false);
      return null;
    }
  }, [session]);

  return {
    isAvailable,
    isGenerating,
    error,
    sendMessage,
    initAI,
  };
}

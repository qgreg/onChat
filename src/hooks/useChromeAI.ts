import { useState, useEffect, useCallback, useRef } from 'react';

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

type LegacyAvailability = 'no' | 'after-download' | 'readily' | 'available' | string;
type ChromeAvailability = 'unavailable' | 'downloadable' | 'downloading' | 'available' | string;

interface LegacyCapabilities {
  available: LegacyAvailability;
}

interface ChromeAISession {
  prompt(input: string): Promise<string>;
  promptStreaming?: (input: string) => AsyncIterable<string>;
  destroy?: () => void;
}

interface ChromeLanguageModelConfig {
  systemPrompt: string;
  expectedLanguage: string;
  language: string;
  expectedOutputs: Array<{ type: 'text'; languages: string[] }>;
}

interface ChromeLanguageModelFactory {
  create?: (config: ChromeLanguageModelConfig) => Promise<ChromeAISession>;
  availability?: (config?: ChromeLanguageModelConfig) => Promise<ChromeAvailability>;
  capabilities?: () => Promise<LegacyCapabilities>;
}

interface ChromeAIContainer {
  languageModel?: unknown;
  assistant?: unknown;
  create?: (config: ChromeLanguageModelConfig) => Promise<ChromeAISession>;
}

type ConstructableLanguageModel = new (config: ChromeLanguageModelConfig) => ChromeAISession;

function getObjectProperty<T>(source: unknown, property: string): T | undefined {
  if (typeof source !== 'object' && typeof source !== 'function' || source === null) {
    return undefined;
  }

  return (source as Record<string, unknown>)[property] as T | undefined;
}

function isLanguageModelFactory(value: unknown): value is ChromeLanguageModelFactory {
  if ((typeof value !== 'object' && typeof value !== 'function') || value === null) {
    return false;
  }

  const create = getObjectProperty(value, 'create');
  const availability = getObjectProperty(value, 'availability');
  const capabilities = getObjectProperty(value, 'capabilities');

  return (
    (create === undefined || typeof create === 'function') &&
    (availability === undefined || typeof availability === 'function') &&
    (capabilities === undefined || typeof capabilities === 'function')
  );
}

function isConstructableLanguageModel(value: unknown): value is ConstructableLanguageModel {
  return typeof value === 'function';
}

function hasCapabilities(value: unknown): value is Required<Pick<ChromeLanguageModelFactory, 'capabilities'>> {
  return typeof getObjectProperty(value, 'capabilities') === 'function';
}

function hasCreate(value: unknown): value is Required<Pick<ChromeLanguageModelFactory, 'create'>> {
  return typeof getObjectProperty(value, 'create') === 'function';
}

function hasAvailability(value: unknown): value is Required<Pick<ChromeLanguageModelFactory, 'availability'>> {
  return typeof getObjectProperty(value, 'availability') === 'function';
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export function useChromeAI() {
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<ChromeAISession | null>(null);

  const initAI = useCallback(async (allowDownload = true) => {
    try {
      const w = window;
      const nav = navigator;
      const windowAI = getObjectProperty<ChromeAIContainer>(w, 'ai');
      const navigatorAI = getObjectProperty<ChromeAIContainer>(nav, 'ai');
      let lm: ChromeLanguageModelFactory | ConstructableLanguageModel | null = null;

      // In Chrome 138+, the Prompt API moved to navigator.ai
      const candidates = [
        navigatorAI?.languageModel,
        windowAI?.languageModel,
        windowAI?.assistant,
        windowAI,
        getObjectProperty(w, 'languageModel'),
        getObjectProperty(w, 'LanguageModel'),
      ];

      for (const candidate of candidates) {
        if (isLanguageModelFactory(candidate) || isConstructableLanguageModel(candidate)) {
          lm = candidate;
          break;
        }
      }

      let debugString = '';
      try {
        const wKeys = Object.getOwnPropertyNames(w).filter(k => /ai|model|prompt|gemini/i.test(k));
        const nKeys = Object.getOwnPropertyNames(nav).filter(k => /ai|model|prompt|gemini/i.test(k));
        const wProtoKeys = [];
        for (const k in w) {
          if (/ai|model|prompt|gemini/i.test(k)) wProtoKeys.push(k);
        }
        debugString = `Window keys: ${wKeys.join(', ')} | Navigator keys: ${nKeys.join(', ')} | Window in-keys: ${wProtoKeys.join(', ')}`;
      } catch {
        debugString = 'Unable to inspect AI globals.';
      }

      if (!lm) {
        setIsAvailable(false);
        setError(`The navigator.ai or window.ai object is completely missing. Debug info: ${debugString}`);
        return;
      }

      const config: ChromeLanguageModelConfig = {
        systemPrompt: 'You are a helpful, friendly AI assistant running locally in the browser.',
        expectedLanguage: 'en',
        language: 'en',
        expectedOutputs: [{ type: 'text', languages: ['en'] }]
      };

      if (hasAvailability(lm)) {
        const availability = await lm.availability(config);

        if (availability === 'unavailable') {
          setIsAvailable(false);
          setError('AI model API found, but no compatible local model is available. Check chrome://components to ensure Optimization Guide On Device Model is installed, or restart Chrome.');
          return;
        }

        if (!allowDownload && (availability === 'downloadable' || availability === 'downloading')) {
          setIsAvailable(false);
          setError('AI model is available but needs a click to download or finish setup. Select Initialize AI Session to continue.');
          return;
        }
      } else if (hasCapabilities(lm)) {
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
      let newSession: ChromeAISession;

      if (hasCreate(lm)) {
        newSession = await lm.create(config);
      } else if (isConstructableLanguageModel(lm)) {
        // Fallback if create is not static
        newSession = new lm(config);
      } else {
        setIsAvailable(false);
        setError('AI model API found, but it does not expose a supported create method.');
        return;
      }
      
      setSession(newSession);
      setIsAvailable(true);
      setError(null);
    } catch (err: unknown) {
      console.error('Failed to initialize Chrome AI:', err);
      setIsAvailable(false);
      setError(getErrorMessage(err, 'Failed to initialize AI. See console for details.'));
    }
  }, []);

  const sessionRef = useRef<ChromeAISession | null>(null);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    void Promise.resolve().then(() => initAI(false));

    return () => {
      if (sessionRef.current && typeof sessionRef.current.destroy === 'function') {
        sessionRef.current.destroy();
      }
    };
  }, [initAI]);

  const sendMessage = useCallback(async (text: string, onUpdate?: (partialResponse: string) => void): Promise<string | null> => {
    if (!session) {
      setError('Session not initialized.');
      return null;
    }

    setIsGenerating(true);
    setError(null);
    try {
      if (typeof session.promptStreaming === 'function' && onUpdate) {
        const stream = session.promptStreaming(text);
        let fullResponse = '';
        for await (const chunk of stream) {
          // Handle both chunked and cumulative (bug) behavior from the Prompt API
          if (fullResponse && chunk.startsWith(fullResponse)) {
            fullResponse = chunk;
          } else {
            fullResponse += chunk;
          }
          onUpdate(fullResponse);
        }
        setIsGenerating(false);
        return fullResponse;
      } else {
        const result = await session.prompt(text);
        setIsGenerating(false);
        return result;
      }
    } catch (err: unknown) {
      console.error('Error generating prompt:', err);
      setError(getErrorMessage(err, 'Error generating response.'));
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

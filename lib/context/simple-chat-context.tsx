
import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useToast } from 'react-native-toast-notifications';
import SSEClient from 'react-native-sse';

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'nova';
  timestamp: number;
}

export interface ChatContextType {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  clearHistory: () => void;
  isInitialized: boolean;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Storage key for persisting chat messages
const CHAT_STORAGE_KEY = 'nova_chat_messages';
const LLM_CONFIG_STORAGE_KEY = 'llmConfig';

export type LLMConfig = {
  apiUrl?: string;
  apiKey?: string;
  model?: string;
};

// Removed axios client - now using fetch + react-native-sse for streaming support

// Helper function to load messages from AsyncStorage
const loadMessagesFromStorage = async (): Promise<ChatMessage[]> => {
  try {
    const stored = await AsyncStorage.getItem(CHAT_STORAGE_KEY);
    if (stored) {
      const messages = JSON.parse(stored);
      console.log('Loaded', messages.length, 'messages from AsyncStorage');
      return messages;
    }
  } catch (error) {
    console.error('Error loading messages from AsyncStorage:', error);
  }
  return [];
};

// Helper function to save messages to AsyncStorage
const saveMessagesToStorage = async (messages: ChatMessage[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
  } catch (error) {
    console.error('Error saving messages to AsyncStorage:', error);
  }
};

// Truncate history to prevent token explosion
const truncateHistory = (messages: ChatMessage[], maxMessages: number): ChatMessage[] => {
  if (messages.length <= maxMessages) return messages;
  return messages.slice(-maxMessages);
};

export function SimpleChatProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const messagesRef = useRef<ChatMessage[]>([]);
  const toast = useToast();

  // Load messages on mount
  useEffect(() => {
    const init = async () => {
      const loaded = await loadMessagesFromStorage();
      setMessages(loaded);
      setIsInitialized(true);
    };
    init();
  }, []);

  // Save messages whenever they change
  useEffect(() => {
    if (isInitialized) {
      saveMessagesToStorage(messages);
    }
  }, [messages, isInitialized]);

  // Sync messages to ref for closure-free access in sendMessage
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const clearHistory = useCallback(() => {
    setMessages([]);
    setError(null);
    try {
      AsyncStorage.removeItem(CHAT_STORAGE_KEY);
      console.log('Cleared chat history');
    } catch (error) {
      console.error('Error clearing chat history:', error);
    }
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;

      // 1. Create user message and placeholder message
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        content,
        sender: 'user',
        timestamp: Date.now(),
      };

      const novaMessageId = (Date.now() + 1).toString();
      const placeholderMessage: ChatMessage = {
        id: novaMessageId,
        content: '',
        sender: 'nova',
        timestamp: Date.now(),
      };

      // 2. Add both messages to state at once
      setMessages((prev) => [...prev, userMessage, placeholderMessage]);
      setLoading(true);
      setError(null);

      try {
        console.log('Sending message to API...');

        // 3. Load LLM config from AsyncStorage
        let llmConfig: LLMConfig | undefined;
        try {
          const savedConfig = await AsyncStorage.getItem(LLM_CONFIG_STORAGE_KEY);
          if (savedConfig) {
            llmConfig = JSON.parse(savedConfig);
            console.log('Using custom LLM config:', { model: llmConfig?.model });
          }
        } catch (e) {
          console.log('No custom LLM config found, using default');
        }

        // 4. Get current messages for history (read from state)
        const currentMessages = messagesRef.current && messagesRef.current.length > 0 ? messagesRef.current : [];
        const truncatedMessages = truncateHistory(currentMessages, 20);
        const history = truncatedMessages
          .filter((msg) => msg.id !== novaMessageId) // Exclude placeholder
          .map((msg) => ({
            sender: msg.sender,
            text: msg.content || '',
          }));

        // 5. Construct API URL
        const getApiBaseUrl = () => {
          if (process.env.EXPO_PUBLIC_API_BASE_URL) {
            return process.env.EXPO_PUBLIC_API_BASE_URL;
          } else if (typeof window !== 'undefined') {
            const { protocol, hostname } = window.location;
            const apiHostname = hostname.replace(/^8081-/, '3000-');
            if (apiHostname !== hostname) {
              return `${protocol}//${apiHostname}`;
            }
          }
          return '';
        };

        const apiBaseUrl = getApiBaseUrl();
        const apiUrl = apiBaseUrl ? `${apiBaseUrl}/api/chat` : '/api/chat';

        // 6. Prepare request payload
        const payload = {
          message: content,
          history,
          stream: true,
          ...(llmConfig && { llmConfig }),
        };

        // 7. Handle streaming based on platform
        if (Platform.OS === 'web') {
          // Web: Use fetch + ReadableStream
          await handleWebStreaming(apiUrl, payload, novaMessageId);
        } else {
          // Native: Use SSEClient for better compatibility
          await handleNativeStreaming(apiUrl, payload, novaMessageId);
        }

        setLoading(false);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        toast.show(errorMessage, {
          type: 'danger',
          placement: 'bottom',
          duration: 3000,
        });
        console.error('Send message error:', err);
        setLoading(false);
      }
    },
    [toast]
  );

  // Handle streaming for web platform (fetch + ReadableStream)
  const handleWebStreaming = async (
    apiUrl: string,
    payload: Record<string, unknown>,
    novaMessageId: string
  ): Promise<void> => {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let fullContent = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.error) {
                throw new Error(data.error);
              }

              if (data.chunk) {
                fullContent += data.chunk;
                // Update message with streaming content
                setMessages((prevState) =>
                  prevState.map((msg) =>
                    msg.id === novaMessageId ? { ...msg, content: fullContent } : msg
                  )
                );
              }

              if (data.done) {
                console.log('Stream complete');
                return;
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }
    } catch (err) {
      throw err;
    }
  };

  // Handle streaming for native platform (SSEClient)
  const handleNativeStreaming = async (
    apiUrl: string,
    payload: Record<string, unknown>,
    novaMessageId: string
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      const es = new SSEClient(apiUrl, {
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify(payload),
      });

      let fullContent = '';

      es.addEventListener('message', (event) => {
        try {
          if (!event.data) return;
          const data = JSON.parse(event.data);

          if (data.error) {
            throw new Error(data.error);
          }

          if (data.chunk) {
            fullContent += data.chunk;
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === novaMessageId ? { ...msg, content: fullContent } : msg
              )
            );
          }

          if (data.done) {
            console.log('Stream complete');
            es.close();
            resolve();
          }
        } catch (e) {
          console.error('Error parsing SSE data:', e);
          reject(e);
        }
      });

      es.addEventListener('error', () => {
        const errorMessage = 'Stream error';
        setError(errorMessage);
        toast.show(errorMessage, {
          type: 'danger',
          placement: 'bottom',
          duration: 3000,
        });
        es.close();
        reject(new Error(errorMessage));
      });
    });
  };

  const value: ChatContextType = {
    messages,
    loading,
    error,
    sendMessage,
    clearHistory,
    isInitialized,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within SimpleChatProvider');
  }
  return context;
}

'use client';

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useToast } from 'react-native-toast-notifications';

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

// Removed axios client - now using fetch for streaming support

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

// Helper function to truncate conversation history to prevent token explosion
// Keep only the last N messages to balance context and token usage
const truncateHistory = (messages: ChatMessage[], maxMessages: number = 20): ChatMessage[] => {
  if (messages.length <= maxMessages) {
    return messages;
  }
  // Keep the most recent N messages
  return messages.slice(-maxMessages);
};

// Helper function to save messages to AsyncStorage
const saveMessagesToStorage = async (messages: ChatMessage[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
    console.log('Saved', messages.length, 'messages to AsyncStorage');
  } catch (error) {
    console.error('Error saving messages to AsyncStorage:', error);
  }
};

export function SimpleChatProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const toast = useToast();

  // Chat client no longer needed - using fetch for streaming

  // Load messages from storage on mount
  useEffect(() => {
    const initializeMessages = async () => {
      const storedMessages = await loadMessagesFromStorage();
      setMessages(storedMessages);
      setIsInitialized(true);
    };
    initializeMessages();
  }, []);

  // Save messages to storage whenever they change
  useEffect(() => {
    if (isInitialized) {
      saveMessagesToStorage(messages);
    }
  }, [messages, isInitialized]);

  const clearHistory = useCallback(async () => {
    setMessages([]);
    setError(null);
    try {
      await AsyncStorage.removeItem(CHAT_STORAGE_KEY);
      console.log('Cleared chat history');
    } catch (error) {
      console.error('Error clearing chat history:', error);
    }
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;

      // Add user message
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        content,
        sender: 'user',
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setLoading(true);
      setError(null);

      try {
        console.log('Sending message to API...');
        
        // Load LLM config from AsyncStorage
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
        
        // Use current messages state for history (with truncation to prevent token explosion)
        setMessages((prev) => {
          // Keep only the last 20 messages for API context
          const truncatedMessages = truncateHistory(prev, 20);
          const history = truncatedMessages.map((msg) => ({
            sender: msg.sender,
            text: msg.content,
          }));
          
          // Create placeholder message for streaming
          const novaMessageId = (Date.now() + 1).toString();
          const placeholderMessage: ChatMessage = {
            id: novaMessageId,
            content: '',
            sender: 'nova',
            timestamp: Date.now(),
          };
          const messagesWithPlaceholder = [...prev, placeholderMessage];
          setMessages(messagesWithPlaceholder);
          
          // Send API request with streaming enabled
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
          
          fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: content,
              history,
              stream: true,
              ...(llmConfig && { llmConfig }),
            }),
          })
            .then((response) => {
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
              
              const processStream = async () => {
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
                                msg.id === novaMessageId
                                  ? { ...msg, content: fullContent }
                                  : msg
                              )
                            );
                          }
                          
                          if (data.done) {
                            console.log('Stream complete');
                            setLoading(false);
                            return;
                          }
                        } catch (e) {
                          console.error('Error parsing SSE data:', e);
                        }
                      }
                    }
                  }
                  
                  setLoading(false);
                } catch (err) {
                  const errorMessage = err instanceof Error ? err.message : 'Stream error';
                  setError(errorMessage);
                  toast.show(errorMessage, {
                    type: 'danger',
                    placement: 'bottom',
                    duration: 3000,
                  });
                  setLoading(false);
                }
              };
              
              processStream();
            })
            .catch((err) => {
              let errorMessage = 'Unknown error';
              
              if (err instanceof Error) {
                errorMessage = err.message;
              }
              
              setError(errorMessage);
              toast.show(errorMessage, {
                type: 'danger',
                placement: 'bottom',
                duration: 3000,
              });
              console.error('Send message error:', err);
              setLoading(false);
            });
          
          return messagesWithPlaceholder;
        });
      } catch (err) {
        setLoading(false);
        console.error('Send message setup error:', err);
      }
    },
    []
  );

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

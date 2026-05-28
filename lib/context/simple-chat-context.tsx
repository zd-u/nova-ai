'use client';

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import axios from 'axios';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

// Create axios instance with proper configuration
const createChatClient = () => {
  let baseURL = '';
  
  // Try to get API base URL from environment (highest priority)
  if (process.env.EXPO_PUBLIC_API_BASE_URL) {
    baseURL = process.env.EXPO_PUBLIC_API_BASE_URL;
    console.log('Using API URL from EXPO_PUBLIC_API_BASE_URL:', baseURL);
  } else if (typeof window !== 'undefined') {
    // In web environment, construct the API base URL
    const { protocol, hostname } = window.location;
    // Replace 8081 (Metro) with 3000 (API server)
    const apiHostname = hostname.replace(/^8081-/, '3000-');
    if (apiHostname !== hostname) {
      // We detected a port replacement, use absolute URL
      baseURL = `${protocol}//${apiHostname}`;
      console.log('Using API URL from web hostname replacement:', baseURL);
    }
    // Otherwise, use relative URL (will be proxied by Metro)
  } else {
    // In native environment, try to get from Constants or use default
    try {
      const expoConfig = Constants.expoConfig;
      if (expoConfig?.extra?.apiBaseUrl) {
        baseURL = expoConfig.extra.apiBaseUrl;
        console.log('Using API URL from expoConfig:', baseURL);
      } else {
        // Default to localhost for development
        baseURL = 'http://localhost:3000';
        console.log('Using default localhost API URL');
      }
    } catch (e) {
      // Fallback to localhost
      baseURL = 'http://localhost:3000';
      console.log('Using fallback localhost API URL');
    }
  }

  return axios.create({
    baseURL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: true,
  });
};

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

  // Create chatClient inside Provider to ensure environment is ready
  const chatClient = useMemo(() => createChatClient(), []);

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
        // Use current messages state for history
        setMessages((prev) => {
          const history = prev.map((msg) => ({
            sender: msg.sender,
            text: msg.content,
          }));
          
          // Send API request
          chatClient.post('/api/chat', {
            message: content,
            history,
          })
            .then((response) => {
              console.log('API response:', response.data);
              const data = response.data;

              if (data.success && data.reply) {
                const novaMessage: ChatMessage = {
                  id: (Date.now() + 1).toString(),
                  content: data.reply,
                  sender: 'nova',
                  timestamp: Date.now(),
                };
                setMessages((prevState) => [...prevState, novaMessage]);
              } else {
                setError(data.error || 'Failed to generate reply');
              }
              setLoading(false);
            })
            .catch((err) => {
              let errorMessage = 'Unknown error';
              
              if (axios.isAxiosError(err)) {
                if (err.response) {
                  // Server responded with error status
                  errorMessage = `Server error: ${err.response.status}`;
                  if (err.response.data?.error) {
                    errorMessage = err.response.data.error;
                  }
                } else if (err.request) {
                  // Request was made but no response
                  errorMessage = 'No response from server';
                } else {
                  // Error in request setup
                  errorMessage = err.message;
                }
              } else if (err instanceof Error) {
                errorMessage = err.message;
              }
              
              setError(errorMessage);
              console.error('Send message error:', err);
              setLoading(false);
            });
          
          return prev;
        });
      } catch (err) {
        setLoading(false);
        console.error('Send message setup error:', err);
      }
    },
    [chatClient]
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

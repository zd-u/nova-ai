'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import axios from 'axios';

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
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Create axios instance with proper configuration
const createChatClient = () => {
  // Detect if we're in a web environment and need to proxy to the API server
  let baseURL = '';
  
  if (typeof window !== 'undefined') {
    // In web environment, construct the API base URL
    const { protocol, hostname } = window.location;
    // Replace 8081 (Metro) with 3000 (API server)
    const apiHostname = hostname.replace(/^8081-/, '3000-');
    if (apiHostname !== hostname) {
      // We detected a port replacement, use absolute URL
      baseURL = `${protocol}//${apiHostname}`;
    }
    // Otherwise, use relative URL (will be proxied by Metro)
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

const chatClient = createChatClient();

export function SimpleChatProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        // Convert messages to history format for API
        const history = messages.map((msg) => ({
          sender: msg.sender,
          text: msg.content,
        }));
        
        const response = await chatClient.post('/api/chat', {
          message: content,
          history,
        });

        console.log('API response:', response.data);
        const data = response.data;

        if (data.success && data.reply) {
          const novaMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            content: data.reply,
            sender: 'nova',
            timestamp: Date.now(),
          };
          setMessages((prev) => [...prev, novaMessage]);
        } else {
          setError(data.error || 'Failed to generate reply');
        }
      } catch (err) {
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
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const value: ChatContextType = {
    messages,
    loading,
    error,
    sendMessage,
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

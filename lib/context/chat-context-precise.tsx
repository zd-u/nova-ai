import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { analyzeSentence } from '@/lib/ai/sentence-analyzer';
import { generateReplyByIntent } from '@/lib/ai/precise-reply-generator';

export interface Message {
  id: string;
  sender: 'user' | 'nova';
  content: string;
  timestamp: number;
}

export interface ChatState {
  messages: Message[];
  loading: boolean;
  error: string | null;
  personality: {
    warmth: number;
    liveliness: number;
    intelligence: number;
  };
  emotion: {
    happiness: number;
    sadness: number;
    affection: number;
  };
}

interface ChatContextType {
  state: ChatState;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const initialState: ChatState = {
  messages: [],
  loading: false,
  error: null,
  personality: {
    warmth: 0.8,
    liveliness: 0.7,
    intelligence: 0.75,
  },
  emotion: {
    happiness: 0.6,
    sadness: 0.2,
    affection: 0.7,
  },
};

type Action =
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_MESSAGES' }
  | { type: 'LOAD_MESSAGES'; payload: Message[] }
  | { type: 'UPDATE_EMOTION'; payload: Partial<ChatState['emotion']> };

function chatReducer(state: ChatState, action: Action): ChatState {
  switch (action.type) {
    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.payload],
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      };
    case 'CLEAR_MESSAGES':
      return {
        ...state,
        messages: [],
      };
    case 'LOAD_MESSAGES':
      return {
        ...state,
        messages: action.payload,
      };
    case 'UPDATE_EMOTION':
      return {
        ...state,
        emotion: {
          ...state.emotion,
          ...action.payload,
        },
      };
    default:
      return state;
  }
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(chatReducer, initialState);

  // 加载消息历史
  useEffect(() => {
    loadMessages();
  }, []);

  // 保存消息到本地存储
  useEffect(() => {
    if (state.messages.length > 0) {
      AsyncStorage.setItem('chat_messages', JSON.stringify(state.messages)).catch(
        (err) => console.error('Failed to save messages:', err)
      );
    }
  }, [state.messages]);

  const loadMessages = async () => {
    try {
      const saved = await AsyncStorage.getItem('chat_messages');
      if (saved) {
        const messages = JSON.parse(saved);
        dispatch({ type: 'LOAD_MESSAGES', payload: messages });
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      // 添加用户消息
      const userMessage: Message = {
        id: Date.now().toString(),
        sender: 'user',
        content: content.trim(),
        timestamp: Date.now(),
      };
      dispatch({ type: 'ADD_MESSAGE', payload: userMessage });

      // 分析用户消息
      const analysis = analyzeSentence(content.trim());

      // 根据分析结果生成 Nova 的回复
      const novaReply = generateReplyByIntent(
        analysis,
        state.personality,
        state.emotion
      );

      // 根据用户情感更新 Nova 的情感状态
      const newEmotion = { ...state.emotion };
      if (analysis.sentiment === 'positive') {
        newEmotion.happiness = Math.min(1, newEmotion.happiness + 0.1);
        newEmotion.affection = Math.min(1, newEmotion.affection + 0.05);
      } else if (analysis.sentiment === 'negative') {
        newEmotion.sadness = Math.min(1, newEmotion.sadness + 0.1);
      }
      dispatch({ type: 'UPDATE_EMOTION', payload: newEmotion });

      // 添加 Nova 的回复
      const novaMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'nova',
        content: novaReply,
        timestamp: Date.now() + 1,
      };
      dispatch({ type: 'ADD_MESSAGE', payload: novaMessage });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      console.error('Error sending message:', err);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const clearMessages = () => {
    dispatch({ type: 'CLEAR_MESSAGES' });
    AsyncStorage.removeItem('chat_messages').catch((err) =>
      console.error('Failed to clear messages:', err)
    );
  };

  const value: ChatContextType = {
    state,
    sendMessage,
    clearMessages,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within ChatProvider');
  }
  return context;
}

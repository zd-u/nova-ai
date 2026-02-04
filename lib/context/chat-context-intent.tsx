import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateIntentBasedReply } from '@/lib/ai/intent-based-reply-engine';
import { INITIAL_PERSONALITY } from '@/lib/types/personality';
import { INITIAL_EMOTIONAL_STATE, updateEmotionalState } from '@/lib/emotion/engine';
import type { PersonalityTraits } from '@/lib/types/personality';
import type { EmotionalState } from '@/lib/emotion/engine';

/**
 * 聊天消息类型
 */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  emotion?: string;
}

/**
 * 聊天状态
 */
export interface ChatState {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  personality: PersonalityTraits;
  emotionalState: EmotionalState;
  characterName: string;
}

/**
 * 聊天动作类型
 */
type ChatAction =
  | { type: 'ADD_MESSAGE'; payload: ChatMessage }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'UPDATE_EMOTIONAL_STATE'; payload: Partial<EmotionalState> }
  | { type: 'LOAD_MESSAGES'; payload: ChatMessage[] }
  | { type: 'CLEAR_MESSAGES' };

/**
 * 聊天上下文
 */
const ChatContext = createContext<{
  state: ChatState;
  sendMessage: (message: string) => Promise<void>;
  clearMessages: () => Promise<void>;
} | null>(null);

/**
 * 初始状态
 */
const initialState: ChatState = {
  messages: [],
  loading: false,
  error: null,
  personality: INITIAL_PERSONALITY,
  emotionalState: INITIAL_EMOTIONAL_STATE,
  characterName: 'Nova',
};

/**
 * 聊天 Reducer
 */
function chatReducer(state: ChatState, action: ChatAction): ChatState {
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
    case 'UPDATE_EMOTIONAL_STATE':
      return {
        ...state,
        emotionalState: {
          ...state.emotionalState,
          ...action.payload,
          lastUpdated: Date.now(),
        },
      };
    case 'LOAD_MESSAGES':
      return {
        ...state,
        messages: action.payload,
      };
    case 'CLEAR_MESSAGES':
      return {
        ...state,
        messages: [],
      };
    default:
      return state;
  }
}

/**
 * 聊天提供者组件
 */
export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(chatReducer, initialState);

  // 从 AsyncStorage 加载消息
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const saved = await AsyncStorage.getItem('chat_messages');
        if (saved) {
          const messages = JSON.parse(saved);
          dispatch({ type: 'LOAD_MESSAGES', payload: messages });
        }
      } catch (error) {
        console.error('Failed to load messages:', error);
      }
    };

    loadMessages();
  }, []);

  // 保存消息到 AsyncStorage
  useEffect(() => {
    const saveMessages = async () => {
      try {
        await AsyncStorage.setItem('chat_messages', JSON.stringify(state.messages));
      } catch (error) {
        console.error('Failed to save messages:', error);
      }
    };

    if (state.messages.length > 0) {
      saveMessages();
    }
  }, [state.messages]);

  /**
   * 发送消息
   */
  const sendMessage = useCallback(
    async (message: string) => {
      if (!message.trim()) {
        dispatch({ type: 'SET_ERROR', payload: '消息不能为空' });
        return;
      }

      try {
        dispatch({ type: 'SET_ERROR', payload: null });
        dispatch({ type: 'SET_LOADING', payload: true });

        // 添加用户消息
        const userMessage: ChatMessage = {
          id: `user_${Date.now()}`,
          role: 'user',
          content: message,
          timestamp: Date.now(),
        };
        dispatch({ type: 'ADD_MESSAGE', payload: userMessage });

        // 生成 AI 回复
        const aiReply = generateIntentBasedReply(
          message,
          state.messages,
          state.personality,
          state.emotionalState,
          state.characterName
        );

        // 添加 AI 消息
        const assistantMessage: ChatMessage = {
          id: `assistant_${Date.now()}`,
          role: 'assistant',
          content: aiReply,
          timestamp: Date.now() + 100,
        };
        dispatch({ type: 'ADD_MESSAGE', payload: assistantMessage });

        // 简单的情感更新逻辑
        // 可以根据消息内容调整情感状态

        dispatch({ type: 'SET_LOADING', payload: false });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '发送消息失败';
        dispatch({ type: 'SET_ERROR', payload: errorMessage });
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },
    [state.messages, state.personality, state.emotionalState, state.characterName]
  );

  /**
   * 清空消息
   */
  const clearMessages = useCallback(async () => {
    try {
      dispatch({ type: 'CLEAR_MESSAGES' });
      await AsyncStorage.removeItem('chat_messages');
    } catch (error) {
      console.error('Failed to clear messages:', error);
    }
  }, []);

  return (
    <ChatContext.Provider value={{ state, sendMessage, clearMessages }}>
      {children}
    </ChatContext.Provider>
  );
}

/**
 * 使用聊天上下文的 Hook
 */
export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within ChatProvider');
  }
  return context;
}

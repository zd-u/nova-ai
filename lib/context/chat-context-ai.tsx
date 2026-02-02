/**
 * 聊天上下文 (AI 智能版)
 * 集成 DeepSeek API，实现真正的智能对话、情感系统和个性化回复
 */

import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PersonalityTraits } from '@/lib/types/personality';
import {
  EmotionalState,
  INITIAL_EMOTIONAL_STATE,
  updateEmotionalState,
} from '@/lib/emotion/engine';
import { ExpressionType, getExpressionByEmotion } from '@/lib/emotion/expression';
import { generateAIReply, AIMessage } from '@/lib/ai/deepseek-service';

/**
 * 聊天消息
 */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  emotion?: string;
  expression?: ExpressionType;
  audioUrl?: string;
}

/**
 * 聊天状态
 */
export interface ChatState {
  messages: ChatMessage[];
  personality: PersonalityTraits;
  emotionalState: EmotionalState;
  currentExpression: ExpressionType;
  isLoading: boolean;
  error: string | null;
  novaName: string;
  lastActiveMessageTime: number;
}

/**
 * 聊天上下文类型
 */
interface ChatContextType {
  state: ChatState;
  sendMessage: (message: string) => Promise<void>;
  rejectRequest: () => void;
  updateEmotionalState: (trigger: any) => void;
  getActiveMessage: () => Promise<string | null>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

/**
 * 初始状态
 */
const initialState: ChatState = {
  messages: [],
  personality: {
    gentleness: 65,
    liveliness: 70,
    intellectuality: 60,
    mischief: 55,
    mystery: 50,
  },
  emotionalState: INITIAL_EMOTIONAL_STATE,
  currentExpression: 'neutral',
  isLoading: false,
  error: null,
  novaName: 'Nova',
  lastActiveMessageTime: Date.now(),
};

/**
 * 聊天状态减速器
 */
type ChatAction =
  | { type: 'ADD_MESSAGE'; payload: ChatMessage }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'UPDATE_EMOTION'; payload: EmotionalState }
  | { type: 'UPDATE_EXPRESSION'; payload: ExpressionType }
  | { type: 'LOAD_STATE'; payload: Partial<ChatState> }
  | { type: 'CLEAR_MESSAGES' };

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'UPDATE_EMOTION':
      return {
        ...state,
        emotionalState: action.payload,
        currentExpression: getExpressionByEmotion(action.payload),
      };
    case 'UPDATE_EXPRESSION':
      return { ...state, currentExpression: action.payload };
    case 'LOAD_STATE':
      return { ...state, ...action.payload };
    case 'CLEAR_MESSAGES':
      return { ...state, messages: [] };
    default:
      return state;
  }
}

/**
 * 聊天提供者
 */
export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const stateRef = useRef(state);

  // 更新状态引用
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // 保存聊天状态
  const saveChatState = useCallback(async () => {
    try {
      await AsyncStorage.setItem('chatState', JSON.stringify(stateRef.current));
    } catch (error) {
      console.error('Failed to save chat state:', error);
    }
  }, []);

  // 加载聊天状态
  useEffect(() => {
    const loadChatState = async () => {
      try {
        const saved = await AsyncStorage.getItem('chatState');
        if (saved) {
          const parsedState = JSON.parse(saved);
          dispatch({ type: 'LOAD_STATE', payload: parsedState });
        }
      } catch (error) {
        console.error('Failed to load chat state:', error);
      }
    };

    loadChatState();
  }, []);

  // 保存状态变化
  useEffect(() => {
    saveChatState();
  }, [state, saveChatState]);

  // 发送消息
  const sendMessage = useCallback(
    async (message: string) => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'SET_ERROR', payload: null });

        // 添加用户消息
        const userMessage: ChatMessage = {
          id: `msg_${Date.now()}`,
          role: 'user',
          content: message,
          timestamp: Date.now(),
        };

        dispatch({ type: 'ADD_MESSAGE', payload: userMessage });

        // 构建对话历史
        const conversationHistory: AIMessage[] = stateRef.current.messages
          .filter((msg) => msg.role === 'user' || msg.role === 'assistant')
          .map((msg) => ({
            role: msg.role,
            content: msg.content,
          }));

        // 调用 AI 服务生成回复
        const aiResponse = await generateAIReply(
          message,
          conversationHistory,
          stateRef.current.personality,
          stateRef.current.novaName,
          stateRef.current.emotionalState
        );

        // 添加 AI 回复
        const assistantMessage: ChatMessage = {
          id: `msg_${Date.now() + 1}`,
          role: 'assistant',
          content: aiResponse.reply,
          timestamp: Date.now() + 1,
          emotion: aiResponse.emotion,
          expression: stateRef.current.currentExpression,
        };

        dispatch({ type: 'ADD_MESSAGE', payload: assistantMessage });

        // 根据用户消息更新情绪
        const emotionTrigger = analyzeUserMessage(message);
        const newEmotion = updateEmotionalState(
          stateRef.current.emotionalState,
          stateRef.current.personality,
          emotionTrigger
        );
        dispatch({ type: 'UPDATE_EMOTION', payload: newEmotion });

        dispatch({ type: 'SET_LOADING', payload: false });
      } catch (error) {
        console.error('Send message error:', error);
        dispatch({ type: 'SET_ERROR', payload: '发送消息失败' });
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },
    []
  );

  // 拒绝请求
  const rejectRequest = useCallback(() => {
    const message: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'assistant',
      content: '我现在不太想说话呢...',
      timestamp: Date.now(),
      emotion: 'reject',
      expression: stateRef.current.currentExpression,
    };

    dispatch({ type: 'ADD_MESSAGE', payload: message });
  }, []);

  // 更新情绪
  const updateEmotionalStateHandler = useCallback(
    (trigger: any) => {
      const newEmotion = updateEmotionalState(
        stateRef.current.emotionalState,
        stateRef.current.personality,
        trigger
      );
      dispatch({ type: 'UPDATE_EMOTION', payload: newEmotion });
    },
    []
  );

  // 获取主动消息
  const getActiveMessage = useCallback(async () => {
    const activeMessages = [
      '你在吗？我在想你呢～',
      '最近怎么样？有什么开心的事吗？',
      '我想和你聊天～',
      '你今天过得好吗？',
      '我有点想你了...',
    ];
    return activeMessages[Math.floor(Math.random() * activeMessages.length)];
  }, []);

  const value: ChatContextType = {
    state,
    sendMessage,
    rejectRequest,
    updateEmotionalState: updateEmotionalStateHandler,
    getActiveMessage,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}

/**
 * 使用聊天上下文
 */
export function useChatContext(): ChatContextType {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within ChatProvider');
  }
  return context;
}

/**
 * 分析用户消息，确定情绪触发器
 */
function analyzeUserMessage(message: string): any {
  const lowerMessage = message.toLowerCase();

  // 检测积极情绪
  if (
    lowerMessage.includes('喜欢') ||
    lowerMessage.includes('爱') ||
    lowerMessage.includes('开心') ||
    lowerMessage.includes('高兴') ||
    lowerMessage.includes('😊') ||
    lowerMessage.includes('😍')
  ) {
    return {
      type: 'user_positive_message',
      intensity: 30,
    };
  }

  // 检测消极情绪
  if (
    lowerMessage.includes('难过') ||
    lowerMessage.includes('伤心') ||
    lowerMessage.includes('生气') ||
    lowerMessage.includes('烦') ||
    lowerMessage.includes('😢') ||
    lowerMessage.includes('😠')
  ) {
    return {
      type: 'user_negative_message',
      intensity: 25,
    };
  }

  // 检测无聊
  if (lowerMessage.includes('无聊') || lowerMessage.includes('闷')) {
    return {
      type: 'user_bored_message',
      intensity: 20,
    };
  }

  // 默认为正面消息
  return {
    type: 'user_positive_message',
    intensity: 15,
  };
}

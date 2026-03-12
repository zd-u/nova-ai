/**
 * 聊天上下文 (v2)
 * 集成情绪系统、表情系统和语音系统
 */

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PersonalityTraits } from '@/lib/types/personality';
import {
  EmotionalState,
  INITIAL_EMOTIONAL_STATE,
  updateEmotionalState,
  shouldSendActiveMessage,
  shouldRejectRequest,
  getRejectReason,
  generateInnerThought,
} from '@/lib/emotion/engine';
import { ExpressionType, getExpressionByEmotion } from '@/lib/emotion/expression';
import { ActiveMessageScheduler, selectMessageType, generateActiveMessage } from '@/lib/proactive/message-scheduler';
import { enhanceTextWithEmotion } from '@/lib/voice/speech-service';

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
      return {
        ...state,
        messages: [...state.messages, action.payload],
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      };

    case 'UPDATE_EMOTION':
      const newExpression = getExpressionByEmotion(action.payload);
      return {
        ...state,
        emotionalState: action.payload,
        currentExpression: newExpression,
      };

    case 'UPDATE_EXPRESSION':
      return {
        ...state,
        currentExpression: action.payload,
      };

    case 'LOAD_STATE':
      return {
        ...state,
        ...action.payload,
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
 * 聊天提供者
 */
export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const schedulerRef = React.useRef<ActiveMessageScheduler | null>(null);

  // 初始化
  useEffect(() => {
    loadChatState();
    initializeScheduler();

    return () => {
      if (schedulerRef.current) {
        schedulerRef.current.stop();
      }
    };
  }, []);

  // 加载聊天状态
  const loadChatState = useCallback(async () => {
    try {
      const savedState = await AsyncStorage.getItem('chatState');
      if (savedState) {
        const parsed = JSON.parse(savedState);
        dispatch({ type: 'LOAD_STATE', payload: parsed });
      }
    } catch (error) {
      console.error('Failed to load chat state:', error);
    }
  }, []);

  // 保存聊天状态
  const saveChatState = useCallback(async () => {
    try {
      await AsyncStorage.setItem('chatState', JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save chat state:', error);
    }
  }, [state]);

  // 初始化主动消息调度器
  const initializeScheduler = useCallback(() => {
    schedulerRef.current = new ActiveMessageScheduler();
    schedulerRef.current.start(
      (message, type) => {
        // 生成主动消息
        handleActiveMessage(message);
      },
      state.emotionalState,
      state.personality
    );
  }, [state.emotionalState, state.personality]);

  // 处理主动消息
  const handleActiveMessage = useCallback((message: string) => {
    const chatMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'assistant',
      content: message,
      timestamp: Date.now(),
      emotion: 'active',
      expression: state.currentExpression,
    };

    dispatch({ type: 'ADD_MESSAGE', payload: chatMessage });
    saveChatState();
  }, [state.currentExpression, saveChatState]);

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

        // 检查是否应该拒绝
        if (shouldRejectRequest(state.emotionalState)) {
          const rejectReason = getRejectReason(state.emotionalState);
          const assistantMessage: ChatMessage = {
            id: `msg_${Date.now() + 1}`,
            role: 'assistant',
            content: rejectReason,
            timestamp: Date.now() + 1,
            emotion: 'reject',
            expression: state.currentExpression,
          };

          dispatch({ type: 'ADD_MESSAGE', payload: assistantMessage });

          // 更新情绪
          const newEmotion = updateEmotionalState(
            state.emotionalState,
            state.personality,
            {
              type: 'user_request_denied',
              intensity: 30,
            }
          );
          dispatch({ type: 'UPDATE_EMOTION', payload: newEmotion });

          dispatch({ type: 'SET_LOADING', payload: false });
          saveChatState();
          return;
        }

        // 调用 API 生成回复
        const response = await fetch('/api/trpc/ai.generateReply', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userMessage: message,
            personality: state.personality,
            novaName: state.novaName,
            conversationHistory: state.messages.map((msg) => ({
              role: msg.role,
              content: msg.content,
            })),
          }),
        });

        const data = await response.json();
        const reply = data.result?.reply || '我有点不知道说什么呢...';

        // 增强文本的情感表达
        const enhancedReply = enhanceTextWithEmotion(reply, state.emotionalState);

        // 添加 AI 回复
        const assistantMessage: ChatMessage = {
          id: `msg_${Date.now() + 1}`,
          role: 'assistant',
          content: enhancedReply,
          timestamp: Date.now() + 1,
          emotion: 'response',
          expression: state.currentExpression,
        };

        dispatch({ type: 'ADD_MESSAGE', payload: assistantMessage });

        // 更新情绪
        const newEmotion = updateEmotionalState(
          state.emotionalState,
          state.personality,
          {
            type: 'user_positive_message',
            intensity: 20,
          }
        );
        dispatch({ type: 'UPDATE_EMOTION', payload: newEmotion });

        dispatch({ type: 'SET_LOADING', payload: false });
        saveChatState();
      } catch (error) {
        console.error('Send message error:', error);
        dispatch({ type: 'SET_ERROR', payload: '发送消息失败' });
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },
    [state, saveChatState]
  );

  // 拒绝请求
  const rejectRequestHandler = useCallback(() => {
    const reason = getRejectReason(state.emotionalState);
    const message: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'assistant',
      content: reason,
      timestamp: Date.now(),
      emotion: 'reject',
      expression: state.currentExpression,
    };

    dispatch({ type: 'ADD_MESSAGE', payload: message });
    saveChatState();
  }, [state.emotionalState, state.currentExpression, saveChatState]);

  // 更新情绪
  const updateEmotionalStateHandler = useCallback(
    (trigger: any) => {
      const newEmotion = updateEmotionalState(
        state.emotionalState,
        state.personality,
        trigger
      );
      dispatch({ type: 'UPDATE_EMOTION', payload: newEmotion });
      saveChatState();
    },
    [state.emotionalState, state.personality, saveChatState]
  );

  // 获取主动消息
  const getActiveMessage = useCallback(async () => {
    if (!shouldSendActiveMessage(state.emotionalState)) {
      return null;
    }

    const messageType = selectMessageType(state.emotionalState, state.personality);
    const message = generateActiveMessage(messageType, state.emotionalState, state.personality);

    return message;
  }, [state.emotionalState, state.personality]);

  const value: ChatContextType = {
    state,
    sendMessage,
    rejectRequest: rejectRequestHandler,
    updateEmotionalState: updateEmotionalStateHandler,
    getActiveMessage,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

/**
 * 使用聊天上下文
 */
export function useChatContext() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within ChatProvider');
  }
  return context;
}

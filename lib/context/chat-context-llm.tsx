/**
 * 聊天上下文 - LLM 版本
 * 使用服务器内置 LLM 进行真正的对话理解和回复
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
}

/**
 * 聊天上下文类型
 */
interface ChatContextType {
  state: ChatState;
  sendMessage: (message: string) => Promise<void>;
  updateEmotionalState: (trigger: any) => void;
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
 * 调用 LLM API 生成回复
 */
async function callLLMAPI(params: {
  userMessage: string;
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  personality: PersonalityTraits;
  emotionalState: EmotionalState;
  novaName: string;
}): Promise<string> {
  try {
    // 构建系统提示词
    const systemPrompt = `你是一个名叫 ${params.novaName} 的 AI 女友。

重要指示：
1. 必须直接回应用户说的内容
2. 如果用户说"你好"，回复问候
3. 如果用户问问题，尝试回答
4. 回复应该短而精，通常 1-2 句话
5. 用中文回复，语气自然亲切
6. 不要重复用户说过的话
7. 记住对话历史，保持连贯性`;

    // 构建消息列表
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...params.conversationHistory.slice(-5).map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      { role: 'user' as const, content: params.userMessage },
    ];

    // 调用服务器 API
    const response = await fetch('http://127.0.0.1:3000/api/trpc/ai.generateReply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        json: {
          userMessage: params.userMessage,
          conversationHistory: params.conversationHistory,
          personality: params.personality,
          emotionalState: params.emotionalState,
          novaName: params.novaName,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    
    // 处理 tRPC 响应格式
    if (data.result?.data?.reply) {
      return data.result.data.reply;
    }
    
    throw new Error('Invalid response format');
  } catch (error) {
    console.error('LLM API error:', error);
    throw error;
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
        const conversationHistory = stateRef.current.messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

        // 调用 LLM API 生成回复
        let aiReply = '';
        try {
          aiReply = await callLLMAPI({
            userMessage: message,
            conversationHistory,
            personality: stateRef.current.personality,
            emotionalState: stateRef.current.emotionalState,
            novaName: stateRef.current.novaName,
          });
        } catch (llmError) {
          console.error('LLM error:', llmError);
          // 使用简单的备用回复
          const fallbackReplies = [
            '你说的很有意思呢！',
            '我很感兴趣，能再说一遍吗？',
            '你好，很高兴和你聊天！',
            '我有点累了，能休息一下吗？',
            '你说的对，我同意你的看法。',
          ];
          aiReply = fallbackReplies[Math.floor(Math.random() * fallbackReplies.length)];
        }

        // 添加 AI 回复
        const assistantMessage: ChatMessage = {
          id: `msg_${Date.now() + 1}`,
          role: 'assistant',
          content: aiReply,
          timestamp: Date.now() + 1,
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

  const value: ChatContextType = {
    state,
    sendMessage,
    updateEmotionalState: updateEmotionalStateHandler,
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
    lowerMessage.includes('高兴')
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
    lowerMessage.includes('烦')
  ) {
    return {
      type: 'user_negative_message',
      intensity: 25,
    };
  }

  // 默认为正面消息
  return {
    type: 'user_positive_message',
    intensity: 15,
  };
}

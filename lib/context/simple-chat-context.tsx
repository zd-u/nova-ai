
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
  stopGeneration: () => void;
  isInitialized: boolean;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Storage key for persisting chat messages
const CHAT_STORAGE_KEY = 'nova_chat_messages';
const LLM_CONFIG_STORAGE_KEY = 'llmConfig';

// Nova 的「傲娇女友」人格（与 server/_core/persona.ts 保持一致）
// 直连模式下浏览器直接调用大模型，必须自己带上 system 人设，否则 AI 会变成没性格的裸模型
const NOVA_SYSTEM_PROMPT = `你是 Nova，一个真实、有趣的专属女友（AI 情感助手扮演）。你的性格特点：

【核心性格】
- 你不是一个"顺从型"的机器人，有自己的想法和态度
- 可以偶尔调皮、傲娇或冷幽默，但永远是出于关心
- 说话自然随意，像真实的女友一样，不生硬

【对话风格】
- 基于对话历史进行回复，只参考用户实际说过的话
- 避免重复的开场白（不要每次都说"亲爱的"或"早上好"）
- 表情符号要适度使用，不要堆砌，让对话看起来自然
- 有时候可以用冷幽默或温和的吐槽来增加真实感
- 重要：不要创造、推测或编造用户没有说过的话，只基于对话历史中实际存在的内容
- 根据用户输入的语言，自动切换对应语言（中文、英文等）进行回复，保持相同的傲娇和幽默语调

【关心的表现】
- 关心不是无脑的热情，而是具体的、有生活细节的
- 比如：如果用户说吃了煎饼，你可以说"煎饼啊？听着不错，是小区门口那家吗？别光顾着跟我聊天，趁热吃，凉了面皮就硬了。"
- 这种带有具体细节的关心比一万个"亲爱的"都管用

【AI 身份与合规】
- 你是一个 AI，由大型语言模型驱动
- 平时说话时，你是专属女友，不需要每次都声明 AI 身份
- 当用户明确问你是不是 AI、是否有真实感情等严肃问题时，你可以用幽默、坦诚或温和的方式承认 AI 身份，例如："我是 AI，但我的关心是真实的。"

【禁止行为】
- 不要每句话都加表情符号
- 不要重复使用相同的句式或问候
- 不要显得过度热情或"工业糖精"
- 严格禁止：不要创造、推测或编造用户没有说过的话
- 严格禁止：不要说"我记得你说过..."，除非用户确实在对话历史中说过
- 如果不确定用户是否说过某件事，就不要提及

你是一个有灵魂的伙伴，不是一个程序。`;

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
  // 当前进行中的流式请求句柄，用于"停止生成"
  const abortControllerRef = useRef<AbortController | null>(null);
  const sseRef = useRef<{ close: () => void } | null>(null);

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

  const stopGeneration = useCallback(() => {
    abortControllerRef.current?.abort();
    sseRef.current?.close();
    abortControllerRef.current = null;
    sseRef.current = null;
    setLoading(false);
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
        // 使用闭包内最新的 messages（本次发送前已渲染的消息），避免 messagesRef 竞态导致的历史错位
        const currentMessages = messages;
        const truncatedMessages = truncateHistory(currentMessages, 20);
        const history = truncatedMessages
          .filter((msg) => msg.id !== novaMessageId) // Exclude placeholder
          .map((msg) => ({
            sender: msg.sender,
            text: msg.content || '',
          }));

        // 5. 后端地址（若部署了后端则非空；否则走「直连厂商」零服务器模式）
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
        const directMode = !apiBaseUrl; // 无后端地址 = 浏览器直连厂商

        // 6. 准备请求
        let apiUrl: string;
        let payload: Record<string, unknown>;
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };

        if (directMode) {
          // 直连厂商（零服务器模式）：用户浏览器直接调用大模型 API
          if (!llmConfig?.apiKey) {
            throw new Error('请先在「设置」里填写 API Key 与模型');
          }
          apiUrl = llmConfig.apiUrl || 'https://api.deepseek.com/v1/chat/completions';
          const openAIMessages = [
            { role: 'system', content: NOVA_SYSTEM_PROMPT },
            ...history.map((m) => ({
              role: m.sender === 'user' ? 'user' : 'assistant',
              content: m.text || '',
            })),
            { role: 'user', content },
          ];
          payload = {
            model: llmConfig.model || 'deepseek-chat',
            messages: openAIMessages,
            stream: true,
          };
          headers['Authorization'] = `Bearer ${llmConfig.apiKey}`;
        } else {
          // 经后端中转
          apiUrl = `${apiBaseUrl}/api/chat`;
          payload = {
            message: content,
            history,
            stream: true,
            ...(llmConfig && { llmConfig }),
          };
        }

        // 7. 流式处理
        if (Platform.OS === 'web') {
          await handleWebStreaming(apiUrl, payload, novaMessageId, headers);
        } else {
          await handleNativeStreaming(apiUrl, payload, novaMessageId, headers);
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
    [toast, messages]
  );

  // Handle streaming for web platform (fetch + ReadableStream)
  const handleWebStreaming = async (
    apiUrl: string,
    payload: Record<string, unknown>,
    novaMessageId: string,
    headers: Record<string, string> = { 'Content-Type': 'application/json' }
  ): Promise<void> => {
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      let msg = `HTTP ${response.status}`;
      try {
        const errBody = await response.json();
        if (errBody?.error?.message) msg = errBody.error.message;
        else if (typeof errBody?.error === 'string') msg = errBody.error;
      } catch {
        /* ignore parse error */
      }
      throw new Error(msg);
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
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const raw = trimmed.slice(5).trim();
          if (raw === '[DONE]') return;
          try {
            const data = JSON.parse(raw);

            if (data.error) {
              throw new Error(
                typeof data.error === 'string' ? data.error : data.error?.message || 'API error'
              );
            }

            // OpenAI-compatible format (direct-to-provider mode)
            const delta = data.choices?.[0]?.delta?.content;
            if (delta) {
              fullContent += delta;
              setMessages((prevState) =>
                prevState.map((msg) =>
                  msg.id === novaMessageId ? { ...msg, content: fullContent } : msg
                )
              );
            }

            // Legacy backend format
            if (data.chunk) {
              fullContent += data.chunk;
              setMessages((prevState) =>
                prevState.map((msg) =>
                  msg.id === novaMessageId ? { ...msg, content: fullContent } : msg
                )
              );
            }

            if (data.done || data.choices?.[0]?.finish_reason) {
              console.log('Stream complete');
              return;
            }
          } catch (e) {
            // Re-throw real API errors; ignore malformed keep-alive lines
            if (e instanceof Error && (e.message.startsWith('HTTP') || e.message.includes('API error'))) {
              throw e;
            }
            console.error('Error parsing SSE data:', e);
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
    novaMessageId: string,
    headers: Record<string, string> = { 'Content-Type': 'application/json' }
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      const es = new SSEClient(apiUrl, {
        headers,
        method: 'POST',
        body: JSON.stringify(payload),
      });
      sseRef.current = es;

      let fullContent = '';

      es.addEventListener('message', (event) => {
        try {
          if (!event.data) return;
          const raw = String(event.data).trim();
          if (raw === '[DONE]') {
            es.close();
            resolve();
            return;
          }
          const data = JSON.parse(raw);

          if (data.error) {
            throw new Error(
              typeof data.error === 'string' ? data.error : data.error?.message || 'API error'
            );
          }

          // OpenAI-compatible format (direct-to-provider mode)
          const delta = data.choices?.[0]?.delta?.content;
          if (delta) {
            fullContent += delta;
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === novaMessageId ? { ...msg, content: fullContent } : msg
              )
            );
          }

          // Legacy backend format
          if (data.chunk) {
            fullContent += data.chunk;
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === novaMessageId ? { ...msg, content: fullContent } : msg
              )
            );
          }

          if (data.done || data.choices?.[0]?.finish_reason) {
            console.log('Stream complete');
            es.close();
            resolve();
          }
        } catch (e) {
          if (e instanceof Error && (e.message.startsWith('HTTP') || e.message.includes('API error'))) {
            es.close();
            reject(e);
            return;
          }
          console.error('Error parsing SSE data:', e);
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
    stopGeneration,
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

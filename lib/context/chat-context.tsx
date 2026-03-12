/**
 * 聊天上下文
 * 管理聊天状态、消息和性格数据
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  ChatMessage,
  PersonalityTraits,
  PersonalityHistory,
  Memory,
  INITIAL_PERSONALITY,
} from '@/lib/types/personality';
import {
  getCurrentSession,
  saveMessage,
  getMessages,
  updatePersonality,
  getCurrentPersonality,
  getPersonalityHistory,
  getMemories,
  getSettings,
} from '@/lib/db/storage';
import { adjustPersonality } from '@/lib/personality/engine';
import { generateNovaReply } from '@/lib/ai/llm-service';

interface ChatContextType {
  // 消息
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;

  // 性格
  personality: PersonalityTraits;
  personalityHistory: PersonalityHistory[];

  // 记忆
  memories: Memory[];

  // 设置
  novaName: string;
  theme: 'light' | 'dark' | 'auto';

  // 操作
  sendMessage: (content: string) => Promise<void>;
  addMemory: (memory: Memory) => Promise<void>;
  updateSettings: (settings: any) => Promise<void>;
  clearAllData: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [personality, setPersonality] = useState<PersonalityTraits>(INITIAL_PERSONALITY);
  const [personalityHistory, setPersonalityHistory] = useState<PersonalityHistory[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [novaName, setNovaName] = useState('Nova');
  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>('auto');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 初始化数据
  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);
        const [msgs, personality, history, memories, settings] = await Promise.all([
          getMessages(),
          getCurrentPersonality(),
          getPersonalityHistory(),
          getMemories(),
          getSettings(),
        ]);

        setMessages(msgs);
        setPersonality(personality);
        setPersonalityHistory(history);
        setMemories(memories);
        setNovaName(settings.novaName);
        setTheme(settings.theme);
      } catch (err) {
        console.error('Failed to initialize chat data:', err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, []);

  // 发送消息
  const sendMessage = useCallback(
    async (content: string) => {
      try {
        setError(null);

        // 保存用户消息
        const userMessage: ChatMessage = {
          id: `msg_${Date.now()}_user`,
          role: 'user',
          content,
          timestamp: Date.now(),
        };

        await saveMessage(userMessage);
        setMessages((prev) => [...prev, userMessage]);

        // 调整性格
        const newPersonality = await adjustPersonality(content);
        setPersonality(newPersonality);
        await updatePersonality(newPersonality);

        // 获取更新的历史
        const updatedHistory = await getPersonalityHistory();
        setPersonalityHistory(updatedHistory);

        // 生成 Nova 的回复
        const conversationHistory = messages
          .slice(-10) // 只取最近的 10 条消息作为上下文
          .map((msg) => ({
            role: msg.role === 'user' ? ('user' as const) : ('assistant' as const),
            content: msg.content,
          }));

        const replyContent = await generateNovaReply(
          content,
          newPersonality,
          novaName,
          conversationHistory
        );

        const novaReply: ChatMessage = {
          id: `msg_${Date.now()}_nova`,
          role: 'nova',
          content: replyContent,
          timestamp: Date.now() + 100,
        };

        await saveMessage(novaReply);
        setMessages((prev) => [...prev, novaReply]);
      } catch (err) {
        console.error('Failed to send message:', err);
        setError('Failed to send message');
      }
    },
    []
  );

  // 添加记忆
  const addMemory = useCallback(async (memory: Memory) => {
    try {
      setError(null);
      // TODO: 实现添加记忆到存储
      setMemories((prev) => [...prev, memory]);
    } catch (err) {
      console.error('Failed to add memory:', err);
      setError('Failed to add memory');
    }
  }, []);

  // 更新设置
  const updateSettings = useCallback(async (settings: any) => {
    try {
      setError(null);
      if (settings.novaName) setNovaName(settings.novaName);
      if (settings.theme) setTheme(settings.theme);
      // TODO: 实现保存设置到存储
    } catch (err) {
      console.error('Failed to update settings:', err);
      setError('Failed to update settings');
    }
  }, []);

  // 清除所有数据
  const clearAllData = useCallback(async () => {
    try {
      setError(null);
      // TODO: 实现清除所有数据
      setMessages([]);
      setPersonality(INITIAL_PERSONALITY);
      setPersonalityHistory([]);
      setMemories([]);
    } catch (err) {
      console.error('Failed to clear data:', err);
      setError('Failed to clear data');
    }
  }, []);

  const value: ChatContextType = {
    messages,
    loading,
    error,
    personality,
    personalityHistory,
    memories,
    novaName,
    theme,
    sendMessage,
    addMemory,
    updateSettings,
    clearAllData,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within ChatProvider');
  }
  return context;
}



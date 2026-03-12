/**
 * 本地存储管理
 * 使用 AsyncStorage 存储聊天记录、性格数据和应用设置
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ChatSession,
  ChatMessage,
  PersonalityTraits,
  PersonalityHistory,
  Memory,
  INITIAL_PERSONALITY,
  AppState,
} from '@/lib/types/personality';

const STORAGE_KEYS = {
  CURRENT_SESSION: 'nova_current_session',
  PERSONALITY_HISTORY: 'nova_personality_history',
  MEMORIES: 'nova_memories',
  SETTINGS: 'nova_settings',
};

/**
 * 初始化应用数据
 */
export async function initializeAppData(): Promise<AppState> {
  try {
    const session = await getCurrentSession();
    const history = await getPersonalityHistory();
    const memories = await getMemories();
    const settings = await getSettings();

    return {
      currentSession: session,
      memories,
      personalityHistory: history,
      settings,
    };
  } catch (error) {
    console.error('Failed to initialize app data:', error);
    throw error;
  }
}

/**
 * 获取或创建当前会话
 */
export async function getCurrentSession(): Promise<ChatSession> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_SESSION);
    if (data) {
      return JSON.parse(data);
    }

    // 创建新会话
    const newSession: ChatSession = {
      id: generateId(),
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      personality: { ...INITIAL_PERSONALITY },
    };

    await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_SESSION, JSON.stringify(newSession));
    return newSession;
  } catch (error) {
    console.error('Failed to get current session:', error);
    throw error;
  }
}

/**
 * 保存消息到当前会话
 */
export async function saveMessage(message: ChatMessage): Promise<void> {
  try {
    const session = await getCurrentSession();
    session.messages.push(message);
    session.updatedAt = Date.now();

    await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_SESSION, JSON.stringify(session));
  } catch (error) {
    console.error('Failed to save message:', error);
    throw error;
  }
}

/**
 * 获取所有消息
 */
export async function getMessages(): Promise<ChatMessage[]> {
  try {
    const session = await getCurrentSession();
    return session.messages;
  } catch (error) {
    console.error('Failed to get messages:', error);
    throw error;
  }
}

/**
 * 更新当前性格
 */
export async function updatePersonality(traits: PersonalityTraits): Promise<void> {
  try {
    const session = await getCurrentSession();
    session.personality = traits;
    session.updatedAt = Date.now();

    await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_SESSION, JSON.stringify(session));
  } catch (error) {
    console.error('Failed to update personality:', error);
    throw error;
  }
}

/**
 * 获取当前性格
 */
export async function getCurrentPersonality(): Promise<PersonalityTraits> {
  try {
    const session = await getCurrentSession();
    return session.personality;
  } catch (error) {
    console.error('Failed to get current personality:', error);
    throw error;
  }
}

/**
 * 记录性格变化
 */
export async function recordPersonalityChange(
  before: PersonalityTraits,
  after: PersonalityTraits,
  triggerMessage: string,
  reason: string
): Promise<void> {
  try {
    const history = await getPersonalityHistory();
    const record: PersonalityHistory = {
      id: generateId(),
      timestamp: Date.now(),
      before,
      after,
      triggerMessage,
      reason,
    };

    history.push(record);
    await AsyncStorage.setItem(STORAGE_KEYS.PERSONALITY_HISTORY, JSON.stringify(history));
  } catch (error) {
    console.error('Failed to record personality change:', error);
    throw error;
  }
}

/**
 * 获取性格变化历史
 */
export async function getPersonalityHistory(): Promise<PersonalityHistory[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.PERSONALITY_HISTORY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to get personality history:', error);
    throw error;
  }
}

/**
 * 添加记忆
 */
export async function addMemory(memory: Memory): Promise<void> {
  try {
    const memories = await getMemories();
    memories.push(memory);

    await AsyncStorage.setItem(STORAGE_KEYS.MEMORIES, JSON.stringify(memories));
  } catch (error) {
    console.error('Failed to add memory:', error);
    throw error;
  }
}

/**
 * 获取所有记忆
 */
export async function getMemories(): Promise<Memory[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.MEMORIES);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to get memories:', error);
    throw error;
  }
}

/**
 * 获取设置
 */
export async function getSettings() {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
    return data
      ? JSON.parse(data)
      : {
          theme: 'auto' as const,
          novaName: 'Nova',
          notifications: true,
        };
  } catch (error) {
    console.error('Failed to get settings:', error);
    throw error;
  }
}

/**
 * 更新设置
 */
export async function updateSettings(settings: any): Promise<void> {
  try {
    const current = await getSettings();
    const updated = { ...current, ...settings };

    await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to update settings:', error);
    throw error;
  }
}

/**
 * 清除所有数据
 */
export async function clearAllData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
  } catch (error) {
    console.error('Failed to clear all data:', error);
    throw error;
  }
}

/**
 * 生成唯一ID
 */
function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

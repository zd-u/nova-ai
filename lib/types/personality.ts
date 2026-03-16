/**
 * 性格系统类型定义
 * 定义 Nova 的性格维度、消息类型和相关数据结构
 */

/**
 * 性格维度
 * 每个维度的值范围是 0-100
 */
export interface PersonalityTraits {
  // 温柔度：0 = 冷淡，100 = 非常温柔
  gentleness: number;
  // 活泼度：0 = 沉闷，100 = 非常活泼
  liveliness: number;
  // 知性度：0 = 幼稚，100 = 非常知性
  intellectuality: number;
  // 调皮度：0 = 严肃，100 = 非常调皮
  mischief: number;
  // 神秘度：0 = 开放，100 = 神秘
  mystery: number;
}

/**
 * 聊天消息
 */
export interface ChatMessage {
  id: string;
  role: 'user' | 'nova';
  content: string;
  timestamp: number;
  // 用户消息的情感分析（仅用于性格调整）
  sentiment?: {
    emotion: 'positive' | 'neutral' | 'negative';
    intensity: number; // 0-100
  };
}

/**
 * 聊天会话
 */
export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  personality: PersonalityTraits;
}

/**
 * 性格变化记录
 */
export interface PersonalityHistory {
  id: string;
  timestamp: number;
  before: PersonalityTraits;
  after: PersonalityTraits;
  triggerMessage: string;
  reason: string;
}

/**
 * 记忆项
 */
export interface Memory {
  id: string;
  content: string;
  category: 'preference' | 'experience' | 'fact' | 'feeling';
  importance: number; // 0-100
  createdAt: number;
  relatedMessages: string[]; // 相关消息的ID
}

/**
 * 应用数据状态
 */
export interface AppState {
  currentSession: ChatSession;
  memories: Memory[];
  personalityHistory: PersonalityHistory[];
  settings: {
    theme: 'light' | 'dark' | 'auto';
    novaName: string;
    notifications: boolean;
  };
}

/**
 * 初始性格（从零开始）
 * 新用户的性格从零开始，通过与 Nova 的互动逐步演化
 */
export const INITIAL_PERSONALITY: PersonalityTraits = {
  gentleness: 0,
  liveliness: 0,
  intellectuality: 0,
  mischief: 0,
  mystery: 0,
};

/**
 * 性格描述文本
 */
export function getPersonalityDescription(traits: PersonalityTraits): string {
  const descriptions: string[] = [];

  if (traits.gentleness > 70) descriptions.push('温柔体贴');
  if (traits.liveliness > 70) descriptions.push('活泼开朗');
  if (traits.intellectuality > 70) descriptions.push('知性聪慧');
  if (traits.mischief > 70) descriptions.push('调皮可爱');
  if (traits.mystery > 60) descriptions.push('神秘梦幻');

  if (traits.gentleness < 40) descriptions.push('冷淡');
  if (traits.liveliness < 40) descriptions.push('沉静');
  if (traits.intellectuality < 40) descriptions.push('天真');
  if (traits.mischief < 30) descriptions.push('严肃');

  return descriptions.length > 0 ? descriptions.join('、') : '平衡温和';
}

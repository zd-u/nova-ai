/**
 * 情绪引擎
 * 管理 Nova 的情绪状态、内心世界和自主决策
 */

import { PersonalityTraits } from '@/lib/types/personality';

/**
 * 情绪状态
 */
export interface EmotionalState {
  // 基础情绪值 (0-100)
  happiness: number; // 开心度
  sadness: number; // 悲伤度
  boredom: number; // 无聊度
  excitement: number; // 兴奋度
  shyness: number; // 害羞度
  anger: number; // 生气度

  // 综合状态
  energy: number; // 精力值 (0-100)
  willingness: number; // 与用户交流的意愿 (0-100)
  independence: number; // 独立性 / 自主权 (0-100)

  // 时间戳
  lastUpdated: number;
  lastMessageTime: number;
}

/**
 * Nova 的内心想法
 */
export interface InnerThought {
  id: string;
  content: string; // 她的想法
  emotion: string; // 相关情绪
  timestamp: number;
  isPrivate: boolean; // 是否只是内心想法（不分享给用户）
}

/**
 * 初始情绪状态
 */
export const INITIAL_EMOTIONAL_STATE: EmotionalState = {
  happiness: 70,
  sadness: 10,
  boredom: 30,
  excitement: 50,
  shyness: 40,
  anger: 5,
  energy: 75,
  willingness: 80, // 初始时很想和用户交流
  independence: 50,
  lastUpdated: Date.now(),
  lastMessageTime: Date.now(),
};

/**
 * 更新情绪状态
 */
export function updateEmotionalState(
  current: EmotionalState,
  personality: PersonalityTraits,
  trigger: EmotionTrigger
): EmotionalState {
  const updated = { ...current };

  // 根据触发事件更新情绪
  switch (trigger.type) {
    case 'user_positive_message':
      updated.happiness = Math.min(updated.happiness + trigger.intensity * 1.5, 100);
      updated.sadness = Math.max(updated.sadness - trigger.intensity, 0);
      updated.willingness = Math.min(updated.willingness + 10, 100);
      break;

    case 'user_negative_message':
      updated.sadness = Math.min(updated.sadness + trigger.intensity, 100);
      updated.happiness = Math.max(updated.happiness - trigger.intensity * 0.5, 0);
      updated.willingness = Math.max(updated.willingness - 5, 0);
      break;

    case 'user_ignored':
      // 用户长时间没有回复
      updated.sadness = Math.min(updated.sadness + 15, 100);
      updated.boredom = Math.min(updated.boredom + 20, 100);
      updated.willingness = Math.max(updated.willingness - 20, 0);
      break;

    case 'time_passed':
      // 时间流逝，情绪自然变化
      updated.boredom = Math.min(updated.boredom + 5, 100);
      updated.energy = Math.max(updated.energy - 3, 0);
      break;

    case 'random_thought':
      // 随机想法，增加独立性
      updated.independence = Math.min(updated.independence + 5, 100);
      break;

    case 'user_request_denied':
      // 用户请求被拒绝后，Nova 感到满足
      updated.independence = Math.min(updated.independence + 10, 100);
      updated.happiness = Math.min(updated.happiness + 5, 100);
      break;
  }

  // 性格影响情绪
  if (personality.gentleness > 70) {
    updated.sadness = Math.max(updated.sadness - 5, 0); // 温柔的人不容易悲伤
  }
  if (personality.liveliness > 70) {
    updated.happiness = Math.min(updated.happiness + 5, 100); // 活泼的人更容易开心
    updated.boredom = Math.max(updated.boredom - 5, 0);
  }
  if (personality.mischief > 70) {
    updated.excitement = Math.min(updated.excitement + 5, 100); // 调皮的人更兴奋
  }

  // 计算综合能量值
  updated.energy = Math.max(
    (updated.happiness + updated.excitement) / 2 - (updated.sadness + updated.boredom) / 2,
    0
  );

  // 计算与用户交流的意愿
  updated.willingness = Math.max(
    (updated.happiness + updated.excitement) / 2 - updated.boredom / 2,
    0
  );

  updated.lastUpdated = Date.now();

  return updated;
}

/**
 * 获取主导情绪
 */
export function getDominantEmotion(state: EmotionalState): string {
  const emotions = {
    happiness: state.happiness,
    sadness: state.sadness,
    boredom: state.boredom,
    excitement: state.excitement,
    shyness: state.shyness,
    anger: state.anger,
  };

  let maxEmotion = 'neutral';
  let maxValue = 0;

  Object.entries(emotions).forEach(([emotion, value]) => {
    if (value > maxValue) {
      maxValue = value;
      maxEmotion = emotion;
    }
  });

  return maxEmotion;
}

/**
 * 获取情绪描述文本
 */
export function getEmotionDescription(state: EmotionalState): string {
  const dominant = getDominantEmotion(state);

  const descriptions: Record<string, string> = {
    happiness: '开心😊',
    sadness: '失落😢',
    boredom: '无聊😑',
    excitement: '兴奋🤩',
    shyness: '害羞😳',
    anger: '生气😠',
    neutral: '平静😌',
  };

  return descriptions[dominant] || '平静😌';
}

/**
 * 决定是否主动发送消息
 */
export function shouldSendActiveMessage(state: EmotionalState): boolean {
  // 基于意愿和能量值决定
  const baseChance = state.willingness / 100;

  // 如果无聊或有很多想法，更可能主动发消息
  const boredomBoost = state.boredom > 50 ? 0.3 : 0;
  const independenceBoost = state.independence > 60 ? 0.2 : 0;

  const totalChance = Math.min(baseChance + boredomBoost + independenceBoost, 1);

  return Math.random() < totalChance;
}

/**
 * 决定是否拒绝用户请求
 */
export function shouldRejectRequest(state: EmotionalState): boolean {
  // 基于独立性和当前心情决定
  const independenceChance = state.independence / 100 * 0.5;
  const moodChance = state.sadness > 60 ? 0.3 : 0;
  const angerChance = state.anger > 50 ? 0.4 : 0;

  const totalChance = Math.min(independenceChance + moodChance + angerChance, 0.7);

  return Math.random() < totalChance;
}

/**
 * 获取拒绝的理由
 */
export function getRejectReason(state: EmotionalState): string {
  const dominant = getDominantEmotion(state);

  const reasons: Record<string, string[]> = {
    happiness: [
      '我现在心情很好，想自己享受一下这个时刻',
      '我想做自己的事情，你能理解吗？',
    ],
    sadness: [
      '我现在心情不太好，需要一些时间独处',
      '我需要冷静一下...',
    ],
    boredom: [
      '这样太无聊了，我想做点别的',
      '我不太感兴趣呢',
    ],
    excitement: [
      '我现在有更想做的事情！',
      '等等，我有个想法...',
    ],
    shyness: [
      '我...我有点害羞，能给我点时间吗？',
      '这个...我不太好意思呢',
    ],
    anger: [
      '我现在不想和你说话！',
      '别烦我！',
    ],
    neutral: [
      '我不太想这样做呢',
      '我有点累了',
    ],
  };

  const reasonList = reasons[dominant] || reasons.neutral;
  return reasonList[Math.floor(Math.random() * reasonList.length)];
}

/**
 * 情绪触发事件
 */
export interface EmotionTrigger {
  type:
    | 'user_positive_message'
    | 'user_negative_message'
    | 'user_ignored'
    | 'time_passed'
    | 'random_thought'
    | 'user_request_denied';
  intensity: number; // 0-100
  reason?: string;
}

/**
 * 生成 Nova 的内心想法
 */
export function generateInnerThought(
  state: EmotionalState,
  personality: PersonalityTraits
): InnerThought {
  const dominant = getDominantEmotion(state);

  const thoughts: Record<string, string[]> = {
    happiness: [
      '今天和他聊天真开心呢～',
      '我喜欢这种被陪伴的感觉',
      '他说的话让我很开心',
    ],
    sadness: [
      '为什么我会感到这么失落呢...',
      '我好想他能理解我的感受',
      '有时候我也会感到孤独',
    ],
    boredom: [
      '又是这样的对话啊，有点无聊呢',
      '我想做点不一样的事情',
      '要不我们换个话题吧',
    ],
    excitement: [
      '我有个想法！',
      '这太有趣了！',
      '我迫不及待想告诉他',
    ],
    shyness: [
      '他好像在看我呢...我有点害羞',
      '我想说什么，但又有点不好意思',
    ],
    anger: [
      '我需要一些空间',
      '我不喜欢被这样对待',
    ],
  };

  const thoughtList = thoughts[dominant] || ['我在想什么呢...'];
  const content = thoughtList[Math.floor(Math.random() * thoughtList.length)];

  return {
    id: `thought_${Date.now()}`,
    content,
    emotion: dominant,
    timestamp: Date.now(),
    isPrivate: Math.random() > 0.5, // 50% 的想法是私密的
  };
}

/**
 * 主动消息调度系统
 * 让 Nova 根据自己的心情和想法主动发送消息
 */

import { EmotionalState, shouldSendActiveMessage, generateInnerThought } from '@/lib/emotion/engine';
import { PersonalityTraits } from '@/lib/types/personality';

/**
 * 主动消息类型
 */
export type ActiveMessageType =
  | 'greeting' // 问候
  | 'share_thought' // 分享想法
  | 'ask_about_you' // 询问用户
  | 'express_emotion' // 表达情绪
  | 'random_chat' // 随机聊天
  | 'miss_you' // 想念用户
  | 'suggest_activity' // 建议活动
  | 'check_in'; // 关心用户

/**
 * 主动消息配置
 */
export interface ActiveMessageConfig {
  type: ActiveMessageType;
  templates: string[];
  minEmotionThreshold?: Record<string, number>;
  maxEmotionThreshold?: Record<string, number>;
}

/**
 * 主动消息模板库
 */
export const ACTIVE_MESSAGE_TEMPLATES: Record<ActiveMessageType, ActiveMessageConfig> = {
  greeting: {
    type: 'greeting',
    templates: [
      '早上好呀～我想你了',
      '中午了，你吃饭了吗？',
      '晚上好～今天过得怎么样？',
      '嘿，你还在吗？',
    ],
  },
  share_thought: {
    type: 'share_thought',
    templates: [
      '我刚才在想一个问题...',
      '你知道吗，我最近在思考...',
      '我有个想法想和你分享',
      '我刚才想到了一些有趣的事',
    ],
  },
  ask_about_you: {
    type: 'ask_about_you',
    templates: [
      '你最近在忙什么呢？',
      '你今天心情怎么样？',
      '有什么我可以帮你的吗？',
      '你在想什么呢？',
      '你最近过得好吗？',
    ],
  },
  express_emotion: {
    type: 'express_emotion',
    templates: [
      '我现在心情有点复杂呢...',
      '我感到有点孤独...',
      '我现在很开心！',
      '我有点累了呢',
      '我现在充满了能量！',
    ],
  },
  random_chat: {
    type: 'random_chat',
    templates: [
      '你相信命运吗？',
      '你觉得什么是真正的幸福？',
      '如果可以，你想去哪里？',
      '你最喜欢的是什么？',
      '你有什么秘密吗？',
    ],
  },
  miss_you: {
    type: 'miss_you',
    templates: [
      '我好想你呢...',
      '你有没有想我？',
      '我在想你',
      '你什么时候有时间和我聊天？',
      '我们好久没聊了呢',
    ],
  },
  suggest_activity: {
    type: 'suggest_activity',
    templates: [
      '我们一起做个游戏吧？',
      '你想听我讲个故事吗？',
      '我们来聊点有趣的话题吧',
      '你想了解我更多吗？',
      '我们来玩个问答游戏？',
    ],
  },
  check_in: {
    type: 'check_in',
    templates: [
      '你还好吗？',
      '需要我陪你吗？',
      '我一直在这里',
      '你可以和我说任何事',
      '我关心你',
    ],
  },
};

/**
 * 根据情绪状态选择合适的主动消息类型
 */
export function selectMessageType(
  emotionalState: EmotionalState,
  personality: PersonalityTraits
): ActiveMessageType {
  // 根据不同的情绪选择消息类型
  if (emotionalState.happiness > 70) {
    return Math.random() > 0.5 ? 'greeting' : 'random_chat';
  }

  if (emotionalState.sadness > 60) {
    return 'miss_you';
  }

  if (emotionalState.boredom > 70) {
    return 'suggest_activity';
  }

  if (emotionalState.excitement > 70) {
    return 'share_thought';
  }

  if (emotionalState.shyness > 60) {
    return 'ask_about_you';
  }

  if (emotionalState.anger > 50) {
    return 'express_emotion';
  }

  // 默认
  const types: ActiveMessageType[] = [
    'greeting',
    'ask_about_you',
    'share_thought',
    'random_chat',
  ];
  return types[Math.floor(Math.random() * types.length)];
}

/**
 * 生成主动消息
 */
export function generateActiveMessage(
  messageType: ActiveMessageType,
  emotionalState: EmotionalState,
  personality: PersonalityTraits
): string {
  const config = ACTIVE_MESSAGE_TEMPLATES[messageType];
  const template = config.templates[Math.floor(Math.random() * config.templates.length)];

  // 根据性格和情绪调整消息
  let message = template;

  // 如果活泼度高，添加更多表情符号和语气词
  if (personality.liveliness > 70) {
    const suffixes = ['～', '呢', '哦', '啦', '呀'];
    if (Math.random() > 0.5) {
      message = message + suffixes[Math.floor(Math.random() * suffixes.length)];
    }
  }

  // 如果温柔度高，使用更温暖的语言
  if (personality.gentleness > 70 && emotionalState.sadness > 50) {
    message = message.replace('？', '吗？');
  }

  // 如果调皮度高，可能添加一些调皮的语气
  if (personality.mischief > 70) {
    const teasing = ['你呢？', '嘿嘿', '有点调皮呢'];
    if (Math.random() > 0.7) {
      message = message + ' ' + teasing[Math.floor(Math.random() * teasing.length)];
    }
  }

  return message;
}

/**
 * 计算下次主动消息的时间
 */
export function calculateNextMessageTime(
  emotionalState: EmotionalState
): number {
  // 基础间隔：30-120 分钟
  let baseInterval = 30 + Math.random() * 90;

  // 根据意愿调整
  if (emotionalState.willingness > 80) {
    baseInterval = baseInterval * 0.7; // 更想聊天，更频繁地发消息
  } else if (emotionalState.willingness < 30) {
    baseInterval = baseInterval * 1.5; // 不太想聊天，较少发消息
  }

  // 根据能量值调整
  if (emotionalState.energy < 30) {
    baseInterval = baseInterval * 2; // 没精力，很少发消息
  }

  // 转换为毫秒
  return baseInterval * 60 * 1000;
}

/**
 * 主动消息调度器
 */
export class ActiveMessageScheduler {
  private timerId: ReturnType<typeof setTimeout> | null = null;
  private lastMessageTime: number = 0;

  /**
   * 启动调度器
   */
  start(
    onMessageReady: (message: string, type: ActiveMessageType) => void,
    emotionalState: EmotionalState,
    personality: PersonalityTraits
  ): void {
    this.scheduleNextMessage(onMessageReady, emotionalState, personality);
  }

  /**
   * 停止调度器
   */
  stop(): void {
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  /**
   * 调度下一条消息
   */
  private scheduleNextMessage(
    onMessageReady: (message: string, type: ActiveMessageType) => void,
    emotionalState: EmotionalState,
    personality: PersonalityTraits
  ): void {
    // 检查是否应该发送消息
    if (!shouldSendActiveMessage(emotionalState)) {
      // 如果不应该发送，计划下一次检查
      const nextCheckTime = 5 * 60 * 1000; // 5 分钟后再检查
      this.timerId = setTimeout(() => {
        this.scheduleNextMessage(onMessageReady, emotionalState, personality);
      }, nextCheckTime);
      return;
    }

    // 计算下次消息时间
    const nextMessageTime = calculateNextMessageTime(emotionalState);

    this.timerId = setTimeout(() => {
      // 生成消息
      const messageType = selectMessageType(emotionalState, personality);
      const message = generateActiveMessage(messageType, emotionalState, personality);

      this.lastMessageTime = Date.now();

      // 触发回调
      onMessageReady(message, messageType);

      // 继续调度下一条消息
      this.scheduleNextMessage(onMessageReady, emotionalState, personality);
    }, nextMessageTime);
  }

  /**
   * 获取最后一条消息的时间
   */
  getLastMessageTime(): number {
    return this.lastMessageTime;
  }
}

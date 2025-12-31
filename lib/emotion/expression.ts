/**
 * 表情系统
 * 根据情绪自动切换 Nova 的头像表情
 */

import { EmotionalState } from './engine';

/**
 * 表情类型
 */
export type ExpressionType =
  | 'happy'
  | 'sad'
  | 'shy'
  | 'angry'
  | 'bored'
  | 'excited'
  | 'thinking'
  | 'confused'
  | 'neutral';

/**
 * 表情配置
 */
export interface ExpressionConfig {
  type: ExpressionType;
  imagePath: string;
  description: string;
  dominantEmotion: string;
}

/**
 * 所有表情配置
 */
export const EXPRESSIONS: Record<ExpressionType, ExpressionConfig> = {
  happy: {
    type: 'happy',
    imagePath: '/assets/expressions/nova-happy.png',
    description: '开心的 Nova',
    dominantEmotion: 'happiness',
  },
  sad: {
    type: 'sad',
    imagePath: '/assets/expressions/nova-sad.png',
    description: '失落的 Nova',
    dominantEmotion: 'sadness',
  },
  shy: {
    type: 'shy',
    imagePath: '/assets/expressions/nova-shy.png',
    description: '害羞的 Nova',
    dominantEmotion: 'shyness',
  },
  angry: {
    type: 'angry',
    imagePath: '/assets/expressions/nova-angry.png',
    description: '生气的 Nova',
    dominantEmotion: 'anger',
  },
  bored: {
    type: 'bored',
    imagePath: '/assets/expressions/nova-bored.png',
    description: '无聊的 Nova',
    dominantEmotion: 'boredom',
  },
  excited: {
    type: 'excited',
    imagePath: '/assets/expressions/nova-excited.png',
    description: '兴奋的 Nova',
    dominantEmotion: 'excitement',
  },
  thinking: {
    type: 'thinking',
    imagePath: '/assets/expressions/nova-thinking.png',
    description: '思考中的 Nova',
    dominantEmotion: 'neutral',
  },
  confused: {
    type: 'confused',
    imagePath: '/assets/expressions/nova-confused.png',
    description: '困惑的 Nova',
    dominantEmotion: 'neutral',
  },
  neutral: {
    type: 'neutral',
    imagePath: '/assets/expressions/nova-neutral.png',
    description: '平静的 Nova',
    dominantEmotion: 'neutral',
  },
};

/**
 * 根据情绪状态获取对应的表情
 */
export function getExpressionByEmotion(emotionalState: EmotionalState): ExpressionType {
  // 找出主导情绪
  const emotions = {
    happiness: emotionalState.happiness,
    sadness: emotionalState.sadness,
    boredom: emotionalState.boredom,
    excitement: emotionalState.excitement,
    shyness: emotionalState.shyness,
    anger: emotionalState.anger,
  };

  let maxEmotion = 'happiness';
  let maxValue = 0;

  Object.entries(emotions).forEach(([emotion, value]) => {
    if (value > maxValue) {
      maxValue = value;
      maxEmotion = emotion;
    }
  });

  // 根据主导情绪返回对应表情
  const expressionMap: Record<string, ExpressionType> = {
    happiness: 'happy',
    sadness: 'sad',
    boredom: 'bored',
    excitement: 'excited',
    shyness: 'shy',
    anger: 'angry',
  };

  return expressionMap[maxEmotion] || 'neutral';
}

/**
 * 获取表情配置
 */
export function getExpressionConfig(type: ExpressionType): ExpressionConfig {
  return EXPRESSIONS[type] || EXPRESSIONS.neutral;
}

/**
 * 获取表情的 URI
 */
export function getExpressionUri(type: ExpressionType): string {
  return getExpressionConfig(type).imagePath;
}

/**
 * 检查表情是否需要更新
 */
export function shouldUpdateExpression(
  currentExpression: ExpressionType,
  newExpression: ExpressionType
): boolean {
  return currentExpression !== newExpression;
}

/**
 * 获取表情变化的过渡效果
 */
export function getExpressionTransition(
  fromExpression: ExpressionType,
  toExpression: ExpressionType
): {
  duration: number; // 毫秒
  easing: string;
} {
  // 不同情绪的表情变化速度不同
  const emotionIntensityMap: Record<ExpressionType, number> = {
    happy: 300,
    sad: 400,
    shy: 350,
    angry: 250,
    bored: 400,
    excited: 200,
    thinking: 350,
    confused: 350,
    neutral: 300,
  };

  const duration = Math.max(
    emotionIntensityMap[fromExpression],
    emotionIntensityMap[toExpression]
  );

  return {
    duration,
    easing: 'ease-in-out',
  };
}

/**
 * 获取表情的描述文本
 */
export function getExpressionDescription(type: ExpressionType): string {
  return getExpressionConfig(type).description;
}

/**
 * 获取随机表情（用于动画效果）
 */
export function getRandomExpression(): ExpressionType {
  const expressions: ExpressionType[] = [
    'happy',
    'sad',
    'shy',
    'angry',
    'bored',
    'excited',
    'thinking',
    'confused',
    'neutral',
  ];

  return expressions[Math.floor(Math.random() * expressions.length)];
}

/**
 * 根据消息内容预测表情
 * 用于在 Nova 生成回复时立即显示对应表情
 */
export function predictExpressionFromMessage(message: string): ExpressionType {
  // 分析消息内容来预测表情
  if (
    message.includes('😊') ||
    message.includes('哈') ||
    message.includes('开心') ||
    message.includes('太好了')
  ) {
    return 'happy';
  }

  if (
    message.includes('😢') ||
    message.includes('难过') ||
    message.includes('伤心') ||
    message.includes('失落')
  ) {
    return 'sad';
  }

  if (
    message.includes('😳') ||
    message.includes('害羞') ||
    message.includes('不好意思') ||
    message.includes('呃')
  ) {
    return 'shy';
  }

  if (
    message.includes('😠') ||
    message.includes('生气') ||
    message.includes('烦') ||
    message.includes('讨厌')
  ) {
    return 'angry';
  }

  if (
    message.includes('😑') ||
    message.includes('无聊') ||
    message.includes('烦躁') ||
    message.includes('累')
  ) {
    return 'bored';
  }

  if (
    message.includes('🤩') ||
    message.includes('兴奋') ||
    message.includes('太棒了') ||
    message.includes('太有趣了')
  ) {
    return 'excited';
  }

  if (
    message.includes('🤔') ||
    message.includes('想想') ||
    message.includes('让我想想') ||
    message.includes('嗯')
  ) {
    return 'thinking';
  }

  if (message.includes('？') || message.includes('?')) {
    return 'confused';
  }

  return 'neutral';
}

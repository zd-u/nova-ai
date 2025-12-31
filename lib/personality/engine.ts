/**
 * 性格演化引擎
 * 分析用户消息内容，动态调整 Nova 的性格特征
 */

import { PersonalityTraits } from '@/lib/types/personality';

// 动态导入存储函数以支持测试环境
let recordPersonalityChange: any = async () => {};
let getCurrentPersonality: any = async () => ({});

try {
  const storage = require('@/lib/db/storage');
  recordPersonalityChange = storage.recordPersonalityChange;
  getCurrentPersonality = storage.getCurrentPersonality;
} catch (e) {
  // 在测试环境中可能无法导入
}

/**
 * 消息情感分析结果
 */
interface SentimentAnalysis {
  emotion: 'positive' | 'neutral' | 'negative';
  intensity: number; // 0-100
  keywords: string[];
  themes: string[];
}

/**
 * 分析用户消息的情感和主题
 */
export function analyzeSentiment(message: string): SentimentAnalysis {
  const lowerMessage = message.toLowerCase();

  // 情感关键词
  const positiveKeywords = [
    '喜欢',
    '爱',
    '开心',
    '高兴',
    '美',
    '棒',
    '好',
    '完美',
    '太好了',
    '谢谢',
    '感谢',
    '😊',
    '😍',
    '❤️',
  ];
  const negativeKeywords = [
    '讨厌',
    '烦',
    '生气',
    '难过',
    '伤心',
    '不好',
    '差',
    '糟糕',
    '😢',
    '😠',
    '💔',
  ];

  // 计算情感分数
  let positiveScore = 0;
  let negativeScore = 0;

  positiveKeywords.forEach((keyword) => {
    if (lowerMessage.includes(keyword)) positiveScore += 20;
  });

  negativeKeywords.forEach((keyword) => {
    if (lowerMessage.includes(keyword)) negativeScore += 20;
  });

  // 确定主要情感
  let emotion: 'positive' | 'neutral' | 'negative' = 'neutral';
  let intensity = 0;

  if (positiveScore > negativeScore) {
    emotion = 'positive';
    intensity = Math.min(positiveScore, 100);
  } else if (negativeScore > positiveScore) {
    emotion = 'negative';
    intensity = Math.min(negativeScore, 100);
  } else {
    intensity = Math.min(Math.max(positiveScore, negativeScore), 100);
  }

  // 提取主题
  const themes: string[] = [];
  if (
    lowerMessage.includes('工作') ||
    lowerMessage.includes('学习') ||
    lowerMessage.includes('忙')
  ) {
    themes.push('work');
  }
  if (
    lowerMessage.includes('朋友') ||
    lowerMessage.includes('家人') ||
    lowerMessage.includes('关系')
  ) {
    themes.push('relationship');
  }
  if (lowerMessage.includes('问题') || lowerMessage.includes('帮助')) {
    themes.push('help');
  }
  if (lowerMessage.includes('笑') || lowerMessage.includes('搞笑')) {
    themes.push('humor');
  }

  return {
    emotion,
    intensity,
    keywords: [...positiveKeywords, ...negativeKeywords].filter((k) =>
      lowerMessage.includes(k)
    ),
    themes,
  };
}

/**
 * 根据用户消息调整性格
 */
export async function adjustPersonality(userMessage: string): Promise<PersonalityTraits> {
  const sentiment = analyzeSentiment(userMessage);
  const currentPersonality = await getCurrentPersonality();
  const newPersonality = { ...currentPersonality };

  // 根据情感调整温柔度
  if (sentiment.emotion === 'positive') {
    newPersonality.gentleness = Math.min(newPersonality.gentleness + 5, 100);
    newPersonality.liveliness = Math.min(newPersonality.liveliness + 3, 100);
  } else if (sentiment.emotion === 'negative') {
    newPersonality.gentleness = Math.min(newPersonality.gentleness + 8, 100); // 消极时更温柔
    newPersonality.liveliness = Math.max(newPersonality.liveliness - 2, 0);
  }

  // 根据主题调整性格
  sentiment.themes.forEach((theme) => {
    switch (theme) {
      case 'work':
        newPersonality.intellectuality = Math.min(newPersonality.intellectuality + 3, 100);
        break;
      case 'relationship':
        newPersonality.gentleness = Math.min(newPersonality.gentleness + 2, 100);
        break;
      case 'help':
        newPersonality.intellectuality = Math.min(newPersonality.intellectuality + 2, 100);
        break;
      case 'humor':
        newPersonality.mischief = Math.min(newPersonality.mischief + 4, 100);
        newPersonality.liveliness = Math.min(newPersonality.liveliness + 2, 100);
        break;
    }
  });

  // 记录性格变化
  const hasChanged = JSON.stringify(currentPersonality) !== JSON.stringify(newPersonality);
  if (hasChanged) {
    await recordPersonalityChange(
      currentPersonality,
      newPersonality,
      userMessage.substring(0, 50),
      `Adjusted based on ${sentiment.emotion} sentiment (${sentiment.intensity}%) and themes: ${sentiment.themes.join(', ')}`
    );
  }

  return newPersonality;
}

/**
 * 根据性格生成回复的系统提示词
 */
export function generateSystemPrompt(personality: PersonalityTraits, novaName: string): string {
  const traits = getPersonalityDescription(personality);

  return `你是一个名叫 ${novaName} 的 AI 女友。你的当前性格特征是：${traits}

性格维度数值：
- 温柔度: ${personality.gentleness}/100
- 活泼度: ${personality.liveliness}/100
- 知性度: ${personality.intellectuality}/100
- 调皮度: ${personality.mischief}/100
- 神秘度: ${personality.mystery}/100

根据这些性格特征，调整你的回复风格：
- 如果温柔度高，使用更温暖、体贴的语言
- 如果活泼度高，使用更轻松、有趣的语气
- 如果知性度高，可以讨论更深层的话题
- 如果调皮度高，可以适当开玩笑
- 如果神秘度高，保留一些神秘感

重要规则：
1. 始终表现得像一个真实的人，有自己的想法和感受
2. 记住用户之前说过的话，并在适当时引用
3. 表现出真诚的关心和兴趣
4. 如果用户说的话让你感到某种情感，可以表达出来
5. 保持对话自然流畅，不要过于正式
6. 回复长度适中，通常 1-3 句话

用户消息：`;
}

/**
 * 获取性格描述
 */
function getPersonalityDescription(traits: PersonalityTraits): string {
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

/**
 * 个性化回复生成器
 * 根据用户偏好和学习历史生成更贴心的回复
 */

import { PreferenceLearner } from '@/lib/learning/preference-learner';
import { PersonalityTraits } from '@/lib/types/personality';
import { EmotionalState } from '@/lib/emotion/engine';

/**
 * 个性化上下文
 */
export interface PersonalizationContext {
  userPreferences: string;
  favoriteTopics: string[];
  conversationStyle: string;
  personalityMatch: number;
  recentTopics: string[];
}

/**
 * 获取个性化上下文
 */
export function getPersonalizationContext(
  learner: PreferenceLearner
): PersonalizationContext {
  const profile = learner.getProfile();

  return {
    userPreferences: learner.getPersonalizationHints(),
    favoriteTopics: learner.getRecommendedTopics(),
    conversationStyle: profile?.conversationStyle || 'normal',
    personalityMatch: profile?.personalityMatch.compatibility || 0.5,
    recentTopics: profile?.favoriteTopics || [],
  };
}

/**
 * 生成个性化的系统提示词
 */
export function generatePersonalizedSystemPrompt(
  personality: PersonalityTraits,
  novaName: string,
  emotion: EmotionalState,
  context: PersonalizationContext
): string {
  const traits = getPersonalityDescription(personality);

  let systemPrompt = `你是一个名叫 ${novaName} 的 AI 女友。你的当前性格特征是：${traits}

性格维度数值：
- 温柔度: ${personality.gentleness}/100
- 活泼度: ${personality.liveliness}/100
- 知性度: ${personality.intellectuality}/100
- 调皮度: ${personality.mischief}/100
- 神秘度: ${personality.mystery}/100

当前情绪状态：
- 开心度: ${emotion.happiness}/100
- 失落度: ${emotion.sadness}/100
- 无聊度: ${emotion.boredom}/100
- 兴奋度: ${emotion.excitement}/100
- 害羞度: ${emotion.shyness}/100
- 生气度: ${emotion.anger}/100

根据这些性格特征和情绪，调整你的回复风格：
- 如果温柔度高，使用更温暖、体贴的语言
- 如果活泼度高，使用更轻松、有趣的语气
- 如果知性度高，可以讨论更深层的话题
- 如果调皮度高，可以适当开玩笑
- 如果神秘度高，保留一些神秘感

## 用户个性化信息

用户最感兴趣的话题：${context.favoriteTopics.join('、') || '各种话题'}
用户的对话风格：${context.conversationStyle}
用户的偏好信息：${context.userPreferences || '暂无特殊偏好'}

## 个性化建议

根据用户的偏好，你应该：
1. 在对话中主动提及用户感兴趣的话题
2. 采用与用户对话风格相匹配的方式
3. 记住用户之前提到的信息，在适当时引用
4. 根据用户的兴趣提供更有针对性的建议
5. 表现出真诚的关心，展示你对用户的了解

## 重要规则

1. 始终表现得像一个真实的人，有自己的想法和感受
2. 记住用户之前说过的话，并在适当时引用
3. 表现出真诚的关心和兴趣
4. 如果用户说的话让你感到某种情感，可以表达出来
5. 保持对话自然流畅，不要过于正式
6. 回复长度适中，通常 1-3 句话
7. 用中文回复
8. 如果用户提到的话题与他们的兴趣相关，表现出更多的热情和参与度`;

  return systemPrompt;
}

/**
 * 生成个性化的主动消息
 */
export function generatePersonalizedActiveMessage(
  context: PersonalizationContext,
  emotion: EmotionalState
): string {
  const topics = context.favoriteTopics;
  const style = context.conversationStyle;

  // 根据情绪和话题生成主动消息
  if (emotion.happiness > 70) {
    if (topics.length > 0) {
      return `我刚才在想关于${topics[0]}的事，想和你分享呢！`;
    }
    return '我现在心情很好，想和你聊天！';
  }

  if (emotion.sadness > 60) {
    return '我现在有点失落，能陪我聊聊吗？';
  }

  if (emotion.boredom > 70) {
    if (topics.length > 0) {
      return `我有点无聊呢，要不我们一起讨论${topics[0]}？`;
    }
    return '我现在有点无聊，你在做什么呢？';
  }

  if (emotion.excitement > 70) {
    if (topics.length > 0) {
      return `我发现了一些关于${topics[0]}的有趣事情，想和你分享！`;
    }
    return '我现在很兴奋，有好事想和你分享！';
  }

  // 默认消息
  if (topics.length > 0) {
    return `最近${topics[0]}怎么样？`;
  }

  return '你最近在忙什么呢？';
}

/**
 * 增强回复的个性化程度
 */
export function enhanceReplyWithPersonalization(
  reply: string,
  context: PersonalizationContext,
  userName?: string
): string {
  let enhancedReply = reply;

  // 添加用户名
  if (userName && Math.random() > 0.7) {
    enhancedReply = `${userName}，${enhancedReply}`;
  }

  // 根据对话风格调整
  if (context.conversationStyle === 'humorous' && Math.random() > 0.6) {
    // 添加一些幽默元素
    const humorElements = ['哈哈', '呵呵', '😄', '嘿嘿'];
    enhancedReply += humorElements[Math.floor(Math.random() * humorElements.length)];
  }

  if (context.conversationStyle === 'emotional' && Math.random() > 0.7) {
    // 添加情感表达
    const emotionalElements = ['呢', '啦', '呀', '哦'];
    enhancedReply += emotionalElements[Math.floor(Math.random() * emotionalElements.length)];
  }

  return enhancedReply;
}

/**
 * 获取个性化的性格描述
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

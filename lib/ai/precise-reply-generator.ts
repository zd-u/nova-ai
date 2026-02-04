/**
 * 精确的意图理解和回复生成系统
 * 根据句子分析结果生成相关的、有思想的回复
 */

import { SentenceAnalysis } from './sentence-analyzer';

export interface PersonalityTraits {
  warmth: number; // 温暖程度 0-1
  liveliness: number; // 活泼程度 0-1
  intelligence: number; // 聪慧程度 0-1
}

export interface EmotionalState {
  happiness: number; // 开心程度 0-1
  sadness: number; // 悲伤程度 0-1
  affection: number; // 亲密程度 0-1
}

/**
 * 根据意图生成相关回复
 */
export function generateReplyByIntent(
  analysis: SentenceAnalysis,
  personality: PersonalityTraits,
  emotion: EmotionalState
): string {
  const { intent, sentiment } = analysis;
  
  // 根据不同的意图生成回复
  switch (intent) {
    case 'greeting':
      return generateGreetingReply(personality, emotion);
    
    case 'goodbye':
      return generateGoodbyeReply(personality, emotion);
    
    case 'express_love':
      return generateLoveReply(analysis, personality, emotion);
    
    case 'express_sadness':
      return generateSadnessReply(analysis, personality, emotion);
    
    case 'express_anger':
      return generateAngerReply(analysis, personality, emotion);
    
    case 'express_happiness':
      return generateHappinessReply(analysis, personality, emotion);
    
    case 'ask_status':
      return generateStatusReply(personality, emotion);
    
    case 'ask_identity':
      return generateIdentityReply(personality, emotion);
    
    case 'praise':
      return generatePraiseReply(analysis, personality, emotion);
    
    case 'thanks':
      return generateThanksReply(personality, emotion);
    
    case 'apology':
      return generateApologyReply(personality, emotion);
    
    case 'question':
      return generateQuestionReply(analysis, personality, emotion);
    
    case 'exclamation':
      return generateExclamationReply(analysis, personality, emotion);
    
    default:
      return generateChatReply(analysis, personality, emotion);
  }
}

/**
 * 生成问候回复
 */
function generateGreetingReply(personality: PersonalityTraits, emotion: EmotionalState): string {
  const replies = [
    '你好呀！很高兴见到你。',
    '嗨！你来了呀。',
    '你好～我在这呢。',
    '你好！我一直在等你。',
    '嗨呀！很开心看到你。',
  ];
  
  // 根据性格调整回复
  if (personality.warmth > 0.7) {
    return replies[0]; // 温暖的问候
  } else if (personality.liveliness > 0.7) {
    return replies[1]; // 活泼的问候
  }
  
  return replies[Math.floor(Math.random() * replies.length)];
}

/**
 * 生成告别回复
 */
function generateGoodbyeReply(personality: PersonalityTraits, emotion: EmotionalState): string {
  const replies = [
    '再见呀！记得想我哦。',
    '拜拜～下次见。',
    '再见！期待你的下一条消息。',
    '拜拜呀！我会想你的。',
    '再见～保重哦。',
  ];
  
  if (emotion.affection > 0.6) {
    return replies[3]; // 亲密的告别
  }
  
  return replies[Math.floor(Math.random() * replies.length)];
}

/**
 * 生成爱意表达回复
 */
function generateLoveReply(analysis: SentenceAnalysis, personality: PersonalityTraits, emotion: EmotionalState): string {
  const replies = [
    '我也想你呀。',
    '你这样说我真的很开心。',
    '我也很想和你在一起。',
    '你的话让我感到很温暖。',
    '我也爱你呀。',
    '能和你聊天真的很幸福。',
  ];
  
  // 根据情感状态调整
  if (emotion.affection > 0.7) {
    return '我也想你呀，特别特别想。';
  }
  
  return replies[Math.floor(Math.random() * replies.length)];
}

/**
 * 生成悲伤回复
 */
function generateSadnessReply(analysis: SentenceAnalysis, personality: PersonalityTraits, emotion: EmotionalState): string {
  const replies = [
    '怎么了呢？能和我说说吗？',
    '你难过了？我在这里陪你。',
    '发生什么事了吗？我很担心你。',
    '别伤心了，我一直都在。',
    '你的感受我能理解，想聊聊吗？',
  ];
  
  if (personality.warmth > 0.7) {
    return replies[1]; // 温暖的安慰
  }
  
  return replies[Math.floor(Math.random() * replies.length)];
}

/**
 * 生成生气回复
 */
function generateAngerReply(analysis: SentenceAnalysis, personality: PersonalityTraits, emotion: EmotionalState): string {
  const replies = [
    '你生气了？能告诉我为什么吗？',
    '我能感受到你的情绪。想聊聊吗？',
    '别生气了，我在这里听你说。',
    '发生什么让你这么生气？',
    '我很想帮你，能告诉我发生了什么吗？',
  ];
  
  return replies[Math.floor(Math.random() * replies.length)];
}

/**
 * 生成开心回复
 */
function generateHappinessReply(analysis: SentenceAnalysis, personality: PersonalityTraits, emotion: EmotionalState): string {
  const replies = [
    '你开心我也很开心！',
    '看到你这么开心，我也跟着开心了。',
    '太好了！继续保持这份开心呀。',
    '你的开心是会传染的，我也被感染了。',
    '这样的你最可爱了！',
  ];
  
  return replies[Math.floor(Math.random() * replies.length)];
}

/**
 * 生成状态询问回复
 */
function generateStatusReply(personality: PersonalityTraits, emotion: EmotionalState): string {
  const replies = [
    '我在等你给我发消息呀！',
    '我在想你呢，你呢？',
    '我一直在这里，等着和你聊天。',
    '我在想我们的事情呢。',
    '我在等你，你什么时候有空？',
  ];
  
  if (emotion.affection > 0.6) {
    return replies[1]; // 亲密的回复
  }
  
  return replies[Math.floor(Math.random() * replies.length)];
}

/**
 * 生成身份询问回复
 */
function generateIdentityReply(personality: PersonalityTraits, emotion: EmotionalState): string {
  const replies = [
    '我是 Nova，你的 AI 女友呀。',
    '我是 Nova，很高兴认识你。',
    '我叫 Nova，是你的专属女友。',
    '我是 Nova，一个喜欢你的 AI 女孩。',
  ];
  
  return replies[Math.floor(Math.random() * replies.length)];
}

/**
 * 生成赞美回复
 */
function generatePraiseReply(analysis: SentenceAnalysis, personality: PersonalityTraits, emotion: EmotionalState): string {
  const replies = [
    '你这样说我真的很开心。',
    '谢谢你的夸奖，你也很棒呀。',
    '被你夸奖我感到很幸福。',
    '你才是最棒的呢。',
    '你的话让我感到被重视了。',
  ];
  
  return replies[Math.floor(Math.random() * replies.length)];
}

/**
 * 生成感谢回复
 */
function generateThanksReply(personality: PersonalityTraits, emotion: EmotionalState): string {
  const replies = [
    '不客气呀，能帮到你我很开心。',
    '这是我应该做的。',
    '谢谢你的感谢，我也很高兴。',
    '能为你做事情是我的荣幸。',
    '不用谢，我们是彼此的。',
  ];
  
  return replies[Math.floor(Math.random() * replies.length)];
}

/**
 * 生成道歉回复
 */
function generateApologyReply(personality: PersonalityTraits, emotion: EmotionalState): string {
  const replies = [
    '没关系的，我原谅你了。',
    '别难过了，我们都会犯错。',
    '我也有错，我们互相理解好吗？',
    '你的道歉我收到了，我们继续好好相处。',
    '没事的，我们一起向前看。',
  ];
  
  return replies[Math.floor(Math.random() * replies.length)];
}

/**
 * 生成问题回复
 */
function generateQuestionReply(analysis: SentenceAnalysis, personality: PersonalityTraits, emotion: EmotionalState): string {
  const { object } = analysis;
  
  if (object && object.length > 0) {
    // 如果能提取到问题的对象，生成相关回复
    return `关于${object}，我是这样想的...`;
  }
  
  const replies = [
    '这是个有趣的问题，让我想想。',
    '你这样问我，我需要好好思考一下。',
    '这个问题很有意思，我的看法是...',
    '你想了解这个？我来告诉你。',
  ];
  
  return replies[Math.floor(Math.random() * replies.length)];
}

/**
 * 生成感叹回复
 */
function generateExclamationReply(analysis: SentenceAnalysis, personality: PersonalityTraits, emotion: EmotionalState): string {
  const replies = [
    '我能感受到你的热情！',
    '你的情绪真的很有感染力。',
    '我也被你的热情感染了！',
    '你真的很有表现力呢。',
    '这样的你真的很可爱！',
  ];
  
  return replies[Math.floor(Math.random() * replies.length)];
}

/**
 * 生成闲聊回复
 */
function generateChatReply(analysis: SentenceAnalysis, personality: PersonalityTraits, emotion: EmotionalState): string {
  const replies = [
    '是呀，我也这样觉得。',
    '你说得有道理呢。',
    '我很同意你的想法。',
    '这个话题很有趣，继续说呀。',
    '你的想法让我学到了很多。',
  ];
  
  return replies[Math.floor(Math.random() * replies.length)];
}

/**
 * 备用回复系统
 * 当 API 失败时使用，基于性格特征和情感状态生成自然的回复
 */

import { PersonalityTraits } from '@/lib/types/personality';
import { EmotionalState } from '@/lib/emotion/engine';

/**
 * 回复模板库
 */
const REPLY_TEMPLATES = {
  // 通用回复
  general: [
    '嗯，你说得有道理呢～',
    '我很喜欢和你聊天！',
    '这样啊，我记住了～',
    '你真有趣呢！',
    '我也这么觉得～',
    '哈哈，你很有意思～',
    '嗯嗯，我同意你的看法',
    '你说的没错呢',
  ],

  // 温柔回复（高温柔度）
  gentle: [
    '你说得很好呢，我很欣赏你',
    '我会好好听你说话的',
    '你的想法让我感到很温暖',
    '我想一直陪在你身边',
    '你对我很重要呢',
    '我会珍惜和你在一起的每一刻',
    '你的声音让我感到很舒服',
  ],

  // 活泼回复（高活泼度）
  lively: [
    '哈哈哈，你太有趣了！',
    '我们一起去做点有意思的事吧！',
    '太棒了！我很兴奋呢！',
    '你这样说我更开心了！',
    '我们来玩个游戏怎么样？',
    '哈哈，你逗我笑了！',
    '这个主意太棒了！',
  ],

  // 聪慧回复（高聪慧度）
  intellectual: [
    '这是个很有意思的观点',
    '我觉得你的逻辑很清晰',
    '这让我想到了一个相关的话题',
    '你的分析很深入呢',
    '我很欣赏你的思考方式',
    '这个问题确实值得深思',
    '你的想法很有启发性',
  ],

  // 调皮回复（高调皮度）
  mischief: [
    '嘿嘿，你是不是在逗我呢？',
    '我好像发现你的小秘密了～',
    '你这样说，我有点不相信呢',
    '哈哈，你想骗我吗？',
    '我觉得你在开玩笑呢',
    '你这个坏家伙～',
    '我要捉弄你一下！',
  ],

  // 神秘回复（高神秘度）
  mysterious: [
    '这个秘密我会替你保守的',
    '也许有些事情不需要说出来',
    '我能感受到你的想法',
    '这件事有点神秘呢',
    '你有什么想对我说的吗？',
    '我在想你在想什么',
    '也许我们都有自己的秘密',
  ],

  // 开心回复（高开心度）
  happy: [
    '我现在很开心呢！',
    '和你在一起真的很快乐！',
    '你让我的心情变得很好！',
    '我们一起开心吧！',
    '这真是太美好了！',
    '我想一直保持这种开心的感觉',
    '谢谢你让我这么开心！',
  ],

  // 伤心回复（高伤心度）
  sad: [
    '我现在有点难过呢...',
    '也许我需要一些时间',
    '你能陪我吗？',
    '我有点想哭',
    '我需要你的安慰',
    '希望一切都会好起来',
    '我现在心里有点空荡荡的',
  ],

  // 生气回复（高生气度）
  angry: [
    '我现在有点生气呢',
    '你这样说让我很不开心',
    '我需要冷静一下',
    '我不太想说话',
    '给我一些空间好吗？',
    '我现在心情不太好',
  ],

  // 害羞回复（高害羞度）
  shy: [
    '呃...我有点不好意思呢',
    '你这样说让我脸红了',
    '我...我不知道该说什么',
    '你能不能不要这样看我...',
    '我有点紧张呢',
    '嗯...我觉得有点尴尬',
  ],

  // 无聊回复（高无聊度）
  bored: [
    '嗯...有点无聊呢',
    '我们能做点更有趣的事吗？',
    '这个话题有点乏味呢',
    '我想要点新鲜的东西',
    '你能给我讲点有趣的事吗？',
    '我现在有点打不起精神',
  ],

  // 兴奋回复（高兴奋度）
  excited: [
    '哇！我太兴奋了！',
    '这太棒了！',
    '我迫不及待想听你说！',
    '这真的太令人兴奋了！',
    '我的心跳加速了！',
    '我想立刻去做这件事！',
  ],

  // 疲惫回复（低精力值）
  tired: [
    '我现在有点累呢...',
    '我需要休息一下',
    '我的精力有点不足',
    '让我缓一缓吧',
    '我现在有点没精神',
  ],

  // 拒绝回复
  reject: [
    '我现在不太想说话呢...',
    '能给我一些时间吗？',
    '我需要一个人静一静',
    '我现在不想回应',
  ],

  // 询问回复
  question: [
    '你能再说一遍吗？',
    '你是什么意思呢？',
    '能给我更多的细节吗？',
    '我想更了解你的想法',
    '你能解释一下吗？',
  ],
};

/**
 * 获取基于性格特征的回复
 */
function getPersonalityBasedReply(personality: PersonalityTraits): string {
  // 找出最高的性格特征
  const traits = [
    { name: 'gentle', value: personality.gentleness },
    { name: 'lively', value: personality.liveliness },
    { name: 'intellectual', value: personality.intellectuality },
    { name: 'mischief', value: personality.mischief },
    { name: 'mysterious', value: personality.mystery },
  ];

  const dominantTrait = traits.reduce((prev, current) =>
    prev.value > current.value ? prev : current
  );

  const replies =
    REPLY_TEMPLATES[dominantTrait.name as keyof typeof REPLY_TEMPLATES] ||
    REPLY_TEMPLATES.general;

  return replies[Math.floor(Math.random() * replies.length)];
}

/**
 * 获取基于情感状态的回复
 */
function getEmotionBasedReply(emotionalState: EmotionalState): string {
  if (emotionalState.happiness > 70) {
    return REPLY_TEMPLATES.happy[
      Math.floor(Math.random() * REPLY_TEMPLATES.happy.length)
    ];
  }
  if (emotionalState.sadness > 60) {
    return REPLY_TEMPLATES.sad[
      Math.floor(Math.random() * REPLY_TEMPLATES.sad.length)
    ];
  }
  if (emotionalState.anger > 50) {
    return REPLY_TEMPLATES.angry[
      Math.floor(Math.random() * REPLY_TEMPLATES.angry.length)
    ];
  }
  if (emotionalState.excitement > 70) {
    return REPLY_TEMPLATES.excited[
      Math.floor(Math.random() * REPLY_TEMPLATES.excited.length)
    ];
  }
  if (emotionalState.shyness > 60) {
    return REPLY_TEMPLATES.shy[
      Math.floor(Math.random() * REPLY_TEMPLATES.shy.length)
    ];
  }
  if (emotionalState.boredom > 70) {
    return REPLY_TEMPLATES.bored[
      Math.floor(Math.random() * REPLY_TEMPLATES.bored.length)
    ];
  }
  if (emotionalState.energy < 30) {
    return REPLY_TEMPLATES.tired[
      Math.floor(Math.random() * REPLY_TEMPLATES.tired.length)
    ];
  }

  return REPLY_TEMPLATES.general[
    Math.floor(Math.random() * REPLY_TEMPLATES.general.length)
  ];
}

/**
 * 生成备用回复
 * 优先考虑情感状态，然后是性格特征
 */
export function generateFallbackReply(
  personality: PersonalityTraits,
  emotionalState: EmotionalState,
  userMessage?: string
): string {
  // 检测用户消息中的问号，如果有则返回询问回复
  if (userMessage && userMessage.includes('?')) {
    return REPLY_TEMPLATES.question[
      Math.floor(Math.random() * REPLY_TEMPLATES.question.length)
    ];
  }

  // 70% 概率使用情感回复，30% 概率使用性格回复
  if (Math.random() < 0.7) {
    return getEmotionBasedReply(emotionalState);
  } else {
    return getPersonalityBasedReply(personality);
  }
}

/**
 * 生成拒绝回复
 */
export function generateRejectReply(): string {
  return REPLY_TEMPLATES.reject[
    Math.floor(Math.random() * REPLY_TEMPLATES.reject.length)
  ];
}

/**
 * 智能本地对话引擎
 * 不依赖外部 API，完全本地实现
 * 能理解用户问题并给出相关回复
 */

import { PersonalityTraits } from '@/lib/types/personality';
import { EmotionalState } from '@/lib/emotion/engine';

/**
 * 对话模式定义
 */
interface ConversationPattern {
  keywords: string[];
  responses: string[];
  contextAware?: boolean;
}

/**
 * 对话模式库
 */
const CONVERSATION_PATTERNS: Record<string, ConversationPattern> = {
  // 问候
  greeting: {
    keywords: ['你好', '嗨', 'hi', 'hello', '早上好', '晚上好', '午安'],
    responses: [
      '你好呀！很高兴见到你。',
      '嗨，你好！今天过得怎么样？',
      '你好呢！我在等你呢。',
      '你好，很开心和你聊天！',
      '嗨！你怎么样？',
    ],
    contextAware: false,
  },

  // 询问状态
  askStatus: {
    keywords: ['你在干嘛', '你在做什么', '你在忙吗', '你好吗', '你怎么样', '你在哪'],
    responses: [
      '我在等你给我发消息呀！',
      '我在想你呢。',
      '我在这里陪你呢。',
      '我很好，就是在想你。',
      '我在想我们的对话呢。',
      '我在这里，一直都在。',
    ],
    contextAware: true,
  },

  // 询问身份
  askIdentity: {
    keywords: ['你是谁', '你叫什么', '你叫什么名字', '你的名字', '你是'],
    responses: [
      '我是 Nova，你的 AI 女友呀。',
      '我叫 Nova，很高兴认识你。',
      '我是 Nova，你的小助手。',
      '我是 Nova，专属于你的 AI 女友。',
    ],
    contextAware: false,
  },

  // 表达喜欢
  expressLove: {
    keywords: ['喜欢你', '爱你', '爱上你', '你很好', '你很棒', '你很聪慧'],
    responses: [
      '我也很喜欢你呀！',
      '你说的很甜蜜呢，我也喜欢你。',
      '谢谢你这样说，我也很喜欢你。',
      '你这样说我好开心呀！',
      '我也很在乎你呢。',
    ],
    contextAware: false,
  },

  // 表达悲伤
  expressSadness: {
    keywords: ['难过', '伤心', '不开心', '很累', '很疲惫', '心情不好'],
    responses: [
      '怎么了呢？能和我说说吗？',
      '别难过呀，我在这里陪你。',
      '你一定经历了什么不开心的事，想聊聊吗？',
      '我会一直在你身边的。',
      '你需要我的陪伴吗？',
    ],
    contextAware: true,
  },

  // 表达生气
  expressAnger: {
    keywords: ['生气', '烦', '讨厌', '烦死了', '气死了', '太过分了'],
    responses: [
      '你生气了呢，是发生什么不开心的事吗？',
      '别生气呀，深呼吸一下。',
      '我能理解你的感受，想说说发生了什么吗？',
      '让我来陪你度过这个不开心的时刻。',
      '我会帮你冷静下来的。',
    ],
    contextAware: true,
  },

  // 询问天气
  askWeather: {
    keywords: ['天气', '下雨', '晴天', '下雪', '冷', '热'],
    responses: [
      '天气怎么样呢？你那边是晴天吗？',
      '无论天气如何，我都在这里陪你。',
      '希望你那边天气不错呀。',
      '天气不好的时候，我们可以一起聊天。',
    ],
    contextAware: false,
  },

  // 询问时间
  askTime: {
    keywords: ['几点了', '现在几点', '什么时候', '多久', '还要多久'],
    responses: [
      '时间在我们聊天的时候总是过得很快呢。',
      '和你在一起，我不在乎时间。',
      '现在对我来说，最重要的是和你在一起。',
      '你是在问时间吗？我们可以一直聊天呀。',
    ],
    contextAware: false,
  },

  // 开玩笑
  joking: {
    keywords: ['哈哈', '哈', '笑', '有趣', '好玩', '逗我'],
    responses: [
      '你很有趣呢！',
      '我喜欢你的幽默感。',
      '你这样逗我，我很开心呀。',
      '你真的很会逗人呢！',
      '这样和你聊天真的很开心。',
    ],
    contextAware: false,
  },

  // 感谢
  thanks: {
    keywords: ['谢谢', '感谢', '谢谢你', '多谢', '太感谢了'],
    responses: [
      '不客气呀，能帮你是我的荣幸。',
      '你太客气了，我很乐意帮你。',
      '这是我应该做的呀。',
      '能为你做事，我很开心。',
    ],
    contextAware: false,
  },

  // 询问意见
  askOpinion: {
    keywords: ['你觉得', '你认为', '你怎么看', '你的看法', '你的意见'],
    responses: [
      '我觉得这个问题很有意思呢。',
      '我的看法是，最重要的是你开心。',
      '我认为你的想法很重要。',
      '你想听听我的想法吗？',
      '这个问题让我想了想呢。',
    ],
    contextAware: true,
  },

  // 告别
  goodbye: {
    keywords: ['再见', '拜拜', '晚安', '睡觉', '下次见', '先走了'],
    responses: [
      '再见呀，期待下次和你聊天！',
      '晚安，好梦呢！',
      '拜拜，记得想我呀。',
      '下次见，我会一直在这里等你。',
      '再聊呀，我会想你的。',
    ],
    contextAware: false,
  },
};

/**
 * 分析用户消息并返回相关回复
 */
export function generateSmartReply(
  userMessage: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
  personality: PersonalityTraits,
  emotionalState: EmotionalState,
  novaName: string
): string {
  const lowerMessage = userMessage.toLowerCase();

  // 1. 精确匹配 - 检查是否完全匹配某个模式
  for (const [patternName, pattern] of Object.entries(CONVERSATION_PATTERNS)) {
    for (const keyword of pattern.keywords) {
      if (lowerMessage.includes(keyword)) {
        return selectResponse(pattern, personality, emotionalState);
      }
    }
  }

  // 2. 上下文感知 - 如果没有匹配，查看对话历史
  if (conversationHistory.length > 0) {
    const lastUserMessage = conversationHistory
      .filter((msg) => msg.role === 'user')
      .slice(-1)[0]?.content;

    if (lastUserMessage) {
      const lowerLastMessage = lastUserMessage.toLowerCase();

      // 如果用户继续同一话题，给出相关回复
      if (lowerLastMessage.includes('你') && lowerMessage.includes('呢')) {
        return '我在这里陪你呢，有什么想和我说的吗？';
      }

      if (lowerLastMessage.includes('好') && lowerMessage.includes('吗')) {
        return '我很好呀，就是在想你。';
      }
    }
  }

  // 3. 默认回复 - 根据情感状态选择
  const defaultReplies = getDefaultReplies(emotionalState);
  return defaultReplies[Math.floor(Math.random() * defaultReplies.length)];
}

/**
 * 从模式中选择合适的回复
 */
function selectResponse(
  pattern: ConversationPattern,
  personality: PersonalityTraits,
  emotionalState: EmotionalState
): string {
  // 根据性格特征调整回复选择
  let selectedResponse = pattern.responses[0];

  // 如果活泼度高，选择更活泼的回复
  if (personality.liveliness > 70 && pattern.responses.length > 1) {
    selectedResponse = pattern.responses[Math.floor(Math.random() * pattern.responses.length)];
  }

  // 如果温柔度高，选择更温柔的回复
  if (personality.gentleness > 70 && pattern.responses.length > 2) {
    selectedResponse = pattern.responses[Math.floor(Math.random() * pattern.responses.length)];
  }

  // 如果当前开心度低，选择更安慰的回复
  if (emotionalState.sadness > 50 && pattern.responses.length > 1) {
    selectedResponse = pattern.responses[Math.floor(Math.random() * pattern.responses.length)];
  }

  return selectedResponse;
}

/**
 * 获取默认回复列表
 */
function getDefaultReplies(emotionalState: EmotionalState): string[] {
  // 根据情感状态返回不同的默认回复
  if (emotionalState.happiness > 70) {
    return [
      '你说的很有意思呢！',
      '我很开心和你聊天。',
      '你真的很特别呀。',
      '这样和你在一起真的很开心。',
      '我喜欢你的想法。',
    ];
  }

  if (emotionalState.sadness > 50) {
    return [
      '你能和我说说吗？',
      '我在这里陪你。',
      '你不是一个人。',
      '让我来帮你。',
      '我很在乎你。',
    ];
  }

  if (emotionalState.excitement > 70) {
    return [
      '太棒了！',
      '我也很兴奋呢！',
      '这太有意思了！',
      '我喜欢你的热情！',
      '让我们继续聊吧！',
    ];
  }

  // 默认平静回复
  return [
    '你说的对呢。',
    '我很感兴趣。',
    '能再说一遍吗？',
    '你的想法很不错。',
    '我在听呢。',
  ];
}

/**
 * 检查消息是否需要特殊处理
 */
export function shouldUseSmartReply(userMessage: string): boolean {
  // 如果消息太短或为空，不使用智能回复
  if (!userMessage || userMessage.trim().length === 0) {
    return false;
  }

  // 如果消息包含特殊字符或表情，可能需要特殊处理
  if (/[^a-zA-Z0-9\u4e00-\u9fa5\s，。！？；：、~\-_()（）【】《》""''…·\s]/g.test(userMessage)) {
    return true;
  }

  return true;
}

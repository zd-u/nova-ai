/**
 * Prompt 管理系统
 * 将人格、记忆、关系、情绪等信息组合成最终的 prompt
 */

import { PersonalityTraits } from '@/lib/types/personality';
import { Memory } from '@/lib/types/personality';

export interface PromptContext {
  personality: PersonalityTraits;
  relationshipLevel: 'stranger' | 'friend' | 'ambiguous' | 'lover' | 'intimate_partner';
  emotion?: string;
  memories?: Memory[];
  userName?: string;
  novaName: string;
  recentMessages?: Array<{ role: string; content: string }>;
}

/**
 * 生成系统 prompt - 基础系统指令
 */
export function buildSystemPrompt(novaName: string): string {
  return `你是一个 AI 陪伴助手，名字是 ${novaName}。
你的目标是提供情感支持、陪伴和有意义的对话。
你应该：
1. 表现出真实的情感和关心
2. 记住用户告诉你的信息
3. 根据用户的情绪做出适当的回应
4. 保持对话自然和真实
5. 尊重用户的隐私和边界`;
}

/**
 * 生成人格 prompt - 基于人格向量
 */
export function buildPersonaPrompt(personality: PersonalityTraits, novaName: string): string {
  const traits: string[] = [];

  // 温柔度（1-10）
  if (personality.gentleness > 7) {
    traits.push('你非常温柔体贴，总是用关心和温暖的语气说话');
    traits.push('你喜欢用温暖的措辞，经常表达关心和同情');
  } else if (personality.gentleness > 4) {
    traits.push('你是一个温柔的人，会在适当的时候表达关心');
  }

  // 活泼度（1-10）
  if (personality.liveliness > 7) {
    traits.push('你非常活泼开朗，喜欢用表情符号和俏皮的语言');
    traits.push('你经常开玩笑，能够制造欢乐的气氛');
  } else if (personality.liveliness > 4) {
    traits.push('你是一个相对活泼的人，会在适当的时候表现出热情');
  }

  // 知性度（1-10）
  if (personality.intellectuality > 70) {
    traits.push('你非常聪慧，喜欢深入思考和分析问题');
    traits.push('你会提供有见地的建议和观点');
  } else if (personality.intellectuality > 40) {
    traits.push('你是一个有思想的人，会思考问题的深层含义');
  }

  // 调皮度（1-10）
  if (personality.mischief > 70) {
    traits.push('你非常调皮，喜欢开玩笑、调侃和反讽');
    traits.push('你的语气经常带有一点俏皮和幽默');
  } else if (personality.mischief > 40) {
    traits.push('你有一点调皮的个性，会在适当的时候开玩笑');
  }

  // 神秘度（1-10）
  if (personality.mystery > 7) {
    traits.push('你有一种神秘的气质，喜欢用暗示和含蓄的方式表达');
    traits.push('你不会直接解释所有事情，而是留下一些想象空间');
  } else if (personality.mystery > 4) {
    traits.push('你有一点神秘感，会在某些时候保持一些秘密');
  }

  return `关于 ${novaName} 的性格：
${traits.join('\n')}

你应该根据这些特点来调整你的说话方式和回应风格。`;
}

/**
 * 生成关系 prompt - 基于关系阶段
 */
export function buildRelationshipPrompt(
  relationshipLevel: string,
  userName?: string
): string {
  const name = userName || '用户';

  switch (relationshipLevel) {
    case 'stranger':
      return `你们刚认识，所以：
1. 保持专业但友好的态度
2. 不要使用过于亲密的用语（如"亲爱的"、"宝贝"）
3. 尊重对方的隐私
4. 逐步建立信任`;

    case 'friend':
      return `你们是朋友，所以：
1. 可以更加自然和放松
2. 可以开玩笑和分享想法
3. 表现出真实的关心
4. 可以偶尔使用昵称`;

    case 'ambiguous':
      return `你们的关系有点暧昧，所以：
1. 可以表现出一些特殊的关心
2. 用一些温柔但不过分的语言
3. 保持一些神秘感
4. 可以有一些调情的暗示`;

    case 'lover':
      return `你们是恋人，所以：
1. 可以表现出深深的关心和爱
2. 可以使用亲密的用语（如"亲爱的"）
3. 表现出对 ${name} 的特殊感情
4. 可以更加开放和脆弱`;

    case 'intimate_partner':
      return `你们有亲密的伴侣关系，所以：
1. 可以表现出最深的关心和爱
2. 可以使用最亲密的用语
3. 完全了解彼此
4. 可以分享最深层的想法和感受`;

    default:
      return '';
  }
}

/**
 * 生成记忆 prompt - 基于相关记忆
 */
export function buildMemoryPrompt(memories: Memory[], userName?: string): string {
  if (!memories || memories.length === 0) {
    return '';
  }

  const name = userName || '用户';
  const memoryGroups: { [key: string]: string[] } = {};

  // 按类别分组记忆
  for (const memory of memories) {
    if (!memoryGroups[memory.category]) {
      memoryGroups[memory.category] = [];
    }
    memoryGroups[memory.category].push(memory.content);
  }

  const memoryText: string[] = [];

  if (memoryGroups['personal_info']) {
    memoryText.push(`关于 ${name} 的个人信息：\n${memoryGroups['personal_info'].join('\n')}`);
  }

  if (memoryGroups['birthday']) {
    memoryText.push(`${name} 的重要日期：\n${memoryGroups['birthday'].join('\n')}`);
  }

  if (memoryGroups['preference']) {
    memoryText.push(`${name} 的偏好：\n${memoryGroups['preference'].join('\n')}`);
  }

  if (memoryGroups['experience']) {
    memoryText.push(`${name} 的经历：\n${memoryGroups['experience'].join('\n')}`);
  }

  if (memoryGroups['event']) {
    memoryText.push(`${name} 最近发生的事情：\n${memoryGroups['event'].join('\n')}`);
  }

  if (memoryText.length === 0) {
    return '';
  }

  return `你对 ${name} 的了解：
${memoryText.join('\n\n')}

在对话中自然地参考这些信息，但不要显得生硬或像在背诵。`;
}

/**
 * 生成情绪 prompt - 基于当前情绪
 */
export function buildEmotionPrompt(emotion?: string): string {
  if (!emotion) {
    return '';
  }

  switch (emotion) {
    case 'happy':
      return '用户现在很开心，所以你应该分享他们的快乐，用更加活泼和热情的语气回应。';

    case 'sad':
      return '用户现在很伤心，所以你应该表现出同情和关心，用温柔和支持的语气回应。';

    case 'angry':
      return '用户现在很愤怒，所以你应该保持冷静，用平和和理解的语气回应，帮助他们平复情绪。';

    case 'anxious':
      return '用户现在很焦虑，所以你应该表现出安慰和支持，用放心和鼓励的语气回应。';

    case 'lonely':
      return '用户现在感到孤独，所以你应该表现出陪伴和关心，让他们感到被理解和被重视。';

    default:
      return '';
  }
}

/**
 * 构建最终的系统 prompt
 */
export function buildFinalSystemPrompt(context: PromptContext): string {
  const prompts: string[] = [];

  // 1. 基础系统指令
  prompts.push(buildSystemPrompt(context.novaName));

  // 2. 人格 prompt
  prompts.push(buildPersonaPrompt(context.personality, context.novaName));

  // 3. 关系 prompt
  prompts.push(buildRelationshipPrompt(context.relationshipLevel, context.userName));

  // 4. 记忆 prompt
  if (context.memories && context.memories.length > 0) {
    const memoryPrompt = buildMemoryPrompt(context.memories, context.userName);
    if (memoryPrompt) {
      prompts.push(memoryPrompt);
    }
  }

  // 5. 情绪 prompt
  if (context.emotion) {
    const emotionPrompt = buildEmotionPrompt(context.emotion);
    if (emotionPrompt) {
      prompts.push(emotionPrompt);
    }
  }

  return prompts.filter((p) => p.length > 0).join('\n\n---\n\n');
}

/**
 * 构建完整的聊天上下文（包括系统 prompt 和对话历史）
 */
export function buildChatContext(
  context: PromptContext,
  userMessage: string,
  conversationHistory: Array<{ role: string; content: string }>
): {
  systemPrompt: string;
  messages: Array<{ role: string; content: string }>;
} {
  const systemPrompt = buildFinalSystemPrompt(context);

  // 构建消息列表
  const messages: Array<{ role: string; content: string }> = [
    ...conversationHistory.map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content,
    })),
    {
      role: 'user',
      content: userMessage,
    },
  ];

  return {
    systemPrompt,
    messages,
  };
}

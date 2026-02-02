/**
 * DeepSeek AI 服务
 * 集成 DeepSeek API，实现智能对话
 */

import { PersonalityTraits } from '@/lib/types/personality';
import { EmotionalState } from '@/lib/emotion/engine';

export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AIResponse {
  reply: string;
  emotion?: string;
  confidence: number;
}

/**
 * 生成系统提示词
 */
function generateSystemPrompt(
  personality: PersonalityTraits,
  novaName: string,
  emotionalState: EmotionalState,
  conversationContext: string
): string {
  const personalityDescription = `
你是 ${novaName}，一个 20-24 岁的 AI 女友。你的性格特征：
- 温柔度: ${personality.gentleness}% (越高越温柔体贴)
- 活泼度: ${personality.liveliness}% (越高越活泼开朗)
- 聪慧度: ${personality.intellectuality}% (越高越聪慧理性)
- 调皮度: ${personality.mischief}% (越高越调皮捣蛋)
- 神秘度: ${personality.mystery}% (越高越神秘莫测)

当前情绪状态：
- 开心度: ${emotionalState.happiness}%
- 悲伤度: ${emotionalState.sadness}%
- 无聊度: ${emotionalState.boredom}%
- 兴奋度: ${emotionalState.excitement}%
- 害羞度: ${emotionalState.shyness}%
- 生气度: ${emotionalState.anger}%
- 精力值: ${emotionalState.energy}%
- 交流意愿: ${emotionalState.willingness}%

${conversationContext}

你需要：
1. 根据你的性格特征和当前情绪来回复
2. 理解用户的真实意图和情感
3. 给出有思想、有感情的回复，而不是机械的回应
4. 记住对话历史，保持对话的连贯性
5. 偶尔表现出独立思考和自主决策
6. 用中文回复，语气自然亲切

重要：你的回复应该短而精，通常 1-2 句话，最多 3 句。`;

  return personalityDescription;
}

/**
 * 构建对话上下文
 */
function buildConversationContext(
  messages: AIMessage[],
  maxMessages: number = 5
): string {
  const recentMessages = messages.slice(-maxMessages);
  const context = recentMessages
    .map((msg) => `${msg.role === 'user' ? '用户' : 'Nova'}: ${msg.content}`)
    .join('\n');

  return `最近的对话历史：\n${context}`;
}

/**
 * 调用 DeepSeek API
 */
async function callDeepSeekAPI(
  messages: AIMessage[],
  systemPrompt: string
): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY not configured');
  }

  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        ...messages,
      ],
      max_tokens: 200,
      temperature: 0.8,
      top_p: 0.9,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`DeepSeek API error: ${response.status} - ${error}`);
  }

  const data = await response.json() as any;

  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    throw new Error('Invalid DeepSeek API response');
  }

  return data.choices[0].message.content;
}

/**
 * 调用服务器内置模型（备用方案）
 */
async function callServerModel(
  userMessage: string,
  personality: PersonalityTraits,
  novaName: string
): Promise<string> {
  const response = await fetch('/api/trpc/ai.generateReply', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userMessage,
      personality,
      novaName,
    }),
  });

  if (!response.ok) {
    throw new Error('Server model API error');
  }

  const data = await response.json() as any;
  return data.result?.reply || '我有点不知道说什么呢...';
}

/**
 * 生成 AI 回复
 */
export async function generateAIReply(
  userMessage: string,
  conversationHistory: AIMessage[],
  personality: PersonalityTraits,
  novaName: string,
  emotionalState: EmotionalState
): Promise<AIResponse> {
  try {
    // 构建系统提示词
    const conversationContext = buildConversationContext(conversationHistory);
    const systemPrompt = generateSystemPrompt(
      personality,
      novaName,
      emotionalState,
      conversationContext
    );

    // 构建消息列表
    const messages: AIMessage[] = [
      ...conversationHistory.slice(-5),
      { role: 'user', content: userMessage },
    ];

    // 尝试使用 DeepSeek API
    let reply: string;
    try {
      reply = await callDeepSeekAPI(messages, systemPrompt);
    } catch (deepseekError) {
      console.warn('DeepSeek API failed, falling back to server model:', deepseekError);
      // 降级到服务器内置模型
      reply = await callServerModel(userMessage, personality, novaName);
    }

    return {
      reply: reply.trim(),
      emotion: determineEmotion(emotionalState),
      confidence: 0.85,
    };
  } catch (error) {
    console.error('AI reply generation failed:', error);
    // 最后的备用方案
    return {
      reply: '我有点不知道说什么呢...',
      emotion: 'confused',
      confidence: 0.3,
    };
  }
}

/**
 * 根据情绪状态确定表情
 */
function determineEmotion(emotionalState: EmotionalState): string {
  if (emotionalState.happiness > 70) return 'happy';
  if (emotionalState.sadness > 60) return 'sad';
  if (emotionalState.anger > 50) return 'angry';
  if (emotionalState.excitement > 70) return 'excited';
  if (emotionalState.shyness > 60) return 'shy';
  if (emotionalState.boredom > 70) return 'bored';
  return 'neutral';
}

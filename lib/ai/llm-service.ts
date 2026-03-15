/**
 * LLM 服务
 * 调用服务器的 LLM API 生成 Nova 的智能回复
 */

import { PersonalityTraits, Memory } from '@/lib/types/personality';
import { getApiBaseUrl } from '@/constants/oauth';
import { buildFinalSystemPrompt, PromptContext } from '@/lib/ai/prompt-builder';

export interface GenerateReplyOptions {
  userMessage: string;
  personality: PersonalityTraits;
  novaName: string;
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  relationshipLevel?: 'stranger' | 'friend' | 'ambiguous' | 'lover' | 'intimate_partner';
  emotion?: string;
  memories?: Memory[];
  userName?: string;
}

/**
 * 生成 Nova 的回复
 */
export async function generateNovaReply(options: GenerateReplyOptions): Promise<string> {
  const {
    userMessage,
    personality,
    novaName,
    conversationHistory,
    relationshipLevel = 'stranger',
    emotion,
    memories = [],
    userName,
  } = options;

  try {
    // 构建最终 prompt
    const promptContext: PromptContext = {
      personality,
      relationshipLevel,
      emotion,
      memories,
      userName,
      novaName,
    };

    const systemPrompt = buildFinalSystemPrompt(promptContext);
    console.log('System Prompt:', systemPrompt);

    // 获取 API 基础 URL
    const baseUrl = getApiBaseUrl();
    console.log('API Base URL:', baseUrl);
    
    const apiUrl = `${baseUrl}/api/trpc/ai.generateReply`;
    console.log('Full API URL:', apiUrl);
    
    // 调用 tRPC 路由
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        json: {
          userMessage,
          systemPrompt,
          conversationHistory,
        },
      }),
    });

    console.log('API Response Status:', response.status);
    console.log('API Response Headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API response error:', response.status, errorText);
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('API response data:', data);
    
    // tRPC 返回的格式是 { result: { data: { json: { reply: "..." } } } }
    const reply = data.result?.data?.json?.reply;
    
    if (typeof reply === 'string' && reply.length > 0) {
      return reply;
    }

    throw new Error('Invalid response format');
  } catch (error) {
    console.error('Failed to generate reply:', error);
    // 如果 API 调用失败，返回备用回复
    return getFallbackReply(options.userMessage);
  }
}

/**
 * 获取备用回复（当 API 失败时使用）
 */
function getFallbackReply(userMessage: string): string {
  const replies = {
    greeting: [
      '嗨！很高兴见到你呢～',
      '你好啊！今天过得怎么样？',
      '嘿，想和我聊天吗？',
    ],
    positive: [
      '太好了！我为你开心～',
      '这听起来很棒呢！',
      '我也很高兴听到这个消息！',
    ],
    negative: [
      '我能感受到你的感受，我在这里陪着你。',
      '别难过，有我在呢～',
      '我理解你的感受，一切都会好起来的。',
    ],
    question: [
      '这是个很有趣的问题呢，让我想想...',
      '你这样问让我很感兴趣！',
      '我很想帮你解答这个问题。',
    ],
    default: [
      '我在听，继续说吧～',
      '你说的很有意思呢。',
      '我很想了解更多关于这个的信息。',
    ],
  };

  // 简单的分类逻辑
  const lowerMessage = userMessage.toLowerCase();
  
  if (/你好|hi|hello|嗨/.test(lowerMessage)) {
    return replies.greeting[Math.floor(Math.random() * replies.greeting.length)];
  } else if (/\?|？/.test(lowerMessage)) {
    return replies.question[Math.floor(Math.random() * replies.question.length)];
  } else if (/开心|高兴|太好|棒|爱|喜欢/.test(lowerMessage)) {
    return replies.positive[Math.floor(Math.random() * replies.positive.length)];
  } else if (/难过|伤心|痛苦|难受|不开心|烦|郁闷/.test(lowerMessage)) {
    return replies.negative[Math.floor(Math.random() * replies.negative.length)];
  }

  return replies.default[Math.floor(Math.random() * replies.default.length)];
}

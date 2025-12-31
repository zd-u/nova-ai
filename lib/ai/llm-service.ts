/**
 * LLM 服务
 * 调用服务器的 LLM API 生成 Nova 的智能回复
 */

import { trpc } from '@/lib/trpc';
import { PersonalityTraits } from '@/lib/types/personality';

/**
 * 生成 Nova 的回复
 */
export async function generateNovaReply(
  userMessage: string,
  personality: PersonalityTraits,
  novaName: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<string> {
  try {
    const response = await trpc.ai.generateReply.useMutation();
    const result = await response.mutateAsync({
      userMessage,
      personality,
      novaName,
      conversationHistory,
    });

    return result.reply;
  } catch (error) {
    console.error('Failed to generate reply:', error);
    // 如果 API 调用失败，返回备用回复
    return getFallbackReply(userMessage);
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
      '听起来真不错呢！',
      '你真的很棒呢！',
    ],
    negative: [
      '没关系，我在这里陪你',
      '别难过，我们一起想办法',
      '我能理解你的感受...',
    ],
    question: [
      '这是个很有趣的问题呢',
      '让我想想...',
      '你这样问我，我有点不好意思呢',
    ],
    default: [
      '是吗？告诉我更多吧',
      '听起来很有趣呢',
      '我很想听你说',
    ],
  };

  // 简单的分类逻辑
  if (
    userMessage.includes('你好') ||
    userMessage.includes('hi') ||
    userMessage.includes('hello') ||
    userMessage.includes('嗨')
  ) {
    return replies.greeting[Math.floor(Math.random() * replies.greeting.length)];
  } else if (
    userMessage.includes('喜欢') ||
    userMessage.includes('爱') ||
    userMessage.includes('开心') ||
    userMessage.includes('😊') ||
    userMessage.includes('😍')
  ) {
    return replies.positive[Math.floor(Math.random() * replies.positive.length)];
  } else if (
    userMessage.includes('难过') ||
    userMessage.includes('伤心') ||
    userMessage.includes('烦') ||
    userMessage.includes('😢') ||
    userMessage.includes('😠')
  ) {
    return replies.negative[Math.floor(Math.random() * replies.negative.length)];
  } else if (userMessage.includes('？') || userMessage.includes('?')) {
    return replies.question[Math.floor(Math.random() * replies.question.length)];
  } else {
    return replies.default[Math.floor(Math.random() * replies.default.length)];
  }
}

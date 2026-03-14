/**
 * 情绪识别系统
 * 识别用户的情绪状态，调整 Nova 的回复语气和人格参数
 */

import { getApiBaseUrl } from '@/constants/oauth';

/**
 * 情绪类型
 */
export type EmotionType = 
  | "happy" // 开心
  | "sad" // 伤心
  | "angry" // 愤怒
  | "anxious" // 焦虑
  | "lonely" // 孤独
  | "neutral" // 中立
  | "excited" // 兴奋
  | "calm"; // 平静

/**
 * 情绪记录
 */
export interface EmotionRecord {
  emotion: EmotionType;
  intensity: number; // 1-10
  confidence: number; // 0-1，识别置信度
  keywords: string[];
  timestamp: Date;
}

/**
 * 情绪到语气的映射
 */
const emotionToToneMap: Record<EmotionType, string> = {
  happy: "轻松、活泼、热情",
  sad: "温柔、关心、同情",
  angry: "冷静、理解、安抚",
  anxious: "鼓励、安心、支持",
  lonely: "陪伴、亲密、温暖",
  neutral: "自然、友好、正常",
  excited: "兴奋、配合、热烈",
  calm: "温和、平静、稳定",
};

/**
 * 情绪关键词映射
 */
const emotionKeywords: Record<EmotionType, string[]> = {
  happy: ["开心", "高兴", "开颜", "笑", "喜欢", "爱", "太好了", "太棒了", "完美", "最好"],
  sad: ["伤心", "难过", "哭", "失望", "沮丧", "悲伤", "不开心", "郁闷", "痛苦"],
  angry: ["生气", "愤怒", "讨厌", "烦", "烦死了", "气死了", "恨", "厌烦"],
  anxious: ["焦虑", "紧张", "担心", "害怕", "恐惧", "不安", "压力", "压抑"],
  lonely: ["孤独", "孤单", "没人", "一个人", "寂寞", "冷清"],
  neutral: ["嗯", "好的", "可以", "还好", "一般", "普通"],
  excited: ["兴奋", "激动", "期待", "想要", "渴望", "迫不及待"],
  calm: ["平静", "放松", "舒服", "安心", "稳定", "冷静"],
};

/**
 * 检测用户情绪
 */
export function detectEmotion(userMessage: string): EmotionRecord {
  const lowerMessage = userMessage.toLowerCase();
  const emotionScores: Record<EmotionType, number> = {
    happy: 0,
    sad: 0,
    angry: 0,
    anxious: 0,
    lonely: 0,
    neutral: 0,
    excited: 0,
    calm: 0,
  };

  // 计算每种情绪的得分
  for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
    for (const keyword of keywords) {
      if (lowerMessage.includes(keyword)) {
        emotionScores[emotion as EmotionType] += 1;
      }
    }
  }

  // 找到得分最高的情绪
  let detectedEmotion: EmotionType = "neutral";
  let maxScore = 0;

  for (const [emotion, score] of Object.entries(emotionScores)) {
    if (score > maxScore) {
      maxScore = score;
      detectedEmotion = emotion as EmotionType;
    }
  }

  // 如果没有检测到明显情绪，默认为中立
  if (maxScore === 0) {
    detectedEmotion = "neutral";
  }

  // 计算强度（1-10）
  const intensity = Math.min(10, Math.max(1, maxScore * 2));
  const confidence = maxScore > 0 ? Math.min(1, maxScore / 5) : 0;

  return {
    emotion: detectedEmotion,
    intensity: Math.round(intensity),
    confidence,
    keywords: emotionKeywords[detectedEmotion],
    timestamp: new Date(),
  };
}

/**
 * 获取情绪对应的语气
 */
export function getEmotionTone(emotion: EmotionType): string {
  return emotionToToneMap[emotion];
}

/**
 * 根据情绪调整人格参数
 * 返回应该调整的人格参数变化
 */
export function getPersonalityAdjustmentByEmotion(
  emotion: EmotionType
): Record<string, number> {
  const adjustments: Record<EmotionType, Record<string, number>> = {
    happy: {
      gentleness: 1,
      liveliness: 2,
      intellectuality: 0,
      mischief: 1,
      mystery: -1,
    },
    sad: {
      gentleness: 3,
      liveliness: -2,
      intellectuality: 1,
      mischief: -1,
      mystery: 0,
    },
    angry: {
      gentleness: -1,
      liveliness: 0,
      intellectuality: 2,
      mischief: 0,
      mystery: 1,
    },
    anxious: {
      gentleness: 2,
      liveliness: -1,
      intellectuality: 1,
      mischief: -2,
      mystery: 0,
    },
    lonely: {
      gentleness: 3,
      liveliness: 1,
      intellectuality: 0,
      mischief: 0,
      mystery: -1,
    },
    neutral: {
      gentleness: 0,
      liveliness: 0,
      intellectuality: 0,
      mischief: 0,
      mystery: 0,
    },
    excited: {
      gentleness: 0,
      liveliness: 3,
      intellectuality: 0,
      mischief: 2,
      mystery: -1,
    },
    calm: {
      gentleness: 1,
      liveliness: -1,
      intellectuality: 1,
      mischief: -1,
      mystery: 1,
    },
  };

  return adjustments[emotion];
}

/**
 * 保存情绪记录
 */
export async function saveEmotionRecord(
  userId: number,
  emotion: EmotionType,
  intensity: number,
  messageContent: string,
  novaResponse: string
): Promise<void> {
  try {
    const baseUrl = getApiBaseUrl();
    const response = await fetch(`${baseUrl}/api/trpc/emotion.save`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        json: {
          userId,
          emotion,
          intensity,
          messageContent,
          novaResponse,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to save emotion record: ${response.status}`);
    }
  } catch (error) {
    console.error("Failed to save emotion record:", error);
  }
}

/**
 * 获取用户最近的情绪趋势
 */
export async function getEmotionTrend(
  userId: number,
  days: number = 7
): Promise<EmotionRecord[]> {
  try {
    const baseUrl = getApiBaseUrl();
    const response = await fetch(`${baseUrl}/api/trpc/emotion.trend`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        json: {
          userId,
          days,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to get emotion trend: ${response.status}`);
    }

    const data = await response.json();
    return data.result?.data?.json?.records || [];
  } catch (error) {
    console.error("Failed to get emotion trend:", error);
    return [];
  }
}

/**
 * 构建情绪上下文
 * 将情绪信息添加到 LLM prompt 中
 */
export function buildEmotionContext(emotionRecord: EmotionRecord): string {
  return `
## 用户当前情绪：
- 情绪类型：${emotionRecord.emotion}
- 强度：${emotionRecord.intensity}/10
- 建议语气：${getEmotionTone(emotionRecord.emotion as EmotionType)}

`;
}

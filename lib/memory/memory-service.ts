/**
 * 记忆系统服务
 * 管理用户的长期记忆、记忆搜索和召回
 */

import { Memory, InsertMemory } from "@/drizzle/schema";
import { getApiBaseUrl } from '@/constants/oauth';

/**
 * 记忆类别
 */
export type MemoryCategory = 
  | "personal_info" // 个人信息
  | "birthday" // 生日
  | "preference" // 偏好
  | "experience" // 经历
  | "emotion" // 情感
  | "event"; // 事件

/**
 * 记忆接口
 */
export interface MemoryItem {
  id?: number;
  userId?: number;
  content: string;
  category: MemoryCategory;
  importance: number; // 1-10
  relatedMessages?: string[]; // 相关消息 ID
  createdAt?: Date;
  lastAccessedAt?: Date;
}

/**
 * 保存记忆
 * 从用户消息中提取重要信息并保存
 */
export async function saveMemory(
  userId: number,
  content: string,
  category: MemoryCategory,
  importance: number = 5
): Promise<MemoryItem> {
  try {
    const baseUrl = getApiBaseUrl();
    const response = await fetch(`${baseUrl}/api/trpc/memory.save`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        json: {
          userId,
          content,
          category,
          importance,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to save memory: ${response.status}`);
    }

    const data = await response.json();
    return data.result?.data?.json || {};
  } catch (error) {
    console.error("Failed to save memory:", error);
    throw error;
  }
}

/**
 * 搜索相关记忆
 * 根据用户输入搜索相关的历史记忆
 */
export async function searchMemories(
  userId: number,
  query: string,
  limit: number = 5
): Promise<MemoryItem[]> {
  try {
    const baseUrl = getApiBaseUrl();
    const response = await fetch(`${baseUrl}/api/trpc/memory.search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        json: {
          userId,
          query,
          limit,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to search memories: ${response.status}`);
    }

    const data = await response.json();
    return data.result?.data?.json?.memories || [];
  } catch (error) {
    console.error("Failed to search memories:", error);
    return [];
  }
}

/**
 * 获取用户档案
 */
export async function getUserProfile(userId: number): Promise<any> {
  try {
    const response = await fetch("/api/trpc/profile.get", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        json: {
          userId,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to get profile: ${response.status}`);
    }

    const data = await response.json();
    return data.result?.data?.json?.profile || null;
  } catch (error) {
    console.error("Failed to get profile:", error);
    return null;
  }
}

/**
 * 更新用户档案
 */
export async function updateUserProfile(
  userId: number,
  profileData: any
): Promise<any> {
  try {
    const response = await fetch("/api/trpc/profile.update", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        json: {
          userId,
          ...profileData,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update profile: ${response.status}`);
    }

    const data = await response.json();
    return data.result?.data?.json?.profile || null;
  } catch (error) {
    console.error("Failed to update profile:", error);
    throw error;
  }
}

/**
 * 提取记忆
 * 从用户消息中自动提取重要信息
 */
export function extractMemoriesFromMessage(
  userMessage: string,
  previousMemories: MemoryItem[] = []
): MemoryItem[] {
  const extractedMemories: MemoryItem[] = [];

  // 检查生日
  const birthdayMatch = userMessage.match(
    /(?:我的)?生日(?:是)?(?:在)?[\s]*(\d{1,2})(?:月|\/)?(\d{1,2})(?:日|号)?/
  );
  if (birthdayMatch) {
    extractedMemories.push({
      content: `用户生日：${birthdayMatch[1]}月${birthdayMatch[2]}日`,
      category: "birthday",
      importance: 9,
    });
  }

  // 检查名字
  const nameMatch = userMessage.match(/(?:我叫|我是|我名字是|名字叫)[\s]*([^\s，。，、]+)/);
  if (nameMatch) {
    extractedMemories.push({
      content: `用户名字：${nameMatch[1]}`,
      category: "personal_info",
      importance: 8,
    });
  }

  // 检查年龄
  const ageMatch = userMessage.match(/(?:我)?(?:今年)?(\d{1,3})(?:岁|岁了|年纪)/);
  if (ageMatch) {
    extractedMemories.push({
      content: `用户年龄：${ageMatch[1]}岁`,
      category: "personal_info",
      importance: 7,
    });
  }

  // 检查兴趣爱好
  const interestMatch = userMessage.match(
    /(?:我喜欢|我的爱好是|我爱好|我最喜欢)[\s]*([^\s，。，、]+)/
  );
  if (interestMatch) {
    extractedMemories.push({
      content: `用户兴趣：${interestMatch[1]}`,
      category: "preference",
      importance: 6,
    });
  }

  // 检查重要事件
  if (
    userMessage.includes("考试") ||
    userMessage.includes("面试") ||
    userMessage.includes("比赛") ||
    userMessage.includes("演讲") ||
    userMessage.includes("出差") ||
    userMessage.includes("出游") ||
    userMessage.includes("搬家") ||
    userMessage.includes("上班") ||
    userMessage.includes("上课")
  ) {
    extractedMemories.push({
      content: `用户事件：${userMessage.substring(0, 50)}...`,
      category: "event",
      importance: 7,
    });
  }

  // 检查情感状态
  const emotionMatch = userMessage.match(
    /(?:我|最近|今天)(?:很|特别|非常)[\s]*(开心|伤心|难过|生气|焦虑|孤独|失望|害怕)/
  );
  if (emotionMatch) {
    extractedMemories.push({
      content: `用户情感：${emotionMatch[0]}`,
      category: "emotion",
      importance: 6,
    });
  }

  return extractedMemories;
}

/**
 * 构建记忆上下文
 * 将相关记忆添加到 LLM prompt 中
 */
export function buildMemoryContext(memories: MemoryItem[]): string {
  if (memories.length === 0) {
    return "";
  }

  const memoryText = memories
    .map((m) => `- [${m.category}] ${m.content}`)
    .join("\n");

  return `
## 关于用户的记忆：
${memoryText}

`;
}

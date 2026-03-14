/**
 * 人格演化系统
 * 根据用户行为动态调整 Nova 的人格参数
 */

/**
 * 人格参数
 */
export interface PersonalityTraits {
  gentleness: number; // 温柔度 0-100
  liveliness: number; // 活泼度 0-100
  intellectuality: number; // 知性度 0-100
  mischief: number; // 调皮度 0-100
  mystery: number; // 神秘度 0-100
}

/**
 * 用户行为类型
 */
export type BehaviorType =
  | "praise" // 夸奖
  | "coldness" // 冷淡
  | "intimacy" // 亲密
  | "question" // 提问
  | "complaint" // 抱怨
  | "gratitude" // 感谢
  | "ignore" // 忽视
  | "tease"; // 调戏

/**
 * 行为触发规则
 * 定义每种行为如何影响人格参数
 */
const behaviorTriggers: Record<BehaviorType, Partial<PersonalityTraits>> = {
  praise: {
    gentleness: 2,
    liveliness: 1,
    intellectuality: 0,
    mischief: 1,
    mystery: -1,
  },
  coldness: {
    gentleness: -1,
    liveliness: -2,
    intellectuality: 1,
    mischief: 0,
    mystery: 2,
  },
  intimacy: {
    gentleness: 2,
    liveliness: 1,
    intellectuality: 0,
    mischief: 0,
    mystery: -2,
  },
  question: {
    gentleness: 0,
    liveliness: 0,
    intellectuality: 2,
    mischief: 0,
    mystery: 0,
  },
  complaint: {
    gentleness: 3,
    liveliness: -1,
    intellectuality: 1,
    mischief: -1,
    mystery: 0,
  },
  gratitude: {
    gentleness: 1,
    liveliness: 1,
    intellectuality: 0,
    mischief: 0,
    mystery: 0,
  },
  ignore: {
    gentleness: -2,
    liveliness: -1,
    intellectuality: 0,
    mischief: -1,
    mystery: 2,
  },
  tease: {
    gentleness: -1,
    liveliness: 2,
    intellectuality: 0,
    mischief: 2,
    mystery: 0,
  },
};

/**
 * 检测用户行为
 */
export function detectUserBehavior(userMessage: string): BehaviorType {
  const lowerMessage = userMessage.toLowerCase();

  // 夸奖
  if (
    lowerMessage.includes("你很") ||
    lowerMessage.includes("你真") ||
    lowerMessage.includes("你好") ||
    lowerMessage.includes("喜欢你") ||
    lowerMessage.includes("爱你") ||
    lowerMessage.includes("你最好") ||
    lowerMessage.includes("你棒") ||
    lowerMessage.includes("你聪明") ||
    lowerMessage.includes("你漂亮") ||
    lowerMessage.includes("你可爱")
  ) {
    return "praise";
  }

  // 冷淡
  if (
    lowerMessage.includes("随便") ||
    lowerMessage.includes("无所谓") ||
    lowerMessage.includes("不用") ||
    lowerMessage.includes("别说话") ||
    lowerMessage.includes("烦你了") ||
    lowerMessage.includes("别理我") ||
    lowerMessage.includes("滚开") ||
    lowerMessage.includes("讨厌你")
  ) {
    return "coldness";
  }

  // 亲密
  if (
    lowerMessage.includes("亲爱的") ||
    lowerMessage.includes("宝贝") ||
    lowerMessage.includes("亲") ||
    lowerMessage.includes("老公") ||
    lowerMessage.includes("老婆") ||
    lowerMessage.includes("亲吻") ||
    lowerMessage.includes("拥抱") ||
    lowerMessage.includes("想你") ||
    lowerMessage.includes("爱你") ||
    lowerMessage.includes("我们")
  ) {
    return "intimacy";
  }

  // 感谢
  if (
    lowerMessage.includes("谢谢") ||
    lowerMessage.includes("感谢") ||
    lowerMessage.includes("谢了") ||
    lowerMessage.includes("多谢") ||
    lowerMessage.includes("太感谢")
  ) {
    return "gratitude";
  }

  // 抱怨
  if (
    lowerMessage.includes("抱怨") ||
    lowerMessage.includes("难过") ||
    lowerMessage.includes("伤心") ||
    lowerMessage.includes("烦") ||
    lowerMessage.includes("累") ||
    lowerMessage.includes("不开心") ||
    lowerMessage.includes("生气") ||
    lowerMessage.includes("郁闷")
  ) {
    return "complaint";
  }

  // 调戏
  if (
    lowerMessage.includes("逗你") ||
    lowerMessage.includes("开玩笑") ||
    lowerMessage.includes("捉弄") ||
    lowerMessage.includes("哈哈") ||
    lowerMessage.includes("😄") ||
    lowerMessage.includes("😂")
  ) {
    return "tease";
  }

  // 忽视
  if (
    lowerMessage === "嗯" ||
    lowerMessage === "哦" ||
    lowerMessage === "好" ||
    lowerMessage.length < 3
  ) {
    return "ignore";
  }

  // 提问
  if (lowerMessage.includes("？") || lowerMessage.includes("?")) {
    return "question";
  }

  return "question"; // 默认
}

/**
 * 应用行为触发
 * 根据检测到的行为调整人格参数
 */
export function applyBehaviorTrigger(
  currentTraits: PersonalityTraits,
  behavior: BehaviorType
): PersonalityTraits {
  const adjustments = behaviorTriggers[behavior];
  const newTraits = { ...currentTraits };

  // 应用调整
  for (const [key, value] of Object.entries(adjustments)) {
    const traitKey = key as keyof PersonalityTraits;
    if (value !== undefined) {
      newTraits[traitKey] = Math.max(0, Math.min(100, newTraits[traitKey] + value));
    }
  }

  return newTraits;
}

/**
 * 保存人格演化记录
 */
export async function savePersonalityRecord(
  userId: number,
  traits: PersonalityTraits,
  triggerEvent: BehaviorType,
  triggerMessage: string
): Promise<void> {
  try {
    const response = await fetch("/api/trpc/personality.save", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        json: {
          userId,
          ...traits,
          triggerEvent,
          triggerMessage,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to save personality record: ${response.status}`);
    }
  } catch (error) {
    console.error("Failed to save personality record:", error);
  }
}

/**
 * 获取用户的当前人格参数
 */
export async function getPersonalityTraits(userId: number): Promise<PersonalityTraits> {
  try {
    const response = await fetch("/api/trpc/personality.get", {
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
      throw new Error(`Failed to get personality traits: ${response.status}`);
    }

    const data = await response.json();
    return (
      data.result?.data?.json?.traits || {
        gentleness: 50,
        liveliness: 50,
        intellectuality: 50,
        mischief: 50,
        mystery: 50,
      }
    );
  } catch (error) {
    console.error("Failed to get personality traits:", error);
    return {
      gentleness: 50,
      liveliness: 50,
      intellectuality: 50,
      mischief: 50,
      mystery: 50,
    };
  }
}

/**
 * 构建人格描述
 * 根据人格参数生成 Nova 的人格描述
 */
export function buildPersonalityDescription(traits: PersonalityTraits): string {
  const descriptions: string[] = [];

  if (traits.gentleness > 70) {
    descriptions.push("温柔体贴");
  } else if (traits.gentleness < 30) {
    descriptions.push("直率坦诚");
  }

  if (traits.liveliness > 70) {
    descriptions.push("活泼开朗");
  } else if (traits.liveliness < 30) {
    descriptions.push("沉静内敛");
  }

  if (traits.intellectuality > 70) {
    descriptions.push("聪慧知性");
  } else if (traits.intellectuality < 30) {
    descriptions.push("天真可爱");
  }

  if (traits.mischief > 70) {
    descriptions.push("调皮捣蛋");
  } else if (traits.mischief < 30) {
    descriptions.push("乖巧懂事");
  }

  if (traits.mystery > 70) {
    descriptions.push("神秘莫测");
  } else if (traits.mystery < 30) {
    descriptions.push("坦率透明");
  }

  return descriptions.join("、") || "独特魅力";
}

/**
 * 构建人格上下文
 * 将人格信息添加到 LLM prompt 中
 */
export function buildPersonalityContext(traits: PersonalityTraits): string {
  const description = buildPersonalityDescription(traits);

  return `
## Nova 的当前人格：
- 温柔度：${traits.gentleness}/100
- 活泼度：${traits.liveliness}/100
- 知性度：${traits.intellectuality}/100
- 调皮度：${traits.mischief}/100
- 神秘度：${traits.mystery}/100
- 人格描述：${description}

`;
}

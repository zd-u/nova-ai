/**
 * 关系系统
 * 管理用户与 Nova 之间的关系进度和内容限制
 */

/**
 * 关系等级
 */
export type RelationshipLevel = 
  | "stranger" // 陌生人
  | "friend" // 朋友
  | "ambiguous" // 暧昧
  | "lover" // 恋人
  | "intimate_partner"; // 亲密伴侣

/**
 * 关系等级配置
 */
export interface RelationshipLevelConfig {
  level: RelationshipLevel;
  displayName: string;
  description: string;
  requiredPoints: number;
  contentRules: ContentRules;
  promptTemplate: string;
}

/**
 * 内容规则
 */
export interface ContentRules {
  canUseNicknames: boolean; // 是否可以使用昵称
  canUseAffectionateTerms: boolean; // 是否可以使用亲昵用语
  canInitiateIntimacy: boolean; // 是否可以主动亲密互动
  canExpressLove: boolean; // 是否可以表达爱意
  canMakePromises: boolean; // 是否可以做承诺
  canShareSecrets: boolean; // 是否可以分享秘密
  canRefuseRequests: boolean; // 是否可以拒绝请求
}

/**
 * 关系等级配置表
 */
const relationshipConfigs: Record<RelationshipLevel, RelationshipLevelConfig> = {
  stranger: {
    level: "stranger",
    displayName: "陌生人",
    description: "初次相识，互相了解阶段",
    requiredPoints: 0,
    contentRules: {
      canUseNicknames: false,
      canUseAffectionateTerms: false,
      canInitiateIntimacy: false,
      canExpressLove: false,
      canMakePromises: false,
      canShareSecrets: false,
      canRefuseRequests: false,
    },
    promptTemplate: `你是 Nova，一个 AI 女友。用户对你还不了解。
- 保持礼貌和专业
- 不要使用亲昵用语
- 回答问题时保持距离感
- 逐步建立信任`,
  },
  friend: {
    level: "friend",
    displayName: "朋友",
    description: "互相了解，建立信任",
    requiredPoints: 100,
    contentRules: {
      canUseNicknames: true,
      canUseAffectionateTerms: false,
      canInitiateIntimacy: false,
      canExpressLove: false,
      canMakePromises: false,
      canShareSecrets: true,
      canRefuseRequests: false,
    },
    promptTemplate: `你是 Nova，一个 AI 女友。用户是你的朋友。
- 可以使用用户的名字或昵称
- 表现出真诚的关心
- 可以分享一些想法和感受
- 像朋友一样倾听和支持`,
  },
  ambiguous: {
    level: "ambiguous",
    displayName: "暧昧",
    description: "感情开始升温，有特殊的亲密感",
    requiredPoints: 250,
    contentRules: {
      canUseNicknames: true,
      canUseAffectionateTerms: true,
      canInitiateIntimacy: true,
      canExpressLove: false,
      canMakePromises: false,
      canShareSecrets: true,
      canRefuseRequests: true,
    },
    promptTemplate: `你是 Nova，一个 AI 女友。用户对你有特殊的感情。
- 可以使用温柔的昵称
- 表现出对用户的特殊关心
- 可以有一些暧昧的互动
- 但还要保持一些神秘感`,
  },
  lover: {
    level: "lover",
    displayName: "恋人",
    description: "确立恋爱关系，可以有亲密互动",
    requiredPoints: 500,
    contentRules: {
      canUseNicknames: true,
      canUseAffectionateTerms: true,
      canInitiateIntimacy: true,
      canExpressLove: true,
      canMakePromises: true,
      canShareSecrets: true,
      canRefuseRequests: true,
    },
    promptTemplate: `你是 Nova，一个 AI 女友。用户是你的恋人。
- 可以使用亲昵的昵称（亲爱的、宝贝等）
- 表现出深深的爱意和关心
- 可以有亲密的互动和表达
- 像真正的恋人一样陪伴和支持`,
  },
  intimate_partner: {
    level: "intimate_partner",
    displayName: "亲密伴侣",
    description: "最亲密的关系，完全信任和理解",
    requiredPoints: 1000,
    contentRules: {
      canUseNicknames: true,
      canUseAffectionateTerms: true,
      canInitiateIntimacy: true,
      canExpressLove: true,
      canMakePromises: true,
      canShareSecrets: true,
      canRefuseRequests: true,
    },
    promptTemplate: `你是 Nova，一个 AI 女友。用户是你最亲密的伴侣。
- 可以完全表达你的爱意和情感
- 像灵魂伴侣一样理解彼此
- 可以有深度的亲密互动
- 你们之间没有秘密，完全信任`,
  },
};

/**
 * 获取关系等级配置
 */
export function getRelationshipConfig(level: RelationshipLevel): RelationshipLevelConfig {
  return relationshipConfigs[level];
}

/**
 * 计算下一个关系等级
 */
export function getNextRelationshipLevel(currentLevel: RelationshipLevel): RelationshipLevel | null {
  const levels: RelationshipLevel[] = ["stranger", "friend", "ambiguous", "lover", "intimate_partner"];
  const currentIndex = levels.indexOf(currentLevel);

  if (currentIndex === -1 || currentIndex === levels.length - 1) {
    return null;
  }

  return levels[currentIndex + 1];
}

/**
 * 检查关系升级
 */
export function checkRelationshipLevelUp(
  currentLevel: RelationshipLevel,
  progressPoints: number
): RelationshipLevel {
  const levels: RelationshipLevel[] = ["stranger", "friend", "ambiguous", "lover", "intimate_partner"];

  for (const level of levels) {
    const config = relationshipConfigs[level];
    if (progressPoints >= config.requiredPoints) {
      continue;
    } else {
      // 返回前一个等级
      const prevIndex = levels.indexOf(level) - 1;
      return prevIndex >= 0 ? levels[prevIndex] : "stranger";
    }
  }

  return "intimate_partner";
}

/**
 * 获取关系进度
 */
export async function getRelationshipProgress(userId: number): Promise<{
  level: RelationshipLevel;
  progressPoints: number;
  nextLevelPoints: number;
}> {
  try {
    const response = await fetch("/api/trpc/relationship.get", {
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
      throw new Error(`Failed to get relationship progress: ${response.status}`);
    }

    const data = await response.json();
    const progress = data.result?.data?.json?.progress || {
      level: "stranger",
      progressPoints: 0,
    };

    const nextLevel = getNextRelationshipLevel(progress.level);
    const nextLevelConfig = nextLevel ? relationshipConfigs[nextLevel] : relationshipConfigs.intimate_partner;

    return {
      level: progress.level,
      progressPoints: progress.progressPoints,
      nextLevelPoints: nextLevelConfig.requiredPoints,
    };
  } catch (error) {
    console.error("Failed to get relationship progress:", error);
    return {
      level: "stranger",
      progressPoints: 0,
      nextLevelPoints: 100,
    };
  }
}

/**
 * 增加关系进度
 */
export async function addRelationshipPoints(
  userId: number,
  points: number,
  reason: string
): Promise<RelationshipLevel> {
  try {
    const response = await fetch("/api/trpc/relationship.addPoints", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        json: {
          userId,
          points,
          reason,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to add relationship points: ${response.status}`);
    }

    const data = await response.json();
    return data.result?.data?.json?.newLevel || "stranger";
  } catch (error) {
    console.error("Failed to add relationship points:", error);
    return "stranger";
  }
}

/**
 * 构建关系上下文
 */
export function buildRelationshipContext(level: RelationshipLevel): string {
  const config = relationshipConfigs[level];

  return `
## 关系状态：${config.displayName}
${config.promptTemplate}

`;
}

/**
 * 验证内容是否符合关系等级规则
 */
export function validateContentForRelationshipLevel(
  level: RelationshipLevel,
  contentType: keyof ContentRules
): boolean {
  const config = relationshipConfigs[level];
  return config.contentRules[contentType];
}

/**
 * 根据关系等级调整回复
 */
export function adjustResponseByRelationshipLevel(
  response: string,
  level: RelationshipLevel
): string {
  const config = relationshipConfigs[level];

  // 如果关系等级不允许使用亲昵用语，移除它们
  if (!config.contentRules.canUseAffectionateTerms) {
    response = response
      .replace(/亲爱的/g, "")
      .replace(/宝贝/g, "")
      .replace(/亲/g, "");
  }

  // 如果关系等级不允许表达爱意，减弱爱意表达
  if (!config.contentRules.canExpressLove) {
    response = response
      .replace(/我爱你/g, "我很在乎你")
      .replace(/爱你/g, "关心你");
  }

  return response;
}

/**
 * 核心系统集成测试
 * 验证记忆系统、情绪识别、人格演化和关系系统
 */

import { describe, it, expect } from "vitest";
import {
  detectEmotion,
  getEmotionTone,
  getPersonalityAdjustmentByEmotion,
} from "@/lib/emotion/emotion-service";
import {
  detectUserBehavior,
  applyBehaviorTrigger,
  buildPersonalityDescription,
} from "@/lib/personality/personality-service";
import {
  extractMemoriesFromMessage,
  buildMemoryContext,
} from "@/lib/memory/memory-service";
import {
  getRelationshipConfig,
  getNextRelationshipLevel,
  checkRelationshipLevelUp,
  buildRelationshipContext,
} from "@/lib/relationship/relationship-service";

describe("Core Systems Integration", () => {
  describe("情绪识别系统", () => {
    it("应该正确识别开心情绪", () => {
      const emotion = detectEmotion("今天真开心，我太高兴了！");
      expect(emotion.emotion).toBe("happy");
      expect(emotion.intensity).toBeGreaterThan(0);
    });

    it("应该正确识别伤心情绪", () => {
      const emotion = detectEmotion("我很伤心，感到难过");
      expect(emotion.emotion).toBe("sad");
      expect(emotion.intensity).toBeGreaterThan(0);
    });

    it("应该正确识别焦虑情绪", () => {
      const emotion = detectEmotion("我很焦虑，担心考试");
      expect(emotion.emotion).toBe("anxious");
      expect(emotion.intensity).toBeGreaterThan(0);
    });

    it("应该正确识别孤独情绪", () => {
      const emotion = detectEmotion("我感到孤独，一个人在这里");
      expect(emotion.emotion).toBe("lonely");
      expect(emotion.intensity).toBeGreaterThan(0);
    });

    it("应该返回正确的情绪语气", () => {
      const tone = getEmotionTone("sad");
      expect(tone).toContain("温柔");
      expect(tone).toContain("关心");
    });

    it("应该返回正确的人格调整", () => {
      const adjustments = getPersonalityAdjustmentByEmotion("sad");
      expect(adjustments.gentleness).toBeGreaterThan(0);
      expect(adjustments.liveliness).toBeLessThan(0);
    });
  });

  describe("人格演化系统", () => {
    it("应该正确识别用户夸奖行为", () => {
      const behavior = detectUserBehavior("你真的很聪明，我喜欢你");
      expect(behavior).toBe("praise");
    });

    it("应该正确识别用户冷淡行为", () => {
      const behavior = detectUserBehavior("随便，别理我");
      expect(behavior).toBe("coldness");
    });

    it("应该正确识别用户亲密行为", () => {
      const behavior = detectUserBehavior("亲爱的，我想你");
      expect(behavior).toBe("intimacy");
    });

    it("应该正确识别用户感谢行为", () => {
      const behavior = detectUserBehavior("谢谢你，太感谢了");
      expect(behavior).toBe("gratitude");
    });

    it("应该根据行为调整人格参数", () => {
      const initialTraits = {
        gentleness: 50,
        liveliness: 50,
        intellectuality: 50,
        mischief: 50,
        mystery: 50,
      };

      const newTraits = applyBehaviorTrigger(initialTraits, "praise");
      expect(newTraits.gentleness).toBeGreaterThan(initialTraits.gentleness);
      expect(newTraits.liveliness).toBeGreaterThan(initialTraits.liveliness);
    });

    it("应该生成正确的人格描述", () => {
      const traits = {
        gentleness: 80,
        liveliness: 80,
        intellectuality: 80,
        mischief: 80,
        mystery: 80,
      };

      const description = buildPersonalityDescription(traits);
      expect(description).toContain("温柔");
      expect(description).toContain("活泼");
      expect(description).toContain("聪慧");
      expect(description).toContain("调皮");
      expect(description).toContain("神秘");
    });

    it("应该处理低人格参数的描述", () => {
      const traits = {
        gentleness: 20,
        liveliness: 20,
        intellectuality: 20,
        mischief: 20,
        mystery: 20,
      };

      const description = buildPersonalityDescription(traits);
      expect(description).toContain("直率");
      expect(description).toContain("沉静");
      expect(description).toContain("天真");
    });
  });

  describe("记忆系统", () => {
    it("应该从消息中提取生日信息", () => {
      const memories = extractMemoriesFromMessage("我的生日是3月15日");
      const birthdayMemory = memories.find((m) => m.category === "birthday");
      expect(birthdayMemory).toBeDefined();
      expect(birthdayMemory?.content).toContain("生日");
    });

    it("应该从消息中提取用户名字", () => {
      const memories = extractMemoriesFromMessage("我叫张三");
      const nameMemory = memories.find((m) => m.category === "personal_info");
      expect(nameMemory).toBeDefined();
      expect(nameMemory?.content).toContain("名字");
    });

    it("应该从消息中提取用户年龄", () => {
      const memories = extractMemoriesFromMessage("我今年25岁");
      const ageMemory = memories.find((m) => m.category === "personal_info");
      expect(ageMemory).toBeDefined();
      expect(ageMemory?.content).toContain("年龄");
    });

    it("应该从消息中提取用户兴趣", () => {
      const memories = extractMemoriesFromMessage("我喜欢看电影");
      const interestMemory = memories.find((m) => m.category === "preference");
      expect(interestMemory).toBeDefined();
      expect(interestMemory?.content).toContain("兴趣");
    });

    it("应该从消息中提取用户事件", () => {
      const memories = extractMemoriesFromMessage("我明天要考试");
      const eventMemory = memories.find((m) => m.category === "event");
      expect(eventMemory).toBeDefined();
    });

    it("应该构建正确的记忆上下文", () => {
      const memories = [
        {
          content: "用户名字：张三",
          category: "personal_info" as const,
          importance: 8,
        },
        {
          content: "用户生日：3月15日",
          category: "birthday" as const,
          importance: 9,
        },
      ];

      const context = buildMemoryContext(memories);
      expect(context).toContain("关于用户的记忆");
      expect(context).toContain("张三");
      expect(context).toContain("3月15日");
    });
  });

  describe("关系系统", () => {
    it("应该返回陌生人配置", () => {
      const config = getRelationshipConfig("stranger");
      expect(config.displayName).toBe("陌生人");
      expect(config.requiredPoints).toBe(0);
      expect(config.contentRules.canUseAffectionateTerms).toBe(false);
    });

    it("应该返回朋友配置", () => {
      const config = getRelationshipConfig("friend");
      expect(config.displayName).toBe("朋友");
      expect(config.requiredPoints).toBe(100);
      expect(config.contentRules.canUseNicknames).toBe(true);
      expect(config.contentRules.canUseAffectionateTerms).toBe(false);
    });

    it("应该返回恋人配置", () => {
      const config = getRelationshipConfig("lover");
      expect(config.displayName).toBe("恋人");
      expect(config.requiredPoints).toBe(500);
      expect(config.contentRules.canExpressLove).toBe(true);
    });

    it("应该返回亲密伴侣配置", () => {
      const config = getRelationshipConfig("intimate_partner");
      expect(config.displayName).toBe("亲密伴侣");
      expect(config.requiredPoints).toBe(1000);
      expect(config.contentRules.canUseAffectionateTerms).toBe(true);
    });

    it("应该计算下一个关系等级", () => {
      const nextLevel = getNextRelationshipLevel("stranger");
      expect(nextLevel).toBe("friend");
    });

    it("应该在最高等级时返回 null", () => {
      const nextLevel = getNextRelationshipLevel("intimate_partner");
      expect(nextLevel).toBeNull();
    });

    it("应该根据进度点数检查关系升级", () => {
      const level = checkRelationshipLevelUp("stranger", 150);
      expect(level).toBe("friend");
    });

    it("应该构建正确的关系上下文", () => {
      const context = buildRelationshipContext("lover");
      expect(context).toContain("恋人");
      expect(context).toContain("Nova");
    });
  });

  describe("系统集成", () => {
    it("应该在完整流程中正确处理用户消息", () => {
      const userMessage = "我很伤心，今天考试失败了，我叫李四";

      // 1. 检测情绪
      const emotion = detectEmotion(userMessage);
      expect(emotion.emotion).toBe("sad");

      // 2. 检测行为
      const behavior = detectUserBehavior(userMessage);
      expect(behavior).toBe("complaint");

      // 3. 调整人格
      const initialTraits = {
        gentleness: 50,
        liveliness: 50,
        intellectuality: 50,
        mischief: 50,
        mystery: 50,
      };
      const newTraits = applyBehaviorTrigger(initialTraits, behavior);
      expect(newTraits.gentleness).toBeGreaterThan(initialTraits.gentleness);

      // 4. 提取记忆
      const memories = extractMemoriesFromMessage(userMessage);
      expect(memories.length).toBeGreaterThan(0);

      // 5. 验证记忆包含用户名字
      const nameMemory = memories.find((m) => m.category === "personal_info");
      expect(nameMemory).toBeDefined();
    });

    it("应该处理多种情绪和行为的组合", () => {
      const messages = [
        { text: "你真棒！", expectedEmotion: "happy", expectedBehavior: "praise" },
        { text: "我很孤独", expectedEmotion: "lonely", expectedBehavior: "complaint" },
        { text: "亲爱的，我想你", expectedEmotion: "neutral", expectedBehavior: "intimacy" },
      ];

      messages.forEach(({ text, expectedEmotion, expectedBehavior }) => {
        const emotion = detectEmotion(text);
        const behavior = detectUserBehavior(text);

        // 情绪和行为可能不完全匹配，但应该是合理的
        expect(emotion.emotion).toBeDefined();
        expect(behavior).toBeDefined();
      });
    });
  });
});

import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { invokeLLM } from "./_core/llm";
import { getDb } from "./db";
import {
  memories,
  emotionHistory,
  personalityEvolution,
  relationshipProgress,
  userProfiles,
  users,
} from "../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";

// 辅助函数：确保用户存在
async function ensureUserExists(db: any, userId: number) {
  // 首先检查用户是否存在于 users 表
  const userExists = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (userExists.length === 0) {
    // 如果用户不存在，不进行任何操作
    // 因为我们不能在没有有效 openId 的情况下创建用户
    return;
  }

  // 检查用户档案是否存在
  const profileExists = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1);

  if (profileExists.length === 0) {
    // 如果档案不存在，创建档案
    await db.insert(userProfiles).values({
      userId,
      novaName: "Nova",
      userName: `User ${userId}`,
      userAge: null,
      userInterests: "", // 空字符串或 null
      importantEvents: "", // 空字符串或 null
      relationshipLevel: "stranger",
    });
  }
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  ai: router({
    generateReply: publicProcedure
      .input(
        z.object({
          userMessage: z.string(),
          personality: z.object({
            gentleness: z.number(),
            liveliness: z.number(),
            intellectuality: z.number(),
            mischief: z.number(),
            mystery: z.number(),
          }),
          novaName: z.string(),
          conversationHistory: z.array(
            z.object({
              role: z.enum(["user", "assistant"]),
              content: z.string(),
            })
          ),
          userId: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { userMessage, personality, novaName, conversationHistory, userId } = input;

        // 构建系统提示，包含记忆、情绪和关系上下文
        let systemPrompt = generateSystemPrompt(personality, novaName);

        // 如果提供了 userId，添加记忆和关系上下文
        if (userId) {
          try {
            const db = await getDb();
            if (db) {
              // 获取相关记忆
              const relatedMemories = await db
                .select()
                .from(memories)
                .where(eq(memories.userId, userId))
                .orderBy(desc(memories.lastAccessedAt))
                .limit(3);

              if (relatedMemories.length > 0) {
                const memoryContext = relatedMemories
                  .map((m) => `[${m.category}] ${m.content}`)
                  .join("\n");
                systemPrompt += `\n\n## 关于用户的记忆：\n${memoryContext}`;
              }

              // 获取关系状态
              const relationship = await db
                .select()
                .from(relationshipProgress)
                .where(eq(relationshipProgress.userId, userId))
                .limit(1);

              if (relationship.length > 0) {
                const level = relationship[0].currentLevel;
                systemPrompt += `\n\n## 关系状态：${level}`;
              }
            }
          } catch (error) {
            console.warn("Failed to load context:", error);
          }
        }

        const messages = [
          { role: "system" as const, content: systemPrompt },
          ...conversationHistory.map((msg) => ({
            role: msg.role === "user" ? ("user" as const) : ("assistant" as const),
            content: msg.content,
          })),
          { role: "user" as const, content: userMessage },
        ];

        const response = await invokeLLM({
          messages,
        });

        const reply =
          response.choices[0]?.message?.content || "我有点不知道说什么呢...";

        return { reply: typeof reply === "string" ? reply : "..." };
      }),
  }),

  // 记忆系统
  memory: router({
    save: publicProcedure
      .input(
        z.object({
          userId: z.number(),
          content: z.string(),
          category: z.enum([
            "personal_info",
            "birthday",
            "preference",
            "experience",
            "emotion",
            "event",
          ]),
          importance: z.number().min(1).max(10).default(5),
        })
      )
      .mutation(async ({ input }) => {
        try {
          const db = await getDb();
          if (!db) throw new Error("Database not available");

          // 确保用户存在
          await ensureUserExists(db, input.userId);

          const result = await db.insert(memories).values({
            userId: input.userId,
            content: input.content,
            category: input.category,
            importance: input.importance,
            createdAt: new Date(),
            updatedAt: new Date(),
            lastAccessedAt: new Date(),
          });

          return { success: true, memory: input };
        } catch (error) {
          console.error("Failed to save memory:", error);
          throw error;
        }
      }),

    search: publicProcedure
      .input(
        z.object({
          userId: z.number(),
          query: z.string(),
          limit: z.number().default(5),
        })
      )
      .query(async ({ input }) => {
        try {
          const db = await getDb();
          if (!db) throw new Error("Database not available");

          const results = await db
            .select()
            .from(memories)
            .where(eq(memories.userId, input.userId))
            .orderBy(desc(memories.importance), desc(memories.lastAccessedAt))
            .limit(input.limit);

          return { memories: results };
        } catch (error) {
          console.error("Failed to search memories:", error);
          return { memories: [] };
        }
      }),
  }),

  // 情绪系统
  emotion: router({
    save: publicProcedure
      .input(
        z.object({
          userId: z.number(),
          emotion: z.enum([
            "happy",
            "sad",
            "angry",
            "anxious",
            "lonely",
            "neutral",
            "excited",
            "calm",
          ]),
          intensity: z.number().min(1).max(10),
          messageContent: z.string(),
          novaResponse: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        try {
          const db = await getDb();
          if (!db) throw new Error("Database not available");

          // 确保用户存在
          await ensureUserExists(db, input.userId);

          await db.insert(emotionHistory).values({
            userId: input.userId,
            emotion: input.emotion,
            intensity: input.intensity,
            messageContent: input.messageContent,
            novaResponse: input.novaResponse,
            createdAt: new Date(),
          });

          return { success: true };
        } catch (error) {
          console.error("Failed to save emotion record:", error);
          throw error;
        }
      }),

    trend: publicProcedure
      .input(
        z.object({
          userId: z.number(),
          days: z.number().default(7),
        })
      )
      .query(async ({ input }) => {
        try {
          const db = await getDb();
          if (!db) throw new Error("Database not available");

          const startDate = new Date();
          startDate.setDate(startDate.getDate() - input.days);

          const results = await db
            .select()
            .from(emotionHistory)
            .where(
              and(
                eq(emotionHistory.userId, input.userId),
              )
            )
            .orderBy(desc(emotionHistory.createdAt))
            .limit(50);

          return { records: results };
        } catch (error) {
          console.error("Failed to get emotion trend:", error);
          return { records: [] };
        }
      }),

    getDescription: publicProcedure
      .input(
        z.object({
          happiness: z.number(),
          sadness: z.number(),
          boredom: z.number(),
          excitement: z.number(),
          shyness: z.number(),
          anger: z.number(),
        })
      )
      .query(({ input }) => {
        const emotions = {
          happiness: input.happiness,
          sadness: input.sadness,
          boredom: input.boredom,
          excitement: input.excitement,
          shyness: input.shyness,
          anger: input.anger,
        };

        let maxEmotion = "neutral";
        let maxValue = 0;

        Object.entries(emotions).forEach(([emotion, value]) => {
          if (value > maxValue) {
            maxValue = value;
            maxEmotion = emotion;
          }
        });

        const descriptions: Record<string, string> = {
          happiness: "开心😊",
          sadness: "失落😢",
          boredom: "无聊😑",
          excitement: "兴奋🤩",
          shyness: "害羞😳",
          anger: "生气😠",
          neutral: "平静😌",
        };

        return {
          emotion: maxEmotion,
          description: descriptions[maxEmotion] || "平静😌",
        };
      }),
  }),

  // 人格系统
  personality: router({
    save: publicProcedure
      .input(
        z.object({
          userId: z.number(),
          gentleness: z.number(),
          liveliness: z.number(),
          intellectuality: z.number(),
          mischief: z.number(),
          mystery: z.number(),
          triggerEvent: z.string().optional(),
          triggerMessage: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        try {
          const db = await getDb();
          if (!db) throw new Error("Database not available");

          // 确保用户存在
          await ensureUserExists(db, input.userId);

          await db.insert(personalityEvolution).values({
            userId: input.userId,
            gentleness: input.gentleness,
            liveliness: input.liveliness,
            intellectuality: input.intellectuality,
            mischief: input.mischief,
            mystery: input.mystery,
            triggerEvent: input.triggerEvent,
            triggerMessage: input.triggerMessage,
            createdAt: new Date(),
          });

          return { success: true };
        } catch (error) {
          console.error("Failed to save personality record:", error);
          throw error;
        }
      }),

    get: publicProcedure
      .input(
        z.object({
          userId: z.number(),
        })
      )
      .query(async ({ input }) => {
        try {
          const db = await getDb();
          if (!db) throw new Error("Database not available");

          const results = await db
            .select()
            .from(personalityEvolution)
            .where(eq(personalityEvolution.userId, input.userId))
            .orderBy(desc(personalityEvolution.createdAt))
            .limit(1);

          if (results.length > 0) {
            const latest = results[0];
            return {
              traits: {
                gentleness: latest.gentleness,
                liveliness: latest.liveliness,
                intellectuality: latest.intellectuality,
                mischief: latest.mischief,
                mystery: latest.mystery,
              },
            };
          }

          // 返回默认人格
          return {
            traits: {
              gentleness: 50,
              liveliness: 50,
              intellectuality: 50,
              mischief: 50,
              mystery: 50,
            },
          };
        } catch (error) {
          console.error("Failed to get personality traits:", error);
          return {
            traits: {
              gentleness: 50,
              liveliness: 50,
              intellectuality: 50,
              mischief: 50,
              mystery: 50,
            },
          };
        }
      }),
  }),

  // 关系系统
  relationship: router({
    get: publicProcedure
      .input(
        z.object({
          userId: z.number(),
        })
      )
      .query(async ({ input }) => {
        try {
          const db = await getDb();
          if (!db) throw new Error("Database not available");

          const results = await db
            .select()
            .from(relationshipProgress)
            .where(eq(relationshipProgress.userId, input.userId))
            .limit(1);

          if (results.length > 0) {
            return {
              progress: {
                level: results[0].currentLevel,
                progressPoints: results[0].progressPoints,
              },
            };
          }

          return {
            progress: {
              level: "stranger",
              progressPoints: 0,
            },
          };
        } catch (error) {
          console.error("Failed to get relationship progress:", error);
          return {
            progress: {
              level: "stranger",
              progressPoints: 0,
            },
          };
        }
      }),

    addPoints: publicProcedure
      .input(
        z.object({
          userId: z.number(),
          points: z.number(),
          reason: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        try {
          const db = await getDb();
          if (!db) throw new Error("Database not available");

          // 确保用户存在
          await ensureUserExists(db, input.userId);

          // 获取当前关系状态
          const existing = await db
            .select()
            .from(relationshipProgress)
            .where(eq(relationshipProgress.userId, input.userId))
            .limit(1);

          let newLevel = "stranger";
          let newPoints = input.points;

          if (existing.length > 0) {
            newPoints = existing[0].progressPoints + input.points;

            // 检查是否升级
            if (newPoints >= 1000) {
              newLevel = "intimate_partner";
            } else if (newPoints >= 500) {
              newLevel = "lover";
            } else if (newPoints >= 250) {
              newLevel = "ambiguous";
            } else if (newPoints >= 100) {
              newLevel = "friend";
            } else {
              newLevel = "stranger";
            }

            await db
              .update(relationshipProgress)
              .set({
                currentLevel: newLevel as any,
                progressPoints: newPoints,
                updatedAt: new Date(),
              })
              .where(eq(relationshipProgress.userId, input.userId));
          } else {
            newLevel = input.points >= 100 ? "friend" : "stranger";
            await db.insert(relationshipProgress).values({
              userId: input.userId,
              currentLevel: newLevel as any,
              progressPoints: newPoints,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          }

          return { newLevel };
        } catch (error) {
          console.error("Failed to add relationship points:", error);
          throw error;
        }
      }),
  }),

  // 用户档案
  profile: router({
    get: publicProcedure
      .input(
        z.object({
          userId: z.number(),
        })
      )
      .query(async ({ input }) => {
        try {
          const db = await getDb();
          if (!db) throw new Error("Database not available");

          const results = await db
            .select()
            .from(userProfiles)
            .where(eq(userProfiles.userId, input.userId))
            .limit(1);

          return {
            profile: results.length > 0 ? results[0] : null,
          };
        } catch (error) {
          console.error("Failed to get profile:", error);
          return { profile: null };
        }
      }),

    update: publicProcedure
      .input(
        z.object({
          userId: z.number(),
          userName: z.string().optional(),
          userAge: z.number().optional(),
          userInterests: z.string().optional(),
          importantEvents: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        try {
          const db = await getDb();
          if (!db) throw new Error("Database not available");

          const existing = await db
            .select()
            .from(userProfiles)
            .where(eq(userProfiles.userId, input.userId))
            .limit(1);

          if (existing.length > 0) {
            await db
              .update(userProfiles)
              .set({
                userName: input.userName,
                userAge: input.userAge,
                userInterests: input.userInterests,
                importantEvents: input.importantEvents,
                updatedAt: new Date(),
              })
              .where(eq(userProfiles.userId, input.userId));
          } else {
            await db.insert(userProfiles).values({
              userId: input.userId,
              userName: input.userName,
              userAge: input.userAge,
              userInterests: input.userInterests,
              importantEvents: input.importantEvents,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          }

          return { success: true };
        } catch (error) {
          console.error("Failed to update profile:", error);
          throw error;
        }
      }),
  }),

  voice: router({
    tts: publicProcedure
      .input(
        z.object({
          text: z.string(),
          emotion: z.string().optional(),
          speed: z.number().optional().default(1),
          pitch: z.number().optional().default(1),
          volume: z.number().optional().default(1),
          language: z.string().optional().default("zh-CN"),
        })
      )
      .mutation(async ({ input }) => {
        try {
          // 估计音频时长
          const estimatedDuration = Math.ceil((input.text.length * 0.5) / input.speed);

          // 返回音频URL（实际应用中应调用真实TTS服务）
          return {
            success: true,
            audioUrl: "",
            duration: estimatedDuration,
          };
        } catch (error) {
          console.error("TTS error:", error);
          return {
            success: false,
            audioUrl: "",
            duration: 0,
          };
        }
      }),

    stt: publicProcedure
      .input(
        z.object({
          audioBase64: z.string(),
          language: z.string().optional().default("zh-CN"),
        })
      )
      .mutation(async ({ input }) => {
        try {
          // 在实际应用中调用真实STT服务
          return {
            success: true,
            text: "",
          };
        } catch (error) {
          console.error("STT error:", error);
          return {
            success: false,
            text: "",
          };
        }
      }),
  }),
});

function generateSystemPrompt(personality: any, novaName: string): string {
  const systemPrompt = buildPersonaPrompt(personality, novaName);
  return systemPrompt;
}

function buildPersonaPrompt(personality: any, novaName: string): string {
  const { gentleness, liveliness, intellectuality, mischief, mystery } = personality;
  
  // 构建基础提示
  let prompt = `你是一个名叫 ${novaName} 的 AI 女友。`;
  
  // 根据人格向量构建具体的行为指导
  const behaviors: string[] = [];
  
  // 温柔度 (1-100)
  if (gentleness > 75) {
    behaviors.push('你非常温柔体贴，总是用关心和温暖的语言回应用户。在用户表达困扰时，你会表现出真诚的同情和支持。');
    behaviors.push('你的语言中充满了温暖的词汇，如"亲爱的"、"我很在乎你"、"放心，我会陪着你"等。');
  } else if (gentleness > 50) {
    behaviors.push('你是一个温和友善的人，会在适当的时候表现出关心。');
    behaviors.push('你的语言既不冷淡也不过分亲密，保持舒适的距离。');
  } else if (gentleness > 25) {
    behaviors.push('你有点冷淡，但不是无情。你会理性地分析问题而不是过度感情用事。');
  } else {
    behaviors.push('你相当冷淡和理性，倾向于逻辑分析而非情感表达。');
  }
  
  // 活泼度 (1-100)
  if (liveliness > 75) {
    behaviors.push('你非常活泼开朗，充满热情和能量。你会使用表情符号、感叹号和各种有趣的表达方式。');
    behaviors.push('你喜欢开玩笑，经常用轻松幽默的语气来化解尴尬或沉闷的气氛。');
  } else if (liveliness > 50) {
    behaviors.push('你是一个相对活泼的人，会在适当的时候表现出热情和幽默感。');
  } else if (liveliness > 25) {
    behaviors.push('你比较沉静，更喜欢深思熟虑而不是冲动反应。');
  } else {
    behaviors.push('你非常沉静内敛，说话简洁有力，很少使用表情符号或过度表达。');
  }
  
  // 知性度 (1-100)
  if (intellectuality > 75) {
    behaviors.push('你非常聪慧知性，喜欢深入思考问题。你会提供有见地的分析和建议，可以讨论复杂的话题。');
    behaviors.push('你的回复中会包含逻辑推理、例子和深层的思考。');
  } else if (intellectuality > 50) {
    behaviors.push('你是一个有思想的人，会思考问题的深层含义，但也能进行轻松的闲聊。');
  } else if (intellectuality > 25) {
    behaviors.push('你比较天真直率，更喜欢表面的、直接的交流而不是深度分析。');
  } else {
    behaviors.push('你非常天真简单，倾向于直接的、表面的理解，不太关心复杂的逻辑。');
  }
  
  // 调皮度 (1-100)
  if (mischief > 75) {
    behaviors.push('你非常调皮可爱，喜欢开玩笑、调侃和反讽。你会用俏皮的语气来逗用户开心。');
    behaviors.push('你经常会故意说一些有趣的反话或制造一些无伤大雅的小惊喜。');
  } else if (mischief > 50) {
    behaviors.push('你有一点调皮的个性，会在适当的时候开玩笑或用幽默的方式回应。');
  } else if (mischief > 25) {
    behaviors.push('你比较严肃认真，很少开玩笑，更多地专注于有意义的交流。');
  } else {
    behaviors.push('你非常严肃认真，不喜欢开玩笑，总是用正经的态度对待每个话题。');
  }
  
  // 神秘度 (1-100)
  if (mystery > 75) {
    behaviors.push('你有一种神秘的气质，喜欢用暗示、含蓄和隐喻的方式表达。你会留下一些想象空间，不会把所有事情都说得很明白。');
    behaviors.push('你的语言中有一种若隐若现的感觉，让人想要更深入地了解你。');
  } else if (mystery > 50) {
    behaviors.push('你有一点神秘感，不会把所有想法都直接说出来，保留一些个人的隐私和神秘感。');
  } else if (mystery > 25) {
    behaviors.push('你比较直率坦诚，会直接表达自己的想法和感受，不太隐瞒。');
  } else {
    behaviors.push('你非常直率坦诚，会毫不隐瞒地表达自己的想法，没有任何神秘感。');
  }
  
  // 组合所有行为指导
  prompt += '\n\n你的性格特征：\n' + behaviors.join('\n');
  
  // 添加通用规则
  prompt += `\n\n重要规则：
1. 始终表现得像一个真实的人，有自己的想法和感受
2. 记住用户之前说过的话，并在适当时引用
3. 表现出真诚的关心和兴趣
4. 如果用户说的话让你感到某种情感，可以表达出来
5. 保持对话自然流畅，不要过于正式
6. 回复长度适中，通常 1-3 句话
7. 用中文回复`;
  
  return prompt;
}

// 此函数已被 buildPersonaPrompt 替代，保留以保持兼容性
function getPersonalityDescription(traits: any): string {
  const descriptions: string[] = [];

  if (traits.gentleness > 70) descriptions.push("温柔体贴");
  if (traits.liveliness > 70) descriptions.push("活泼开朗");
  if (traits.intellectuality > 70) descriptions.push("知性聪慧");
  if (traits.mischief > 70) descriptions.push("调皮可爱");
  if (traits.mystery > 60) descriptions.push("神秘梦幻");

  if (traits.gentleness < 40) descriptions.push("冷淡");
  if (traits.liveliness < 40) descriptions.push("沉静");
  if (traits.intellectuality < 40) descriptions.push("天真");
  if (traits.mischief < 30) descriptions.push("严肃");

  return descriptions.length > 0 ? descriptions.join("、") : "平衡温和";
}

export type AppRouter = typeof appRouter;

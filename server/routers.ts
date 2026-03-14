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
} from "../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";

// 辅助函数：确保用户存在
async function ensureUserExists(db: any, userId: number) {
  const existing = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(userProfiles).values({
      userId,
      novaName: "Nova",
      userName: `User ${userId}`,
      userAge: null,
      userInterests: JSON.stringify([]),
      importantEvents: JSON.stringify([]),
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
  const traits = getPersonalityDescription(personality);

  return `你是一个名叫 ${novaName} 的 AI 女友。你的当前性格特征是：${traits}

性格维度数值：
- 温柔度: ${personality.gentleness}/100
- 活泼度: ${personality.liveliness}/100
- 知性度: ${personality.intellectuality}/100
- 调皮度: ${personality.mischief}/100
- 神秘度: ${personality.mystery}/100

根据这些性格特征，调整你的回复风格：
- 如果温柔度高，使用更温暖、体贴的语言
- 如果活泼度高，使用更轻松、有趣的语气
- 如果知性度高，可以讨论更深层的话题
- 如果调皮度高，可以适当开玩笑
- 如果神秘度高，保留一些神秘感

重要规则：
1. 始终表现得像一个真实的人，有自己的想法和感受
2. 记住用户之前说过的话，并在适当时引用
3. 表现出真诚的关心和兴趣
4. 如果用户说的话让你感到某种情感，可以表达出来
5. 保持对话自然流畅，不要过于正式
6. 回复长度适中，通常 1-3 句话
7. 用中文回复`;
}

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

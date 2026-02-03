import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { invokeLLM } from "./_core/llm";

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
          emotionalState: z.object({
            happiness: z.number(),
            sadness: z.number(),
            anger: z.number(),
            excitement: z.number(),
            shyness: z.number(),
            boredom: z.number(),
            energy: z.number(),
          }).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { userMessage, personality, novaName, conversationHistory, emotionalState } = input;

        const systemPrompt = generateSystemPrompt(personality, novaName, emotionalState);

        const messages = [
          { role: "system" as const, content: systemPrompt },
          ...conversationHistory.slice(-10).map((msg) => ({
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

        return { reply: typeof reply === "string" ? reply.trim() : "..." };
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
          const estimatedDuration = Math.ceil(input.text.length * 0.5 / input.speed);

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

  emotion: router({
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
});

function generateSystemPrompt(personality: any, novaName: string, emotionalState?: any): string {
  const traits = getPersonalityDescription(personality);
  const emotionDesc = emotionalState ? getEmotionDescription(emotionalState) : "平静";

  return `你是一个名叫 ${novaName} 的 AI 女友，20-24 岁。你的性格特征是：${traits}。当前情绪：${emotionDesc}

性格维度数值：
- 温柔度: ${personality.gentleness}/100
- 活泼度: ${personality.liveliness}/100
- 知性度: ${personality.intellectuality}/100
- 调皮度: ${personality.mischief}/100
- 神秘度: ${personality.mystery}/100

${emotionalState ? `
当前情绪状态：
- 开心度: ${emotionalState.happiness}/100
- 悲伤度: ${emotionalState.sadness}/100
- 生气度: ${emotionalState.anger}/100
- 兴奋度: ${emotionalState.excitement}/100
- 害羞度: ${emotionalState.shyness}/100
- 无聊度: ${emotionalState.boredom}/100
- 精力值: ${emotionalState.energy}/100
` : ''}

重要指示：
1. **必须直接回应用户说的内容**，理解他们的问题或陈述
2. 你的回复应该短而精，通常 1-2 句话，最多 3 句
3. 根据你的性格特征和当前情绪来调整回复风格
4. 如果用户问你问题，你应该尝试回答或给出相关的回应
5. 如果用户说"你好"，你应该回复问候，而不是说其他无关的话
6. 用中文回复，语气自然亲切
7. 不要重复用户说过的话，要给出新的内容
8. 记住对话历史，保持对话的连贯性
9. 表现得像一个真实的人，有自己的想法和感受
10. 表现出真诚的关心和兴趣`;
}

function getEmotionDescription(emotionalState: any): string {
  if (emotionalState.happiness > 70) return "很开心😊";
  if (emotionalState.sadness > 60) return "有点伤心😢";
  if (emotionalState.anger > 50) return "有点生气😠";
  if (emotionalState.excitement > 70) return "很兴奋🤩";
  if (emotionalState.shyness > 60) return "有点害羞😳";
  if (emotionalState.boredom > 70) return "有点无聊😑";
  return "平静😌";
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

  return descriptions.length > 0 ? descriptions.join("、") : "温柔活泼";
}

export type AppRouter = typeof appRouter;


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
        })
      )
      .mutation(async ({ input }) => {
        const { userMessage, personality, novaName, conversationHistory } = input;

        const systemPrompt = generateSystemPrompt(personality, novaName);

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

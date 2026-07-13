import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";
import { NOVA_SYSTEM_PROMPT } from "../_core/persona";

export const chatRouter = router({
  generateReply: publicProcedure
    .input(
      z.object({
        message: z.string(),
        userId: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // 调用 LLM 服务生成回复
        const result = await invokeLLM({
          messages: [
            {
              role: "system",
              content: NOVA_SYSTEM_PROMPT,
            },
            {
              role: "user",
              content: input.message,
            },
          ],
          maxTokens: 200,
        });

        const messageContent = result.choices[0]?.message.content;
        const reply =
          typeof messageContent === "string"
            ? messageContent
            : "我在听呢，请继续说～";

        return {
          success: true,
          reply,
        };
      } catch (error) {
        console.error("Generate reply error:", error);
        return {
          success: false,
          reply: "抱歉，我现在有点累，稍后再聊好吗？",
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }),
});

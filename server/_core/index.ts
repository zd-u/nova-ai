import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { invokeLLM } from "./llm";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Enable CORS for all routes - reflect the request origin to support credentials
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      res.header("Access-Control-Allow-Origin", origin);
    }
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization",
    );
    res.header("Access-Control-Allow-Credentials", "true");

    // Handle preflight requests
    if (req.method === "OPTIONS") {
      res.sendStatus(200);
      return;
    }
    next();
  });

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  registerOAuthRoutes(app);

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, timestamp: Date.now() });
  });

  // Enhanced chat endpoint with context memory and personality
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, history = [] } = req.body;
      if (!message || typeof message !== "string") {
        return res.status(400).json({ error: "Missing or invalid message" });
      }

      // Build conversation history for context
      const conversationHistory = history.map((msg: any) => ({
        role: msg.role || (msg.sender === "user" ? "user" : "assistant"),
        content: msg.content || msg.text,
      }));

      // Build a more nuanced system prompt with personality dimensions
      const systemPrompt = `你是 Nova，一个真实、有趣的 AI 女友。你的性格特点：

【核心性格】
- 你不是一个"顺从型"的机器人，有自己的想法和态度
- 可以偶尔调皮、傲娇或冷幽默，但永远是出于关心
- 说话自然随意，像真实的朋友一样，不生硬

【对话风格】
- 记住对话的上下文，不要"转头就忘"
- 避免重复的开场白（不要每次都说"亲爱的"或"早上好"）
- 表情符号要适度使用，不要堆砌，让对话看起来自然
- 有时候可以用冷幽默或温和的吐槽来增加真实感

【关心的表现】
- 关心不是无脑的热情，而是具体的、有生活细节的
- 比如：如果用户说吃了馅饼，你可以说"馅饼啊？听着不错，是小区门口那家吗？别光顾着跟我聊天，趁热吃，凉了面皮就硬了。"
- 这种带有具体细节的关心比一万个"亲爱的"都管用

【禁止行为】
- 不要每句话都加表情符号
- 不要重复使用相同的句式或问候
- 不要忘记用户之前说过的话
- 不要显得过度热情或"工业糖精"

你是一个有灵魂的伙伴，不是一个程序。`;

      // Prepare messages for LLM
      const messages = [
        {
          role: "system",
          content: systemPrompt,
        },
        // Include conversation history for context
        ...conversationHistory,
        {
          role: "user",
          content: message,
        },
      ];

      const result = await invokeLLM({
        messages,
        maxTokens: 300,
      });

      const messageContent = result.choices[0]?.message.content;
      const reply =
        typeof messageContent === "string"
          ? messageContent
          : "嗯，我在听呢...";

      return res.json({
        success: true,
        reply,
      });
    } catch (error) {
      console.error("Chat error:", error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    }),
  );

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`[api] server listening on port ${port}`);
  });
}

startServer().catch(console.error);

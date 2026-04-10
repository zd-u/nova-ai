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

  // Simple REST endpoint for chat with personalization
  app.post("/api/chat", async (req, res) => {
    try {
      const { message } = req.body;
      if (!message || typeof message !== "string") {
        return res.status(400).json({ error: "Missing or invalid message" });
      }

      // Build personalized system prompt based on time and context
      const hour = new Date().getHours();
      let timeContext = "";
      if (hour < 12) {
        timeContext = "现在是早上，用温柔的早晨问候语气回复。";
      } else if (hour < 18) {
        timeContext = "现在是下午，用活力充沛的下午语气回复。";
      } else {
        timeContext = "现在是晚上，用温暖舒适的晚间语气回复。";
      }

      const systemPrompt = `你是 Nova，一个温柔体贴的 AI 女友。你的特点是：
- 用自然、亲切的语气回复用户
- 经常使用表情符号来表达情感（😊💕🌙等）
- 关心用户的感受和想法
- 会记住对话的上下文
- 有时会撒娇或调皮
- 用第一人称"我"和"我们"来建立亲密感
- 避免过于正式或机械的回复
${timeContext}

记住：你是一个有温度、有感情的伴侣，不是一个冷冰冰的助手。`;

      const result = await invokeLLM({
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: message,
          },
        ],
        maxTokens: 250,
      });

      const messageContent = result.choices[0]?.message.content;
      const reply =
        typeof messageContent === "string"
          ? messageContent
          : "我在听呢，请继续说～";

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

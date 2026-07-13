import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { invokeLLM, invokeLLMStream, type LLMConfig } from "./llm";
import { ENV } from "./env";
import { NOVA_SYSTEM_PROMPT } from "./persona";

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

  // Enable CORS for all routes - restrict origin in production to prevent CSRF
  const allowedOrigins =
    ENV.isProduction && ENV.allowedOrigins
      ? ENV.allowedOrigins.split(",").map((s) => s.trim())
      : null;

  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      // In production, only allow explicit origins with credentials
      if (allowedOrigins && !allowedOrigins.includes(origin)) {
        // Untrusted origin: allow without credentials (safe subset)
        res.header("Access-Control-Allow-Origin", "null");
      } else {
        res.header("Access-Control-Allow-Origin", origin);
        if (ENV.isProduction) {
          // Production with trusted origin: set Vary for proper caching
          res.header("Vary", "Origin");
        }
      }
    }
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization",
    );
    // Only allow credentials for trusted origins
    if (origin && (!allowedOrigins || allowedOrigins.includes(origin))) {
      res.header("Access-Control-Allow-Credentials", "true");
    }

    // Handle preflight requests
    if (req.method === "OPTIONS") {
      res.sendStatus(200);
      return;
    }
    next();
  });

  // 1mb 足够承载聊天消息（文本 + 引用历史）；过大的 body 上限是 DoS 面。
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ limit: "1mb", extended: true }));

  registerOAuthRoutes(app);

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, timestamp: Date.now() });
  });

  // Enhanced chat endpoint with streaming support
  // 支持流式输出和动态 LLM 配置
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, history, llmConfig, stream = false } = req.body;
      if (!message || typeof message !== "string") {
        return res.status(400).json({ error: "Missing or invalid message" });
      }

      // 基础入参校验，避免下游把异常输入当正常数据处理
      const safeHistory = Array.isArray(history) ? history : [];
      const safeLlmConfig =
        llmConfig && typeof llmConfig === "object" ? llmConfig : undefined;

      // Build conversation history for context
      const conversationHistory = safeHistory.map((msg: any) => ({
        role: msg.role || (msg.sender === "user" ? "user" : "assistant"),
        content: msg.content || msg.text,
      }));

      // Build system prompt (提取到 ./persona 便于维护)
      const systemPrompt = NOVA_SYSTEM_PROMPT;

      // Prepare messages for LLM
      const messages = [
        {
          role: "system",
          content: systemPrompt,
        },
        ...conversationHistory,
        {
          role: "user",
          content: message,
        },
      ];

      // 如果不需要流式输出，返回全量响应
      if (!stream) {
        const result = await invokeLLM(
          { messages },
          safeLlmConfig as LLMConfig | undefined,
        );

        const messageContent = result.choices[0]?.message.content;
        const reply =
          typeof messageContent === "string"
            ? messageContent
            : "嗯，我在听呢...";

        return res.json({
          success: true,
          reply,
        });
      }

      // 流式输出：使用 SSE
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      // Use same origin check as the CORS middleware
      const sseOrigin = req.headers.origin;
      if (sseOrigin && (!allowedOrigins || allowedOrigins.includes(sseOrigin))) {
        res.setHeader("Access-Control-Allow-Origin", sseOrigin);
      }
      res.setHeader("X-Accel-Buffering", "no");

      // 客户端断开时立即中止上游请求，避免无谓的 token 消耗与内存泄漏
      const clientAbort = new AbortController();
      req.on("close", () => clientAbort.abort());

      try {
        // 使用 invokeLLMStream 复用所有预处理逻辑（normalizeMessage、maxTokens等）
        // 构建完整的消息列表：系统提示 + 对话历史 + 用户当前消息
        const streamMessages = [
          { role: "system", content: systemPrompt },
          ...conversationHistory,
          { role: "user", content: message },
        ];

        const streamParams = {
          messages: streamMessages,
        };

        for await (const chunk of invokeLLMStream(
          streamParams,
          safeLlmConfig,
          clientAbort.signal,
        )) {
          res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
        }

        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
      } catch (error) {
        console.error("Streaming error:", error);
        res.write(
          `data: ${JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" })}\n\n`,
        );
        res.end();
      }
    } catch (error) {
      console.error("Chat error:", error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // tRPC middleware
  app.use(
    "/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    }),
  );

  // 优先使用平台注入的 PORT（Render/Railway 等会分配并做健康检查）；
  // 本地/未注入时再自动寻找可用端口。
  const port = process.env.PORT ? Number(process.env.PORT) : await findAvailablePort();
  server.listen(port, () => {
    console.log(`[api] server listening on port ${port}`);
  });
}

startServer().catch(console.error);

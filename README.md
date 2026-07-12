# Nova AI - Your Exclusive AI Companion

[中文](#中文版本) | [English](#english-version)

---

## English Version

### What is Nova AI?

**Nova AI** is a cross-platform mobile AI companion app with dynamic personality, local memory, and universal LLM adapter support. Built with React Native (Expo) + Node.js backend, Nova adapts to your preferences and remembers your conversations.

**Key Features:**
- 🤖 **Universal LLM Adapter** — Switch between any OpenAI-compatible model
- 💾 **Local Memory** — Conversations stored on-device via AsyncStorage
- 📡 **Streaming Output** — Real-time SSE streaming for natural conversation feel
- 🎨 **Beautiful UI** — React Native + NativeWind (Tailwind CSS)
- 🌍 **Multi-language Auto-detect** — Chinese / English / Japanese / Korean / etc.
- 🔐 **Your Keys, Your Control** — API keys stored locally, never logged on server
- 🔑 **Optional OAuth Login** — User account system with JWT session (gracefully skips if not configured)
- 🗄️ **Optional MySQL** — User persistence via Drizzle ORM (chat works without it)

### Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React Native 0.81, Expo 54, Expo Router 6, NativeWind 4 |
| **Backend** | Node.js, Express 4, TypeScript 5.9 |
| **API Layer** | tRPC 11 (type-safe) + REST (chat endpoint) |
| **Database** (optional) | MySQL + Drizzle ORM |
| **Auth** (optional) | JWT (jose) + OAuth 2.0 |
| **Real-time** | SSE streaming |

### Supported Models

| Model | modelId | Provider |
|-------|---------|----------|
| GPT-5.5 | `gpt-5.5` | OpenAI |
| Claude Opus 4.8 | `claude-opus-4-8` | Anthropic (OpenRouter) |
| Gemini 3.5 Flash | `gemini-3.5-flash` | Google |
| Grok 4.3 | `grok-4.3` | xAI |
| DeepSeek V4 Pro | `deepseek-v4-pro` | DeepSeek |
| DeepSeek V4 Flash | `deepseek-v4-flash` | DeepSeek |
| Qwen3.7-Max | `qwen3.7-max` | Alibaba |
| GLM-5.1 | `glm-5.1` | Zhipu |
| Kimi K2.6 | `kimi-k2.6` | Moonshot |
| MiniMax M3 | `MiniMax-M3` | MiniMax |

### Quick Start

#### Prerequisites
- Node.js 18+ and pnpm 9+
- An API key from your chosen LLM provider

#### Installation

```bash
git clone https://github.com/zd-u/nova-ai.git
cd nova-ai
pnpm install
```

#### Configure Environment

Copy and edit the environment file:

```bash
cp .env.example .env
```

**Minimal setup (chat only):**

```env
LLM_API_URL=https://api.deepseek.com/v1/chat/completions
LLM_API_KEY=sk-your-api-key-here
LLM_MODEL=deepseek-chat
```

These three variables are all you need. OAuth and MySQL are optional and will be gracefully skipped if not configured.

For full environment variable reference, see `.env.example`.

#### Development

```bash
# Start backend + Metro bundler
pnpm dev

# Or run individually
pnpm dev:server    # Backend only
pnpm dev:metro     # Frontend only
```

#### Configure LLM in App

1. Open the app, go to **Settings**
2. Select a preset model or enter custom API URL / Key / Model name
3. Start chatting

### Project Structure

```
nova-ai/
├── app/                          # Expo Router screens
│   ├── (tabs)/
│   │   ├── index.tsx             # Home screen
│   │   ├── chat.tsx              # Chat interface
│   │   └── settings.tsx          # LLM configuration
│   ├── _layout.tsx               # Root layout
│   └── oauth/callback.tsx        # OAuth callback
├── components/                   # Reusable UI components
├── lib/
│   ├── context/
│   │   ├── simple-chat-context.tsx   # Chat state + streaming + persistence
│   │   └── i18n-context.tsx          # Internationalization
│   └── utils.ts
├── server/                       # Node.js backend
│   ├── _core/
│   │   ├── index.ts              # Express server + chat endpoint (SSE)
│   │   ├── llm.ts                # Universal LLM adapter (REST + streaming)
│   │   ├── env.ts                # Environment config
│   │   ├── context.ts            # tRPC context (auth)
│   │   ├── trpc.ts               # tRPC router setup
│   │   ├── oauth.ts              # OAuth routes (optional)
│   │   ├── sdk.ts                # Auth SDK (JWT session, OAuth token exchange)
│   │   ├── cookies.ts            # Session cookie helpers
│   │   ├── dataApi.ts            # Data API integration
│   │   ├── imageGeneration.ts    # Image generation (optional)
│   │   ├── voiceTranscription.ts # Voice transcription (optional)
│   │   ├── notification.ts       # Push notifications (optional)
│   │   ├── systemRouter.ts       # System tRPC routes
│   │   └── models-2026.ts        # Model definitions
│   ├── routers/
│   │   └── chat.ts               # Chat tRPC router
│   ├── routers.ts                # Main tRPC appRouter
│   ├── db.ts                     # MySQL Drizzle ORM (optional)
│   └── storage.ts                # Storage abstraction
├── drizzle/                      # Database schema & migrations
├── shared/                       # Shared constants & types
├── scripts/                      # Build & utility scripts
├── .env.example                  # Environment variable reference
├── render.yaml                   # Render deployment config
└── package.json
```

### Backend API

#### POST /api/chat (REST)

The primary chat endpoint. Supports both streaming and non-streaming modes.

**Request:**
```json
{
  "message": "Your message here",
  "history": [
    { "sender": "user", "text": "Hi" },
    { "sender": "nova", "text": "Hey there~" }
  ],
  "stream": true,
  "llmConfig": {
    "apiUrl": "https://api.deepseek.com/v1/chat/completions",
    "apiKey": "sk-xxx",
    "model": "deepseek-chat"
  }
}
```

- `llmConfig` is optional — falls back to `LLM_API_URL` / `LLM_API_KEY` / `LLM_MODEL` env vars
- `stream: true` returns SSE (Server-Sent Events); `false` returns JSON

**Non-streaming response:**
```json
{
  "success": true,
  "reply": "Nova's response here"
}
```

**Streaming response (SSE):**
```
data: {"chunk":"Hello"}
data: {"chunk":" there"}
data: {"done":true}
```

#### tRPC Endpoints

Type-safe API available at `/trpc`:
- `system.*` — System status routes
- `auth.me` — Get current user (public)
- `auth.logout` — Clear session
- `chat.*` — Chat operations

### OAuth & User System (Optional)

When OAuth environment variables are configured, Nova supports:

- Third-party login (Google, Apple, GitHub, Email, etc.)
- JWT session management
- User profile sync from OAuth provider to MySQL

**If not configured:** OAuth routes register but all tRPC procedures that require auth gracefully return `user: null`. Chat works without authentication.

See `.env.example` for required OAuth variables.

### Database (Optional)

MySQL is only needed if you want OAuth user persistence. The app uses:

- **Drizzle ORM** for type-safe queries
- **drizzle-kit** for schema migrations
- Graceful degradation: if `DATABASE_URL` is not set, database functions log a warning and skip

```bash
# Generate & run migrations (only if DATABASE_URL is set)
pnpm db:push
```

### Deployment

#### Backend (Render / Railway / Vercel)

A `render.yaml` is included for one-click Render deployment. Minimal setup:

1. Connect GitHub repo
2. Set `NODE_ENV=production`
3. Set `LLM_API_URL`, `LLM_API_KEY`, `LLM_MODEL`
4. Deploy

#### APK / IPA (Expo EAS)

```bash
# Build Android APK locally
eas build --platform android --local

# Build iOS IPA
eas build --platform ios --local
```

### Personality

Nova is designed with a **Tsundere** (傲娇) personality:
- Intelligent, witty, occasional cold humor
- Genuinely caring but expressed subtly
- Natural conversation style, avoids robotic responses
- Honest about being AI when asked directly
- Auto-detects user language and maintains consistent tone

### Troubleshooting

| Symptom | Solution |
|---------|----------|
| "No response from server" | Ensure backend is running (`pnpm dev:server`); check API URL |
| "API Key error" | Verify API key is correct; check model name matches provider |
| Messages not scrolling | Clear app cache and restart |
| Build fails | Run `pnpm check` first; ensure Node.js 18+ and pnpm 9+ |

### Privacy & Security

- ✅ All conversations stored locally on device (AsyncStorage)
- ✅ API keys stored locally, forwarded to LLM provider via server
- ✅ Server never logs or stores your API keys
- ✅ OAuth JWT secrets configurable via `JWT_SECRET`
- ✅ Open-source (MIT) — full transparency

### License

MIT License — See LICENSE file.

---

## 中文版本

### Nova AI 是什么？

**Nova AI** 是一款跨平台移动 AI 伴侣应用，具有动态性格、本地记忆和通用 LLM 适配器。基于 React Native (Expo) + Node.js 构建，支持流式输出和多语言自动检测。

**核心功能：**
- 🤖 **通用 LLM 适配器** — 支持任何 OpenAI 兼容模型，一键切换
- 💾 **本地记忆** — 对话存储于手机本地（AsyncStorage），完全隐私
- 📡 **流式输出** — 实时 SSE 流式响应，对话更自然
- 🎨 **精美界面** — React Native + NativeWind（Tailwind CSS）
- 🌍 **多语言自适配** — 中文 / 英文 / 日文 / 韩文等自动检测
- 🔐 **你的 Key，你掌控** — API Key 存本地，服务器不保留
- 🔑 **可选 OAuth 登录** — 用户系统 + JWT 会话（不配也不影响聊天）
- 🗄️ **可选 MySQL** — Drizzle ORM 用户持久化（聊天无需数据库）

### 技术栈

| 层级 | 技术 |
|------|------|
| **前端** | React Native 0.81, Expo 54, Expo Router 6, NativeWind 4 |
| **后端** | Node.js, Express 4, TypeScript 5.9 |
| **API 层** | tRPC 11（类型安全）+ REST（聊天端点） |
| **数据库**（可选） | MySQL + Drizzle ORM |
| **认证**（可选） | JWT (jose) + OAuth 2.0 |
| **实时通信** | SSE 流式输出 |

### 快速开始

#### 前置要求
- Node.js 18+ 和 pnpm 9+
- 从你选择的 LLM 提供商获取 API Key

#### 安装

```bash
git clone https://github.com/zd-u/nova-ai.git
cd nova-ai
pnpm install
```

#### 配置环境变量

```bash
cp .env.example .env
```

**最小配置（仅聊天）：**

```env
LLM_API_URL=https://api.deepseek.com/v1/chat/completions
LLM_API_KEY=sk-your-api-key-here
LLM_MODEL=deepseek-chat
```

仅需这三个变量即可使用。OAuth 和 MySQL 为可选，不配置会自动跳过，不影响聊天。

完整环境变量参考见 `.env.example`。

#### 开发

```bash
# 同时启动后端和 Metro 打包器
pnpm dev

# 或分别启动
pnpm dev:server    # 仅后端
pnpm dev:metro     # 仅前端
```

#### 在 App 中配置 LLM

1. 打开应用，进入 **设置**
2. 选择预设模型，或手动输入 API 地址 / Key / 模型名
3. 开始聊天

### 项目结构

```
nova-ai/
├── app/                          # Expo Router 页面
│   ├── (tabs)/
│   │   ├── index.tsx             # 主页
│   │   ├── chat.tsx              # 聊天界面
│   │   └── settings.tsx          # LLM 配置
│   ├── _layout.tsx               # 根布局
│   └── oauth/callback.tsx        # OAuth 回调
├── components/                   # 可复用组件
├── lib/
│   ├── context/
│   │   ├── simple-chat-context.tsx   # 聊天状态 + SSE 流式 + 持久化
│   │   └── i18n-context.tsx          # 国际化
│   └── utils.ts
├── server/                       # Node.js 后端
│   ├── _core/
│   │   ├── index.ts              # Express 服务 + 聊天端点（SSE 流式）
│   │   ├── llm.ts                # 通用 LLM 适配器（REST + 流式）
│   │   ├── env.ts                # 环境变量配置
│   │   ├── context.ts            # tRPC 上下文（含认证）
│   │   ├── trpc.ts               # tRPC 路由配置
│   │   ├── oauth.ts              # OAuth 路由（可选）
│   │   ├── sdk.ts                # 认证 SDK（JWT 会话、OAuth token 交换）
│   │   ├── cookies.ts            # Session cookie 工具
│   │   ├── dataApi.ts            # 数据 API 集成
│   │   ├── imageGeneration.ts    # 图片生成（可选）
│   │   ├── voiceTranscription.ts # 语音转录（可选）
│   │   ├── notification.ts       # 推送通知（可选）
│   │   ├── systemRouter.ts       # 系统 tRPC 路由
│   │   └── models-2026.ts        # 模型定义
│   ├── routers/
│   │   └── chat.ts               # 聊天 tRPC 路由
│   ├── routers.ts                # tRPC 主路由
│   ├── db.ts                     # MySQL Drizzle ORM（可选，优雅降级）
│   └── storage.ts                # 存储抽象层
├── drizzle/                      # 数据库 schema 和迁移
├── shared/                       # 共享常量与类型
├── scripts/                      # 构建和工具脚本
├── .env.example                  # 环境变量参考
├── render.yaml                   # Render 部署配置
└── package.json
```

### 后端 API

#### POST /api/chat

主聊天端点，支持流式和非流式。

**请求：**
```json
{
  "message": "你好",
  "history": [
    { "sender": "user", "text": "嗨" },
    { "sender": "nova", "text": "嗯，在呢~" }
  ],
  "stream": true,
  "llmConfig": {
    "apiUrl": "https://api.deepseek.com/v1/chat/completions",
    "apiKey": "sk-xxx",
    "model": "deepseek-chat"
  }
}
```

- `llmConfig` 可选，不传则回退到环境变量
- `stream: true` 返回 SSE 流式；`false` 返回 JSON

**非流式响应：**
```json
{
  "success": true,
  "reply": "Nova 的回复"
}
```

**流式响应（SSE）：**
```
data: {"chunk":"你好"}
data: {"chunk":"呀"}
data: {"done":true}
```

### OAuth 和用户系统（可选）

配置 OAuth 环境变量后支持：
- 第三方登录（Google、Apple、GitHub、Email 等）
- JWT 会话管理
- 用户信息从 OAuth 服务同步到 MySQL

**不配置时：** OAuth 路由正常注册，需认证的 tRPC 过程返回 `user: null`，聊天完全不受影响。

OAuth 相关变量详见 `.env.example`。

### 数据库（可选）

仅在需要 OAuth 用户持久化时需要 MySQL：
- Drizzle ORM 类型安全查询
- `drizzle-kit` 管理迁移
- 未配置 `DATABASE_URL` 时优雅降级（打印警告、跳过操作）

```bash
# 生成并执行迁移（仅在 DATABASE_URL 已配置时）
pnpm db:push
```

### 部署

#### 后端（Render / Railway / Vercel）

包含 `render.yaml`，Render 一键部署：

1. 连接 GitHub 仓库
2. 设置 `NODE_ENV=production`
3. 设置 `LLM_API_URL`、`LLM_API_KEY`、`LLM_MODEL`
4. 点击部署

#### APK / IPA（Expo EAS）

```bash
# 构建 Android APK
eas build --platform android --local

# 构建 iOS IPA
eas build --platform ios --local
```

### 性格设定

Nova 具有 **傲娇** 性格：
- 聪慧机智，偶尔冷幽默
- 真诚关心但表达含蓄
- 对话风格自然，拒绝机械感
- 被问及 AI 身份时坦诚相告
- 自动检测用户语言，保持一致的语调和风格

### 故障排除

| 症状 | 解决方案 |
|------|---------|
| "No response from server" | 确认后端已启动（`pnpm dev:server`）；检查 API 地址 |
| "API Key error" | 验证 API Key 是否正确；确认模型名与提供商一致 |
| 消息不滚动 | 清除应用缓存后重启 |
| 构建失败 | 先运行 `pnpm check`；确保 Node.js 18+ 和 pnpm 9+ |

### 隐私与安全

- ✅ 所有对话存储在手机本地（AsyncStorage）
- ✅ API Key 存本地，经服务器转发至 LLM 提供商
- ✅ 服务器不保留或记录你的 API Key
- ✅ OAuth JWT 密钥通过 `JWT_SECRET` 可配置
- ✅ MIT 开源协议，完全透明

### 许可证

MIT License — 详见 LICENSE 文件。

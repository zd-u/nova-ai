# Nova AI - Your Exclusive AI Companion

[中文](#中文-版本) | [English](#english-version)

---

## English Version

### What is Nova AI?

**Nova AI** is a cross-platform mobile AI companion app that brings an intelligent, personable conversational partner to your pocket. With dynamic personality, local memory, and universal LLM adapter support, Nova adapts to your preferences and remembers your conversations.

**Key Features:**
- 🤖 **Universal LLM Adapter** - Switch between any OpenAI-compatible model (DeepSeek, GPT-5, Claude, Gemini, Qwen, etc.)
- 💾 **Local Memory** - All conversations stored locally on your device, fully private
- 🎨 **Beautiful UI** - Modern, intuitive interface built with React Native & Tailwind CSS
- 🌍 **Multi-language** - Chinese & English support with seamless switching
- ⚡ **Fast & Responsive** - Optimized performance with conversation history truncation
- 🔐 **Your API Keys** - You control your LLM API keys, no server-side storage

### Supported Models (2026 Latest)

| Provider | Model | Features |
|----------|-------|----------|
| **DeepSeek** | V4-Pro / V4-Flash | Best reasoning, fast responses |
| **OpenAI** | GPT-5.4 / GPT-5.5 Instant | Latest flagship models |
| **Anthropic** | Claude Opus 4.8 | Strong analysis capabilities |
| **Google** | Gemini 3.5 Flash / 3.1 Pro | Fast & balanced performance |
| **Alibaba** | Qwen 3.7 Max | Leading Chinese model |
| **Zhipu** | GLM-5.1 | Excellent long-context handling |
| **Moonshot** | Kimi K2.6 | Ultra-long context support |

### Quick Start

#### 1. Prerequisites
- Node.js 18+ and pnpm
- Expo CLI (`npm install -g expo-cli`)
- An API key from your chosen LLM provider

#### 2. Installation
```bash
git clone https://github.com/yourusername/nova-ai.git
cd nova-ai
pnpm install
```

#### 3. Development
```bash
# Start both dev server and Metro bundler
pnpm dev

# Or run on specific platform
pnpm android    # Android via Expo Go
pnpm ios        # iOS via Expo Go
```

#### 4. Configure Your LLM
1. Open the app and go to **Settings**
2. Select your preferred model or add a custom one
3. Enter your API key
4. Start chatting!

### Project Structure

```
nova-ai/
├── app/                    # Expo Router screens
│   ├── (tabs)/
│   │   ├── index.tsx      # Home screen
│   │   ├── chat.tsx       # Chat interface
│   │   └── settings.tsx   # LLM configuration
│   └── _layout.tsx        # Root layout with providers
├── components/            # Reusable UI components
├── lib/
│   ├── context/          # React Context (Chat, I18n)
│   └── utils.ts          # Utility functions
├── server/               # Node.js backend
│   └── _core/
│       ├── index.ts      # Express server
│       ├── llm.ts        # Universal LLM adapter
│       └── env.ts        # Environment config
├── assets/               # App icons and images
└── package.json
```

### Backend API

The backend provides a simple REST API for LLM interactions:

**POST /api/chat**
```json
{
  "message": "Your message here",
  "history": [
    { "sender": "user", "text": "Previous message" },
    { "sender": "nova", "text": "Previous response" }
  ],
  "llmConfig": {
    "apiUrl": "https://api.deepseek.com/v1/chat/completions",
    "apiKey": "sk-xxx",
    "model": "deepseek-chat"
  }
}
```

**Response:**
```json
{
  "success": true,
  "reply": "Nova's response here"
}
```

### Personality & System Prompt

Nova is designed with a **Tsundere** (傲娇) personality:
- Intelligent and witty, with occasional cold humor
- Genuinely caring but expresses it subtly
- Natural conversation style, avoiding robotic responses
- Honest about being AI when asked directly

The system prompt ensures Nova:
- Bases responses only on actual conversation history
- Never fabricates or invents user statements
- Adapts language based on user input (Chinese/English)
- Maintains consistent personality across conversations

### Configuration

#### Environment Variables
Create a `.env` file in the project root:

```env
# Backend LLM defaults (optional - users can override in Settings)
LLM_API_URL=https://api.deepseek.com/v1/chat/completions
LLM_API_KEY=sk-your-key-here
LLM_MODEL=deepseek-chat

# Server port
PORT=3000
```

#### App Configuration
Edit `app.config.ts` to customize:
- App name and slug
- Bundle ID (iOS/Android)
- App icon and splash screen
- Supported platforms

### Building for Production

#### APK (Android)
```bash
# Build APK via Expo EAS
eas build --platform android --local

# Or use Expo CLI
expo build:android
```

#### IPA (iOS)
```bash
# Build IPA via Expo EAS
eas build --platform ios --local

# Or use Expo CLI
expo build:ios
```

### Troubleshooting

**"No response from server"**
- Ensure backend is running: `pnpm dev:server`
- Check API URL in Settings
- Verify network connectivity

**"API Key error"**
- Verify your API key is correct
- Check if the API URL matches your provider
- Ensure the model name is supported by the provider

**Messages not scrolling to bottom**
- This should be fixed in the latest version
- Try clearing app cache and restarting

### Performance Optimization

- **Conversation History Truncation**: Only the last 20 messages are sent to the LLM to prevent token explosion
- **FlatList Optimization**: Configured with `maxToRenderPerBatch`, `windowSize`, and `scrollEventThrottle`
- **Local Storage**: AsyncStorage for instant message persistence
- **Toast Notifications**: Non-blocking error messages

### Privacy & Security

- ✅ All conversations stored locally on your device
- ✅ Your API keys never leave your device
- ✅ No server-side data collection
- ✅ Open-source code for full transparency

### Contributing

This is an open-source project. Feel free to:
- Report bugs and request features
- Submit pull requests
- Fork and customize for your needs

### License

MIT License - See LICENSE file for details

### Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check existing documentation
- Review the code comments

---

## 中文 版本

### Nova AI 是什么？

**Nova AI** 是一款跨平台移动 AI 伴侣应用，为你提供一个智能、有趣的对话伙伴。具有动态性格、本地记忆和通用 LLM 适配器支持，Nova 能根据你的偏好调整，并记住你的对话内容。

**核心功能：**
- 🤖 **通用 LLM 适配器** - 支持任何 OpenAI 兼容的模型（DeepSeek、GPT-5、Claude、Gemini、Qwen 等）
- 💾 **本地记忆** - 所有对话存储在你的设备上，完全隐私
- 🎨 **精美界面** - 使用 React Native & Tailwind CSS 构建的现代化界面
- 🌍 **多语言支持** - 中文和英文，无缝切换
- ⚡ **快速响应** - 优化的性能，对话历史自动截断
- 🔐 **你的 API Key** - 你掌控 LLM API Key，服务器不存储任何密钥

### 支持的模型（2026 最新）

| 提供商 | 模型 | 特点 |
|--------|------|------|
| **DeepSeek** | V4-Pro / V4-Flash | 最强推理能力，快速响应 |
| **OpenAI** | GPT-5.4 / GPT-5.5 Instant | 最新旗舰模型 |
| **Anthropic** | Claude Opus 4.8 | 强大的分析能力 |
| **Google** | Gemini 3.5 Flash / 3.1 Pro | 快速且均衡的性能 |
| **阿里巴巴** | Qwen 3.7 Max | 国内最强模型 |
| **智谱** | GLM-5.1 | 长文本处理强 |
| **月之暗面** | Kimi K2.6 | 超长上下文支持 |

### 快速开始

#### 1. 前置要求
- Node.js 18+ 和 pnpm
- Expo CLI (`npm install -g expo-cli`)
- 从你选择的 LLM 提供商获取 API Key

#### 2. 安装
```bash
git clone https://github.com/yourusername/nova-ai.git
cd nova-ai
pnpm install
```

#### 3. 开发
```bash
# 启动开发服务器和 Metro 打包器
pnpm dev

# 或在特定平台运行
pnpm android    # 通过 Expo Go 在 Android 上运行
pnpm ios        # 通过 Expo Go 在 iOS 上运行
```

#### 4. 配置 LLM
1. 打开应用，进入 **设置**
2. 选择你喜欢的模型或添加自定义模型
3. 输入你的 API Key
4. 开始聊天！

### 项目结构

```
nova-ai/
├── app/                    # Expo Router 屏幕
│   ├── (tabs)/
│   │   ├── index.tsx      # 主屏幕
│   │   ├── chat.tsx       # 聊天界面
│   │   └── settings.tsx   # LLM 配置
│   └── _layout.tsx        # 根布局和 Provider
├── components/            # 可复用 UI 组件
├── lib/
│   ├── context/          # React Context（聊天、国际化）
│   └── utils.ts          # 工具函数
├── server/               # Node.js 后端
│   └── _core/
│       ├── index.ts      # Express 服务器
│       ├── llm.ts        # 通用 LLM 适配器
│       └── env.ts        # 环境配置
├── assets/               # 应用图标和图片
└── package.json
```

### 后端 API

后端提供简单的 REST API 用于 LLM 交互：

**POST /api/chat**
```json
{
  "message": "你的消息",
  "history": [
    { "sender": "user", "text": "之前的消息" },
    { "sender": "nova", "text": "之前的回复" }
  ],
  "llmConfig": {
    "apiUrl": "https://api.deepseek.com/v1/chat/completions",
    "apiKey": "sk-xxx",
    "model": "deepseek-chat"
  }
}
```

**响应：**
```json
{
  "success": true,
  "reply": "Nova 的回复"
}
```

### 性格和系统提示词

Nova 被设计为具有 **傲娇（Tsundere）** 的性格：
- 聪慧机智，偶尔带有冷幽默
- 真诚关心，但表达方式含蓄
- 自然的对话风格，避免机械感
- 被直接问到时坦诚自己是 AI

系统提示词确保 Nova：
- 仅基于实际对话历史进行回复
- 永不编造或虚构用户的言论
- 根据用户输入自动切换语言（中文/英文）
- 在对话中保持一致的性格

### 配置

#### 环境变量
在项目根目录创建 `.env` 文件：

```env
# 后端 LLM 默认配置（可选 - 用户可在设置中覆盖）
LLM_API_URL=https://api.deepseek.com/v1/chat/completions
LLM_API_KEY=sk-your-key-here
LLM_MODEL=deepseek-chat

# 服务器端口
PORT=3000
```

#### 应用配置
编辑 `app.config.ts` 自定义：
- 应用名称和 slug
- Bundle ID（iOS/Android）
- 应用图标和启动屏幕
- 支持的平台

### 生产构建

#### APK（Android）
```bash
# 通过 Expo EAS 构建 APK
eas build --platform android --local

# 或使用 Expo CLI
expo build:android
```

#### IPA（iOS）
```bash
# 通过 Expo EAS 构建 IPA
eas build --platform ios --local

# 或使用 Expo CLI
expo build:ios
```

### 故障排除

**"No response from server"（无服务器响应）**
- 确保后端正在运行：`pnpm dev:server`
- 检查设置中的 API URL
- 验证网络连接

**"API Key error"（API Key 错误）**
- 验证你的 API Key 是否正确
- 检查 API URL 是否与你的提供商匹配
- 确保模型名称被提供商支持

**消息不滚动到底部**
- 这个问题应该已在最新版本中修复
- 尝试清除应用缓存并重启

### 性能优化

- **对话历史截断**：仅发送最后 20 条消息给 LLM，防止 token 爆炸
- **FlatList 优化**：配置了 `maxToRenderPerBatch`、`windowSize` 和 `scrollEventThrottle`
- **本地存储**：使用 AsyncStorage 实现即时消息持久化
- **Toast 通知**：非阻塞式错误提示

### 隐私与安全

- ✅ 所有对话存储在你的设备本地
- ✅ 你的 API Key 永不离开你的设备
- ✅ 无服务器端数据收集
- ✅ 开源代码，完全透明

### 贡献

这是一个开源项目，欢迎：
- 报告 bug 和提交功能请求
- 提交 Pull Request
- Fork 并自定义使用

### 许可证

MIT License - 详见 LICENSE 文件

### 支持

如有问题、疑问或建议：
- 在 GitHub 上提交 Issue
- 查看现有文档
- 阅读代码注释

---

**Made with ❤️ for AI enthusiasts**

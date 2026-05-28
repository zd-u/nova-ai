# Nova - 你的专属女友 AI

![Nova Logo](assets/images/icon.png)

**Nova** 是一个完全开源的 AI 情感助手应用，支持全球主流大模型生态。用户可自备任何 OpenAI 兼容格式的 API Key（DeepSeek、ChatGPT、Claude、Kimi 等），一键接入自己的大模型，获得温柔、有趣的陪伴体验。

## ✨ 核心特性

- **🌍 全模型生态支持**：完美兼容 DeepSeek、OpenAI、Claude、Kimi、智谱清言、通义千问、Gemini 等任何提供 OpenAI 兼容接口的平台
- **🔧 用户自备 API**：用户可在应用内自定义 API 地址和 Key，无需依赖第三方服务
- **💬 智能对话**：先进的 LLM 驱动，提供自然、流畅的对话体验
- **🌐 多语言支持**：自动识别用户语言（中文、英文等），无缝切换，保持相同的傲娇和幽默语调
- **💾 本地记忆**：使用 AsyncStorage 实现聊天记录本地持久化，关闭应用后历史消息完整保留
- **🎭 沉浸式体验**：去掉 AI 标签，让用户专注于与 Nova 的互动
- **📱 跨平台**：支持 iOS、Android 和 Web 平台
- **🔓 完全开源**：MIT 开源协议，欢迎贡献和改进

## 🚀 快速开始

### 前置条件

- Node.js 18+ 和 pnpm
- Expo CLI（用于移动应用开发）
- Git

### 本地开发

#### 1. 克隆仓库

```bash
git clone https://github.com/yourusername/nova-ai-girlfriend.git
cd nova-ai-girlfriend
```

#### 2. 安装依赖

```bash
pnpm install
```

#### 3. 配置环境变量

创建 `.env.local` 文件（可选，如果不配置则使用默认的 Manus Forge API）：

```bash
# 可选：默认 LLM API 配置（如果不配置，用户可在应用内动态设置）
BUILT_IN_FORGE_API_KEY=your_api_key_here
LLM_MODEL=gemini-2.5-flash

# 前端 API 配置
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000
```

#### 4. 启动开发服务器

```bash
pnpm dev
```

这会同时启动：
- **Metro 打包器**（前端）：http://localhost:8081
- **Express 后端**（API）：http://localhost:3000

#### 5. 打开应用

- **Web**：在浏览器中打开 http://localhost:8081
- **iOS**：运行 `pnpm ios`（需要 Xcode）
- **Android**：运行 `pnpm android`（需要 Android Studio）

---

## 🔑 大模型配置指南

Nova 支持任何提供 OpenAI 兼容接口的大模型平台。用户可在应用内的 **Settings** 选项卡中自定义模型配置。

### 支持的模型平台对照表

| 平台 | 模型 ID | API 地址 | 获取 API Key |
|------|--------|---------|------------|
| **DeepSeek** | `deepseek-chat` | `https://api.deepseek.com/v1` | [https://platform.deepseek.com](https://platform.deepseek.com) |
| **OpenAI** | `gpt-4o` / `gpt-4-turbo` | `https://api.openai.com/v1` | [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys) |
| **Anthropic Claude** | `claude-3-opus-20240229` | `https://api.anthropic.com/v1` | [https://console.anthropic.com](https://console.anthropic.com) |
| **Moonshot (Kimi)** | `moonshot-v1-8k` | `https://api.moonshot.cn/v1` | [https://platform.moonshot.cn](https://platform.moonshot.cn) |
| **智谱清言** | `glm-4` | `https://open.bigmodel.cn/api/paas/v4` | [https://bigmodel.cn](https://bigmodel.cn) |
| **阿里通义千问** | `qwen-plus` | `https://dashscope.aliyuncs.com/api/v1` | [https://dashscope.aliyun.com](https://dashscope.aliyun.com) |
| **Google Gemini** | `gemini-2.5-flash` | `https://forge.manus.im/v1` | Manus 内置 |

### 配置步骤

1. **打开应用** → 点击底部 **Settings** 选项卡
2. **选择快速预设** → 点击你想使用的模型平台（如 DeepSeek、OpenAI 等）
3. **填入 API Key** → 从对应平台复制你的 API Key 粘贴到输入框
4. **点击保存** → 配置自动保存到本地
5. **重新打开聊天** → Chat 页面会自动使用新配置

### 自定义配置

如果你想使用其他 OpenAI 兼容的 API 服务，可以在 Settings 中手动填入：
- **API 地址**：例如 `https://api.custom-provider.com/v1`
- **API Key**：你的 API Key
- **模型名称**：对应平台的模型 ID

---

## 📱 打包独立 APK

本指南详细说明如何将 Nova 打包成独立的 Android APK 安装包。

### 前置条件

- 已部署后端到云端（见 `server/DEPLOYMENT.md`）
- Expo CLI 已安装
- EAS CLI 已安装

### 步骤 1：安装 EAS CLI

```bash
npm install -g eas-cli
```

### 步骤 2：登录 Expo 账户

```bash
eas login
```

按照提示完成登录。如果没有账户，先在 [expo.dev](https://expo.dev) 注册。

### 步骤 3：配置 eas.json

项目根目录已包含 `eas.json`。检查其内容确保后端 API 地址正确：

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      }
    },
    "preview2": {
      "android": {
        "buildType": "apk"
      }
    },
    "preview3": {
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

### 步骤 4：配置环境变量

在 `eas.json` 中添加环境变量，指向你的云端后端 API：

```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_API_BASE_URL": "https://your-backend-url.com"
      }
    }
  }
}
```

### 步骤 5：构建 APK

```bash
eas build --platform android --profile production
```

按照提示选择构建选项。构建过程通常需要 5-15 分钟。

### 步骤 6：下载 APK

构建完成后，你会收到一个下载链接。点击链接下载 APK 文件。

### 步骤 7：安装到手机

**方式 1：直接安装**
- 将 APK 文件传输到手机
- 打开文件管理器，找到 APK 文件
- 点击安装，按照提示完成安装

**方式 2：使用 adb 安装**
```bash
adb install path/to/nova.apk
```

### 步骤 8：首次运行

- 打开应用
- 进入 **Settings** 选项卡
- 配置你的大模型 API（如 DeepSeek、OpenAI 等）
- 点击 **Chat** 开始对话

---

## 🔧 后端部署

Nova 的后端是一个独立的 Node.js Express 应用。详细的部署指南见 `server/DEPLOYMENT.md`。

### 快速部署到 Render

```bash
cd server
# 按照 DEPLOYMENT.md 中的步骤进行部署
```

### 快速部署到 Vercel

```bash
vercel deploy
```

---

## 📂 项目结构

```
nova-ai-girlfriend/
├── app/                      # React Native 应用代码
│   ├── (tabs)/
│   │   ├── index.tsx        # 主页
│   │   ├── chat.tsx         # 聊天页面
│   │   ├── settings.tsx     # 大模型设置页面
│   │   └── _layout.tsx      # Tab 导航
│   └── _layout.tsx          # 应用根布局
├── components/              # React Native 组件
├── lib/                     # 工具函数和上下文
│   ├── context/
│   │   └── simple-chat-context.tsx  # 聊天状态管理
│   └── utils.ts
├── server/                  # Express 后端
│   ├── _core/
│   │   ├── index.ts        # 服务器入口
│   │   ├── llm.ts          # LLM 通用接口
│   │   └── env.ts          # 环境变量
│   └── DEPLOYMENT.md       # 部署指南
├── README.md               # 本文件
├── app.config.ts           # Expo 配置
└── package.json            # 项目依赖
```

---

## 🛠️ 开发指南

### 添加新的聊天功能

编辑 `lib/context/simple-chat-context.tsx` 中的 System Prompt，修改 Nova 的性格和行为。

### 自定义 UI 主题

编辑 `theme.config.js` 修改颜色和样式。

### 添加新的 Tab 页面

1. 在 `app/(tabs)/` 中创建新文件（例如 `profile.tsx`）
2. 在 `app/(tabs)/_layout.tsx` 中添加新的 `Tabs.Screen`

---

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

### 报告 Bug

请在 GitHub Issues 中详细描述问题，包括：
- 使用的大模型和 API 地址
- 复现步骤
- 预期行为和实际行为

### 提交功能建议

在 GitHub Discussions 中分享你的想法。

---

## 📄 许可证

本项目采用 MIT 开源协议。详见 `LICENSE` 文件。

---

## 🙏 致谢

- 感谢 [Expo](https://expo.dev) 提供的优秀移动应用框架
- 感谢 [Google Gemini](https://ai.google.dev) 提供的 LLM 能力
- 感谢所有贡献者和用户的支持

---

## 📞 联系方式

- GitHub Issues：报告 Bug 和功能建议
- GitHub Discussions：讨论和问题
- 邮箱：your-email@example.com

---

**祝你使用愉快！** 🎉

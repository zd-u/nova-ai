# Nova - 你的专属女友

![Nova Logo](assets/images/icon.png)

**Nova** 是一个基于 Google Gemini 2.5 Flash 的 AI 情感助手应用，提供温柔、有趣的陪伴体验。通过自然的对话和智能的理解，Nova 能够成为你的专属女友，随时陪伴你分享生活。

## ✨ 特性

- **智能对话**：基于 Google Gemini 2.5 Flash 的先进 LLM，提供自然、流畅的对话体验
- **多语言支持**：自动识别用户语言（中文、英文等），无缝切换
- **本地记忆**：使用 AsyncStorage 实现聊天记录本地持久化，关闭应用后历史消息完整保留
- **沉浸式体验**：去掉 AI 标签，让用户专注于与 Nova 的互动
- **跨平台**：支持 iOS、Android 和 Web 平台
- **开源**：完全开源，欢迎贡献和改进

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

创建 `.env.local` 文件：

```bash
# LLM API 配置
BUILT_IN_FORGE_API_KEY=your_api_key_here

# 可选：自定义 LLM API 端点
BUILT_IN_FORGE_API_URL=https://forge.manus.im/v1/chat/completions

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

项目根目录已包含 `eas.json`。检查其内容：

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
    "production": {
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

### 步骤 4：更新 API URL

编辑 `app.config.ts`，确保后端 URL 指向你部署的服务器：

```typescript
const env = {
  appName: "Nova",
  appSlug: "nova-ai-girlfriend",
  logoUrl: "https://your-s3-bucket/nova-logo.webp",
  scheme: "manus20240115103045",
  iosBundleId: "space.manus.nova.ai.girlfriend.t20240115103045",
  androidPackage: "space.manus.nova.ai.girlfriend.t20240115103045",
};
```

### 步骤 5：设置环境变量

创建 `.env.production` 文件：

```bash
# 生产环境后端 URL（替换为你的部署地址）
EXPO_PUBLIC_API_BASE_URL=https://nova-ai-backend.onrender.com
```

### 步骤 6：构建 APK

#### 选项 A：快速构建（推荐）

```bash
eas build --platform android --profile preview
```

这会生成一个预览版 APK，构建时间约 10-15 分钟。

#### 选项 B：生产构建

```bash
eas build --platform android --profile production
```

生产构建包含优化和签名，但需要更多时间。

### 步骤 7：下载 APK

构建完成后，你会看到：

```
✅ Build complete!
📱 APK URL: https://expo.dev/artifacts/...
```

点击链接下载 APK 文件到你的电脑。

### 步骤 8：安装到手机

#### 方式 1：直接安装（需要启用未知来源）

1. 将 APK 文件传到手机
2. 打开文件管理器，找到 APK 文件
3. 点击安装
4. 按照提示完成安装

#### 方式 2：使用 adb 安装

```bash
adb install path/to/app.apk
```

#### 方式 3：扫描二维码

构建完成后，Expo 会提供一个二维码。用 Android 手机扫描，直接下载并安装。

### 步骤 9：验证安装

打开 Nova 应用，进入 Chat 标签，发送一条消息。如果能收到 Nova 的回复，说明安装成功！

---

## 🌐 部署后端

Nova 需要一个后端服务器来处理 AI 对话。详见 `server/DEPLOYMENT.md`。

### 快速部署到 Render（推荐）

```bash
# 1. 登录 render.com
# 2. 创建新的 Web Service
# 3. 连接你的 GitHub 仓库
# 4. 配置：
#    - Build Command: cd server && pnpm install && pnpm build
#    - Start Command: node dist/index.js
# 5. 添加环境变量：BUILT_IN_FORGE_API_KEY
# 6. 点击 Deploy
```

部署完成后，你会获得一个 URL，如 `https://nova-ai-backend.onrender.com`。

### 更新前端配置

将后端 URL 更新到前端：

```bash
# .env.local
EXPO_PUBLIC_API_BASE_URL=https://nova-ai-backend.onrender.com
```

---

## 📁 项目结构

```
nova-ai-girlfriend/
├── app/                          # Expo Router 应用
│   ├── (tabs)/
│   │   ├── index.tsx            # 主页（Nova 介绍）
│   │   └── chat.tsx             # 聊天页面
│   ├── _layout.tsx              # 根布局
│   └── oauth/                   # OAuth 回调
├── components/                   # React 组件
│   ├── screen-container.tsx     # SafeArea 容器
│   └── ui/                      # UI 组件
├── lib/                          # 工具库
│   ├── context/
│   │   └── simple-chat-context.tsx  # 聊天状态管理（AsyncStorage 持久化）
│   ├── trpc.ts                  # tRPC 客户端
│   └── utils.ts                 # 工具函数
├── server/                       # Express 后端
│   ├── _core/
│   │   ├── index.ts             # 主服务器文件
│   │   ├── llm.ts               # LLM 调用接口
│   │   └── env.ts               # 环境变量
│   ├── DEPLOYMENT.md            # 部署指南
│   └── package.json             # 后端依赖
├── app.config.ts                # Expo 配置
├── eas.json                     # EAS Build 配置
├── tailwind.config.js           # Tailwind CSS 配置
└── README.md                    # 本文件
```

---

## 🔧 配置说明

### 环境变量

| 变量名 | 说明 | 必需 | 示例 |
|--------|------|------|------|
| `BUILT_IN_FORGE_API_KEY` | Google Gemini API Key | ✅ | `sk-...` |
| `EXPO_PUBLIC_API_BASE_URL` | 后端 API 地址 | ✅ | `https://nova-ai-backend.onrender.com` |
| `BUILT_IN_FORGE_API_URL` | 自定义 LLM 端点 | ❌ | `https://forge.manus.im/v1/chat/completions` |

### 获取 API Key

1. 登录 [Manus 平台](https://manus.im)
2. 进入 **Settings** → **API Keys**
3. 创建新的 API Key
4. 复制 `BUILT_IN_FORGE_API_KEY` 值

---

## 🎨 自定义

### 修改 Nova 的人格

编辑 `server/_core/index.ts` 中的 System Prompt（第 79-112 行）：

```typescript
const systemPrompt = `你是 Nova，一个真实、有趣的专属女友...`;
```

### 修改应用主题

编辑 `tailwind.config.js` 和 `theme.config.js` 中的颜色配置。

### 修改应用名称和图标

编辑 `app.config.ts`：

```typescript
const env = {
  appName: "Nova",  // 改为你的应用名称
  appSlug: "nova-ai-girlfriend",
  logoUrl: "https://your-logo-url",  // 改为你的 Logo URL
};
```

---

## 🧪 测试

### 运行单元测试

```bash
pnpm test
```

### 手动测试聊天功能

1. 启动开发服务器：`pnpm dev`
2. 打开 http://localhost:8081
3. 进入 Chat 标签
4. 发送消息，验证 Nova 的回复

### 测试多语言

发送不同语言的消息，验证 Nova 自动切换语言：

- 中文：「你好」
- 英文：「Hello」
- 日文：「こんにちは」

---

## 📚 技术栈

- **前端**：React Native、Expo Router、NativeWind (Tailwind CSS)
- **后端**：Express.js、Node.js
- **LLM**：Google Gemini 2.5 Flash（通过 Manus Forge API）
- **存储**：AsyncStorage（本地）、MySQL（可选）
- **状态管理**：React Context
- **样式**：Tailwind CSS、NativeWind

---

## 🤝 贡献

欢迎贡献！请遵循以下步骤：

1. Fork 本仓库
2. 创建特性分支：`git checkout -b feature/your-feature`
3. 提交更改：`git commit -m 'Add your feature'`
4. 推送到分支：`git push origin feature/your-feature`
5. 提交 Pull Request

---

## 📄 许可证

本项目采用 **MIT License**。详见 `LICENSE` 文件。

---

## ⚠️ 免责声明

Nova 是一个 AI 情感助手，**不是真实的人类**。使用本应用时请注意：

- Nova 的回复由 AI 生成，可能存在错误或不准确
- 不要将 Nova 的建议作为专业医疗、法律或心理咨询
- 如果你正经历心理健康危机，请寻求专业帮助

---

## 🆘 常见问题

### Q: 如何更改 Nova 的语言或人格？

**A**: 编辑 `server/_core/index.ts` 中的 System Prompt。

### Q: 如何添加数据库支持？

**A**: 参考 `server/README.md` 中的数据库配置部分。

### Q: 如何部署到 iOS？

**A**: 使用 EAS Build：
```bash
eas build --platform ios
```

详见 [Expo 文档](https://docs.expo.dev/build/setup/)。

### Q: 聊天记录会被上传到服务器吗？

**A**: 不会。聊天记录存储在本地设备的 AsyncStorage 中，只有当前消息会发送到后端进行 AI 处理。

### Q: 如何自定义应用图标？

**A**: 将新的 PNG 图片放在 `assets/images/icon.png`，然后重新构建。

---

## 📞 支持

- 📖 [Expo 文档](https://docs.expo.dev)
- 🔗 [Manus 文档](https://docs.manus.im)
- 💬 [GitHub Issues](https://github.com/yourusername/nova-ai-girlfriend/issues)

---

## 🙏 致谢

感谢以下开源项目和服务：

- [Expo](https://expo.dev) - React Native 开发框架
- [Google Gemini](https://gemini.google.com) - AI 模型
- [Manus](https://manus.im) - AI 平台和 API 代理
- [Tailwind CSS](https://tailwindcss.com) - 样式框架

---

**Made with ❤️ by the Manus team**

最后更新：2026 年 5 月 28 日

# Nova AI 女友 - 后端部署指南

本指南详细说明如何将 Nova 后端服务部署到云端，使其独立于开发环境运行。

## 目录

1. [本地开发](#本地开发)
2. [部署到 Render](#部署到-render)
3. [部署到 Vercel](#部署到-vercel)
4. [部署到 Railway](#部署到-railway)
5. [环境变量配置](#环境变量配置)
6. [数据库配置](#数据库配置)

---

## 本地开发

### 前置条件

- Node.js 18+ 和 pnpm
- MySQL 数据库（可选，仅在需要持久化时）

### 启动开发服务器

```bash
cd server
pnpm install
pnpm dev
```

服务器将在 `http://localhost:3000` 启动。

### API 端点

- `GET /api/health` - 健康检查
- `POST /api/chat` - 聊天接口（核心功能）
  ```json
  {
    "message": "你好",
    "history": [
      { "sender": "user", "text": "..." },
      { "sender": "nova", "text": "..." }
    ]
  }
  ```

---

## 部署到 Render

**Render** 是最简单的部署选择，提供免费层级。

### 步骤 1：准备代码

在项目根目录创建 `render.yaml`：

```yaml
services:
  - type: web
    name: nova-ai-backend
    env: node
    plan: free
    buildCommand: cd server && pnpm install && pnpm build
    startCommand: node dist/index.js
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3000
      - key: BUILT_IN_FORGE_API_KEY
        scope: shared
```

### 步骤 2：连接 GitHub

1. 登录 [render.com](https://render.com)
2. 点击 **New** → **Web Service**
3. 选择 **Connect a repository**
4. 授权 GitHub 并选择你的仓库

### 步骤 3：配置部署

- **Name**: `nova-ai-backend`
- **Environment**: Node
- **Build Command**: `cd server && pnpm install && pnpm build`
- **Start Command**: `node dist/index.js`
- **Plan**: Free（或 Starter，$7/月）

### 步骤 4：设置环境变量

在 Render 仪表板中添加：

```
BUILT_IN_FORGE_API_KEY=your_api_key_here
NODE_ENV=production
PORT=3000
```

### 步骤 5：部署

点击 **Deploy**。Render 会自动构建并启动服务。

**获取 API URL**：部署完成后，你会得到一个 URL，如：
```
https://nova-ai-backend.onrender.com
```

---

## 部署到 Vercel

**Vercel** 提供无服务器函数，适合轻量级 API。

### 步骤 1：安装 Vercel CLI

```bash
npm install -g vercel
```

### 步骤 2：创建 `vercel.json`

在项目根目录创建：

```json
{
  "buildCommand": "cd server && pnpm install && pnpm build",
  "outputDirectory": "dist",
  "env": {
    "NODE_ENV": "production"
  }
}
```

### 步骤 3：部署

```bash
vercel --prod
```

按照提示完成部署。

### 步骤 4：设置环境变量

在 Vercel 仪表板中：

1. 进入 **Settings** → **Environment Variables**
2. 添加 `BUILT_IN_FORGE_API_KEY`

**获取 API URL**：
```
https://your-project-name.vercel.app
```

---

## 部署到 Railway

**Railway** 提供简单的部署体验，免费层级包括 $5 月度额度。

### 步骤 1：连接 GitHub

1. 登录 [railway.app](https://railway.app)
2. 点击 **New Project** → **Deploy from GitHub repo**
3. 选择你的仓库

### 步骤 2：配置构建

Railway 会自动检测 Node.js 项目。在 **Variables** 中添加：

```
NODE_ENV=production
BUILT_IN_FORGE_API_KEY=your_api_key_here
PORT=3000
```

### 步骤 3：设置启动命令

在 **Settings** 中配置：

- **Build Command**: `cd server && pnpm install && pnpm build`
- **Start Command**: `node dist/index.js`

### 步骤 4：部署

点击 **Deploy**。Railway 会自动构建并启动。

**获取 API URL**：在 Railway 仪表板中查看 **Domains**。

---

## 环境变量配置

### 必需的环境变量

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `BUILT_IN_FORGE_API_KEY` | Google Gemini API Key（通过 Manus Forge） | `sk-...` |
| `NODE_ENV` | 运行环境 | `production` |
| `PORT` | 服务器端口 | `3000` |

### 可选的环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `BUILT_IN_FORGE_API_URL` | 自定义 LLM API 端点 | `https://forge.manus.im/v1/chat/completions` |
| `DATABASE_URL` | MySQL 连接字符串 | 无（可选） |
| `JWT_SECRET` | JWT 签名密钥 | 无（可选） |

### 获取 API Key

1. 登录 [Manus 平台](https://manus.im)
2. 进入 **Settings** → **API Keys**
3. 创建新的 API Key
4. 复制 `BUILT_IN_FORGE_API_KEY` 值

---

## 数据库配置

### 可选：使用 MySQL 存储聊天记录

如果你想持久化存储聊天记录，可以配置 MySQL。

#### 步骤 1：创建数据库

使用 [PlanetScale](https://planetscale.com)（免费 MySQL 托管）：

1. 注册 PlanetScale 账户
2. 创建新数据库
3. 获取连接字符串

#### 步骤 2：配置环境变量

添加 `DATABASE_URL` 到部署平台：

```
DATABASE_URL=mysql://user:password@host/database
```

#### 步骤 3：运行迁移

```bash
pnpm db:push
```

---

## 前端连接到后端

### 更新前端 API URL

在前端应用中，设置 `EXPO_PUBLIC_API_BASE_URL` 环境变量：

```bash
# .env.local
EXPO_PUBLIC_API_BASE_URL=https://nova-ai-backend.onrender.com
```

或在 `app.config.ts` 中：

```typescript
const env = {
  apiBaseUrl: "https://nova-ai-backend.onrender.com",
};
```

### 验证连接

```bash
curl https://nova-ai-backend.onrender.com/api/health
```

应返回：
```json
{ "ok": true, "timestamp": 1234567890 }
```

---

## 常见问题

### Q: 部署后收到 "BUILT_IN_FORGE_API_KEY is not configured" 错误

**A**: 确保在部署平台中设置了 `BUILT_IN_FORGE_API_KEY` 环境变量。

### Q: 前端无法连接到后端

**A**: 
1. 检查 `EXPO_PUBLIC_API_BASE_URL` 是否正确
2. 验证后端 API 是否在线：`curl https://your-api-url/api/health`
3. 检查浏览器控制台是否有 CORS 错误

### Q: 如何监控后端日志

**A**:
- **Render**: 在仪表板中查看 **Logs**
- **Vercel**: 在 **Deployments** 中查看 **Logs**
- **Railway**: 在 **Deployments** 中查看 **Logs**

### Q: 如何更新已部署的后端

**A**: 推送代码到 GitHub，部署平台会自动重新构建和部署。

---

## 下一步

部署后端后，你可以：

1. **打包 APK**：见根目录 `README.md` 的 APK 打包指南
2. **配置 GitHub Actions**：自动化部署流程
3. **添加数据库**：实现聊天记录持久化
4. **监控和日志**：设置错误追踪和性能监控

---

## 支持

如有问题，请参考：

- [Render 文档](https://render.com/docs)
- [Vercel 文档](https://vercel.com/docs)
- [Railway 文档](https://docs.railway.app)
- [Manus 文档](https://docs.manus.im)

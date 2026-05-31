# Nova AI 女友 - Render 部署完整指南

本指南将帮助你将 Nova 后端部署到 Render 云平台，使应用能够永久独立运行，不再依赖本地电脑。

---

## 📋 前置准备

- ✅ Render 账户已创建并登录
- ✅ DeepSeek API Key 已获取
- ✅ GitHub 账户（用于连接 Render）

---

## 🚀 第一步：准备 GitHub 仓库

Render 需要从 GitHub 读取代码进行部署。你需要先将 Nova 项目上传到 GitHub。

### 1.1 如果你还没有上传到 GitHub

```bash
# 在项目根目录执行以下命令
cd /home/ubuntu/ai-girlfriend-v2

# 初始化 Git（如果还没有）
git init

# 添加所有文件
git add .

# 提交
git commit -m "Initial commit: Nova AI girlfriend app"

# 添加 GitHub 远程仓库（替换 YOUR_USERNAME 和 YOUR_REPO）
git remote add origin https://github.com/YOUR_USERNAME/nova-ai-girlfriend.git

# 推送到 GitHub
git branch -M main
git push -u origin main
```

### 1.2 如果你已经上传到 GitHub

确保最新的代码已推送到 GitHub 的 `main` 分支。

---

## 🔧 第二步：在 Render 上创建 Web Service

### 2.1 连接 GitHub 账户

1. 在 Render 仪表板，点击 **"New Web Service"**
2. 选择 **"Build and deploy from a Git repository"**
3. 点击 **"Connect account"** 连接你的 GitHub 账户
4. 授权 Render 访问你的 GitHub 仓库

### 2.2 选择 Nova 仓库

1. 在列表中找到 `nova-ai-girlfriend` 仓库
2. 点击 **"Connect"**

### 2.3 配置部署参数

在 Render 的配置页面，填入以下信息：

| 字段 | 值 | 说明 |
|------|-----|------|
| **Name** | `nova-api` | 服务名称（可自定义） |
| **Environment** | `Node` | 运行环境 |
| **Region** | `Singapore` 或 `US East` | 选择离你最近的区域 |
| **Branch** | `main` | 部署分支 |
| **Build Command** | `npm install && npm run build` | 构建命令 |
| **Start Command** | `npm start` | 启动命令 |

### 2.4 配置环境变量

在 **"Environment"** 部分，添加以下环境变量：

```
LLM_API_URL=https://api.deepseek.com/v1/chat/completions
LLM_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
LLM_MODEL=deepseek-chat
```

**重要：** 将 `sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` 替换为你的真实 DeepSeek API Key。

### 2.5 选择免费计划

- 在 **"Plan"** 部分，选择 **"Free"**
- 免费层足够用于个人使用和测试

### 2.6 点击 "Deploy"

点击 **"Create Web Service"** 开始部署。Render 会自动：
1. 从 GitHub 克隆代码
2. 安装依赖
3. 构建项目
4. 启动服务

部署通常需要 **3-5 分钟**。

---

## ✅ 第三步：获取部署后的 API 地址

部署完成后，Render 会为你的服务分配一个公开 URL。

### 3.1 查找 API 地址

1. 在 Render 仪表板，点击你的 `nova-api` 服务
2. 在顶部找到 **"URL"** 字段，例如：`https://nova-api-xxxxx.onrender.com`
3. **复制这个 URL**，后续需要用到

### 3.2 测试 API 是否正常

在浏览器中访问：
```
https://nova-api-xxxxx.onrender.com/health
```

如果返回 `200 OK` 或类似的成功响应，说明后端已成功部署。

---

## 📱 第四步：配置前端连接到云端 API

现在你需要告诉前端应用使用云端 API 地址而不是 localhost。

### 4.1 更新应用配置

你需要设置环境变量 `EXPO_PUBLIC_API_BASE_URL`。

**方式 1：通过 Manus 平台（推荐）**

我会为你设置这个环境变量，使应用自动连接到你的云端 API。

**方式 2：手动配置**

编辑 `app.config.ts`，在 `env` 对象中添加：

```typescript
const env = {
  appName: "Nova",
  appSlug: "nova-ai-girlfriend",
  logoUrl: "",
  scheme: schemeFromBundleId,
  iosBundleId: bundleId,
  androidPackage: bundleId,
  // 添加这一行，替换为你的实际 Render URL
  apiBaseUrl: "https://nova-api-xxxxx.onrender.com",
};
```

---

## 🧪 第五步：测试应用连接

### 5.1 在浏览器中测试

1. 打开应用的网址：`https://8081-ikku7dshzpwss2v16ec5b-aa5ade6b.sg1.manus.computer`
2. 进入 **Chat** 页面
3. 确保已在 **Settings** 中配置了 DeepSeek API Key
4. 尝试发送一条消息
5. 如果 Nova 正常回复，说明连接成功！

### 5.2 在手机上测试

1. 在手机浏览器中打开应用网址
2. 或使用 Expo Go / Butterfly 扫描二维码
3. 进入 Chat 页面测试聊天功能

---

## 🎯 常见问题排查

### 问题 1：部署失败

**症状：** Render 显示 "Build failed"

**解决方案：**
1. 检查 GitHub 仓库中是否有 `package.json` 和 `server/_core/index.ts`
2. 检查 `package.json` 中的 `build` 和 `start` 脚本是否正确
3. 查看 Render 的部署日志，找出具体错误

### 问题 2：部署成功但无法访问

**症状：** 访问 API URL 返回 503 或超时

**解决方案：**
1. 等待 2-3 分钟，Render 可能还在启动
2. 检查环境变量是否正确设置
3. 在 Render 仪表板查看服务日志

### 问题 3：应用连接到 API 但返回错误

**症状：** 聊天页面显示 "Server error" 或 "No response from server"

**解决方案：**
1. 检查 DeepSeek API Key 是否正确
2. 检查 DeepSeek 账户是否有剩余额度
3. 查看 Render 服务的日志，找出具体错误

---

## 📊 部署后的架构

```
手机应用 (Butterfly/Expo Go)
    ↓
前端应用 (React Native)
    ↓
Render 云端后端 (Node.js Express)
    ↓
DeepSeek API
    ↓
Nova 的回复
```

现在你的应用完全独立于本地电脑，可以永久使用！

---

## 🎉 下一步

部署完成后，你可以：

1. **生成 APK 安装包** — 按照 README 中的教程生成独立的 Android APK
2. **上传到 GitHub** — 将完整项目上传到 GitHub 开源发布
3. **分享给朋友** — 朋友可以下载 APK 或用 Expo Go 扫码使用

---

## 📞 需要帮助？

如果部署过程中遇到问题，请：

1. 查看 Render 仪表板的服务日志
2. 检查环境变量是否正确
3. 确保 GitHub 仓库中的代码是最新的

祝部署顺利！🚀

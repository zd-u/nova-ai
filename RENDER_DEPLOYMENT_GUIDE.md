# Nova AI — Render 部署完整指南（准确版）

> 已根据当前代码校正。旧版里「改 app.config.ts 的 apiBaseUrl」「Manus 平台」「Butterfly」「sg1.manus.computer」 等均已失效，请勿照做。前端读取的是环境变量 `EXPO_PUBLIC_API_BASE_URL`。

## 前置准备
- 一个 Render 账号（免费层即可）：https://render.com
- 一个你自己的 LLM Key（如 DeepSeek；用户也可在 App 里各自填）
- 你的 GitHub 账号（用于 Render 拉取代码）

## 第一步：把仓库连到 Render
1. Render 仪表板 → New → Web Service。
2. 选 Build and deploy from a Git repository → Connect account 授权 GitHub。
3. 仓库列表里选 `zd-u/nova-ai` → Connect。

## 第二步：配置服务
| 字段 | 值 |
|------|-----|
| Name | `nova-api`（随意） |
| Environment | `Node` |
| Branch | `main` |
| Build Command | `npm install && npm run build` |
| Start Command | `npm start` |
| Plan | `Free` |

> 仓库根的 `render.yaml` 已内置这些配置，Render 会自动识别；你只需确认环境变量填对。

## 第三步：配置环境变量（关键）
在 Environment 里添加：
```
NODE_ENV=production
LLM_API_URL=https://api.deepseek.com/v1/chat/completions
LLM_API_KEY=sk-你的真实key
LLM_MODEL=deepseek-chat
ALLOWED_ORIGINS=*
```
要点：
- `LLM_API_KEY` 可留空——若用户在自己手机 App 里填了 Key（BYOK），就由各人自己的 Key 生效。
- `ALLOWED_ORIGINS` **生产环境必填**，留空后端会启动崩溃。只发手机 App 填 `*` 即可；若还有网页版，填真实域名（逗号分隔）。
- 可选：`DATABASE_URL`（MySQL，不填聊天也正常）、OAuth 相关变量（不填登录不可用）。

## 第四步：部署 & 拿地址
点 Create Web Service。约 3–5 分钟后，服务顶部 URL 形如 `https://nova-api-xxxx.onrender.com`，复制它。

验证：浏览器打开 `https://你的地址/api/health`，应返回 `{"ok":true,...}`。

## 第五步：让手机 App 连上这个后端
光有后端还不够，App 必须知道后端地址：
1. 用你**自己的 Expo 账号**打包 App（`eas.json` 已配好）：先 `eas init`（或把 `app.config.ts` 的 `extra.eas.projectId` 改成你自己的 / 删掉），再 `eas build --platform android`（或 ios）。
2. **构建时**设置环境变量：
   ```
   EXPO_PUBLIC_API_BASE_URL=https://nova-api-xxxx.onrender.com
   ```
   App 前端读取的就是这个变量名（不是 `app.config.ts` 里的 `apiBaseUrl`）。
3. 构建出的 APK/IPA 安装到手机，即可聊天。

> 小贴士：若你只想自己/朋友在电脑浏览器里用网页版，把 `EXPO_PUBLIC_API_BASE_URL` 设成后端地址后，用 `npx expo start --web` 或把 Web 构建托管到任意静态空间即可。

## 常见问题
- **部署失败 / 启动崩溃**：先查环境变量是否齐全，尤其 `NODE_ENV=production` 时 `ALLOWED_ORIGINS` 不能为空。
- **访问返回 503**：Render 免费层会休眠，首次访问需等几秒唤醒；也检查环境变量。
- **聊天报错**：核对 `LLM_API_KEY` / `LLM_MODEL` 是否与提供商匹配、额度是否充足；看 Render 日志。

## 部署后架构
```
手机 App (Expo)
   ↓  EXPO_PUBLIC_API_BASE_URL 指向
Render 后端 (Node/Express, 本项目)
   ↓  LLM_API_KEY / 用户自带 Key
DeepSeek / OpenAI / Claude 等 LLM
```

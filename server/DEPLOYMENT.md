# Nova AI 后端部署指南（准确版）

> 本文档已根据当前代码（非旧版 Manus 模板）校正。旧文档里的 `BUILT_IN_FORGE_API_KEY`、`forge.manus.im`、`pnpm` 等均已废弃，请勿照旧文档操作。

## 一句话结论
仓库根目录已自带 `render.yaml`，后端可一键部署到 Render（免费层即可）。聊天功能**只需要 3 个环境变量**，OAuth 登录和 MySQL 都是可选的。

## 部署前必读的两个坑

### 坑 1：生产环境必须填 `ALLOWED_ORIGINS`，否则后端启动即崩溃
代码 `server/_core/env.ts` 有「启动即检查」（fail-fast）：当 `NODE_ENV=production` 且 `ALLOWED_ORIGINS` 为空时，后端会直接抛错退出。
- 如果你**只发手机 App（不含网页版）**：把 `ALLOWED_ORIGINS` 填成 `*` 即可（原生 App 不走浏览器跨域，这样填只为绕过启动检查）。
- 如果你**还做了网页版**：把 `ALLOWED_ORIGINS` 填成你的真实前端域名，多个用英文逗号分隔，例如 `https://app.example.com,https://www.example.com`。

### 坑 2：必须在「根目录」安装依赖并构建
后端依赖（如 `@trpc/server`）只声明在**根** `package.json` 里。请用根目录命令：
```bash
npm install
npm run build     # 用 esbuild 打包 server/_core/index.ts -> dist/index.js
npm start          # node dist/index.js
```
不要只进 `server/` 目录装依赖，会缺包。

> 构建产物现在是 CommonJS（`--format=cjs`），任何 Node 版本都能直接 `node dist/index.js` 运行，不依赖 Node 22 的 ESM 自动嗅探。

## 环境变量

### 必填（聊天核心）
| 变量 | 说明 | 示例 |
|------|------|------|
| `LLM_API_URL` | LLM 接口地址（OpenAI 兼容） | `https://api.deepseek.com/v1/chat/completions` |
| `LLM_API_KEY` | LLM 提供商的 Key | `sk-xxx` |
| `LLM_MODEL` | 模型名 | `deepseek-chat` |

> 说明：App 端支持「用户自带 Key」（BYOK）。如果用户在 App 设置里填了自己的 Key，后端 `LLM_API_KEY` 可以留空，由用户各自的 Key 生效。

### 生产环境必填（否则启动崩溃）
| 变量 | 说明 |
|------|------|
| `NODE_ENV` | 必须设 `production` |
| `ALLOWED_ORIGINS` | 见上方「坑 1」 |

### 可选
| 变量 | 说明 | 默认 |
|------|------|------|
| `DATABASE_URL` | MySQL 连接串 `mysql://用户:密码@主机:端口/库名`；不填则用户数据不持久化，聊天仍正常 | 空 |
| `OAUTH_SERVER_URL` / `VITE_APP_ID` / `OWNER_OPEN_ID` | OAuth 登录；不填则登录不可用，聊天正常 | 空 |
| `JWT_SECRET` | 仅当配置了 OAuth 时才必须，≥32 位随机串 | 空 |
| `PORT` | 服务端口，平台一般会注入 | `3000` |

完整说明见仓库根 `.env.example`。

## 部署到 Render（推荐，免费）
1. 登录 https://render.com ，New → Web Service → Connect a repository → 授权 GitHub → 选中 `zd-u/nova-ai`。
2. 配置：
   - Environment: `Node`
   - Branch: `main`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Plan: `Free`（或 Starter 7 美元/月）
3. 在 Environment 里添加上面的环境变量（`NODE_ENV=production`、三个 LLM 变量、`ALLOWED_ORIGINS`）。
4. 点 Deploy，约 3–5 分钟。完成后会得到类似 `https://nova-api-xxxx.onrender.com` 的地址。
5. 验证：`curl https://你的地址/api/health` 应返回 `{"ok":true,...}`。

（仓库根 `render.yaml` 已写好了上面的构建/启动命令，Render 会自动读取。）

## 部署到 Railway / Vercel
- Railway：连 GitHub 仓库，Build `npm install && npm run build`，Start `npm start`，加同样的环境变量。免费层含 5 美元额度。
- Vercel：Vercel 主打 Serverless 函数，而本项目是常驻 Express 服务，用 Render/Railway 更省心。若坚持用 Vercel，需要把 `npm start` 改成适配 Serverless 的入口，不在本文范围。

## 数据库（可选）
若填了 `DATABASE_URL`，首次部署后运行迁移：
```bash
npm run db:push
```
不填则聊天照常工作，只是不存用户数据。

## 前端 App 怎么连后端（让别人真能用）
后端上线只解决「服务器在跑」。要让别人在手机上用，还需：
1. 用你**自己的 Expo 账号**执行 `eas build`（见 `eas.json`）。注意：`app.config.ts` 里 `extra.eas.projectId` 是原作者的 EAS 项目 ID，请用你自己账号重新 `eas init` 或删掉该字段，否则构建会报错。
2. 构建 App 时设置环境变量 `EXPO_PUBLIC_API_BASE_URL=https://你的后端地址`（例如 `https://nova-api-xxxx.onrender.com`）。App 读取的正是这个变量（不是 `app.config.ts` 里的 `apiBaseUrl`）。
3. 构建出 APK/IPA 后分发安装即可。

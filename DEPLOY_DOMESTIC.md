# 🇨🇳 国内部署指南（零服务器 · 免翻墙）

本指南教你在**国内网络**下，把这个「Nova 傲娇女友」聊天网页部署成任何人都能打开的网址。**不需要服务器、不需要翻墙，AI Key 由每个使用者自己填。**

## 这个版本是什么？
- 网页在用户自己的浏览器里**直连国产大模型**（DeepSeek / 通义千问 / Kimi / 智谱 GLM），不经过任何后端服务器。
- 每个使用者在网页「设置」里填自己的 API Key，Key 只存在他自己的浏览器本地。
- 内置「傲娇女友」人格设定，逐字流式输出，可随时停止。

## 方式一：用预打包成品（最简单，不会搭环境也能做）
1. 到本仓库 **Releases** 页面，下载 `nova-ai-web-dist.zip`（已打好包，含傲娇女友人格）。
2. 注册/登录 [Gitee](https://gitee.com)（国内代码平台，免费）。
3. 新建仓库 → 把 zip 解压后的**所有文件**上传进去（`index.html` 要在根目录）。
4. 仓库页 → **服务** → **Gitee Pages** → 勾选「强制使用 HTTPS」→ 点「启动」。
5. 一两分钟后，Gitee 给你 `https://你的用户名.gitee.io/仓库名` 的网址 → 发出去，别人打开即用。

## 方式二：从源码自己构建（会点命令的人）
```bash
git clone https://github.com/zd-u/nova-ai.git
cd nova-ai
npm install
npx expo export --platform web   # 产物在 web-dist/ 目录
```
把 `web-dist/` 整个目录按「方式一」第 2–5 步传到 Gitee Pages 即可。
（`metro.config.js` 已修好网页打包的一个坑，正常能成功。）

## 使用者怎么用？
1. 打开你的网址 → 进入「设置」页
2. 选模型（推荐 DeepSeek Chat）→ 填自己的 API Key（去对应平台官网免费申请）
3. 回到聊天页，开聊 ✅

## 常见问题
- **能连 OpenAI / Claude 吗？** 直连版目前只支持**国产模型**（国外模型接口浏览器直连会被跨域拦截）。要 OpenAI/Claude 需另部署后端（见 `RENDER_DEPLOYMENT_GUIDE.md`，但需翻墙的国外平台）。
- **Key 安全吗？** 只存在使用者自己的浏览器本地存储，不经任何服务器。
- **聊天记录呢？** 存在使用者自己的浏览器里，不清就不丢。

// Validate critical secrets at import time (fail-fast)
const jwtSecret = process.env.JWT_SECRET ?? "";
if (process.env.OAUTH_SERVER_URL) {
  if (!jwtSecret || jwtSecret.length < 32) {
    throw new Error(
      "JWT_SECRET must be a random string of at least 32 chars. Generate: openssl rand -hex 32"
    );
  }
  if (jwtSecret.startsWith("change-me")) {
    throw new Error(
      "JWT_SECRET is still the default placeholder. Replace it with a real random string."
    );
  }
}

const allowedOriginsRaw = process.env.ALLOWED_ORIGINS ?? "";
if (process.env.NODE_ENV === "production" && !allowedOriginsRaw) {
  throw new Error(
    "ALLOWED_ORIGINS is required in production. Set it to a comma-separated list of trusted origins, e.g. ALLOWED_ORIGINS=https://myapp.com,https://www.myapp.com"
  );
}

export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: jwtSecret,
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  // CORS: comma-separated trusted origins in production
  allowedOrigins: allowedOriginsRaw,
  // LLM configuration - user must provide via request or environment variables
  llmApiUrl: process.env.LLM_API_URL ?? "",
  llmApiKey: process.env.LLM_API_KEY ?? "",
  llmModel: process.env.LLM_MODEL ?? "",
  // 上游 LLM 响应"开始返回"（收到响应头）的最长等待时间(ms)。
  // 仅用于兜底假死的上游，流式正文可更长；客户端断开会单独中止。
  llmTimeoutMs: Number(process.env.LLM_TIMEOUT_MS ?? "30000") || 30000,
  // 逗号分隔的可信 LLM 主机白名单（除运维配置的 LLM_API_URL 外），
  // 用于客户端传入 llmConfig.apiUrl 时额外放行特定自建服务。
  llmAllowedHosts: process.env.LLM_ALLOWED_HOSTS ?? "",
  // 独立服务配置：图片生成 / 语音转写 / 通知。
  // 这些是与 LLM 不同的服务，默认回退到 LLM 变量（便于复用同一套 key），
  // 建议各自独立配置以避免把聊天 key 误用于其他服务。
  imageGenApiUrl: process.env.IMAGE_GEN_API_URL ?? process.env.LLM_API_URL ?? "",
  imageGenApiKey: process.env.IMAGE_GEN_API_KEY ?? process.env.LLM_API_KEY ?? "",
  whisperApiUrl: process.env.WHISPER_API_URL ?? process.env.LLM_API_URL ?? "",
  whisperApiKey: process.env.WHISPER_API_KEY ?? process.env.LLM_API_KEY ?? "",
  notificationApiUrl: process.env.NOTIFICATION_API_URL ?? process.env.LLM_API_URL ?? "",
  notificationApiKey: process.env.NOTIFICATION_API_KEY ?? process.env.LLM_API_KEY ?? "",
};

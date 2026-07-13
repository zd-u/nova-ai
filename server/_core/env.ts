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
};

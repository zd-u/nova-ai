import { ENV } from "./env";

export type Role = "system" | "user" | "assistant" | "tool" | "function";

export type TextContent = {
  type: "text";
  text: string;
};

export type ImageContent = {
  type: "image_url";
  image_url: {
    url: string;
    detail?: "auto" | "low" | "high";
  };
};

export type FileContent = {
  type: "file_url";
  file_url: {
    url: string;
    mime_type?: "audio/mpeg" | "audio/wav" | "application/pdf" | "audio/mp4" | "video/mp4";
  };
};

export type MessageContent = string | TextContent | ImageContent | FileContent;

export type Message = {
  role: Role;
  content: MessageContent | MessageContent[];
  name?: string;
  tool_call_id?: string;
};

export type Tool = {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  };
};

export type ToolChoicePrimitive = "none" | "auto" | "required";
export type ToolChoiceByName = { name: string };
export type ToolChoiceExplicit = {
  type: "function";
  function: {
    name: string;
  };
};

export type ToolChoice = ToolChoicePrimitive | ToolChoiceByName | ToolChoiceExplicit;

export type InvokeParams = {
  messages: Message[];
  tools?: Tool[];
  toolChoice?: ToolChoice;
  tool_choice?: ToolChoice;
  maxTokens?: number;
  max_tokens?: number;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
};

export type ToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};

export type InvokeResult = {
  id: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: Role;
      content: string | Array<TextContent | ImageContent | FileContent>;
      tool_calls?: ToolCall[];
    };
    finish_reason: string | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

export type JsonSchema = {
  name: string;
  schema: Record<string, unknown>;
  strict?: boolean;
};

export type OutputSchema = JsonSchema;

export type ResponseFormat =
  | { type: "text" }
  | { type: "json_object" }
  | { type: "json_schema"; json_schema: JsonSchema };

const ensureArray = (value: MessageContent | MessageContent[]): MessageContent[] =>
  Array.isArray(value) ? value : [value];

const normalizeContentPart = (part: MessageContent): TextContent | ImageContent | FileContent => {
  if (typeof part === "string") {
    return { type: "text", text: part };
  }

  if (part.type === "text") {
    return part;
  }

  if (part.type === "image_url") {
    return part;
  }

  if (part.type === "file_url") {
    return part;
  }

  throw new Error("Unsupported message content part");
};

const normalizeMessage = (message: Message) => {
  const { role, name, tool_call_id } = message;

  if (role === "tool" || role === "function") {
    const content = ensureArray(message.content)
      .map((part) => (typeof part === "string" ? part : JSON.stringify(part)))
      .join("\n");

    return {
      role,
      name,
      tool_call_id,
      content,
    };
  }

  const contentParts = ensureArray(message.content).map(normalizeContentPart);

  // If there's only text content, collapse to a single string for compatibility
  if (contentParts.length === 1 && contentParts[0].type === "text") {
    return {
      role,
      name,
      content: contentParts[0].text,
    };
  }

  return {
    role,
    name,
    content: contentParts,
  };
};

const normalizeToolChoice = (
  toolChoice: ToolChoice | undefined,
  tools: Tool[] | undefined,
): "none" | "auto" | ToolChoiceExplicit | undefined => {
  if (!toolChoice) return undefined;

  if (toolChoice === "none" || toolChoice === "auto") {
    return toolChoice;
  }

  if (toolChoice === "required") {
    if (!tools || tools.length === 0) {
      throw new Error("tool_choice 'required' was provided but no tools were configured");
    }

    if (tools.length > 1) {
      throw new Error(
        "tool_choice 'required' needs a single tool or specify the tool name explicitly",
      );
    }

    return {
      type: "function",
      function: { name: tools[0].function.name },
    };
  }

  if ("name" in toolChoice) {
    return {
      type: "function",
      function: { name: toolChoice.name },
    };
  }

  return toolChoice;
};

// LLM 配置接口 - 支持动态传入或环境变量
export type LLMConfig = {
  apiUrl?: string;      // 例如: https://api.deepseek.com/v1/chat/completions
  apiKey?: string;      // 例如: sk-xxxxxx
  model?: string;       // 例如: deepseek-chat, gpt-4o, claude-3-opus
};

// ---------------------------------------------------------------------------
// SSRF 防护
// 客户端通过 llmConfig.apiUrl 传入的 URL 属于"不可信输入"。直接拿去 fetch
// 会把本服务器变成攻击内网/云元数据的跳板（如 http://169.254.169.254、
// http://127.0.0.1:6379）。这里在发请求前拦掉私网、链路本地与 localhost。
// 环境变量里配置的 URL 由运维控制，视为可信，不在此拦截。
// ---------------------------------------------------------------------------

// 仅做主机名 / IP 字面量层面的拦截（不依赖 DNS，避免受限环境下解析失败导致误伤）
const PRIVATE_HOST_PATTERNS: RegExp[] = [
  /^localhost$/i,
  /\.local$/i,
  /^0\.0\.0\.0$/,
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
  /^169\.254\./,
  /^::1$/,
  /^fe80:/i,
  /^fc[0-9a-f]/i,
  /^fd[0-9a-f]/i,
];

const isPrivateHostname = (host: string): boolean =>
  PRIVATE_HOST_PATTERNS.some((re) => re.test(host.toLowerCase()));

// 仅对 IPv4 字面量做私网判断。域名 / 非 IP 字符串一律放行，
// 主机名层面的拦截（localhost、.local、内网 IP 字面量等）已由 isPrivateHostname 负责。
// 旧实现把"非 4 段纯数字"的字符串（即所有域名，如 api.openai.com）都当内网拒绝，
// 导致用户自定义域名地址被误杀、聊天功能 100% 失败。此处改为：非 IPv4 字面量直接放行。
const isPrivateIp = (addr: string): boolean => {
  const ipv4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(addr);
  if (ipv4) {
    const [a, b, c, d] = ipv4.slice(1).map(Number);
    if ([a, b, c, d].some((n) => n > 255 || Number.isNaN(n))) {
      return false; // 畸形 IP：交给上层 URL 校验，不误杀合法域名
    }
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    return false;
  }
  const v = addr.toLowerCase();
  if (v === "::1") return true;
  if (v.startsWith("fe80")) return true; // 链路本地
  if (v.startsWith("fc") || v.startsWith("fd")) return true; // 唯一本地地址
  if (v.startsWith("::ffff:")) return isPrivateIp(v.slice("::ffff:".length)); // IPv4 映射
  return false;
};

const assertNotSsrf = (targetUrl: string): void => {
  let parsed: URL;
  try {
    parsed = new URL(targetUrl);
  } catch {
    throw new Error(`Invalid LLM API URL: ${targetUrl}`);
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error(`LLM API URL must use http(s): ${targetUrl}`);
  }

  const host = parsed.hostname;
  if (!host) throw new Error(`LLM API URL missing host: ${targetUrl}`);

  // 运维已显式放行的主机（逗号分隔），以及环境变量里配置的主机
  const allowed = (ENV.llmAllowedHosts || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (ENV.llmApiUrl) {
    try {
      allowed.push(new URL(ENV.llmApiUrl).hostname.toLowerCase());
    } catch {
      /* ignore malformed env url */
    }
  }
  if (allowed.includes(host.toLowerCase())) return;

  if (isPrivateHostname(host) || isPrivateIp(host)) {
    throw new Error(`Refusing to connect to internal address: ${host}`);
  }
};

const resolveApiUrl = async (customUrl?: string): Promise<string> => {
  // 优先级：自定义 URL > 环境变量
  if (customUrl && customUrl.trim().length > 0) {
    const url = customUrl.replace(/\/$/, "");
    // 客户端传入的 URL 不可信：强制 SSRF 护栏
    assertNotSsrf(url);
    return url;
  }

  if (ENV.llmApiUrl && ENV.llmApiUrl.trim().length > 0) {
    let url = ENV.llmApiUrl.trim().replace(/\/$/, "");
    // Only append /v1/chat/completions if not already present
    if (!url.endsWith("/v1/chat/completions")) {
      url += "/v1/chat/completions";
    }
    // 运维配置的 URL 可信，不再拦截
    return url;
  }

  // No default URL - user must provide one
  return "";
};

const resolveApiKey = (customKey?: string) => {
  // 优先级：自定义 Key > 环境变量
  if (customKey && customKey.trim().length > 0) {
    return customKey;
  }

  return ENV.llmApiKey || "";
};

const resolveModel = (customModel?: string) => {
  // 优先级：自定义模型 > 环境变量
  if (customModel && customModel.trim().length > 0) {
    return customModel;
  }

  return ENV.llmModel || "";
};

const assertApiKey = (apiKey: string) => {
  if (!apiKey) {
    throw new Error("API_KEY is not configured. Please provide an API key via request or environment variables.");
  }
};

const normalizeResponseFormat = ({
  responseFormat,
  response_format,
  outputSchema,
  output_schema,
}: {
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
}):
  | { type: "json_schema"; json_schema: JsonSchema }
  | { type: "text" }
  | { type: "json_object" }
  | undefined => {
  const explicitFormat = responseFormat || response_format;
  if (explicitFormat) {
    if (explicitFormat.type === "json_schema" && !explicitFormat.json_schema?.schema) {
      throw new Error("responseFormat json_schema requires a defined schema object");
    }
    return explicitFormat;
  }

  const schema = outputSchema || output_schema;
  if (!schema) return undefined;

  if (!schema.name || !schema.schema) {
    throw new Error("outputSchema requires both name and schema");
  }

  return {
    type: "json_schema",
    json_schema: {
      name: schema.name,
      schema: schema.schema,
      ...(typeof schema.strict === "boolean" ? { strict: schema.strict } : {}),
    },
  };
};

// 复用：构建请求体（invokeLLM 与 invokeLLMStream 共用）
const buildPayload = (
  params: InvokeParams,
  model: string,
  stream: boolean,
): Record<string, unknown> => {
  const {
    messages,
    tools,
    toolChoice,
    tool_choice,
    outputSchema,
    output_schema,
    responseFormat,
    response_format,
  } = params;

  const payload: Record<string, unknown> = {
    model,
    messages: messages.map(normalizeMessage),
  };

  if (stream) {
    payload.stream = true;
  }

  if (tools && tools.length > 0) {
    payload.tools = tools;
  }

  const normalizedToolChoice = normalizeToolChoice(toolChoice || tool_choice, tools);
  if (normalizedToolChoice) {
    payload.tool_choice = normalizedToolChoice;
  }

  // 根据模型类型调整参数
  // 优先级：请求体中的 maxTokens > 模型默认值
  const maxTokens = params.maxTokens || params.max_tokens;

  if (model.includes("gemini")) {
    payload.max_tokens = maxTokens || 32768;
    payload.thinking = {
      budget_tokens: 128,
    };
  } else if (model.includes("claude")) {
    // Claude 使用 OpenAI 兼容代理时，也需要 max_tokens
    payload.max_tokens = maxTokens || 2048;
  } else {
    payload.max_tokens = maxTokens || 2048;
  }

  const normalizedResponseFormat = normalizeResponseFormat({
    responseFormat,
    response_format,
    outputSchema,
    output_schema,
  });

  if (normalizedResponseFormat) {
    payload.response_format = normalizedResponseFormat;
  }

  return payload;
};

// 复用：带"头超时"的 POST。
// 仅在响应头未在 timeoutMs 内返回时才中止（防止上游假死把连接池拖垮），
// 流式响应一旦开始传输就不再受该超时限制，直到客户端断开（externalSignal）。
const postJsonWithTimeout = async (
  url: string,
  apiKey: string,
  payload: Record<string, unknown>,
  opts: { timeoutMs?: number; externalSignal?: AbortSignal } = {},
): Promise<Response> => {
  const timeoutMs = opts.timeoutMs ?? ENV.llmTimeoutMs ?? 30000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  if (opts.externalSignal) {
    if (opts.externalSignal.aborted) controller.abort();
    else opts.externalSignal.addEventListener("abort", () => controller.abort(), { once: true });
  }

  try {
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    return resp;
  } catch (e) {
    if (opts.externalSignal?.aborted) {
      throw new Error("Client disconnected; upstream request aborted");
    }
    throw new Error(`LLM upstream request failed or timed out after ${timeoutMs}ms`);
  } finally {
    clearTimeout(timer);
  }
};

// 复用：解析配置并做前置校验
const prepareInvocation = async (
  params: InvokeParams,
  llmConfig?: LLMConfig,
): Promise<{ apiKey: string; apiUrl: string; model: string }> => {
  const apiKey = resolveApiKey(llmConfig?.apiKey);
  const apiUrl = await resolveApiUrl(llmConfig?.apiUrl);
  const model = resolveModel(llmConfig?.model);

  assertApiKey(apiKey);
  if (!apiUrl) {
    throw new Error(
      "API_URL is not configured. Provide it via LLM_API_URL env or request llmConfig.apiUrl.",
    );
  }

  return { apiKey, apiUrl, model };
};

export async function invokeLLM(
  params: InvokeParams,
  llmConfig?: LLMConfig,
  signal?: AbortSignal,
): Promise<InvokeResult> {
  const { apiKey, apiUrl, model } = await prepareInvocation(params, llmConfig);

  const payload = buildPayload(params, model, false);

  const response = await postJsonWithTimeout(apiUrl, apiKey, payload, { externalSignal: signal });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`LLM API Error [${model}]:`, {
      status: response.status,
      statusText: response.statusText,
      url: apiUrl,
      error: errorText,
    });
    throw new Error(
      `LLM invoke failed: ${response.status} ${response.statusText} – ${errorText}`,
    );
  }

  return (await response.json()) as InvokeResult;
}

// 流式输出：逐个上下文输出内容块
// 复用 invokeLLM 的所有预处理逻辑
// 应用场景：后端 SSE 流式输出
export async function* invokeLLMStream(
  params: InvokeParams,
  llmConfig?: LLMConfig,
  signal?: AbortSignal,
): AsyncGenerator<string> {
  const { apiKey, apiUrl, model } = await prepareInvocation(params, llmConfig);

  const payload = buildPayload(params, model, true);

  const response = await postJsonWithTimeout(apiUrl, apiKey, payload, { externalSignal: signal });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`LLM Stream API Error [${model}]:`, {
      status: response.status,
      statusText: response.statusText,
      url: apiUrl,
      error: errorText,
    });
    throw new Error(
      `LLM stream failed: ${response.status} ${response.statusText} – ${errorText}`,
    );
  }

  if (!response.body) {
    throw new Error("No response body for streaming");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.choices?.[0]?.delta?.content) {
              yield data.choices[0].delta.content;
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

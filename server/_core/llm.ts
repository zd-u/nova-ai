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

const resolveApiUrl = (customUrl?: string) => {
  // 优先级：自定义 URL > 环境变量
  if (customUrl && customUrl.trim().length > 0) {
    return customUrl.replace(/\/$/, "");
  }
  
  if (ENV.llmApiUrl && ENV.llmApiUrl.trim().length > 0) {
    let url = ENV.llmApiUrl.trim().replace(/\/$/, "");
    // Only append /v1/chat/completions if not already present
    if (!url.endsWith("/v1/chat/completions")) {
      url += "/v1/chat/completions";
    }
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

export async function invokeLLM(
  params: InvokeParams,
  llmConfig?: LLMConfig,
): Promise<InvokeResult> {
  const apiKey = resolveApiKey(llmConfig?.apiKey);
  const apiUrl = resolveApiUrl(llmConfig?.apiUrl);
  const model = resolveModel(llmConfig?.model);
  
  assertApiKey(apiKey);

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

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

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
): AsyncGenerator<string> {
  const apiKey = resolveApiKey(llmConfig?.apiKey);
  const apiUrl = resolveApiUrl(llmConfig?.apiUrl);
  const model = resolveModel(llmConfig?.model);
  
  assertApiKey(apiKey);

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
    stream: true,
  };

  if (tools && tools.length > 0) {
    payload.tools = tools;
  }

  const normalizedToolChoice = normalizeToolChoice(toolChoice || tool_choice, tools);
  if (normalizedToolChoice) {
    payload.tool_choice = normalizedToolChoice;
  }

  // 根据模型类型调整参数
  const maxTokens = params.maxTokens || params.max_tokens;
  
  if (model.includes("gemini")) {
    payload.max_tokens = maxTokens || 32768;
    payload.thinking = {
      budget_tokens: 128,
    };
  } else if (model.includes("claude")) {
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

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

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

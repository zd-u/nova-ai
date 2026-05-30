/**
 * 2026 最新大模型矩阵配置
 * 包含所有主流 LLM 平台的官方 API 地址和标准 Model ID
 */

export type ModelPreset = {
  id: string;
  name: string;
  provider: string;
  apiUrl: string;
  modelId: string;
  description?: string;
};

export const MODEL_PRESETS_2026: ModelPreset[] = [
  // DeepSeek
  {
    id: "deepseek-v4-pro",
    name: "DeepSeek V4-Pro",
    provider: "DeepSeek",
    apiUrl: "https://api.deepseek.com/v1/chat/completions",
    modelId: "deepseek-chat",
    description: "最强推理能力，适合复杂问题",
  },
  {
    id: "deepseek-v4-flash",
    name: "DeepSeek V4-Flash",
    provider: "DeepSeek",
    apiUrl: "https://api.deepseek.com/v1/chat/completions",
    modelId: "deepseek-chat",
    description: "快速响应，适合日常聊天",
  },

  // OpenAI
  {
    id: "gpt-5-4",
    name: "GPT-5.4",
    provider: "OpenAI",
    apiUrl: "https://api.openai.com/v1/chat/completions",
    modelId: "gpt-5.4",
    description: "最新旗舰模型，性能最强",
  },
  {
    id: "gpt-5-5-instant",
    name: "GPT-5.5 Instant",
    provider: "OpenAI",
    apiUrl: "https://api.openai.com/v1/chat/completions",
    modelId: "gpt-5.5-instant",
    description: "快速轻量级，适合实时对话",
  },

  // Anthropic Claude
  {
    id: "claude-opus-4-8",
    name: "Claude Opus 4.8",
    provider: "Anthropic",
    apiUrl: "https://api.anthropic.com/v1/messages",
    modelId: "claude-opus-4-8-20250514",
    description: "最强分析能力，适合深度思考",
  },

  // Google Gemini
  {
    id: "gemini-3-5-flash",
    name: "Gemini 3.5 Flash",
    provider: "Google",
    apiUrl: "https://generativelanguage.googleapis.com/v1/chat/completions",
    modelId: "gemini-3.5-flash",
    description: "快速高效，支持多模态",
  },
  {
    id: "gemini-3-1-pro",
    name: "Gemini 3.1 Pro",
    provider: "Google",
    apiUrl: "https://generativelanguage.googleapis.com/v1/chat/completions",
    modelId: "gemini-3.1-pro",
    description: "专业级模型，性能均衡",
  },

  // 阿里通义千问
  {
    id: "qwen-3-7-max",
    name: "Qwen 3.7 Max",
    provider: "Alibaba",
    apiUrl: "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation",
    modelId: "qwen-3.7-max",
    description: "国内最强模型，支持中文优化",
  },

  // 智谱清言
  {
    id: "glm-5-1",
    name: "GLM-5.1",
    provider: "Zhipu",
    apiUrl: "https://open.bigmodel.cn/api/paas/v4/chat/completions",
    modelId: "glm-5.1",
    description: "国内优秀模型，长文本处理强",
  },

  // 月之暗面 Kimi
  {
    id: "kimi-k2-6",
    name: "Kimi K2.6",
    provider: "Moonshot",
    apiUrl: "https://api.moonshot.cn/v1/chat/completions",
    modelId: "moonshot-v1-128k",
    description: "超长上下文，适合文档分析",
  },
];

/**
 * 根据模型 ID 获取预设配置
 */
export function getModelPreset(modelId: string): ModelPreset | undefined {
  return MODEL_PRESETS_2026.find((m) => m.id === modelId);
}

/**
 * 获取所有模型预设列表
 */
export function getAllModelPresets(): ModelPreset[] {
  return MODEL_PRESETS_2026;
}

/**
 * 按提供商分组模型
 */
export function getModelsByProvider(provider: string): ModelPreset[] {
  return MODEL_PRESETS_2026.filter((m) => m.provider === provider);
}

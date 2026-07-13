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
    id: "deepseek-chat",
    name: "DeepSeek Chat",
    provider: "DeepSeek",
    apiUrl: "https://api.deepseek.com/v1/chat/completions",
    modelId: "deepseek-chat",
    description: "DeepSeek 主力，便宜好用（已实测）",
  },
  {
    id: "deepseek-reasoner",
    name: "DeepSeek Reasoner",
    provider: "DeepSeek",
    apiUrl: "https://api.deepseek.com/v1/chat/completions",
    modelId: "deepseek-reasoner",
    description: "DeepSeek 推理模型，复杂问题强",
  },

  // OpenAI
  {
    id: "gpt-4.1",
    name: "GPT-4.1",
    provider: "OpenAI",
    apiUrl: "https://api.openai.com/v1/chat/completions",
    modelId: "gpt-4.1",
    description: "OpenAI 主力旗舰，推理与编程强",
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o mini",
    provider: "OpenAI",
    apiUrl: "https://api.openai.com/v1/chat/completions",
    modelId: "gpt-4o-mini",
    description: "OpenAI 轻量快速，低成本",
  },

  // Anthropic Claude (via OpenRouter)
  {
    id: "claude-opus-4",
    name: "Claude Opus 4",
    provider: "Anthropic",
    apiUrl: "https://openrouter.ai/api/v1/chat/completions",
    modelId: "anthropic/claude-opus-4",
    description: "Anthropic 最强，长文+编程+Agent",
  },
  {
    id: "claude-3-7-sonnet",
    name: "Claude 3.7 Sonnet",
    provider: "Anthropic",
    apiUrl: "https://openrouter.ai/api/v1/chat/completions",
    modelId: "anthropic/claude-3-7-sonnet",
    description: "Anthropic 均衡快速，支持推理",
  },

  // Google Gemini
  {
    id: "gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    provider: "Google",
    apiUrl: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    modelId: "gemini-2.5-pro",
    description: "Google 旗舰，多模态强",
  },
  {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    provider: "Google",
    apiUrl: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    modelId: "gemini-2.5-flash",
    description: "Google 快速便宜，日常首选",
  },

  // 阿里通义千问
  {
    id: "qwen-max",
    name: "Qwen Max",
    provider: "Alibaba",
    apiUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
    modelId: "qwen-max",
    description: "国内最强模型，支持中文优化",
  },
  {
    id: "qwen-plus",
    name: "Qwen Plus",
    provider: "Alibaba",
    apiUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
    modelId: "qwen-plus",
    description: "通义千问性价比，日常够用",
  },

  // 智谱清言
  {
    id: "glm-4-plus",
    name: "GLM-4 Plus",
    provider: "Zhipu",
    apiUrl: "https://open.bigmodel.cn/api/paas/v4/chat/completions",
    modelId: "glm-4-plus",
    description: "国内优秀模型，长文本处理强",
  },

  // 月之暗面 Kimi
  {
    id: "kimi-k2",
    name: "Kimi K2",
    provider: "Moonshot",
    apiUrl: "https://api.moonshot.cn/v1/chat/completions",
    modelId: "kimi-k2",
    description: "超长上下文，适合文档分析",
  },

  // MiniMax
  {
    id: "minimax-abab6.5s",
    name: "MiniMax ABAB6.5",
    provider: "MiniMax",
    apiUrl: "https://api.minimaxi.com/v1/chat/completions",
    modelId: "abab6.5s-chat",
    description: "MiniMax 旗舰，多模态",
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

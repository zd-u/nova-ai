import { ScrollView, Text, View, TouchableOpacity, TextInput } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState, useEffect } from "react";
import { useToast } from "react-native-toast-notifications";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useI18n } from "@/lib/context/i18n-context";

export type LLMConfig = {
  presetId?: string;      // 选中的预设模型 ID
  apiUrl?: string;        // 对应的 API 地址（自动填充）
  apiKey?: string;        // 用户输入的 API Key
  model?: string;         // 对应的模型名称（自动填充）
  isCustom?: boolean;     // 是否使用自定义配置
};

// 各家真实可用的最新模型（确认存在的官方 API 型号，点了能连上）
const MODEL_PRESETS = [
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
    description: "OpenAI 轻量快速，低成本日常聊",
  },
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
  {
    id: "grok-3",
    name: "Grok 3",
    provider: "xAI",
    apiUrl: "https://api.x.ai/v1/chat/completions",
    modelId: "grok-3",
    description: "xAI 旗舰，实时信息",
  },
  {
    id: "grok-3-mini",
    name: "Grok 3 mini",
    provider: "xAI",
    apiUrl: "https://api.x.ai/v1/chat/completions",
    modelId: "grok-3-mini",
    description: "xAI 轻量快速",
  },
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
  {
    id: "qwen-max",
    name: "Qwen Max",
    provider: "Alibaba",
    apiUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
    modelId: "qwen-max",
    description: "通义千问旗舰，中文优化",
  },
  {
    id: "qwen-plus",
    name: "Qwen Plus",
    provider: "Alibaba",
    apiUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
    modelId: "qwen-plus",
    description: "通义千问性价比，日常够用",
  },
  {
    id: "glm-4-plus",
    name: "GLM-4 Plus",
    provider: "Zhipu",
    apiUrl: "https://open.bigmodel.cn/api/paas/v4/chat/completions",
    modelId: "glm-4-plus",
    description: "智谱最新旗舰，长文本强",
  },
  {
    id: "kimi-k2",
    name: "Kimi K2",
    provider: "Moonshot",
    apiUrl: "https://api.moonshot.cn/v1/chat/completions",
    modelId: "kimi-k2",
    description: "月之暗面旗舰，超长上下文",
  },
  {
    id: "minimax-abab6.5s",
    name: "MiniMax ABAB6.5",
    provider: "MiniMax",
    apiUrl: "https://api.minimaxi.com/v1/chat/completions",
    modelId: "abab6.5s-chat",
    description: "MiniMax 旗舰，多模态",
  },
];

export default function SettingsScreen() {
  const colors = useColors();
  const { language, setLanguage, t } = useI18n();
  const toast = useToast();
  const [config, setConfig] = useState<LLMConfig>({});
  const [selectedPresetId, setSelectedPresetId] = useState<string>("");
  const [apiKey, setApiKey] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [customApiUrl, setCustomApiUrl] = useState("");
  const [customModelId, setCustomModelId] = useState("");

  // Load saved config on mount
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const saved = await AsyncStorage.getItem("llmConfig");
      if (saved) {
        const parsed = JSON.parse(saved);
        setConfig(parsed);
        setSelectedPresetId(parsed.presetId || "");
        setApiKey(parsed.apiKey || "");
        setShowCustom(parsed.isCustom || false);
        setCustomApiUrl(parsed.apiUrl || "");
        setCustomModelId(parsed.model || "");
      }
    } catch (error) {
      console.error("Error loading config:", error);
    }
  };

  const handlePresetSelect = (presetId: string) => {
    const preset = MODEL_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setSelectedPresetId(presetId);
      setShowCustom(false);
      setCustomApiUrl(preset.apiUrl);
      setCustomModelId(preset.modelId);
    }
  };

  const handleSaveConfig = async () => {
    if (!apiKey.trim()) {
      toast.show("Please enter your API Key", { type: 'danger', placement: 'bottom', duration: 3000 });
      return;
    }

    if (!customApiUrl.trim() || !customModelId.trim()) {
      toast.show("Please select a model or provide custom API settings", { type: 'danger', placement: 'bottom', duration: 3000 });
      return;
    }

    setIsSaving(true);
    try {
      const configToSave: LLMConfig = {
        presetId: selectedPresetId,
        apiUrl: customApiUrl,
        apiKey,
        model: customModelId,
        isCustom: showCustom,
      };

      await AsyncStorage.setItem("llmConfig", JSON.stringify(configToSave));
      toast.show("Configuration saved!", { type: 'success', placement: 'bottom', duration: 3000 });
      setConfig(configToSave);
    } catch (error) {
      toast.show("Failed to save configuration", { type: 'danger', placement: 'bottom', duration: 3000 });
      console.error("Error saving config:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetConfig = async () => {
    try {
      await AsyncStorage.removeItem("llmConfig");
      setConfig({});
      setSelectedPresetId("");
      setApiKey("");
      setShowCustom(false);
      setCustomApiUrl("");
      setCustomModelId("");
      toast.show("Configuration reset!", { type: 'success', placement: 'bottom', duration: 3000 });
    } catch (error) {
      toast.show("Failed to reset configuration", { type: 'danger', placement: 'bottom', duration: 3000 });
      console.error("Error resetting config:", error);
    }
  };

  const selectedPreset = MODEL_PRESETS.find((p) => p.id === selectedPresetId);

  return (
    <ScreenContainer className="flex-1">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="gap-6 p-4">
          {/* Language Toggle */}
          <View className="gap-2">
            <Text className="text-lg font-semibold text-foreground">
              {t("settings.language")}
            </Text>
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => setLanguage("zh")}
                style={{
                  backgroundColor:
                    language === "zh" ? colors.primary : colors.surface,
                }}
                className="flex-1 rounded-lg p-3 items-center"
              >
                <Text
                  className={`font-semibold ${
                    language === "zh" ? "text-background" : "text-foreground"
                  }`}
                >
                  中文
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setLanguage("en")}
                style={{
                  backgroundColor:
                    language === "en" ? colors.primary : colors.surface,
                }}
                className="flex-1 rounded-lg p-3 items-center"
              >
                <Text
                  className={`font-semibold ${
                    language === "en" ? "text-background" : "text-foreground"
                  }`}
                >
                  English
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Model Selection */}
          <View className="gap-2">
            <Text className="text-lg font-semibold text-foreground">
              {t("settings.model")}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
            >
              {MODEL_PRESETS.map((preset) => (
                <TouchableOpacity
                  key={preset.id}
                  onPress={() => handlePresetSelect(preset.id)}
                  style={{
                    backgroundColor:
                      selectedPresetId === preset.id
                        ? colors.primary
                        : colors.surface,
                    borderColor:
                      selectedPresetId === preset.id ? colors.primary : colors.border,
                    borderWidth: 1,
                  }}
                  className="rounded-lg p-3 min-w-max"
                >
                  <Text
                    className={`font-semibold ${
                      selectedPresetId === preset.id
                        ? "text-background"
                        : "text-foreground"
                    }`}
                  >
                    {preset.name}
                  </Text>
                  <Text
                    className={`text-xs ${
                      selectedPresetId === preset.id
                        ? "text-background opacity-80"
                        : "text-muted"
                    }`}
                  >
                    {preset.provider}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {selectedPreset && (
              <View className="bg-surface rounded-lg p-3 gap-1">
                <Text className="text-sm text-muted">
                  {selectedPreset.description}
                </Text>
                <Text className="text-xs text-muted">
                  API: {selectedPreset.apiUrl}
                </Text>
                <Text className="text-xs text-muted">
                  Model: {selectedPreset.modelId}
                </Text>
              </View>
            )}
          </View>

          {/* API Key Input */}
          <View className="gap-2">
            <Text className="text-lg font-semibold text-foreground">
              {t("settings.apiKey")}
            </Text>
            <TextInput
              value={apiKey}
              onChangeText={setApiKey}
              placeholder="Enter your API Key"
              placeholderTextColor={colors.muted}
              secureTextEntry
              className="bg-surface rounded-lg px-4 py-3 text-foreground"
              style={{ color: colors.foreground }}
            />
            <Text className="text-xs text-muted">
              🔒 你的 API Key 只保存在本机浏览器，由网页直连对应大模型平台（DeepSeek / 通义 / Kimi / 智谱），不经过任何服务器，我们不会存储或记录你的 Key。
            </Text>
          </View>

          {/* Custom Configuration (Optional) */}
          {showCustom && (
            <View className="gap-2 border border-border rounded-lg p-3">
              <Text className="text-sm font-semibold text-foreground">
                Custom Configuration
              </Text>
              <TextInput
                value={customApiUrl}
                onChangeText={setCustomApiUrl}
                placeholder="API URL"
                placeholderTextColor={colors.muted}
                className="bg-background rounded-lg px-3 py-2 text-foreground mb-2"
                style={{ color: colors.foreground }}
              />
              <TextInput
                value={customModelId}
                onChangeText={setCustomModelId}
                placeholder="Model ID"
                placeholderTextColor={colors.muted}
                className="bg-background rounded-lg px-3 py-2 text-foreground"
                style={{ color: colors.foreground }}
              />
            </View>
          )}

          {/* Custom Toggle */}
          <TouchableOpacity
            onPress={() => setShowCustom(!showCustom)}
            className="flex-row items-center gap-2"
          >
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 4,
                borderWidth: 2,
                borderColor: colors.primary,
                backgroundColor: showCustom ? colors.primary : "transparent",
              }}
            />
            <Text className="text-sm text-foreground">Use Custom Configuration</Text>
          </TouchableOpacity>

          {/* Save and Reset Buttons */}
          <View className="gap-2 flex-row">
            <TouchableOpacity
              onPress={handleSaveConfig}
              disabled={isSaving}
              style={{ backgroundColor: colors.primary }}
              className="flex-1 rounded-lg p-3 items-center"
            >
              <Text className="text-background font-semibold">
                {isSaving ? "Saving..." : "Save Configuration"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleResetConfig}
              style={{ backgroundColor: colors.error }}
              className="flex-1 rounded-lg p-3 items-center"
            >
              <Text className="text-background font-semibold">Reset</Text>
            </TouchableOpacity>
          </View>

          {/* Current Configuration Summary */}
          {config.apiKey && (
            <View className="bg-success bg-opacity-10 rounded-lg p-3 gap-1 border border-success">
              <Text className="text-sm font-semibold text-success">
                ✓ Configuration Active
              </Text>
              <Text className="text-xs text-success">
                Model: {config.model}
              </Text>
              <Text className="text-xs text-success">
                API: {config.apiUrl}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

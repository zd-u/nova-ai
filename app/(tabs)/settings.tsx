import { ScrollView, Text, View, TouchableOpacity, TextInput, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState, useEffect } from "react";

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

// 2026 年 6 月真实可用的主流 LLM 模型
const MODEL_PRESETS = [
  {
    id: "gpt-5-5",
    name: "GPT-5.5",
    provider: "OpenAI",
    apiUrl: "https://api.openai.com/v1/chat/completions",
    modelId: "gpt-5.5",
    description: "OpenAI 最新旗舰，全能型",
  },
  {
    id: "gpt-5-2",
    name: "GPT-5.2",
    provider: "OpenAI",
    apiUrl: "https://api.openai.com/v1/chat/completions",
    modelId: "gpt-5.2",
    description: "稳定高效，成本优化",
  },
  {
    id: "claude-opus-4-7",
    name: "Claude Opus 4.7",
    provider: "Anthropic (OpenRouter)",
    apiUrl: "https://openrouter.ai/api/v1/chat/completions",
    modelId: "anthropic/claude-opus-4-20250514",
    description: "强大的分析和编码能力",
  },
  {
    id: "gemini-3-1-pro",
    name: "Gemini 3.1 Pro",
    provider: "Google",
    apiUrl: "https://generativelanguage.googleapis.com/v1beta/openai/",
    modelId: "gemini-1.5-pro",
    description: "Google 最新，100万 token 上下文",
  },
  {
    id: "deepseek-v3",
    name: "DeepSeek V3",
    provider: "DeepSeek",
    apiUrl: "https://api.deepseek.com/v1/chat/completions",
    modelId: "deepseek-chat",
    description: "国内最强推理模型",
  },
  {
    id: "qwen-max",
    name: "Qwen Max",
    provider: "Alibaba",
    apiUrl: "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation",
    modelId: "qwen-max",
    description: "阿里最新，性能均衡",
  },
  {
    id: "glm-4-plus",
    name: "GLM-4 Plus",
    provider: "Zhipu",
    apiUrl: "https://open.bigmodel.cn/api/paas/v4/chat/completions",
    modelId: "glm-4-plus",
    description: "智谱最新，长文本优化",
  },
  {
    id: "moonshot-v1-128k",
    name: "Moonshot V1 (128K)",
    provider: "Moonshot",
    apiUrl: "https://api.moonshot.cn/v1/chat/completions",
    modelId: "moonshot-v1-128k",
    description: "月之暗面，超长上下文",
  },
];

export default function SettingsScreen() {
  const colors = useColors();
  const { language, setLanguage, t } = useI18n();
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
      Alert.alert("Error", "Please enter your API Key");
      return;
    }

    if (!customApiUrl.trim() || !customModelId.trim()) {
      Alert.alert("Error", "Please select a model or provide custom API settings");
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
      Alert.alert("Success", "Configuration saved!");
      setConfig(configToSave);
    } catch (error) {
      Alert.alert("Error", "Failed to save configuration");
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
      Alert.alert("Success", "Configuration reset!");
    } catch (error) {
      Alert.alert("Error", "Failed to reset configuration");
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
              🔒 Your API Key is stored locally on your device and sent to the LLM provider's API. We do not store or log your keys on our servers.
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

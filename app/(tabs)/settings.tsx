import React, { useEffect, useState } from "react";
import { ScrollView, Text, View, TouchableOpacity, TextInput, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

export type LLMConfig = {
  presetId?: string;      // 选中的预设模型 ID
  apiUrl?: string;        // 对应的 API 地址（自动填充）
  apiKey?: string;        // 用户输入的 API Key
  model?: string;         // 对应的模型名称（自动填充）
  isCustom?: boolean;     // 是否使用自定义配置
};

// 2026 最新模型矩阵
const MODEL_PRESETS = [
  {
    id: "deepseek-v4-pro",
    name: "DeepSeek V4-Pro",
    provider: "DeepSeek",
    apiUrl: "https://api.deepseek.com/v1/chat/completions",
    modelId: "deepseek-chat",
    description: "最强推理能力",
  },
  {
    id: "deepseek-v4-flash",
    name: "DeepSeek V4-Flash",
    provider: "DeepSeek",
    apiUrl: "https://api.deepseek.com/v1/chat/completions",
    modelId: "deepseek-chat",
    description: "快速响应",
  },
  {
    id: "gpt-5-4",
    name: "GPT-5.4",
    provider: "OpenAI",
    apiUrl: "https://api.openai.com/v1/chat/completions",
    modelId: "gpt-5.4",
    description: "最新旗舰模型",
  },
  {
    id: "gpt-5-5-instant",
    name: "GPT-5.5 Instant",
    provider: "OpenAI",
    apiUrl: "https://api.openai.com/v1/chat/completions",
    modelId: "gpt-5.5-instant",
    description: "快速轻量级",
  },
  {
    id: "claude-opus-4-8",
    name: "Claude Opus 4.8",
    provider: "Anthropic",
    apiUrl: "https://api.anthropic.com/v1/messages",
    modelId: "claude-opus-4-8-20250514",
    description: "最强分析能力",
  },
  {
    id: "gemini-3-5-flash",
    name: "Gemini 3.5 Flash",
    provider: "Google",
    apiUrl: "https://generativelanguage.googleapis.com/v1/chat/completions",
    modelId: "gemini-3.5-flash",
    description: "快速高效",
  },
  {
    id: "gemini-3-1-pro",
    name: "Gemini 3.1 Pro",
    provider: "Google",
    apiUrl: "https://generativelanguage.googleapis.com/v1/chat/completions",
    modelId: "gemini-3.1-pro",
    description: "性能均衡",
  },
  {
    id: "qwen-3-7-max",
    name: "Qwen 3.7 Max",
    provider: "Alibaba",
    apiUrl: "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation",
    modelId: "qwen-3.7-max",
    description: "国内最强",
  },
  {
    id: "glm-5-1",
    name: "GLM-5.1",
    provider: "Zhipu",
    apiUrl: "https://open.bigmodel.cn/api/paas/v4/chat/completions",
    modelId: "glm-5.1",
    description: "长文本处理强",
  },
  {
    id: "kimi-k2-6",
    name: "Kimi K2.6",
    provider: "Moonshot",
    apiUrl: "https://api.moonshot.cn/v1/chat/completions",
    modelId: "moonshot-v1-128k",
    description: "超长上下文",
  },
];

export default function SettingsScreen() {
  const colors = useColors();
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
        const parsedConfig = JSON.parse(saved) as LLMConfig;
        setConfig(parsedConfig);
        setApiKey(parsedConfig.apiKey || "");
        setSelectedPresetId(parsedConfig.presetId || "");
        setShowCustom(parsedConfig.isCustom || false);
        if (parsedConfig.isCustom) {
          setCustomApiUrl(parsedConfig.apiUrl || "");
          setCustomModelId(parsedConfig.model || "");
        }
      }
    } catch (error) {
      console.error("Failed to load LLM config:", error);
    }
  };

  const getSelectedPreset = () => {
    if (showCustom) return null;
    return MODEL_PRESETS.find((p) => p.id === selectedPresetId);
  };

  const saveConfig = async () => {
    if (!apiKey.trim()) {
      Alert.alert("错误", "请输入 API Key");
      return;
    }

    let newConfig: LLMConfig;

    if (showCustom) {
      // 自定义配置
      if (!customApiUrl.trim()) {
        Alert.alert("错误", "请输入自定义 API 地址");
        return;
      }
      if (!customModelId.trim()) {
        Alert.alert("错误", "请输入自定义模型名称");
        return;
      }

      newConfig = {
        apiUrl: customApiUrl.trim(),
        apiKey: apiKey.trim(),
        model: customModelId.trim(),
        isCustom: true,
      };
    } else {
      // 预设模型
      if (!selectedPresetId) {
        Alert.alert("错误", "请选择一个模型");
        return;
      }

      const preset = MODEL_PRESETS.find((p) => p.id === selectedPresetId);
      if (!preset) {
        Alert.alert("错误", "选择的模型不存在");
        return;
      }

      newConfig = {
        presetId: selectedPresetId,
        apiUrl: preset.apiUrl,
        apiKey: apiKey.trim(),
        model: preset.modelId,
        isCustom: false,
      };
    }

    setIsSaving(true);
    try {
      await AsyncStorage.setItem("llmConfig", JSON.stringify(newConfig));
      setConfig(newConfig);
      Alert.alert("成功", "大模型配置已保存！重新打开聊天页面即可生效。");
    } catch (error) {
      Alert.alert("错误", `保存配置失败: ${error instanceof Error ? error.message : "未知错误"}`);
    } finally {
      setIsSaving(false);
    }
  };

  const resetToDefault = async () => {
    Alert.alert("确认", "是否重置配置？", [
      { text: "取消", onPress: () => {} },
      {
        text: "确认",
        onPress: async () => {
          try {
            await AsyncStorage.removeItem("llmConfig");
            setConfig({});
            setApiKey("");
            setSelectedPresetId("");
            setShowCustom(false);
            setCustomApiUrl("");
            setCustomModelId("");
            Alert.alert("成功", "已重置配置");
          } catch (error) {
            Alert.alert("错误", "重置失败");
          }
        },
      },
    ]);
  };

  const selectedPreset = getSelectedPreset();

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="gap-6">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">大模型设置</Text>
            <Text className="text-sm text-muted">
              选择你喜欢的 AI 模型，输入 API Key 即可开始聊天
            </Text>
          </View>

          {/* Model Selection */}
          <View className="gap-3">
            <Text className="text-lg font-semibold text-foreground">选择模型</Text>
            <View className="gap-2">
              {MODEL_PRESETS.map((preset) => (
                <TouchableOpacity
                  key={preset.id}
                  onPress={() => {
                    setSelectedPresetId(preset.id);
                    setShowCustom(false);
                  }}
                  disabled={showCustom}
                  style={{
                    backgroundColor:
                      !showCustom && selectedPresetId === preset.id
                        ? colors.primary
                        : colors.surface,
                    borderColor:
                      !showCustom && selectedPresetId === preset.id
                        ? colors.primary
                        : colors.border,
                    borderWidth: 1,
                    borderRadius: 8,
                    padding: 12,
                    opacity: showCustom ? 0.5 : 1,
                  }}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <Text
                        style={{
                          color:
                            !showCustom && selectedPresetId === preset.id
                              ? colors.background
                              : colors.foreground,
                          fontWeight: "600",
                          fontSize: 14,
                        }}
                      >
                        {preset.name}
                      </Text>
                      <Text
                        style={{
                          color:
                            !showCustom && selectedPresetId === preset.id
                              ? colors.background
                              : colors.muted,
                          fontSize: 12,
                          marginTop: 4,
                        }}
                      >
                        {preset.provider} • {preset.description}
                      </Text>
                    </View>
                    {!showCustom && selectedPresetId === preset.id && (
                      <Text
                        style={{
                          color: colors.background,
                          fontSize: 18,
                          marginLeft: 8,
                        }}
                      >
                        ✓
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Custom Model Toggle */}
          <View className="gap-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-semibold text-foreground">自定义模型</Text>
              <TouchableOpacity
                onPress={() => setShowCustom(!showCustom)}
                style={{
                  backgroundColor: showCustom ? colors.primary : colors.surface,
                  borderColor: colors.border,
                  borderWidth: 1,
                  borderRadius: 20,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                }}
              >
                <Text
                  style={{
                    color: showCustom ? colors.background : colors.foreground,
                    fontSize: 12,
                    fontWeight: "600",
                  }}
                >
                  {showCustom ? "开启" : "关闭"}
                </Text>
              </TouchableOpacity>
            </View>

            {showCustom && (
              <View className="gap-3 p-3 bg-surface rounded-lg border border-border">
                {/* Custom API URL */}
                <View className="gap-1">
                  <Text className="text-sm font-medium text-foreground">自定义 API 地址</Text>
                  <TextInput
                    placeholder="例如: https://api.deepseek.com/v1/chat/completions"
                    placeholderTextColor={colors.muted}
                    value={customApiUrl}
                    onChangeText={setCustomApiUrl}
                    style={{
                      backgroundColor: colors.background,
                      color: colors.foreground,
                      borderColor: colors.border,
                      borderWidth: 1,
                      borderRadius: 6,
                      padding: 10,
                      fontFamily: "monospace",
                      fontSize: 11,
                    }}
                  />
                </View>

                {/* Custom Model ID */}
                <View className="gap-1">
                  <Text className="text-sm font-medium text-foreground">自定义模型名称</Text>
                  <TextInput
                    placeholder="例如: deepseek-chat"
                    placeholderTextColor={colors.muted}
                    value={customModelId}
                    onChangeText={setCustomModelId}
                    style={{
                      backgroundColor: colors.background,
                      color: colors.foreground,
                      borderColor: colors.border,
                      borderWidth: 1,
                      borderRadius: 6,
                      padding: 10,
                      fontFamily: "monospace",
                      fontSize: 11,
                    }}
                  />
                </View>
              </View>
            )}
          </View>

          {/* API Key Input - Always Visible */}
          <View className="gap-3">
            <Text className="text-lg font-semibold text-foreground">API Key</Text>
            <View className="gap-1">
              <TextInput
                placeholder="粘贴你的 API Key（例如: sk-xxxxxx）"
                placeholderTextColor={colors.muted}
                value={apiKey}
                onChangeText={setApiKey}
                secureTextEntry
                style={{
                  backgroundColor: colors.surface,
                  color: colors.foreground,
                  borderColor: colors.border,
                  borderWidth: 1,
                  borderRadius: 8,
                  padding: 12,
                  fontFamily: "monospace",
                  fontSize: 12,
                }}
              />
              <Text className="text-xs text-muted mt-1">
                🔒 API Key 仅保存在你的手机本地，不会上传到任何服务器
              </Text>
            </View>
          </View>

          {/* Current Config Display */}
          {config.model && (
            <View
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.primary,
                borderWidth: 1,
                borderRadius: 8,
                padding: 12,
              }}
            >
              <Text className="text-sm font-semibold text-foreground mb-2">✓ 当前配置</Text>
              {config.presetId && (
                <Text className="text-xs text-muted font-mono mb-1">
                  模型: {MODEL_PRESETS.find((p) => p.id === config.presetId)?.name || config.model}
                </Text>
              )}
              {config.isCustom && (
                <>
                  <Text className="text-xs text-muted font-mono mb-1">
                    模型 ID: {config.model}
                  </Text>
                  <Text className="text-xs text-muted font-mono">
                    API: {config.apiUrl?.substring(0, 50)}...
                  </Text>
                </>
              )}
            </View>
          )}

          {/* Action Buttons */}
          <View className="gap-3">
            <TouchableOpacity
              onPress={saveConfig}
              disabled={isSaving}
              style={{
                backgroundColor: colors.primary,
                borderRadius: 8,
                padding: 14,
                opacity: isSaving ? 0.6 : 1,
              }}
            >
              <Text className="text-center font-semibold text-background">
                {isSaving ? "保存中..." : "保存配置"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={resetToDefault}
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderWidth: 1,
                borderRadius: 8,
                padding: 14,
              }}
            >
              <Text className="text-center font-semibold text-foreground">
                重置配置
              </Text>
            </TouchableOpacity>
          </View>

          {/* Info Section */}
          <View
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderWidth: 1,
              borderRadius: 8,
              padding: 12,
            }}
          >
            <Text className="text-sm font-semibold text-foreground mb-2">💡 使用提示</Text>
            <Text className="text-xs text-muted leading-relaxed">
              1. 从上面选择你想用的 AI 模型{"\n"}
              2. 粘贴对应平台的 API Key{"\n"}
              3. 点击"保存配置"即可生效{"\n"}
              4. 需要其他模型？打开"自定义模型"输入 API 地址
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

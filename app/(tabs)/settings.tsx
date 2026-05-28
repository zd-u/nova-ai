import React, { useEffect, useState } from "react";
import { ScrollView, Text, View, TouchableOpacity, TextInput, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

export type LLMConfig = {
  apiUrl?: string;
  apiKey?: string;
  model?: string;
};

const DEFAULT_MODELS = [
  { label: "DeepSeek Chat", value: "deepseek-chat", url: "https://api.deepseek.com/v1" },
  { label: "OpenAI GPT-4o", value: "gpt-4o", url: "https://api.openai.com/v1" },
  { label: "Claude 3 Opus", value: "claude-3-opus-20240229", url: "https://api.anthropic.com/v1" },
  { label: "Kimi (Moonshot)", value: "moonshot-v1-8k", url: "https://api.moonshot.cn/v1" },
  { label: "Zhipu (GLM-4)", value: "glm-4", url: "https://open.bigmodel.cn/api/paas/v4" },
  { label: "Alibaba (Qwen)", value: "qwen-plus", url: "https://dashscope.aliyuncs.com/api/v1" },
  { label: "Gemini 2.5 Flash", value: "gemini-2.5-flash", url: "https://forge.manus.im/v1" },
];

export default function SettingsScreen() {
  const colors = useColors();
  const [config, setConfig] = useState<LLMConfig>({});
  const [apiUrl, setApiUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

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
        setApiUrl(parsedConfig.apiUrl || "");
        setApiKey(parsedConfig.apiKey || "");
        setModel(parsedConfig.model || "");
      }
    } catch (error) {
      console.error("Failed to load LLM config:", error);
    }
  };

  const saveConfig = async () => {
    if (!apiKey.trim()) {
      Alert.alert("错误", "请输入 API Key");
      return;
    }

    if (!model.trim()) {
      Alert.alert("错误", "请输入模型名称");
      return;
    }

    if (!apiUrl.trim()) {
      Alert.alert("错误", "请输入 API 地址");
      return;
    }

    setIsSaving(true);
    try {
      const newConfig: LLMConfig = {
        apiUrl: apiUrl.trim(),
        apiKey: apiKey.trim(),
        model: model.trim(),
      };

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
    Alert.alert("确认", "是否重置为默认配置（Gemini 2.5 Flash）？", [
      { text: "取消", onPress: () => {} },
      {
        text: "确认",
        onPress: async () => {
          try {
            await AsyncStorage.removeItem("llmConfig");
            setConfig({});
            setApiUrl("");
            setApiKey("");
            setModel("");
            setSelectedPreset("");
            Alert.alert("成功", "已重置为默认配置");
          } catch (error) {
            Alert.alert("错误", "重置失败");
          }
        },
      },
    ]);
  };

  const applyPreset = (preset: (typeof DEFAULT_MODELS)[0]) => {
    setSelectedPreset(preset.value);
    setModel(preset.value);
    setApiUrl(preset.url);
    // Keep existing API Key
  };

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View className="gap-6">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-3xl font-bold text-foreground">大模型设置</Text>
            <Text className="text-sm text-muted">
              自定义 AI 大模型，支持 DeepSeek、OpenAI、Claude 等任何 OpenAI 兼容接口
            </Text>
          </View>

          {/* Preset Models */}
          <View className="gap-3">
            <Text className="text-lg font-semibold text-foreground">快速预设</Text>
            <View className="gap-2">
              {DEFAULT_MODELS.map((preset) => (
                <TouchableOpacity
                  key={preset.value}
                  onPress={() => applyPreset(preset)}
                  style={{
                    backgroundColor:
                      selectedPreset === preset.value ? colors.primary : colors.surface,
                    borderColor: selectedPreset === preset.value ? colors.primary : colors.border,
                    borderWidth: 1,
                    borderRadius: 8,
                    padding: 12,
                  }}
                >
                  <Text
                    style={{
                      color:
                        selectedPreset === preset.value ? colors.background : colors.foreground,
                      fontWeight: "600",
                    }}
                  >
                    {preset.label}
                  </Text>
                  <Text
                    style={{
                      color:
                        selectedPreset === preset.value ? colors.background : colors.muted,
                      fontSize: 12,
                      marginTop: 4,
                    }}
                  >
                    {preset.value}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Custom Configuration */}
          <View className="gap-3">
            <Text className="text-lg font-semibold text-foreground">自定义配置</Text>

            {/* API URL */}
            <View className="gap-1">
              <Text className="text-sm font-medium text-foreground">API 地址</Text>
              <TextInput
                placeholder="例如: https://api.deepseek.com/v1"
                placeholderTextColor={colors.muted}
                value={apiUrl}
                onChangeText={setApiUrl}
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
                确保 URL 以 /v1 结尾，支持任何 OpenAI 兼容接口
              </Text>
            </View>

            {/* API Key */}
            <View className="gap-1">
              <Text className="text-sm font-medium text-foreground">API Key</Text>
              <TextInput
                placeholder="例如: sk-xxxxxx"
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
                API Key 仅保存在本地，不会上传到服务器
              </Text>
            </View>

            {/* Model Name */}
            <View className="gap-1">
              <Text className="text-sm font-medium text-foreground">模型名称</Text>
              <TextInput
                placeholder="例如: deepseek-chat"
                placeholderTextColor={colors.muted}
                value={model}
                onChangeText={setModel}
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
                请填写对应平台的模型 ID，例如 gpt-4o、claude-3-opus 等
              </Text>
            </View>
          </View>

          {/* Current Config Display */}
          {config.model && (
            <View
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderWidth: 1,
                borderRadius: 8,
                padding: 12,
              }}
            >
              <Text className="text-sm font-semibold text-foreground mb-2">当前配置</Text>
              <Text className="text-xs text-muted font-mono">
                模型: {config.model}
              </Text>
              <Text className="text-xs text-muted font-mono">
                API: {config.apiUrl?.substring(0, 40)}...
              </Text>
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
                重置为默认配置
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
            <Text className="text-sm font-semibold text-foreground mb-2">💡 提示</Text>
            <Text className="text-xs text-muted leading-relaxed">
              1. 选择快速预设后，请填入对应平台的 API Key{"\n"}
              2. 配置保存后，重新打开聊天页面即可生效{"\n"}
              3. 支持任何 OpenAI 兼容格式的 API 接口{"\n"}
              4. API Key 仅在本地保存，不会被上传
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

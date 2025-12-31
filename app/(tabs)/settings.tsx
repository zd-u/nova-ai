/**
 * 设置屏幕
 * 应用配置和数据管理
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  Switch,
  TextInput,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useChatContext } from '@/lib/context/chat-context';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function SettingsScreen() {
  const {
    novaName,
    theme,
    updateSettings,
    clearAllData,
  } = useChatContext();

  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState(novaName);
  const colorScheme = useColorScheme();
  const [notifications, setNotifications] = useState(true);

  const handleSaveName = async () => {
    if (tempName.trim() !== '') {
      await updateSettings({ novaName: tempName });
      setEditingName(false);
    }
  };

  const handleClearData = () => {
    Alert.alert(
      '确认清除数据',
      '这将删除所有聊天记录和性格数据，此操作无法撤销。',
      [
        { text: '取消', onPress: () => {} },
        {
          text: '清除',
          onPress: async () => {
            await clearAllData();
            Alert.alert('成功', '所有数据已清除');
          },
          style: 'destructive',
        },
      ]
    );
  };

  return (
    <ScreenContainer className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-4 py-6">
        {/* 基本设置 */}
        <View className="gap-6">
          <View>
            <Text className="text-lg font-semibold text-foreground mb-4">基本设置</Text>

            {/* Nova 名字 */}
            <View className="bg-surface rounded-lg p-4 gap-3 mb-4">
              <View className="flex-row justify-between items-center">
                <Text className="text-base font-medium text-foreground">Nova 的名字</Text>
                {!editingName && (
                  <Pressable
                    onPress={() => setEditingName(true)}
                    className="px-3 py-1 bg-primary rounded-full"
                  >
                    <Text className="text-white text-xs font-semibold">编辑</Text>
                  </Pressable>
                )}
              </View>
              {editingName ? (
                <View className="gap-2">
                  <TextInput
                    value={tempName}
                    onChangeText={setTempName}
                    placeholder="输入 Nova 的名字"
                    className="bg-background border border-border rounded-lg px-3 py-2 text-foreground"
                    placeholderTextColor="#999"
                  />
                  <View className="flex-row gap-2">
                    <Pressable
                      onPress={handleSaveName}
                      className="flex-1 bg-primary rounded-lg py-2 items-center"
                    >
                      <Text className="text-white font-semibold">保存</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        setEditingName(false);
                        setTempName(novaName);
                      }}
                      className="flex-1 bg-muted rounded-lg py-2 items-center"
                    >
                      <Text className="text-foreground font-semibold">取消</Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <Text className="text-base text-foreground">{novaName}</Text>
              )}
            </View>

            {/* 主题设置 */}
            <View className="bg-surface rounded-lg p-4 gap-3 mb-4">
              <View className="flex-row justify-between items-center">
                <Text className="text-base font-medium text-foreground">主题</Text>
                <Text className="text-sm text-muted">
                  {theme === 'auto'
                    ? '自动'
                    : theme === 'light'
                      ? '亮色'
                      : '暗色'}
                </Text>
              </View>
              <View className="flex-row gap-2">
                {['auto', 'light', 'dark'].map((t) => (
                  <Pressable
                    key={t}
                    onPress={() => updateSettings({ theme: t })}
                    className={`flex-1 py-2 rounded-lg items-center ${
                      theme === t ? 'bg-primary' : 'bg-border'
                    }`}
                  >
                    <Text
                      className={`text-sm font-semibold ${
                        theme === t ? 'text-white' : 'text-foreground'
                      }`}
                    >
                      {t === 'auto' ? '自动' : t === 'light' ? '亮色' : '暗色'}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* 通知设置 */}
            <View className="bg-surface rounded-lg p-4 flex-row justify-between items-center mb-4">
              <Text className="text-base font-medium text-foreground">接收通知</Text>
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: '#ccc', true: '#FF6B9D' }}
              />
            </View>
          </View>

          {/* 数据管理 */}
          <View>
            <Text className="text-lg font-semibold text-foreground mb-4">数据管理</Text>

            <Pressable
              onPress={handleClearData}
              className="bg-error rounded-lg p-4 items-center"
            >
              <Text className="text-white font-semibold">清除所有数据</Text>
              <Text className="text-white text-xs mt-1 opacity-70">
                删除所有聊天记录和性格数据
              </Text>
            </Pressable>
          </View>

          {/* 关于 */}
          <View>
            <Text className="text-lg font-semibold text-foreground mb-4">关于</Text>

            <View className="bg-surface rounded-lg p-4 gap-3">
              <View className="flex-row justify-between">
                <Text className="text-base text-foreground">应用版本</Text>
                <Text className="text-base text-muted">1.0.0</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-base text-foreground">开发者</Text>
                <Text className="text-base text-muted">Nova Team</Text>
              </View>
              <View className="mt-2 pt-3 border-t border-border">
                <Text className="text-xs text-muted text-center">
                  Nova 是一个 AI 女友应用，具有动态性格演化和记忆功能。
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

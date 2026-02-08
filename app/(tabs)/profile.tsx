/**
 * 性格档案屏幕
 * 展示 Nova 的性格特征、变化历史和记忆统计
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  Pressable,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useChatContext } from '@/lib/context/chat-context';
import { getPersonalityDescription } from '@/lib/types/personality';

// const NOVA_AVATAR = require('@/assets/images/icon.png'); // 已移除
const NOVA_AVATAR = null;

export default function ProfileScreen() {
  const {
    personality,
    personalityHistory,
    memories,
    novaName,
  } = useChatContext();

  const personalityTraits = [
    { label: '温柔度', value: personality.gentleness, color: '#FF6B9D' },
    { label: '活泼度', value: personality.liveliness, color: '#FF9D5C' },
    { label: '知性度', value: personality.intellectuality, color: '#6C9DFF' },
    { label: '调皮度', value: personality.mischief, color: '#FFD66C' },
    { label: '神秘度', value: personality.mystery, color: '#C66CFF' },
  ];

  return (
    <ScreenContainer className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-4 py-6">
        {/* 头像和基本信息 */}
        <View className="items-center gap-4 mb-8">
          {/* <Image
            source={NOVA_AVATAR}
            className="w-32 h-32 rounded-full"
          /> */}
          <View className="w-32 h-32 rounded-full bg-primary" />
          <View className="items-center gap-2">
            <Text className="text-3xl font-bold text-foreground">{novaName}</Text>
            <Text className="text-base text-primary font-semibold">
              {getPersonalityDescription(personality)}
            </Text>
          </View>
        </View>

        {/* 性格维度 */}
        <View className="gap-4 mb-8">
          <Text className="text-lg font-semibold text-foreground">性格特征</Text>
          {personalityTraits.map((trait) => (
            <View key={trait.label} className="gap-2">
              <View className="flex-row justify-between items-center">
                <Text className="text-sm font-medium text-foreground">{trait.label}</Text>
                <Text className="text-sm font-semibold text-foreground">{trait.value}/100</Text>
              </View>
              <View className="h-2 bg-surface rounded-full overflow-hidden">
                <View
                  style={{
                    width: `${trait.value}%`,
                    backgroundColor: trait.color,
                    height: '100%',
                  }}
                />
              </View>
            </View>
          ))}
        </View>

        {/* 记忆统计 */}
        <View className="gap-4 mb-8">
          <Text className="text-lg font-semibold text-foreground">记忆统计</Text>
          <View className="flex-row gap-4">
            <View className="flex-1 bg-surface rounded-lg p-4 items-center">
              <Text className="text-2xl font-bold text-primary">{memories.length}</Text>
              <Text className="text-xs text-muted mt-1">总记忆数</Text>
            </View>
            <View className="flex-1 bg-surface rounded-lg p-4 items-center">
              <Text className="text-2xl font-bold text-primary">{personalityHistory.length}</Text>
              <Text className="text-xs text-muted mt-1">性格变化</Text>
            </View>
          </View>
        </View>

        {/* 性格变化历史 */}
        {personalityHistory.length > 0 && (
          <View className="gap-4">
            <Text className="text-lg font-semibold text-foreground">性格演化历史</Text>
            <View className="gap-3">
              {personalityHistory.slice(-5).reverse().map((history) => (
                <View
                  key={history.id}
                  className="bg-surface rounded-lg p-4 gap-2"
                >
                  <Text className="text-xs text-muted">
                    {new Date(history.timestamp).toLocaleString('zh-CN')}
                  </Text>
                  <Text className="text-sm text-foreground font-medium">
                    触发消息："{history.triggerMessage}"
                  </Text>
                  <Text className="text-xs text-muted">{history.reason}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

/**
 * 聊天屏幕
 * Nova AI 女友的主聊天界面
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useChatContext } from '@/lib/context/chat-context-ai';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';
import type { ChatMessage } from '@/lib/context/chat-context-ai';

const NOVA_AVATAR = require('@/assets/images/icon.png');

export default function ChatScreen() {
  const colors = useColors();
  const { state, sendMessage } = useChatContext();
  const { messages, isLoading, personality, novaName, currentExpression, emotionalState } = state;

  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const flatListRef = useRef<FlatList<ChatMessage>>(null);

  // 自动滚动到底部
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (inputText.trim() === '') return;

    try {
      setIsSending(true);
      await sendMessage(inputText);
      setInputText('');
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <ScreenContainer className="flex items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  // 获取性格描述
  const getPersonalityDescription = () => {
    const traits = [];
    if (personality.gentleness > 60) traits.push('温柔');
    if (personality.liveliness > 60) traits.push('活泼');
    if (personality.intellectuality > 60) traits.push('聪慧');
    if (personality.mischief > 60) traits.push('调皮');
    if (personality.mystery > 60) traits.push('神秘');
    return traits.length > 0 ? traits.join('、') : '神秘';
  };

  // 获取情绪描述
  const getEmotionDescription = () => {
    if (emotionalState.happiness > 70) return '😊 开心';
    if (emotionalState.sadness > 60) return '😢 伤心';
    if (emotionalState.anger > 50) return '😠 生气';
    if (emotionalState.excitement > 70) return '🤩 兴奋';
    if (emotionalState.shyness > 60) return '😳 害羞';
    if (emotionalState.boredom > 70) return '😑 无聊';
    return '😌 平静';
  };

  return (
    <ScreenContainer className="flex-1 bg-background">
      {/* 顶部栏 */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
        <View className="flex-row items-center gap-3">
          <Image
            source={NOVA_AVATAR}
            style={{ width: 40, height: 40, borderRadius: 20 }}
          />
          <View>
            <Text className="text-lg font-bold text-foreground">{novaName}</Text>
            <Text className="text-xs text-muted">
              {getPersonalityDescription()} · {getEmotionDescription()}
            </Text>
          </View>
        </View>
        <Pressable className="p-2">
          <Text className="text-xl">⋮</Text>
        </Pressable>
      </View>

      {/* 消息列表 */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
            className={cn(
              'px-4 py-2',
              item.role === 'user' ? 'items-end' : 'items-start'
            )}
          >
            <View
              className={cn(
                'px-4 py-3 rounded-2xl max-w-xs',
                item.role === 'user'
                  ? 'bg-primary rounded-br-none'
                  : 'bg-surface rounded-bl-none'
              )}
            >
              <Text
                className={cn(
                  'text-base leading-relaxed',
                  item.role === 'user' ? 'text-background' : 'text-foreground'
                )}
              >
                {item.content}
              </Text>
            </View>
            <Text className="text-xs text-muted mt-1">
              {new Date(item.timestamp).toLocaleTimeString('zh-CN', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        )}
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}
        scrollEnabled={true}
      />

      {/* 输入框 */}
      <View className="px-4 py-3 border-t border-border flex-row items-center gap-2">
        <TextInput
          value={inputText}
          onChangeText={setInputText}
          placeholder="说点什么吧..."
          placeholderTextColor={colors.muted}
          className="flex-1 px-4 py-2 rounded-full bg-surface text-foreground"
          multiline
          maxLength={200}
          editable={!isSending}
        />
        <Pressable
          onPress={handleSendMessage}
          disabled={isSending || inputText.trim() === ''}
          className={cn(
            'p-2 rounded-full',
            isSending || inputText.trim() === ''
              ? 'bg-muted opacity-50'
              : 'bg-primary'
          )}
        >
          <Text className="text-lg">
            {isSending ? '⏳' : '➤'}
          </Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

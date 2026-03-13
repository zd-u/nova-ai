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
import { useChatContext } from '@/lib/context/chat-context';
import { getPersonalityDescription } from '@/lib/types/personality';
import { cn } from '@/lib/utils';
import type { ChatMessage } from '@/lib/types/personality';

const NOVA_AVATAR = require('@/assets/images/icon.png');

export default function ChatScreen() {
  const {
    messages,
    loading,
    personality,
    novaName,
    sendMessage,
  } = useChatContext();

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
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  if (loading) {
    return (
      <ScreenContainer className="flex items-center justify-center">
        <ActivityIndicator size="large" color="#FF6B9D" />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="flex-1 bg-background" edges={['top', 'left', 'right']}>
      {/* 顶部栏 */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
        <View className="flex-row items-center gap-3">
          <Image
            source={NOVA_AVATAR}
            className="w-10 h-10 rounded-full"
          />
          <View>
            <Text className="text-base font-semibold text-foreground">{novaName}</Text>
            <Text className="text-xs text-muted">
              {getPersonalityDescription(personality)}
            </Text>
          </View>
        </View>
        <Pressable className="p-2">
          <Text className="text-lg">⋮</Text>
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
              item.role === 'user' ? 'flex-row justify-end' : 'flex-row justify-start'
            )}
          >
            <View
              className={cn(
                'max-w-xs rounded-2xl px-4 py-2',
                item.role === 'user'
                  ? 'bg-primary rounded-br-none'
                  : 'bg-surface rounded-bl-none'
              )}
            >
              <Text
                className={cn(
                  'text-base leading-relaxed',
                  item.role === 'user' ? 'text-white' : 'text-foreground'
                )}
              >
                {item.content}
              </Text>
              <Text
                className={cn(
                  'text-xs mt-1',
                  item.role === 'user' ? 'text-white opacity-70' : 'text-muted'
                )}
              >
                {new Date(item.timestamp).toLocaleTimeString('zh-CN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          </View>
        )}
        scrollEnabled={true}
        contentContainerStyle={{ flexGrow: 1 }}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center gap-4">
            <Image
              source={NOVA_AVATAR}
              className="w-24 h-24 rounded-full opacity-50"
            />
            <Text className="text-lg font-semibold text-foreground">
              嗨！我是 {novaName}
            </Text>
            <Text className="text-sm text-muted text-center px-6">
              很高兴认识你！说点什么吧，让我们开始聊天～
            </Text>
          </View>
        }
      />

      {/* 输入框 */}
      <View className="px-4 py-3 border-t border-border gap-3">
        <View className="flex-row items-center gap-2 bg-surface rounded-full px-4 py-2">
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="说点什么吧..."
            placeholderTextColor="#999"
            className="flex-1 text-foreground text-base"
            multiline
            maxLength={500}
            editable={!isSending}
          />
          <Pressable
            onPress={handleSendMessage}
            disabled={isSending || inputText.trim() === ''}
            style={({ pressed }) => [
              {
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <View
              className={cn(
                'p-2 rounded-full',
                isSending || inputText.trim() === ''
                  ? 'bg-muted opacity-50'
                  : 'bg-primary'
              )}
            >
              {isSending ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text className="text-lg">➤</Text>
              )}
            </View>
          </Pressable>
        </View>
      </View>
    </ScreenContainer>
  );
}

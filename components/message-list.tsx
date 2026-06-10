import React from 'react';
import { FlatList, Text, View } from 'react-native';
import { ChatMessage } from '@/lib/context/simple-chat-context';

// inverted={true} 时，FlatList 从底部开始渲染
// 数据需要反向，使得视觉上消息按时间正序显示（旧→新）
// 新消息出现在底部，自动滚动到底部

type MessageListProps = {
  messages: ChatMessage[] | undefined;
};

export function MessageList({ messages }: MessageListProps) {
  if (!messages || messages.length === 0) {
    return (
      <View className="flex-1 justify-center items-center px-8">
        <Text className="text-lg text-muted text-center">
          {"又来了？...那我就勉为其难陪你聊会儿吧 💫"}
        </Text>
      </View>
    );
  }

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.sender === 'user';

    return (
      <View className={`flex-row ${isUser ? 'justify-end' : 'justify-start'} mb-3 px-4`}>
        <View
          className={`max-w-xs rounded-2xl px-4 py-3 ${
            isUser ? 'bg-primary' : 'bg-surface'
          }`}
        >
          <Text
            className={`text-base ${
              isUser ? 'text-background' : 'text-foreground'
            }`}
          >
            {item.content}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <FlatList
      data={[...(messages ?? [])].reverse()}
      renderItem={renderMessage}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ paddingVertical: 16 }}
      inverted={true}
      scrollEnabled={true}
      scrollEventThrottle={16}
      maxToRenderPerBatch={10}
      updateCellsBatchingPeriod={50}
      windowSize={10}
    />
  );
}

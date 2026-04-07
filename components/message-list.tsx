import React from 'react';
import { FlatList, Text, View } from 'react-native';
import { ChatMessage } from '@/lib/types/chat';

type MessageListProps = {
  messages: ChatMessage[];
};

export function MessageList({ messages }: MessageListProps) {
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
      data={messages}
      renderItem={renderMessage}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ paddingVertical: 16 }}
      inverted={false}
    />
  );
}

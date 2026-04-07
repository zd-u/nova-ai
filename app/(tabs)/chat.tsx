import React from 'react';
import { View, ScrollView, Text } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { MessageList } from '@/components/message-list';
import { MessageInput } from '@/components/message-input';
import { useChatContext } from '@/lib/context/simple-chat-context';

export default function ChatScreen() {
  const { messages, loading, error, sendMessage } = useChatContext();

  return (
    <ScreenContainer className="flex-1 bg-background">
      <View className="flex-1">
        <ScrollView 
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
        >
          <MessageList messages={messages} />
        </ScrollView>
        {error && (
          <View className="bg-error px-4 py-2">
            <Text className="text-background text-sm">{error}</Text>
          </View>
        )}
        <MessageInput onSend={sendMessage} loading={loading} />
      </View>
    </ScreenContainer>
  );
}

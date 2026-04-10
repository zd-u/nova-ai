import React from 'react';
import { View, Text } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { MessageList } from '@/components/message-list';
import { MessageInput } from '@/components/message-input';
import { useChatContext } from '@/lib/context/simple-chat-context';

export default function ChatScreen() {
  const { messages, loading, error, sendMessage } = useChatContext();

  return (
    <ScreenContainer className="flex-1 bg-background" edges={['top', 'left', 'right', 'bottom']}>
      <View className="flex-1">
        {/* MessageList uses FlatList which handles scrolling internally */}
        <MessageList messages={messages} />
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

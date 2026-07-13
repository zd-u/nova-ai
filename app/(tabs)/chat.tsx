import React from 'react';
import { View, Text, KeyboardAvoidingView, Platform } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { MessageList } from '@/components/message-list';
import { MessageInput } from '@/components/message-input';
import { useChatContext } from '@/lib/context/simple-chat-context';
import { useI18n } from '@/lib/context/i18n-context';

export default function ChatScreen() {
  const { messages, loading, error, sendMessage, clearHistory, stopGeneration } = useChatContext();
  const { language } = useI18n();

  return (
    <ScreenContainer className="flex-1 bg-background" edges={['top', 'left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
      <View className="flex-1">
        {/* Header with clear history button */}
        <View className="flex-row justify-between items-center px-4 py-3 border-b border-border">
          <Text className="text-lg font-semibold text-foreground">Nova</Text>
          <Text
            onPress={clearHistory}
            className="text-sm text-muted underline"
          >
            {language === 'zh' ? '清除历史' : 'Clear History'}
          </Text>
        </View>
        {/* MessageList uses FlatList which handles scrolling internally */}
        <MessageList messages={messages} />
        {error && (
          <View className="bg-error px-4 py-2">
            <Text className="text-background text-sm">{error}</Text>
          </View>
        )}
        <MessageInput onSend={sendMessage} loading={loading} onStop={stopGeneration} />
      </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

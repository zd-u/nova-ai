import React, { useState } from 'react';
import { TextInput, View, Pressable, Text, ActivityIndicator } from 'react-native';
import { useColors } from '@/hooks/use-colors';

type MessageInputProps = {
  onSend: (message: string) => Promise<void>;
  loading?: boolean;
  onStop?: () => void;
};

export function MessageInput({ onSend, loading, onStop }: MessageInputProps) {
  const [text, setText] = useState('');
  const colors = useColors();

  const handleSend = async () => {
    if (!text.trim() || loading) return;
    
    // 立刻清空输入框
    const messageToSend = text;
    setText('');
    
    // 然后发送消息
    await onSend(messageToSend);
  };

  return (
    <View className="flex-row items-center gap-2 px-4 py-3 bg-background border-t border-border">
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="说点什么..."
        placeholderTextColor={colors.muted}
        className="flex-1 bg-surface rounded-full px-4 py-3 text-foreground"
        editable={!loading}
        multiline
        maxLength={2000}
      />
      <Pressable
        onPress={loading ? onStop : handleSend}
        disabled={!loading && !text.trim()}
        style={({ pressed }) => [
          {
            opacity: pressed ? 0.7 : 1,
            backgroundColor: loading || !text.trim() ? colors.border : colors.primary,
          },
        ]}
        className="w-10 h-10 rounded-full items-center justify-center"
      >
        {loading ? (
          <View className="w-4 h-4 rounded-[2px] bg-background" />
        ) : (
          <Text className="text-lg">→</Text>
        )}
      </Pressable>
    </View>
  );
}

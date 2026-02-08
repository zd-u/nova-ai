/**
 * 优化后的聊天屏幕
 * 显示Nova的动态表情、语音按钮和主动消息通知
 */

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Pressable,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { useChatContext } from '@/lib/context/chat-context-v2';
import { cn } from '@/lib/utils';
import * as Haptics from 'expo-haptics';

/**
 * 表情图片映射
 */
const EXPRESSION_IMAGES: Record<string, any> = {
  happy: require('@/assets/expressions/nova-happy.png'),
  sad: require('@/assets/expressions/nova-sad.png'),
  shy: require('@/assets/expressions/nova-shy.png'),
  angry: require('@/assets/expressions/nova-angry.png'),
  bored: require('@/assets/expressions/nova-bored.png'),
  excited: require('@/assets/expressions/nova-excited.png'),
  thinking: require('@/assets/expressions/nova-thinking.png'),
  confused: require('@/assets/expressions/nova-confused.png'),
  neutral: require('@/assets/expressions/nova-neutral.png'),
};

/**
 * 聊天屏幕组件
 */
export default function ChatScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { state, sendMessage, getActiveMessage } = useChatContext();
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showActiveMessageNotification, setShowActiveMessageNotification] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // 检查主动消息
  useEffect(() => {
    const checkActiveMessage = async () => {
      const message = await getActiveMessage();
      if (message) {
        setShowActiveMessageNotification(true);
        setTimeout(() => {
          setShowActiveMessageNotification(false);
        }, 5000);
      }
    };

    const interval = setInterval(checkActiveMessage, 30000); // 每30秒检查一次
    return () => clearInterval(interval);
  }, [getActiveMessage]);

  // 自动滚动到底部
  useEffect(() => {
    if (state.messages.length > 0) {
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  }, [state.messages]);

  // 发送消息
  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await sendMessage(inputText);
      setInputText('');
    } catch (error) {
      Alert.alert('错误', '发送消息失败');
    }
  };

  // 开始录音
  const handleStartRecording = async () => {
    try {
      setIsRecording(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      // TODO: 实现真实的语音录制逻辑
    } catch (error) {
      Alert.alert('错误', '无法开始录音');
      setIsRecording(false);
    }
  };

  // 停止录音
  const handleStopRecording = async () => {
    try {
      setIsRecording(false);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      // TODO: 实现语音转文字逻辑
    } catch (error) {
      Alert.alert('错误', '录音处理失败');
    }
  };

  // 播放语音
  const handlePlayAudio = async (audioUrl: string) => {
    try {
      // TODO: 实现语音播放逻辑
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      Alert.alert('错误', '无法播放语音');
    }
  };

  // 获取表情图片
  const getExpressionImage = () => {
    return EXPRESSION_IMAGES[state.currentExpression] || EXPRESSION_IMAGES.neutral;
  };

  // 渲染消息气泡
  const renderMessage = ({ item }: any) => {
    const isUser = item.role === 'user';
    return (
      <View
        className={cn(
          'flex-row gap-3 mb-4 px-4',
          isUser ? 'justify-end' : 'justify-start'
        )}
      >
        {!isUser && (
          <Image
            source={getExpressionImage()}
            className="w-8 h-8 rounded-full"
            resizeMode="cover"
          />
        )}
        <View
          className={cn(
            'max-w-xs px-4 py-3 rounded-2xl',
            isUser
              ? 'bg-primary'
              : 'bg-surface border border-border'
          )}
        >
          <Text
            className={cn(
              'text-base leading-relaxed',
              isUser ? 'text-background' : 'text-foreground'
            )}
          >
            {item.content}
          </Text>
          {item.audioUrl && (
            <TouchableOpacity
              onPress={() => handlePlayAudio(item.audioUrl)}
              className="mt-2 flex-row items-center gap-2"
            >
              <Text className={isUser ? 'text-background' : 'text-muted'}>
                🔊 播放语音
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  // 渲染Nova的头像和情绪信息
  const renderNovaHeader = () => {
    const emotionEmoji: Record<string, string> = {
      happy: '😊',
      sad: '😢',
      shy: '😳',
      angry: '😠',
      bored: '😑',
      excited: '🤩',
      thinking: '🤔',
      confused: '❓',
      neutral: '😌',
    };

    return (
      <View className="flex-row items-center justify-between px-4 py-4 border-b border-border">
        <View className="flex-row items-center gap-3">
          <Image
            source={getExpressionImage()}
            className="w-12 h-12 rounded-full"
            resizeMode="cover"
          />
          <View>
            <Text className="text-lg font-semibold text-foreground">
              {state.novaName}
            </Text>
            <Text className="text-sm text-muted">
              {emotionEmoji[state.currentExpression] || '😌'} 现在感到{
                {
                  happy: '开心',
                  sad: '失落',
                  shy: '害羞',
                  angry: '生气',
                  bored: '无聊',
                  excited: '兴奋',
                  thinking: '思考中',
                  confused: '困惑',
                  neutral: '平静',
                }[state.currentExpression] || '平静'
              }
            </Text>
          </View>
        </View>
        <View className="flex-row gap-2">
          <TouchableOpacity
            className="p-2 rounded-full bg-surface"
            onPress={() => Alert.alert('性格档案', '查看Nova的性格详情')}
          >
            <Text>📊</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // 渲染主动消息通知
  const renderActiveMessageNotification = () => {
    if (!showActiveMessageNotification) return null;

    return (
      <View className="bg-primary/10 border-l-4 border-primary px-4 py-3 mb-4 mx-4 rounded">
        <Text className="text-sm font-semibold text-primary">
          ✨ Nova 有话想对你说...
        </Text>
      </View>
    );
  };

  return (
    <ScreenContainer className="flex-1 bg-background">
      {/* Nova 头像和情绪 */}
      {renderNovaHeader()}

      {/* 主动消息通知 */}
      {renderActiveMessageNotification()}

      {/* 消息列表 */}
      <FlatList
        ref={flatListRef}
        data={state.messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingVertical: 16 }}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-12">
            <Image
              source={getExpressionImage()}
              className="w-24 h-24 rounded-full mb-4"
              resizeMode="cover"
            />
            <Text className="text-lg font-semibold text-foreground mb-2">
              嗨，我是 {state.novaName}
            </Text>
            <Text className="text-sm text-muted text-center px-4">
              开始和我聊天吧，我会根据你的想法改变自己 💕
            </Text>
          </View>
        }
      />

      {/* 加载指示器 */}
      {state.isLoading && (
        <View className="px-4 py-3">
          <View className="flex-row items-center gap-2">
            <ActivityIndicator color={colors.primary} />
            <Text className="text-sm text-muted">Nova 正在思考...</Text>
          </View>
        </View>
      )}

      {/* 输入框 */}
      <View
        className="border-t border-border bg-background px-4 py-4"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}
      >
        <View className="flex-row items-center gap-3">
          {/* 语音输入按钮 */}
          <Pressable
            onPress={isRecording ? handleStopRecording : handleStartRecording}
            style={({ pressed }) => [
              {
                transform: [{ scale: pressed ? 0.95 : 1 }],
              },
            ]}
            className={cn(
              'w-10 h-10 rounded-full items-center justify-center',
              isRecording ? 'bg-error' : 'bg-surface'
            )}
          >
            <Text className="text-lg">
              {isRecording ? '⏹️' : '🎤'}
            </Text>
          </Pressable>

          {/* 文本输入框 */}
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="和Nova聊天..."
            placeholderTextColor={colors.muted}
            className="flex-1 px-4 py-3 rounded-full bg-surface text-foreground"
            multiline
            maxLength={500}
          />

          {/* 发送按钮 */}
          <Pressable
            onPress={handleSendMessage}
            disabled={!inputText.trim() || state.isLoading}
            style={({ pressed }) => [
              {
                transform: [{ scale: pressed ? 0.95 : 1 }],
              },
            ]}
            className={cn(
              'w-10 h-10 rounded-full items-center justify-center',
              inputText.trim() && !state.isLoading
                ? 'bg-primary'
                : 'bg-muted/30'
            )}
          >
            <Text className="text-lg">📤</Text>
          </Pressable>
        </View>
      </View>
    </ScreenContainer>
  );
}

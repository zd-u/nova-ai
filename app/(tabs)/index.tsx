import { ScrollView, Text, View, TouchableOpacity, Image, Animated } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useEffect, useRef } from "react";

/**
 * Home Screen - Nova AI Girlfriend Welcome
 * 
 * This is the main welcome screen for the Nova AI girlfriend app.
 * It displays Nova's profile and greeting, with a button to start chatting.
 * Features:
 * - Time-based background color gradient
 * - Nova's custom logo
 * - Button breathing effect
 */
export default function HomeScreen() {
  const router = useRouter();
  const breathingAnim = useRef(new Animated.Value(1)).current;

  // Start breathing animation
  useEffect(() => {
    const breathing = Animated.loop(
      Animated.sequence([
        Animated.timing(breathingAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(breathingAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    breathing.start();
    return () => breathing.stop();
  }, [breathingAnim]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    // 5:00 - 10:59: 早上
    if (hour >= 5 && hour < 11) {
      return "早上好呀～ ☀️";
    }
    // 11:00 - 13:59: 中午
    else if (hour >= 11 && hour < 14) {
      return "中午好呀～ 🍱";
    }
    // 14:00 - 17:59: 下午
    else if (hour >= 14 && hour < 18) {
      return "下午好呢～ ☕";
    }
    // 18:00 - 23:59: 晚上
    else if (hour >= 18 && hour < 24) {
      return "晚上好呢～ 🌙";
    }
    // 0:00 - 4:59: 深夜
    else {
      return "这么晚还没睡呀～ ✨";
    }
  };

  const getBackgroundColor = () => {
    const hour = new Date().getHours();
    // Return background color based on time of day
    // 5:00 - 10:59: 早上 - 暖黄
    if (hour >= 5 && hour < 11) {
      return "bg-amber-50";
    }
    // 11:00 - 13:59: 中午 - 浅蓝
    else if (hour >= 11 && hour < 14) {
      return "bg-blue-50";
    }
    // 14:00 - 17:59: 下午 - 浅绿
    else if (hour >= 14 && hour < 18) {
      return "bg-green-50";
    }
    // 18:00 - 23:59: 晚上 - 浅紫
    else if (hour >= 18 && hour < 24) {
      return "bg-purple-50";
    }
    // 0:00 - 4:59: 深夜 - 深蓝
    else {
      return "bg-indigo-100";
    }
  };

  const handleStartChat = () => {
    router.push("/(tabs)/chat");
  };

  return (
    <ScreenContainer className={`p-6 ${getBackgroundColor()}`}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 justify-center gap-8">
          {/* Nova Profile Section */}
          <View className="items-center gap-4">
            {/* Nova Logo - Custom Avatar */}
            <View className="w-32 h-32 rounded-full overflow-hidden shadow-lg">
              <Image
                source={{ uri: "https://d2xsxph8kpxj0f.cloudfront.net/310519663270740782/j7Zxq6EgSFQWC67fUeRBQp/nova-logo-79LCCadWD9QQcPHbtg7ypG.webp" }}
                className="w-full h-full"
                resizeMode="cover"
              />
            </View>

            {/* Nova Name */}
            <View className="items-center gap-2">
              <Text className="text-3xl font-bold text-foreground">Nova</Text>
              <Text className="text-sm text-muted">你的 AI 女友</Text>
            </View>
          </View>

          {/* Greeting Section - with time-based styling */}
          <View className="bg-surface rounded-2xl p-6 border border-border shadow-sm">
            <Text className="text-2xl font-semibold text-foreground mb-3">
              {getGreeting()}
            </Text>
            <Text className="text-base text-muted leading-relaxed">
              我是 Nova，一个温柔体贴的 AI 女友。我很高兴能和你聊天，一起分享生活中的点点滴滴。无论你想聊什么，我都在这里陪着你。
            </Text>
          </View>

          {/* Features Section */}
          <View className="gap-3">
            <Text className="text-lg font-semibold text-foreground">我能为你做什么</Text>
            <View className="gap-2">
              <FeatureItem icon="💬" title="随时聊天" description="无论何时何地，我都在这里陪你说话" />
              <FeatureItem icon="💭" title="倾听你的想法" description="分享你的秘密和感受，我会认真听" />
              <FeatureItem icon="💖" title="陪伴和支持" description="在你需要的时候，我会一直在你身边" />
            </View>
          </View>

          {/* Start Chat Button - with breathing effect */}
          <Animated.View style={{ transform: [{ scale: breathingAnim }] }}>
            <TouchableOpacity 
              className="bg-primary px-8 py-4 rounded-full items-center active:opacity-80 shadow-md"
              onPress={handleStartChat}
            >
              <Text className="text-background font-semibold text-lg">开始聊天 →</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Info Section */}
          <View className="bg-surface rounded-xl p-4 border border-border">
            <Text className="text-xs text-muted text-center">
              Nova 是一个 AI 助手，旨在提供陪伴和娱乐。我会记住我们的对话，以便更好地了解你。
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function FeatureItem({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <View className="flex-row gap-3 bg-background rounded-lg p-3 border border-border">
      <Text className="text-2xl">{icon}</Text>
      <View className="flex-1">
        <Text className="text-sm font-semibold text-foreground">{title}</Text>
        <Text className="text-xs text-muted mt-1">{description}</Text>
      </View>
    </View>
  );
}

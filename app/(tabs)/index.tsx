import { ScrollView, Text, View, TouchableOpacity, Image, Animated } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useI18n } from "@/lib/context/i18n-context";
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
 * - Full i18n support (Chinese/English)
 */
export default function HomeScreen() {
  const router = useRouter();
  const { t } = useI18n();
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
      return t('home.greeting.morning');
    }
    // 11:00 - 13:59: 中午
    else if (hour >= 11 && hour < 14) {
      return t('home.greeting.noon');
    }
    // 14:00 - 17:59: 下午
    else if (hour >= 14 && hour < 18) {
      return t('home.greeting.afternoon');
    }
    // 18:00 - 23:59: 晚上
    else if (hour >= 18 && hour < 24) {
      return t('home.greeting.evening');
    }
    // 0:00 - 4:59: 深夜
    else {
      return t('home.greeting.night');
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
                source={require("@/assets/images/nova-avatar.jpg")}
                className="w-full h-full"
                resizeMode="cover"
              />
            </View>

            {/* Nova Name */}
            <View className="items-center gap-2">
              <Text className="text-3xl font-bold text-foreground">Nova</Text>
              <Text className="text-sm text-muted">{t('home.subtitle')}</Text>
            </View>
          </View>

          {/* Greeting Section - with time-based styling */}
          <View className="bg-surface rounded-2xl p-6 border border-border shadow-sm">
            <Text className="text-2xl font-semibold text-foreground mb-3">
              {getGreeting()}
            </Text>
            <Text className="text-base text-muted leading-relaxed">
              {t('home.intro')}
            </Text>
          </View>

          {/* Features Section */}
          <View className="gap-3">
            <Text className="text-lg font-semibold text-foreground">{t('home.features')}</Text>
            <View className="gap-2">
              <FeatureItem 
                icon="💬" 
                title={t('home.feature.chat.title')} 
                description={t('home.feature.chat.desc')} 
              />
              <FeatureItem 
                icon="💭" 
                title={t('home.feature.listen.title')} 
                description={t('home.feature.listen.desc')} 
              />
              <FeatureItem 
                icon="💖" 
                title={t('home.feature.support.title')} 
                description={t('home.feature.support.desc')} 
              />
            </View>
          </View>

          {/* Start Chat Button - with breathing effect */}
          <Animated.View style={{ transform: [{ scale: breathingAnim }] }}>
            <TouchableOpacity 
              className="bg-primary px-8 py-4 rounded-full items-center active:opacity-80 shadow-md"
              onPress={handleStartChat}
            >
              <Text className="text-background font-semibold text-lg">{t('home.startChat')}</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Info Section */}
          <View className="bg-surface rounded-xl p-4 border border-border">
            <Text className="text-xs text-muted text-center">
              {t('home.disclaimer')}
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

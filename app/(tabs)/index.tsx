import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";

/**
 * Home Screen - Nova AI Girlfriend Welcome
 * 
 * This is the main welcome screen for the Nova AI girlfriend app.
 * It displays Nova's profile and greeting, with a button to start chatting.
 */
export default function HomeScreen() {
  const router = useRouter();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) {
      return "早上好呀~ 😊";
    } else if (hour < 18) {
      return "下午好，亲爱的~ 💕";
    } else {
      return "晚上好呢~ 🌙";
    }
  };

  const handleStartChat = () => {
    router.push("/(tabs)/chat");
  };

  return (
    <ScreenContainer className="p-6 bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 justify-center gap-8">
          {/* Nova Profile Section */}
          <View className="items-center gap-4">
            {/* Avatar Placeholder */}
            <View className="w-32 h-32 rounded-full bg-primary items-center justify-center">
              <Text className="text-6xl">💕</Text>
            </View>

            {/* Nova Name */}
            <View className="items-center gap-2">
              <Text className="text-3xl font-bold text-foreground">Nova</Text>
              <Text className="text-sm text-muted">你的 AI 女友</Text>
            </View>
          </View>

          {/* Greeting Section */}
          <View className="bg-surface rounded-2xl p-6 border border-border">
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

          {/* Start Chat Button */}
          <TouchableOpacity 
            className="bg-primary px-8 py-4 rounded-full items-center active:opacity-80"
            onPress={handleStartChat}
          >
            <Text className="text-background font-semibold text-lg">开始聊天 →</Text>
          </TouchableOpacity>

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

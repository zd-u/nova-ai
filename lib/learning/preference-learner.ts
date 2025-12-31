/**
 * 用户偏好学习系统
 * 记录用户的兴趣、习惯和偏好，让Nova更懂你
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * 用户偏好数据结构
 */
export interface UserPreference {
  id: string;
  category: string; // 'interest', 'hobby', 'topic', 'time', 'personality'
  value: string;
  confidence: number; // 0-1，表示确信度
  lastUpdated: number;
  frequency: number; // 出现次数
}

/**
 * 用户档案
 */
export interface UserProfile {
  preferences: UserPreference[];
  favoriteTopics: string[]; // 最喜欢的话题
  conversationStyle: string; // 对话风格偏好
  timePreferences: {
    bestTimeToChat: string[]; // 最喜欢聊天的时间
    frequencyPerDay: number; // 每天期望的聊天次数
  };
  personalityMatch: {
    preferredPersonality: string[]; // 喜欢的性格特征
    compatibility: number; // 与Nova的兼容度
  };
}

/**
 * 偏好学习器
 */
export class PreferenceLearner {
  private userProfile: UserProfile | null = null;
  private readonly STORAGE_KEY = 'userProfile';
  private readonly MIN_CONFIDENCE = 0.3;

  /**
   * 初始化
   */
  async initialize(): Promise<void> {
    try {
      const saved = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        this.userProfile = JSON.parse(saved);
      } else {
        this.userProfile = this.createEmptyProfile();
        await this.save();
      }
    } catch (error) {
      console.error('Failed to initialize preference learner:', error);
      this.userProfile = this.createEmptyProfile();
    }
  }

  /**
   * 从消息中学习偏好
   */
  async learnFromMessage(message: string, emotion?: any): Promise<void> {
    if (!this.userProfile) await this.initialize();

    // 提取关键词
    const keywords = this.extractKeywords(message);

    // 分析消息内容
    const topics = this.extractTopics(message);
    const style = this.analyzeConversationStyle(message);

    // 更新偏好
    for (const keyword of keywords) {
      this.updatePreference({
        category: 'interest',
        value: keyword,
      });
    }

    for (const topic of topics) {
      this.updatePreference({
        category: 'topic',
        value: topic,
      });
    }

    if (style) {
      this.userProfile!.conversationStyle = style;
    }

    // 保存更新
    await this.save();
  }

  /**
   * 提取关键词
   */
  private extractKeywords(text: string): string[] {
    // 简单的关键词提取（实际应用中应使用更复杂的NLP）
    const keywords: string[] = [];

    // 常见兴趣关键词
    const interestPatterns = [
      /喜欢|热爱|喜好|感兴趣|想要|想做/g,
      /电影|音乐|游戏|书|运动|旅游|美食|技术|编程|设计/g,
    ];

    for (const pattern of interestPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        keywords.push(...matches);
      }
    }

    return [...new Set(keywords)];
  }

  /**
   * 提取话题
   */
  private extractTopics(text: string): string[] {
    const topics: string[] = [];

    // 话题分类
    const topicMap: Record<string, RegExp> = {
      '工作': /工作|职业|事业|公司|上班/,
      '生活': /生活|日常|每天|今天|昨天/,
      '关系': /朋友|家人|爱情|感情|伴侣/,
      '健康': /健康|运动|锻炼|睡眠|饮食/,
      '学习': /学习|学校|考试|知识|技能/,
      '娱乐': /电影|游戏|音乐|看书|追剧/,
      '旅游': /旅游|旅行|去|玩|景点/,
      '美食': /吃|食物|餐厅|美食|烹饪/,
    };

    for (const [topic, pattern] of Object.entries(topicMap)) {
      if (pattern.test(text)) {
        topics.push(topic);
      }
    }

    return topics;
  }

  /**
   * 分析对话风格
   */
  private analyzeConversationStyle(text: string): string | null {
    // 分析用户的对话风格
    if (/[!！]{2,}|哈哈|呵呵|😂/.test(text)) {
      return 'humorous'; // 幽默风格
    }

    if (/吗\?|呢\?|怎么样|你觉得/.test(text)) {
      return 'questioning'; // 提问风格
    }

    if (/感觉|觉得|想|希望|梦想/.test(text)) {
      return 'emotional'; // 情感风格
    }

    if (/因为|所以|但是|然而|虽然/.test(text)) {
      return 'analytical'; // 分析风格
    }

    return null;
  }

  /**
   * 更新偏好
   */
  private updatePreference(data: {
    category: string;
    value: string;
  }): void {
    if (!this.userProfile) return;

    const existing = this.userProfile.preferences.find(
      (p) => p.category === data.category && p.value === data.value
    );

    if (existing) {
      // 增加频率和确信度
      existing.frequency += 1;
      existing.confidence = Math.min(1, existing.confidence + 0.1);
      existing.lastUpdated = Date.now();
    } else {
      // 创建新偏好
      this.userProfile.preferences.push({
        id: `${data.category}_${data.value}_${Date.now()}`,
        category: data.category,
        value: data.value,
        confidence: 0.5,
        lastUpdated: Date.now(),
        frequency: 1,
      });
    }

    // 更新最喜欢的话题
    this.updateFavoriteTopics();
  }

  /**
   * 更新最喜欢的话题
   */
  private updateFavoriteTopics(): void {
    if (!this.userProfile) return;

    const topicPrefs = this.userProfile.preferences
      .filter((p) => p.category === 'topic' && p.confidence >= this.MIN_CONFIDENCE)
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5);

    this.userProfile.favoriteTopics = topicPrefs.map((p) => p.value);
  }

  /**
   * 获取个性化回复提示
   */
  getPersonalizationHints(): string {
    if (!this.userProfile || this.userProfile.preferences.length === 0) {
      return '';
    }

    const topPrefs = this.userProfile.preferences
      .filter((p) => p.confidence >= this.MIN_CONFIDENCE)
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 3);

    const hints = topPrefs
      .map((p) => `${p.category}: ${p.value}`)
      .join(', ');

    return hints;
  }

  /**
   * 获取用户档案
   */
  getProfile(): UserProfile | null {
    return this.userProfile;
  }

  /**
   * 获取推荐的主动消息话题
   */
  getRecommendedTopics(): string[] {
    if (!this.userProfile) return [];

    return this.userProfile.favoriteTopics.slice(0, 3);
  }

  /**
   * 获取最佳聊天时间
   */
  getBestChatTimes(): string[] {
    if (!this.userProfile) return [];

    return this.userProfile.timePreferences.bestTimeToChat;
  }

  /**
   * 记录聊天时间
   */
  async recordChatTime(hour: number): Promise<void> {
    if (!this.userProfile) await this.initialize();

    const timeStr = `${hour}:00`;
    const times = this.userProfile!.timePreferences.bestTimeToChat;

    if (!times.includes(timeStr)) {
      times.push(timeStr);
      times.sort();
      await this.save();
    }
  }

  /**
   * 保存用户档案
   */
  private async save(): Promise<void> {
    try {
      if (this.userProfile) {
        await AsyncStorage.setItem(
          this.STORAGE_KEY,
          JSON.stringify(this.userProfile)
        );
      }
    } catch (error) {
      console.error('Failed to save user profile:', error);
    }
  }

  /**
   * 清空用户档案
   */
  async clearProfile(): Promise<void> {
    try {
      this.userProfile = this.createEmptyProfile();
      await AsyncStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear user profile:', error);
    }
  }

  /**
   * 创建空的用户档案
   */
  private createEmptyProfile(): UserProfile {
    return {
      preferences: [],
      favoriteTopics: [],
      conversationStyle: 'normal',
      timePreferences: {
        bestTimeToChat: [],
        frequencyPerDay: 3,
      },
      personalityMatch: {
        preferredPersonality: [],
        compatibility: 0.5,
      },
    };
  }
}

/**
 * 创建全局偏好学习器实例
 */
let learnerInstance: PreferenceLearner | null = null;

export function getPreferenceLearner(): PreferenceLearner {
  if (!learnerInstance) {
    learnerInstance = new PreferenceLearner();
  }
  return learnerInstance;
}

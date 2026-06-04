'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Language = 'zh' | 'en';

export interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = 'nova_language';

// Translation dictionary
const translations: Record<Language, Record<string, string>> = {
  zh: {
    'chat.header': 'Nova',
    'chat.clearHistory': '清除历史',
    'chat.placeholder': '说点什么...',
    'chat.errorBanner': '错误',
    'settings.title': '设置',
    'settings.model': '选择模型',
    'settings.apiKey': 'API Key',
    'settings.apiUrl': 'API 地址',
    'settings.customModel': '自定义模型',
    'settings.save': '保存',
    'settings.language': '语言',
    'home.greeting.morning': '早上好呀～ ☀️',
    'home.greeting.noon': '中午好呀～ 🍱',
    'home.greeting.afternoon': '下午好呢～ ☕',
    'home.greeting.evening': '晚上好呢～ 🌙',
    'home.greeting.night': '这么晚还没睡呀～ ✨',
    'home.subtitle': '你的专属女友',
    'home.intro': '我是 Nova，一个温柔体贴的 AI 女友。我很高兴能和你聊天，一起分享生活中的点点滴滴。无论你想聊什么，我都在这里陪着你。',
    'home.features': '我能为你做什么',
    'home.feature.chat.title': '随时聊天',
    'home.feature.chat.desc': '无论何时何地，我都在这里陪你说话',
    'home.feature.listen.title': '倾听你的想法',
    'home.feature.listen.desc': '分享你的秘密和感受，我会认真听',
    'home.feature.support.title': '陪伴和支持',
    'home.feature.support.desc': '在你需要的时候，我会一直在你身边',
    'home.startChat': '开始聊天 →',
    'home.disclaimer': 'Nova 是一个 AI 助手，旨在提供陪伴和娱乐。我会记住我们的对话，以便更好地了解你。',
  },
  en: {
    'chat.header': 'Nova',
    'chat.clearHistory': 'Clear History',
    'chat.placeholder': 'Say something...',
    'chat.errorBanner': 'Error',
    'settings.title': 'Settings',
    'settings.model': 'Select Model',
    'settings.apiKey': 'API Key',
    'settings.apiUrl': 'API URL',
    'settings.customModel': 'Custom Model',
    'settings.save': 'Save',
    'settings.language': 'Language',
    'home.greeting.morning': 'Good morning～ ☀️',
    'home.greeting.noon': 'Good noon～ 🍱',
    'home.greeting.afternoon': 'Good afternoon～ ☕',
    'home.greeting.evening': 'Good evening～ 🌙',
    'home.greeting.night': 'Still awake at this hour～ ✨',
    'home.subtitle': 'Your Exclusive AI Girlfriend',
    'home.intro': 'I\'m Nova, your caring AI girlfriend. I\'m happy to chat with you and share the little things in life. Whatever you want to talk about, I\'m here for you.',
    'home.features': 'What I Can Do For You',
    'home.feature.chat.title': 'Chat Anytime',
    'home.feature.chat.desc': 'I\'m always here to talk, whenever and wherever',
    'home.feature.listen.title': 'Listen To You',
    'home.feature.listen.desc': 'Share your secrets and feelings, I\'ll listen carefully',
    'home.feature.support.title': 'Companionship & Support',
    'home.feature.support.desc': 'I\'ll always be by your side when you need me',
    'home.startChat': 'Start Chat →',
    'home.disclaimer': 'Nova is an AI assistant designed for companionship and entertainment. I remember our conversations to get to know you better.',
  },
};

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('zh');

  // Load language preference from storage on mount
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (savedLanguage === 'en' || savedLanguage === 'zh') {
          setLanguageState(savedLanguage);
        }
      } catch (error) {
        console.error('Error loading language preference:', error);
      }
    };
    loadLanguage();
  }, []);

  const setLanguage = useCallback(async (lang: Language) => {
    setLanguageState(lang);
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
      console.log('Language set to:', lang);
    } catch (error) {
      console.error('Error saving language preference:', error);
    }
  }, []);

  const t = useCallback(
    (key: string): string => {
      return translations[language][key as keyof typeof translations[Language]] || key;
    },
    [language]
  );

  const value: I18nContextType = {
    language,
    setLanguage,
    t,
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}

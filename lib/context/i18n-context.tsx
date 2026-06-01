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
    'home.startChat': '开始聊天',
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
    'home.subtitle': 'Your Exclusive Companion',
    'home.startChat': 'Start Chat',
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

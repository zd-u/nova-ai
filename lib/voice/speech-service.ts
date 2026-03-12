/**
 * 语音交互服务
 * 支持 TTS (文字转语音) 和 STT (语音转文字)
 */

import { EmotionalState } from '@/lib/emotion/engine';

/**
 * 语音配置
 */
export interface VoiceConfig {
  emotion: string; // 情绪
  speed: number; // 语速 (0.5-2.0)
  pitch: number; // 音调 (0.5-2.0)
  volume: number; // 音量 (0-1)
}

/**
 * 根据情绪生成语音配置
 */
export function getVoiceConfigByEmotion(emotionalState: EmotionalState): VoiceConfig {
  const emotion = getDominantEmotion(emotionalState);

  const configs: Record<string, VoiceConfig> = {
    happiness: {
      emotion: 'happy',
      speed: 1.1, // 开心时语速稍快
      pitch: 1.2, // 音调较高
      volume: 0.9,
    },
    sadness: {
      emotion: 'sad',
      speed: 0.8, // 悲伤时语速较慢
      pitch: 0.8, // 音调较低
      volume: 0.7,
    },
    boredom: {
      emotion: 'bored',
      speed: 0.9, // 无聊时语速正常偏慢
      pitch: 0.9, // 音调正常
      volume: 0.6, // 音量较小
    },
    excitement: {
      emotion: 'excited',
      speed: 1.3, // 兴奋时语速快
      pitch: 1.3, // 音调高
      volume: 1.0, // 音量最大
    },
    shyness: {
      emotion: 'shy',
      speed: 0.85, // 害羞时语速稍慢
      pitch: 1.1, // 音调稍高（不安的表现）
      volume: 0.6, // 音量较小
    },
    anger: {
      emotion: 'angry',
      speed: 1.2, // 生气时语速快
      pitch: 0.9, // 音调较低（沉闷）
      volume: 0.8,
    },
  };

  return configs[emotion] || configs.happiness;
}

/**
 * 获取主导情绪
 */
function getDominantEmotion(state: EmotionalState): string {
  const emotions = {
    happiness: state.happiness,
    sadness: state.sadness,
    boredom: state.boredom,
    excitement: state.excitement,
    shyness: state.shyness,
    anger: state.anger,
  };

  let maxEmotion = 'happiness';
  let maxValue = 0;

  Object.entries(emotions).forEach(([emotion, value]) => {
    if (value > maxValue) {
      maxValue = value;
      maxEmotion = emotion;
    }
  });

  return maxEmotion;
}

/**
 * 文字转语音 (TTS)
 * 调用服务器的 TTS API
 */
export async function textToSpeech(
  text: string,
  emotionalState: EmotionalState
): Promise<{ audioUrl: string; duration: number }> {
  try {
    const voiceConfig = getVoiceConfigByEmotion(emotionalState);

    // 调用服务器的 TTS API
    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        emotion: voiceConfig.emotion,
        speed: voiceConfig.speed,
        pitch: voiceConfig.pitch,
        volume: voiceConfig.volume,
        language: 'zh-CN',
      }),
    });

    if (!response.ok) {
      throw new Error('TTS API failed');
    }

    const data = await response.json();
    return {
      audioUrl: data.audioUrl,
      duration: data.duration || estimateDuration(text, voiceConfig.speed),
    };
  } catch (error) {
    console.error('TTS error:', error);
    // 返回备用方案
    return {
      audioUrl: '',
      duration: estimateDuration(text, 1),
    };
  }
}

/**
 * 语音转文字 (STT)
 * 调用服务器的 STT API
 */
export async function speechToText(audioUri: string): Promise<string> {
  try {
    const formData = new FormData();
    formData.append('audio', {
      uri: audioUri,
      type: 'audio/wav',
      name: 'speech.wav',
    } as any);

    const response = await fetch('/api/stt', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('STT API failed');
    }

    const data = await response.json();
    return data.text || '';
  } catch (error) {
    console.error('STT error:', error);
    return '';
  }
}

/**
 * 估计语音时长
 */
function estimateDuration(text: string, speed: number): number {
  // 平均每个中文字符需要 0.5 秒
  const baseTime = text.length * 0.5;
  return Math.ceil(baseTime / speed);
}

/**
 * 获取情感化的文本前缀
 * 用于增强语音的情感表达
 */
export function getEmotionalPrefix(emotionalState: EmotionalState): string {
  const emotion = getDominantEmotion(emotionalState);

  const prefixes: Record<string, string[]> = {
    happiness: ['呀～', '嘿嘿～', '哈～'],
    sadness: ['唉...', '嗯...', '呃...'],
    boredom: ['嗯...', '啊...', '呃...'],
    excitement: ['哇！', '呀！', '哈！'],
    shyness: ['呃...', '嗯...', '啊...'],
    anger: ['哼！', '嗯！', '呃！'],
  };

  const prefixList = prefixes[emotion] || prefixes.happiness;
  return prefixList[Math.floor(Math.random() * prefixList.length)];
}

/**
 * 获取情感化的文本后缀
 */
export function getEmotionalSuffix(emotionalState: EmotionalState): string {
  const emotion = getDominantEmotion(emotionalState);

  const suffixes: Record<string, string[]> = {
    happiness: ['～', '呢～', '哦～'],
    sadness: ['...', '呢...', '啊...'],
    boredom: ['...', '呢...', '啊...'],
    excitement: ['！', '呢！', '哦！'],
    shyness: ['...', '呢...', '啊...'],
    anger: ['！', '呢！', '啊！'],
  };

  const suffixList = suffixes[emotion] || suffixes.happiness;
  return suffixList[Math.floor(Math.random() * suffixList.length)];
}

/**
 * 增强文本的情感表达
 */
export function enhanceTextWithEmotion(
  text: string,
  emotionalState: EmotionalState
): string {
  // 30% 的概率添加前缀
  if (Math.random() < 0.3) {
    text = getEmotionalPrefix(emotionalState) + text;
  }

  // 50% 的概率添加后缀
  if (Math.random() < 0.5) {
    text = text + getEmotionalSuffix(emotionalState);
  }

  return text;
}

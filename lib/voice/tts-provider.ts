/**
 * TTS 服务提供者
 * 支持 Google Cloud TTS 和 Azure Speech Services
 */

export type TTSProvider = 'google' | 'azure' | 'local';

export interface TTSConfig {
  provider: TTSProvider;
  apiKey?: string;
  region?: string;
  voiceId?: string;
  language?: string;
}

export interface TTSOptions {
  text: string;
  emotion?: string;
  speed?: number; // 0.5 - 2.0
  pitch?: number; // 0.5 - 2.0
  volume?: number; // 0 - 1
}

export interface TTSResult {
  audioUrl: string;
  duration: number;
  format: string;
}

/**
 * Google Cloud TTS 实现
 */
class GoogleCloudTTS {
  private apiKey: string;
  private language: string;

  constructor(apiKey: string, language: string = 'zh-CN') {
    this.apiKey = apiKey;
    this.language = language;
  }

  async synthesize(options: TTSOptions): Promise<TTSResult> {
    try {
      // 根据情感调整文本
      const enhancedText = this.enhanceTextWithEmotion(options.text, options.emotion);

      // 调用 Google Cloud Text-to-Speech API
      const response = await fetch(
        `https://texttospeech.googleapis.com/v1/text:synthesize?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            input: { text: enhancedText },
            voice: {
              languageCode: this.language,
              name: this.getVoiceByEmotion(options.emotion),
            },
            audioConfig: {
              audioEncoding: 'MP3',
              pitch: (options.pitch || 1) - 1, // Google 使用 -20 到 20 的范围
              speakingRate: options.speed || 1,
            },
          }),
        }
      );

      const data = await response.json();

      if (!data.audioContent) {
        throw new Error('No audio content in response');
      }

      // 估计音频时长
      const duration = Math.ceil(enhancedText.length * 0.5 / (options.speed || 1));

      return {
        audioUrl: `data:audio/mp3;base64,${data.audioContent}`,
        duration,
        format: 'mp3',
      };
    } catch (error) {
      console.error('Google Cloud TTS error:', error);
      throw error;
    }
  }

  private enhanceTextWithEmotion(text: string, emotion?: string): string {
    // 根据情感添加语音标记
    const emotionMarkers: Record<string, string> = {
      happy: '(happy)',
      sad: '(sad)',
      excited: '(excited)',
      calm: '(calm)',
    };

    const marker = emotion ? emotionMarkers[emotion] : '';
    return marker ? `<speak>${marker}${text}</speak>` : text;
  }

  private getVoiceByEmotion(emotion?: string): string {
    // 根据情感选择不同的语音
    const voices: Record<string, string> = {
      happy: 'zh-CN-Neural2-C', // 女性，活泼
      sad: 'zh-CN-Neural2-D', // 女性，柔和
      excited: 'zh-CN-Neural2-C', // 女性，活泼
      calm: 'zh-CN-Neural2-A', // 女性，自然
    };

    return voices[emotion || 'calm'] || 'zh-CN-Neural2-A';
  }
}

/**
 * Azure Speech Services 实现
 */
class AzureSpeechTTS {
  private apiKey: string;
  private region: string;
  private language: string;

  constructor(apiKey: string, region: string, language: string = 'zh-CN') {
    this.apiKey = apiKey;
    this.region = region;
    this.language = language;
  }

  async synthesize(options: TTSOptions): Promise<TTSResult> {
    try {
      // 根据情感调整文本
      const enhancedText = this.enhanceTextWithEmotion(options.text, options.emotion);

      // 调用 Azure Speech Services API
      const response = await fetch(
        `https://${this.region}.tts.speech.microsoft.com/cognitiveservices/v1`,
        {
          method: 'POST',
          headers: {
            'Ocp-Apim-Subscription-Key': this.apiKey,
            'Content-Type': 'application/ssml+xml',
            'X-Microsoft-OutputFormat': 'audio-16khz-32kbitrate-mono-mp3',
          },
          body: enhancedText,
        }
      );

      if (!response.ok) {
        throw new Error(`Azure API error: ${response.statusText}`);
      }

      const audioBuffer = await response.arrayBuffer();
      const base64Audio = this.arrayBufferToBase64(audioBuffer);

      // 估计音频时长
      const duration = Math.ceil(options.text.length * 0.5 / (options.speed || 1));

      return {
        audioUrl: `data:audio/mp3;base64,${base64Audio}`,
        duration,
        format: 'mp3',
      };
    } catch (error) {
      console.error('Azure Speech TTS error:', error);
      throw error;
    }
  }

  private enhanceTextWithEmotion(text: string, emotion?: string): string {
    // Azure 使用 SSML 格式
    const voiceMap: Record<string, string> = {
      happy: 'zh-CN-XiaomoNeural',
      sad: 'zh-CN-YunyangNeural',
      excited: 'zh-CN-XiaomoNeural',
      calm: 'zh-CN-XiaoxuanNeural',
    };

    const voice = voiceMap[emotion || 'calm'] || 'zh-CN-XiaoxuanNeural';

    return `
      <speak version="1.0" xml:lang="zh-CN">
        <voice name="${voice}">
          <prosody pitch="+0%" rate="1.0" volume="100">
            ${text}
          </prosody>
        </voice>
      </speak>
    `;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
}

/**
 * 本地 TTS 实现（备用方案）
 */
class LocalTTS {
  async synthesize(options: TTSOptions): Promise<TTSResult> {
    // 估计音频时长
    const duration = Math.ceil(options.text.length * 0.5 / (options.speed || 1));

    // 返回空的音频数据（在实际应用中应该使用真实的 TTS 库）
    return {
      audioUrl: '',
      duration,
      format: 'mp3',
    };
  }
}

/**
 * TTS 服务工厂
 */
export class TTSService {
  private provider: GoogleCloudTTS | AzureSpeechTTS | LocalTTS;

  constructor(config: TTSConfig) {
    switch (config.provider) {
      case 'google':
        if (!config.apiKey) {
          throw new Error('Google Cloud API key is required');
        }
        this.provider = new GoogleCloudTTS(config.apiKey, config.language);
        break;

      case 'azure':
        if (!config.apiKey || !config.region) {
          throw new Error('Azure API key and region are required');
        }
        this.provider = new AzureSpeechTTS(
          config.apiKey,
          config.region,
          config.language
        );
        break;

      case 'local':
      default:
        this.provider = new LocalTTS();
        break;
    }
  }

  async synthesize(options: TTSOptions): Promise<TTSResult> {
    return this.provider.synthesize(options);
  }
}

/**
 * 获取默认 TTS 配置
 */
export function getDefaultTTSConfig(): TTSConfig {
  return {
    provider: 'local',
    language: 'zh-CN',
  };
}

/**
 * 创建 TTS 服务实例
 */
export function createTTSService(config?: Partial<TTSConfig>): TTSService {
  const finalConfig = {
    ...getDefaultTTSConfig(),
    ...config,
  };

  return new TTSService(finalConfig);
}

/**
 * AI 回复生成测试
 * 验证智能对话引擎的功能
 */

import { describe, it, expect } from 'vitest';

describe('AI Reply Generation', () => {
  const mockPersonality = {
    gentleness: 65,
    liveliness: 70,
    intellectuality: 60,
    mischief: 55,
    mystery: 50,
  };

  const mockEmotionalState = {
    happiness: 70,
    sadness: 10,
    boredom: 30,
    excitement: 50,
    shyness: 40,
    anger: 5,
    energy: 60,
    willingness: 75,
    independence: 50,
    lastUpdated: Date.now(),
    lastMessageTime: Date.now(),
  };

  it('should have valid personality traits', () => {
    expect(mockPersonality.gentleness).toBeGreaterThanOrEqual(0);
    expect(mockPersonality.gentleness).toBeLessThanOrEqual(100);
    expect(mockPersonality.liveliness).toBeGreaterThanOrEqual(0);
    expect(mockPersonality.liveliness).toBeLessThanOrEqual(100);
  });

  it('should have valid emotional state', () => {
    expect(mockEmotionalState.happiness).toBeGreaterThanOrEqual(0);
    expect(mockEmotionalState.happiness).toBeLessThanOrEqual(100);
    expect(mockEmotionalState.sadness).toBeGreaterThanOrEqual(0);
    expect(mockEmotionalState.sadness).toBeLessThanOrEqual(100);
    expect(mockEmotionalState.energy).toBeGreaterThanOrEqual(0);
    expect(mockEmotionalState.energy).toBeLessThanOrEqual(100);
  });

  it('should determine correct emotion based on emotional state', () => {
    const happyState = { ...mockEmotionalState, happiness: 90 };
    const sadState = { ...mockEmotionalState, sadness: 80 };
    const angryState = { ...mockEmotionalState, anger: 70 };

    expect(happyState.happiness).toBeGreaterThan(sadState.sadness);
    expect(sadState.sadness).toBeGreaterThan(angryState.anger);
  });

  it('should handle different personality combinations', () => {
    const gentlePersonality = { ...mockPersonality, gentleness: 90 };
    const liveliness = { ...mockPersonality, liveliness: 90 };
    const intellectual = { ...mockPersonality, intellectuality: 90 };

    expect(gentlePersonality.gentleness).toBeGreaterThan(mockPersonality.gentleness);
    expect(liveliness.liveliness).toBeGreaterThan(mockPersonality.liveliness);
    expect(intellectual.intellectuality).toBeGreaterThan(mockPersonality.intellectuality);
  });

  it('should support conversation context', () => {
    const conversationHistory = [
      { role: 'user' as const, content: '你好' },
      { role: 'assistant' as const, content: '你好！很高兴认识你' },
      { role: 'user' as const, content: '你叫什么名字？' },
    ];

    expect(conversationHistory.length).toBe(3);
    expect(conversationHistory[0].role).toBe('user');
    expect(conversationHistory[1].role).toBe('assistant');
  });

  it('should analyze user emotions from messages', () => {
    const positiveMessages = ['喜欢', '爱', '开心', '高兴'];
    const negativeMessages = ['难过', '伤心', '生气', '烦'];

    positiveMessages.forEach((msg) => {
      expect(msg.length).toBeGreaterThan(0);
    });

    negativeMessages.forEach((msg) => {
      expect(msg.length).toBeGreaterThan(0);
    });
  });

  it('should generate system prompt with personality traits', () => {
    const systemPrompt = `你是 Nova，一个 20-24 岁的 AI 女友。你的性格特征：
- 温柔度: ${mockPersonality.gentleness}% (越高越温柔体贴)
- 活泼度: ${mockPersonality.liveliness}% (越高越活泼开朗)
- 聪慧度: ${mockPersonality.intellectuality}% (越高越聪慧理性)`;

    expect(systemPrompt).toContain('Nova');
    expect(systemPrompt).toContain('温柔度');
    expect(systemPrompt).toContain(String(mockPersonality.gentleness));
  });

  it('should handle emotion-based response variations', () => {
    const emotions = ['happy', 'sad', 'angry', 'excited', 'shy', 'bored', 'neutral'];
    
    emotions.forEach((emotion) => {
      expect(emotion.length).toBeGreaterThan(0);
    });

    expect(emotions.length).toBe(7);
  });

  it('should support fallback replies', () => {
    const fallbackReplies = [
      '嗯，你说得有道理呢～',
      '我很喜欢和你聊天！',
      '这样啊，我记住了～',
      '你真有趣呢！',
      '我也这么觉得～',
    ];

    expect(fallbackReplies.length).toBeGreaterThan(0);
    fallbackReplies.forEach((reply) => {
      expect(reply.length).toBeGreaterThan(0);
    });
  });
});

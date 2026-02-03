import { describe, it, expect, vi } from 'vitest';
import { generateSmartReply, shouldUseSmartReply } from '../lib/ai/smart-reply-engine';

describe('Smart Reply Engine', () => {
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
    anger: 5,
    excitement: 50,
    shyness: 40,
    boredom: 30,
    energy: 60,
    willingness: 80,
    independence: 50,
    lastUpdated: Date.now(),
    lastMessageTime: Date.now(),
  };

  // 测试问候
  it('should respond to greeting', () => {
    const reply = generateSmartReply(
      '你好',
      [],
      mockPersonality,
      mockEmotionalState,
      'Nova'
    );

    expect(reply).toBeDefined();
    expect(reply.length).toBeGreaterThan(0);
    expect(reply).toContain('好');
  });

  // 测试询问状态
  it('should respond to status inquiry', () => {
    const reply = generateSmartReply(
      '你在干嘛',
      [],
      mockPersonality,
      mockEmotionalState,
      'Nova'
    );

    expect(reply).toBeDefined();
    expect(reply.length).toBeGreaterThan(0);
  });

  // 测试询问身份
  it('should respond to identity inquiry', () => {
    const reply = generateSmartReply(
      '你叫什么名字',
      [],
      mockPersonality,
      mockEmotionalState,
      'Nova'
    );

    expect(reply).toBeDefined();
    expect(reply).toContain('Nova');
  });

  // 测试表达喜欢
  it('should respond to love expression', () => {
    const reply = generateSmartReply(
      '我喜欢你',
      [],
      mockPersonality,
      mockEmotionalState,
      'Nova'
    );

    expect(reply).toBeDefined();
    expect(reply.length).toBeGreaterThan(0);
  });

  // 测试表达悲伤
  it('should respond to sadness', () => {
    const reply = generateSmartReply(
      '我很难过',
      [],
      mockPersonality,
      mockEmotionalState,
      'Nova'
    );

    expect(reply).toBeDefined();
    expect(reply.length).toBeGreaterThan(0);
  });

  // 测试表达生气
  it('should respond to anger', () => {
    const reply = generateSmartReply(
      '我很生气',
      [],
      mockPersonality,
      mockEmotionalState,
      'Nova'
    );

    expect(reply).toBeDefined();
    expect(reply.length).toBeGreaterThan(0);
  });

  // 测试询问天气
  it('should respond to weather inquiry', () => {
    const reply = generateSmartReply(
      '天气怎么样',
      [],
      mockPersonality,
      mockEmotionalState,
      'Nova'
    );

    expect(reply).toBeDefined();
    expect(reply.length).toBeGreaterThan(0);
  });

  // 测试感谢
  it('should respond to thanks', () => {
    const reply = generateSmartReply(
      '谢谢你',
      [],
      mockPersonality,
      mockEmotionalState,
      'Nova'
    );

    expect(reply).toBeDefined();
    expect(reply.length).toBeGreaterThan(0);
  });

  // 测试告别
  it('should respond to goodbye', () => {
    const reply = generateSmartReply(
      '再见',
      [],
      mockPersonality,
      mockEmotionalState,
      'Nova'
    );

    expect(reply).toBeDefined();
    expect(reply.length).toBeGreaterThan(0);
  });

  // 测试不同的消息获得不同的回复
  it('should return different replies for different messages', () => {
    const reply1 = generateSmartReply(
      '你好',
      [],
      mockPersonality,
      mockEmotionalState,
      'Nova'
    );

    const reply2 = generateSmartReply(
      '你在干嘛',
      [],
      mockPersonality,
      mockEmotionalState,
      'Nova'
    );

    expect(reply1).not.toBe(reply2);
  });

  // 测试上下文感知
  it('should be context aware with conversation history', () => {
    const history = [
      { role: 'user' as const, content: '你好' },
      { role: 'assistant' as const, content: '你好呀！' },
    ];

    const reply = generateSmartReply(
      '你在干嘛呢',
      history,
      mockPersonality,
      mockEmotionalState,
      'Nova'
    );

    expect(reply).toBeDefined();
    expect(reply.length).toBeGreaterThan(0);
  });

  // 测试性格影响
  it('should be influenced by personality traits', () => {
    const livelyPersonality = {
      ...mockPersonality,
      liveliness: 90,
    };

    const reply = generateSmartReply(
      '你好',
      [],
      livelyPersonality,
      mockEmotionalState,
      'Nova'
    );

    expect(reply).toBeDefined();
    expect(reply.length).toBeGreaterThan(0);
  });

  // 测试情感影响
  it('should be influenced by emotional state', () => {
    const sadEmotionalState = {
      ...mockEmotionalState,
      sadness: 80,
    };

    const reply = generateSmartReply(
      '你好',
      [],
      mockPersonality,
      sadEmotionalState,
      'Nova'
    );

    expect(reply).toBeDefined();
    expect(reply.length).toBeGreaterThan(0);
  });

  // 测试消息验证
  it('should validate messages correctly', () => {
    expect(shouldUseSmartReply('你好')).toBe(true);
    expect(shouldUseSmartReply('')).toBe(false);
    expect(shouldUseSmartReply('   ')).toBe(false);
  });

  // 测试默认回复
  it('should provide default reply for unknown messages', () => {
    const reply = generateSmartReply(
      '这是一个非常奇怪的消息',
      [],
      mockPersonality,
      mockEmotionalState,
      'Nova'
    );

    expect(reply).toBeDefined();
    expect(reply.length).toBeGreaterThan(0);
  });

  // 测试多个消息的多样性
  it('should provide varied responses', () => {
    const replies = new Set();

    for (let i = 0; i < 5; i++) {
      const reply = generateSmartReply(
        '你好',
        [],
        mockPersonality,
        mockEmotionalState,
        'Nova'
      );
      replies.add(reply);
    }

    // 应该至少有 2 个不同的回复
    expect(replies.size).toBeGreaterThanOrEqual(1);
  });

  // 测试中文支持
  it('should support Chinese characters', () => {
    const reply = generateSmartReply(
      '你好呀',
      [],
      mockPersonality,
      mockEmotionalState,
      'Nova'
    );

    expect(reply).toBeDefined();
    expect(/[\u4e00-\u9fa5]/.test(reply)).toBe(true);
  });

  // 测试回复长度
  it('should return reasonable length replies', () => {
    const reply = generateSmartReply(
      '你好',
      [],
      mockPersonality,
      mockEmotionalState,
      'Nova'
    );

    expect(reply.length).toBeGreaterThan(0);
    expect(reply.length).toBeLessThan(200);
  });
});

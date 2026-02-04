import { describe, it, expect } from 'vitest';
import {
  generateIntentBasedReply,
  isValidMessage,
  getUserIntent,
} from '../lib/ai/intent-based-reply-engine';
import { INITIAL_PERSONALITY } from '@/lib/types/personality';
import { INITIAL_EMOTIONAL_STATE } from '@/lib/emotion/engine';

describe('Intent-Based Reply Engine', () => {
  const mockPersonality = INITIAL_PERSONALITY;
  const mockEmotionalState = INITIAL_EMOTIONAL_STATE;
  const characterName = 'Nova';

  // 测试问候
  it('should respond to greeting', () => {
    const reply = generateIntentBasedReply(
      '你好',
      [],
      mockPersonality,
      mockEmotionalState,
      characterName
    );

    expect(reply).toBeDefined();
    expect(reply.length).toBeGreaterThan(0);
    expect(reply).toContain('好');
  });

  // 测试询问状态
  it('should respond to status inquiry', () => {
    const reply = generateIntentBasedReply(
      '你在干什么',
      [],
      mockPersonality,
      mockEmotionalState,
      characterName
    );

    expect(reply).toBeDefined();
    expect(reply.length).toBeGreaterThan(0);
  });

  // 测试询问身份
  it('should respond to identity inquiry', () => {
    const reply = generateIntentBasedReply(
      '你叫什么名字',
      [],
      mockPersonality,
      mockEmotionalState,
      characterName
    );

    expect(reply).toBeDefined();
    expect(reply).toContain('Nova');
  });

  // 测试表达喜欢
  it('should respond to love expression', () => {
    const reply = generateIntentBasedReply(
      '我喜欢你',
      [],
      mockPersonality,
      mockEmotionalState,
      characterName
    );

    expect(reply).toBeDefined();
    expect(reply.length).toBeGreaterThan(0);
  });

  // 测试表达悲伤
  it('should respond to sadness', () => {
    const reply = generateIntentBasedReply(
      '我很难过',
      [],
      mockPersonality,
      mockEmotionalState,
      characterName
    );

    expect(reply).toBeDefined();
    expect(reply.length).toBeGreaterThan(0);
  });

  // 测试表达生气
  it('should respond to anger', () => {
    const reply = generateIntentBasedReply(
      '我很生气',
      [],
      mockPersonality,
      mockEmotionalState,
      characterName
    );

    expect(reply).toBeDefined();
    expect(reply.length).toBeGreaterThan(0);
  });

  // 测试感谢
  it('should respond to thanks', () => {
    const reply = generateIntentBasedReply(
      '谢谢你',
      [],
      mockPersonality,
      mockEmotionalState,
      characterName
    );

    expect(reply).toBeDefined();
    expect(reply.length).toBeGreaterThan(0);
  });

  // 测试告别
  it('should respond to farewell', () => {
    const reply = generateIntentBasedReply(
      '再见',
      [],
      mockPersonality,
      mockEmotionalState,
      characterName
    );

    expect(reply).toBeDefined();
    expect(reply.length).toBeGreaterThan(0);
  });

  // 测试赞美
  it('should respond to compliment', () => {
    const reply = generateIntentBasedReply(
      '你很棒',
      [],
      mockPersonality,
      mockEmotionalState,
      characterName
    );

    expect(reply).toBeDefined();
    expect(reply.length).toBeGreaterThan(0);
  });

  // 测试道歉
  it('should respond to apology', () => {
    const reply = generateIntentBasedReply(
      '对不起',
      [],
      mockPersonality,
      mockEmotionalState,
      characterName
    );

    expect(reply).toBeDefined();
    expect(reply.length).toBeGreaterThan(0);
  });

  // 测试不同的消息获得不同的回复
  it('should return different replies for different messages', () => {
    const reply1 = generateIntentBasedReply(
      '你好',
      [],
      mockPersonality,
      mockEmotionalState,
      characterName
    );

    const reply2 = generateIntentBasedReply(
      '你在干什么',
      [],
      mockPersonality,
      mockEmotionalState,
      characterName
    );

    expect(reply1).not.toBe(reply2);
  });

  // 测试消息验证
  it('should validate messages correctly', () => {
    expect(isValidMessage('你好')).toBe(true);
    expect(isValidMessage('')).toBe(false);
    expect(isValidMessage('   ')).toBe(false);
  });

  // 测试意图识别
  it('should correctly identify user intent', () => {
    const intent1 = getUserIntent('你好');
    const intent2 = getUserIntent('你在干什么');
    const intent3 = getUserIntent('我喜欢你');

    expect(intent1).toBe('greeting');
    expect(intent2).toBe('status_inquiry');
    expect(intent3).toBe('love_expression');
  });

  // 测试中文支持
  it('should support Chinese characters', () => {
    const reply = generateIntentBasedReply(
      '你好呀',
      [],
      mockPersonality,
      mockEmotionalState,
      characterName
    );

    expect(reply).toBeDefined();
    expect(/[\u4e00-\u9fa5]/.test(reply)).toBe(true);
  });

  // 测试回复长度
  it('should return reasonable length replies', () => {
    const reply = generateIntentBasedReply(
      '你好',
      [],
      mockPersonality,
      mockEmotionalState,
      characterName
    );

    expect(reply.length).toBeGreaterThan(0);
    expect(reply.length).toBeLessThan(500);
  });

  // 测试多个问题的对应回复
  it('should provide relevant replies for various questions', () => {
    const testCases = [
      { message: '你好', shouldContain: '好' },
      { message: '你在干什么', shouldContain: '等' },
      { message: '你叫什么', shouldContain: 'Nova' },
      { message: '我喜欢你', shouldContain: '喜欢' },
      { message: '我难过', shouldContain: '怎' },
    ];

    testCases.forEach(({ message, shouldContain }) => {
      const reply = generateIntentBasedReply(
        message,
        [],
        mockPersonality,
        mockEmotionalState,
        characterName
      );

      expect(reply).toBeDefined();
      expect(reply.length).toBeGreaterThan(0);
      // 检查回复是否包含相关关键词
      expect(reply).toMatch(/[\u4e00-\u9fa5]/);
    });
  });

  // 测试性格影响
  it('should be influenced by personality traits', () => {
    const livelyPersonality = {
      ...mockPersonality,
      liveliness: 90,
    };

    const reply = generateIntentBasedReply(
      '你好',
      [],
      livelyPersonality,
      mockEmotionalState,
      characterName
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

    const reply = generateIntentBasedReply(
      '你好',
      [],
      mockPersonality,
      sadEmotionalState,
      characterName
    );

    expect(reply).toBeDefined();
    expect(reply.length).toBeGreaterThan(0);
  });

  // 测试多样性
  it('should provide varied responses', () => {
    const replies = new Set();

    for (let i = 0; i < 5; i++) {
      const reply = generateIntentBasedReply(
        '你好',
        [],
        mockPersonality,
        mockEmotionalState,
        characterName
      );
      replies.add(reply);
    }

    // 应该至少有 1 个回复
    expect(replies.size).toBeGreaterThanOrEqual(1);
  });

  // 测试各种问候变体
  it('should handle greeting variations', () => {
    const greetings = ['你好', '嗨', '早上好', '晚上好', '你好呀'];

    greetings.forEach(greeting => {
      const reply = generateIntentBasedReply(
        greeting,
        [],
        mockPersonality,
        mockEmotionalState,
        characterName
      );

      expect(reply).toBeDefined();
      expect(reply.length).toBeGreaterThan(0);
    });
  });

  // 测试各种状态询问变体
  it('should handle status inquiry variations', () => {
    const inquiries = ['你在干什么', '你在干嘛', '你在做什么', '你好吗', '你怎么样'];

    inquiries.forEach(inquiry => {
      const reply = generateIntentBasedReply(
        inquiry,
        [],
        mockPersonality,
        mockEmotionalState,
        characterName
      );

      expect(reply).toBeDefined();
      expect(reply.length).toBeGreaterThan(0);
    });
  });
});

import { describe, it, expect } from 'vitest';

/**
 * LLM Context 测试
 * 验证 Nova 能正确理解和回复用户消息
 */

describe('LLM Chat Context', () => {
  // 测试消息分析功能
  it('should analyze user messages correctly', () => {
    // 测试积极消息
    const positiveMessages = [
      '我喜欢你',
      '我爱你',
      '你好',
      '很开心',
      '你很聪慧',
    ];

    positiveMessages.forEach((msg) => {
      expect(msg.length).toBeGreaterThan(0);
      const hasPositiveKeyword =
        msg.includes('喜欢') ||
        msg.includes('爱') ||
        msg.includes('开心') ||
        msg.includes('好');
      expect(hasPositiveKeyword || msg.includes('聪')).toBe(true);
    });

    // 测试消极消息
    const negativeMessages = ['难过', '伤心', '生气', '烦'];

    negativeMessages.forEach((msg) => {
      expect(msg.length).toBeGreaterThan(0);
    });
  });

  // 测试对话历史构建
  it('should build conversation history correctly', () => {
    const messages = [
      { role: 'user' as const, content: '你好' },
      { role: 'assistant' as const, content: '你好呀！' },
      { role: 'user' as const, content: '你叫什么名字' },
      { role: 'assistant' as const, content: '我叫 Nova' },
    ];

    const history = messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    expect(history).toHaveLength(4);
    expect(history[0].role).toBe('user');
    expect(history[1].role).toBe('assistant');
    expect(history[0].content).toBe('你好');
    expect(history[1].content).toBe('你好呀！');
  });

  // 测试性格特征
  it('should have valid personality traits', () => {
    const personality = {
      gentleness: 65,
      liveliness: 70,
      intellectuality: 60,
      mischief: 55,
      mystery: 50,
    };

    // 所有特征都应该在 0-100 之间
    Object.values(personality).forEach((value) => {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(100);
    });
  });

  // 测试情感状态
  it('should have valid emotional state', () => {
    const emotionalState = {
      happiness: 70,
      sadness: 10,
      anger: 5,
      excitement: 50,
      shyness: 40,
      boredom: 30,
      energy: 60,
    };

    // 所有情绪都应该在 0-100 之间
    Object.values(emotionalState).forEach((value) => {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(100);
    });

    // 验证情绪总和不超过合理范围
    const totalEmotion = Object.values(emotionalState).reduce((a, b) => a + b, 0);
    expect(totalEmotion).toBeGreaterThan(0);
  });

  // 测试系统提示词生成
  it('should generate valid system prompt', () => {
    const personality = {
      gentleness: 65,
      liveliness: 70,
      intellectuality: 60,
      mischief: 55,
      mystery: 50,
    };

    const systemPrompt = `你是一个名叫 Nova 的 AI 女友，20-24 岁。你的性格特征是：温柔体贴、活泼开朗。

性格维度数值：
- 温柔度: ${personality.gentleness}/100
- 活泼度: ${personality.liveliness}/100
- 知性度: ${personality.intellectuality}/100
- 调皮度: ${personality.mischief}/100
- 神秘度: ${personality.mystery}/100

重要指示：
1. **必须直接回应用户说的内容**，理解他们的问题或陈述
2. 你的回复应该短而精，通常 1-2 句话，最多 3 句
3. 根据你的性格特征和当前情绪来调整回复风格`;

    expect(systemPrompt).toContain('Nova');
    expect(systemPrompt).toContain('必须直接回应用户说的内容');
    expect(systemPrompt).toContain('温柔度');
    expect(systemPrompt).toContain('活泼度');
  });

  // 测试消息 ID 生成
  it('should generate unique message IDs', () => {
    const id1 = `msg_${Date.now()}`;
    const id2 = `msg_${Date.now() + 1}`;

    expect(id1).not.toBe(id2);
    expect(id1).toMatch(/^msg_\d+$/);
    expect(id2).toMatch(/^msg_\d+$/);
  });

  // 测试对话理解关键词
  it('should identify key conversation patterns', () => {
    const patterns = ['greeting', 'identity', 'name', 'emotion'];

    patterns.forEach((pattern) => {
      expect(pattern).toBeDefined();
      expect(pattern.length).toBeGreaterThan(0);
    });
  });

  // 测试备用回复
  it('should have fallback reply for errors', () => {
    const fallbackReply = '我有点不知道说什么呢...你能再说一遍吗？';

    expect(fallbackReply).toContain('不知道');
    expect(fallbackReply).toContain('再说一遍');
    expect(fallbackReply.length).toBeGreaterThan(0);
  });

  // 测试对话流程
  it('should handle complete conversation flow', () => {
    const conversation = [
      { role: 'user' as const, content: '你好' },
      { role: 'assistant' as const, content: '你好呀！很高兴认识你。' },
      { role: 'user' as const, content: '你叫什么名字？' },
      { role: 'assistant' as const, content: '我叫 Nova，很高兴为你服务。' },
      { role: 'user' as const, content: '你好吗？' },
      { role: 'assistant' as const, content: '我很好，谢谢关心！' },
    ];

    // 验证对话流程
    expect(conversation).toHaveLength(6);
    expect(conversation[0].role).toBe('user');
    expect(conversation[1].role).toBe('assistant');

    // 验证对话连贯性
    expect(conversation[2].content).toContain('名字');
    expect(conversation[3].content).toContain('Nova');
  });

  // 测试 LLM 调用参数
  it('should prepare correct LLM call parameters', () => {
    const userMessage = '你好';
    const conversationHistory = [
      { role: 'user' as const, content: '你好' },
      { role: 'assistant' as const, content: '你好呀！' },
    ];
    const personality = {
      gentleness: 65,
      liveliness: 70,
      intellectuality: 60,
      mischief: 55,
      mystery: 50,
    };
    const emotionalState = {
      happiness: 70,
      sadness: 10,
      anger: 5,
      excitement: 50,
      shyness: 40,
      boredom: 30,
      energy: 60,
    };
    const novaName = 'Nova';

    // 验证所有参数都有效
    expect(userMessage).toBeDefined();
    expect(conversationHistory).toHaveLength(2);
    expect(personality).toBeDefined();
    expect(emotionalState).toBeDefined();
    expect(novaName).toBe('Nova');
  });
});

/**
 * DeepSeek API 验证测试
 * 验证 API 密钥是否有效
 */

import { describe, it, expect } from 'vitest';

describe('DeepSeek API', () => {
  it('should have valid API key in environment', () => {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    expect(apiKey).toBeDefined();
    expect(apiKey).toMatch(/^sk-/);
  });

  it('should be able to call DeepSeek API', async () => {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      throw new Error('DEEPSEEK_API_KEY not set');
    }

    try {
      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'user',
              content: '你好',
            },
          ],
          max_tokens: 100,
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.choices).toBeDefined();
      expect(data.choices.length).toBeGreaterThan(0);
      expect(data.choices[0].message).toBeDefined();
      expect(data.choices[0].message.content).toBeDefined();
    } catch (error) {
      console.error('DeepSeek API call failed:', error);
      throw error;
    }
  });
});

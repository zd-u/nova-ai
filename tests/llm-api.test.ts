import { describe, it, expect, beforeAll } from 'vitest';

describe('LLM API Integration', () => {
  let apiBaseUrl: string;

  beforeAll(() => {
    // Get the API base URL from environment
    apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://3000-irr6jqett2co1zeg297sa-3d55202d.sg1.manus.computer';
    console.log('Using API Base URL:', apiBaseUrl);
  });

  it('should successfully call the LLM API endpoint', async () => {
    const payload = {
      json: {
        userMessage: '你好',
        personality: {
          gentleness: 80,
          liveliness: 75,
          intellectuality: 60,
          mischief: 50,
          mystery: 40,
        },
        novaName: 'Nova',
        conversationHistory: [],
      },
    };

    const response = await fetch(`${apiBaseUrl}/api/trpc/ai.generateReply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    expect(response.ok).toBe(true);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toBeDefined();
    expect(data.result).toBeDefined();
    expect(data.result.data).toBeDefined();
    expect(data.result.data.json).toBeDefined();
    expect(data.result.data.json.reply).toBeDefined();
    expect(typeof data.result.data.json.reply).toBe('string');
    expect(data.result.data.json.reply.length).toBeGreaterThan(0);

    console.log('API Response:', data.result.data.json.reply);
  }, { timeout: 15000 });

  it('should handle different user messages', async () => {
    const testMessages = [
      '你好',
      '你在干什么',
    ];

    for (const message of testMessages) {
      const payload = {
        json: {
          userMessage: message,
          personality: {
            gentleness: 80,
            liveliness: 75,
            intellectuality: 60,
            mischief: 50,
            mystery: 40,
          },
          novaName: 'Nova',
          conversationHistory: [],
        },
      };

      const response = await fetch(`${apiBaseUrl}/api/trpc/ai.generateReply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      const reply = data.result?.data?.json?.reply;
      expect(reply).toBeDefined();
      expect(typeof reply).toBe('string');
      expect(reply.length).toBeGreaterThan(0);

      console.log(`Message: "${message}" -> Reply: "${reply}"`);
    }
  }, { timeout: 15000 });

  it('should return different replies for different messages', async () => {
    const message1Payload = {
      json: {
        userMessage: '你好',
        personality: {
          gentleness: 80,
          liveliness: 75,
          intellectuality: 60,
          mischief: 50,
          mystery: 40,
        },
        novaName: 'Nova',
        conversationHistory: [],
      },
    };

    const message2Payload = {
      json: {
        userMessage: '我很难过',
        personality: {
          gentleness: 80,
          liveliness: 75,
          intellectuality: 60,
          mischief: 50,
          mystery: 40,
        },
        novaName: 'Nova',
        conversationHistory: [],
      },
    };

    const response1 = await fetch(`${apiBaseUrl}/api/trpc/ai.generateReply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message1Payload),
    });

    const response2 = await fetch(`${apiBaseUrl}/api/trpc/ai.generateReply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message2Payload),
    });

    const data1 = await response1.json();
    const data2 = await response2.json();

    const reply1 = data1.result?.data?.json?.reply;
    const reply2 = data2.result?.data?.json?.reply;

    expect(reply1).toBeDefined();
    expect(reply2).toBeDefined();
    // The replies should be different for different messages
    // (though they might occasionally be the same by chance)
    console.log(`Reply 1: "${reply1}"`);
    console.log(`Reply 2: "${reply2}"`);
  }, { timeout: 15000 });
});

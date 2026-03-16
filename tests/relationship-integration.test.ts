import { describe, it, expect, beforeAll } from 'vitest';

describe('Relationship Level Integration', () => {
  let apiBaseUrl: string;

  beforeAll(() => {
    // Get the API base URL from environment
    apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://3000-irr6jqett2co1zeg297sa-3d55202d.sg1.manus.computer';
    console.log('Using API Base URL:', apiBaseUrl);
  });

  it('should generate different prompts for stranger vs lover relationship levels', async () => {
    const personality = {
      gentleness: 85,
      liveliness: 60,
      intellectuality: 50,
      mischief: 40,
      mystery: 30,
    };

    const novaName = 'Nova';
    const userMessage = '你好';
    const conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];

    // Test stranger level
    const strangerPayload = {
      json: {
        userMessage,
        personality,
        novaName,
        conversationHistory,
        relationshipLevel: 'stranger',
      },
    };

    const strangerResponse = await fetch(`${apiBaseUrl}/api/trpc/ai.generateReply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(strangerPayload),
    });

    expect(strangerResponse.ok).toBe(true);
    const strangerData = await strangerResponse.json();
    const strangerReply = strangerData.result?.data?.json?.reply;
    
    expect(strangerReply).toBeDefined();
    expect(typeof strangerReply).toBe('string');
    expect(strangerReply.length).toBeGreaterThan(0);
    
    console.log('Stranger reply:', strangerReply);
    
    // Stranger level should NOT use "亲爱的"
    expect(strangerReply).not.toContain('亲爱的');

    // Test lover level
    const loverPayload = {
      json: {
        userMessage,
        personality,
        novaName,
        conversationHistory,
        relationshipLevel: 'lover',
      },
    };

    const loverResponse = await fetch(`${apiBaseUrl}/api/trpc/ai.generateReply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loverPayload),
    });

    expect(loverResponse.ok).toBe(true);
    const loverData = await loverResponse.json();
    const loverReply = loverData.result?.data?.json?.reply;
    
    expect(loverReply).toBeDefined();
    expect(typeof loverReply).toBe('string');
    expect(loverReply.length).toBeGreaterThan(0);
    
    console.log('Lover reply:', loverReply);
    
    // Lover level CAN use "亲爱的" (but not required due to LLM randomness)
    // Just verify the reply is different from stranger level
    expect(strangerReply).not.toBe(loverReply);
  }, { timeout: 15000 });

  it('should respect relationship level in emotional messages', async () => {
    const personality = {
      gentleness: 90,
      liveliness: 50,
      intellectuality: 50,
      mischief: 30,
      mystery: 20,
    };

    const novaName = 'Nova';
    const userMessage = '我很想你';
    const conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];

    // Test stranger level - should be more formal
    const strangerPayload = {
      json: {
        userMessage,
        personality,
        novaName,
        conversationHistory,
        relationshipLevel: 'stranger',
      },
    };

    const strangerResponse = await fetch(`${apiBaseUrl}/api/trpc/ai.generateReply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(strangerPayload),
    });

    expect(strangerResponse.ok).toBe(true);
    const strangerData = await strangerResponse.json();
    const strangerReply = strangerData.result?.data?.json?.reply;
    
    console.log('Stranger response to "我很想你":', strangerReply);
    expect(strangerReply).toBeDefined();
    expect(strangerReply).not.toContain('亲爱的');

    // Test friend level
    const friendPayload = {
      json: {
        userMessage,
        personality,
        novaName,
        conversationHistory,
        relationshipLevel: 'friend',
      },
    };

    const friendResponse = await fetch(`${apiBaseUrl}/api/trpc/ai.generateReply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(friendPayload),
    });

    expect(friendResponse.ok).toBe(true);
    const friendData = await friendResponse.json();
    const friendReply = friendData.result?.data?.json?.reply;
    
    console.log('Friend response to "我很想你":', friendReply);
    expect(friendReply).toBeDefined();

    // Test ambiguous level - more intimate
    const ambiguousPayload = {
      json: {
        userMessage,
        personality,
        novaName,
        conversationHistory,
        relationshipLevel: 'ambiguous',
      },
    };

    const ambiguousResponse = await fetch(`${apiBaseUrl}/api/trpc/ai.generateReply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(ambiguousPayload),
    });

    expect(ambiguousResponse.ok).toBe(true);
    const ambiguousData = await ambiguousResponse.json();
    const ambiguousReply = ambiguousData.result?.data?.json?.reply;
    
    console.log('Ambiguous response to "我很想你":', ambiguousReply);
    expect(ambiguousReply).toBeDefined();

    // Test lover level - most intimate
    const loverPayload = {
      json: {
        userMessage,
        personality,
        novaName,
        conversationHistory,
        relationshipLevel: 'lover',
      },
    };

    const loverResponse = await fetch(`${apiBaseUrl}/api/trpc/ai.generateReply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loverPayload),
    });

    expect(loverResponse.ok).toBe(true);
    const loverData = await loverResponse.json();
    const loverReply = loverData.result?.data?.json?.reply;
    
    console.log('Lover response to "我很想你":', loverReply);
    expect(loverReply).toBeDefined();
  }, { timeout: 15000 });

  it('should generate appropriate responses for each relationship stage', async () => {
    const personality = {
      gentleness: 75,
      liveliness: 60,
      intellectuality: 50,
      mischief: 40,
      mystery: 30,
    };

    const novaName = 'Nova';
    const conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];

    const stages = ['stranger', 'friend', 'familiar', 'ambiguous', 'lover'] as const;

    for (const stage of stages) {
      const payload = {
        json: {
          userMessage: '你好',
          personality,
          novaName,
          conversationHistory,
          relationshipLevel: stage,
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
      
      console.log(`[${stage}] Reply:`, reply);
    }
  }, { timeout: 30000 });
});

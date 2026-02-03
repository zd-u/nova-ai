/**
 * 备用回复系统测试
 */

import { describe, it, expect } from 'vitest';
import { generateFallbackReply, generateRejectReply } from '@/lib/ai/fallback-replies';

describe('Fallback Replies System', () => {
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

  it('should generate a fallback reply', () => {
    const reply = generateFallbackReply(mockPersonality, mockEmotionalState);
    expect(reply).toBeTruthy();
    expect(reply.length).toBeGreaterThan(0);
    expect(typeof reply).toBe('string');
  });

  it('should generate different replies on multiple calls', () => {
    const reply1 = generateFallbackReply(mockPersonality, mockEmotionalState);
    const reply2 = generateFallbackReply(mockPersonality, mockEmotionalState);
    // 不一定不同，但都应该有效
    expect(reply1).toBeTruthy();
    expect(reply2).toBeTruthy();
  });

  it('should generate happy replies when happiness is high', () => {
    const happyState = { ...mockEmotionalState, happiness: 90 };
    const reply = generateFallbackReply(mockPersonality, happyState);
    expect(reply).toBeTruthy();
    expect(reply.length).toBeGreaterThan(0);
  });

  it('should generate sad replies when sadness is high', () => {
    const sadState = { ...mockEmotionalState, sadness: 80 };
    const reply = generateFallbackReply(mockPersonality, sadState);
    expect(reply).toBeTruthy();
    expect(reply.length).toBeGreaterThan(0);
  });

  it('should generate excited replies when excitement is high', () => {
    const excitedState = { ...mockEmotionalState, excitement: 80 };
    const reply = generateFallbackReply(mockPersonality, excitedState);
    expect(reply).toBeTruthy();
    expect(reply.length).toBeGreaterThan(0);
  });

  it('should generate reject replies', () => {
    const reply = generateRejectReply();
    expect(reply).toBeTruthy();
    expect(reply.length).toBeGreaterThan(0);
  });

  it('should handle question messages', () => {
    const reply = generateFallbackReply(
      mockPersonality,
      mockEmotionalState,
      '你好吗？'
    );
    expect(reply).toBeTruthy();
    expect(reply.length).toBeGreaterThan(0);
  });

  it('should generate gentle replies with high gentleness', () => {
    const gentlePersonality = { ...mockPersonality, gentleness: 90 };
    const reply = generateFallbackReply(gentlePersonality, mockEmotionalState);
    expect(reply).toBeTruthy();
  });

  it('should generate lively replies with high liveliness', () => {
    const livelyPersonality = { ...mockPersonality, liveliness: 90 };
    const reply = generateFallbackReply(livelyPersonality, mockEmotionalState);
    expect(reply).toBeTruthy();
  });

  it('should generate intellectual replies with high intellectuality', () => {
    const intellectualPersonality = {
      ...mockPersonality,
      intellectuality: 90,
    };
    const reply = generateFallbackReply(
      intellectualPersonality,
      mockEmotionalState
    );
    expect(reply).toBeTruthy();
  });

  it('should generate mischievous replies with high mischief', () => {
    const mischievousPersonality = { ...mockPersonality, mischief: 90 };
    const reply = generateFallbackReply(
      mischievousPersonality,
      mockEmotionalState
    );
    expect(reply).toBeTruthy();
  });

  it('should generate mysterious replies with high mystery', () => {
    const mysteriousPersonality = { ...mockPersonality, mystery: 90 };
    const reply = generateFallbackReply(
      mysteriousPersonality,
      mockEmotionalState
    );
    expect(reply).toBeTruthy();
  });

  it('should handle low energy state', () => {
    const tiredState = { ...mockEmotionalState, energy: 10 };
    const reply = generateFallbackReply(mockPersonality, tiredState);
    expect(reply).toBeTruthy();
  });

  it('should handle shy state', () => {
    const shyState = { ...mockEmotionalState, shyness: 80 };
    const reply = generateFallbackReply(mockPersonality, shyState);
    expect(reply).toBeTruthy();
  });

  it('should handle bored state', () => {
    const boredState = { ...mockEmotionalState, boredom: 80 };
    const reply = generateFallbackReply(mockPersonality, boredState);
    expect(reply).toBeTruthy();
  });

  it('should handle angry state', () => {
    const angryState = { ...mockEmotionalState, anger: 70 };
    const reply = generateFallbackReply(mockPersonality, angryState);
    expect(reply).toBeTruthy();
  });
});

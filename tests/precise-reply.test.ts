import { describe, it, expect } from 'vitest';
import { analyzeSentence } from '../lib/ai/sentence-analyzer';
import { generateReplyByIntent } from '../lib/ai/precise-reply-generator';

describe('Sentence Analyzer', () => {
  it('should identify greeting', () => {
    const analysis = analyzeSentence('你好');
    expect(analysis.intent).toBe('greeting');
    expect(['statement', 'question']).toContain(analysis.type);
  });

  it('should identify question about status', () => {
    const analysis = analyzeSentence('你在干什么');
    expect(analysis.intent).toBe('ask_status');
    expect(['question', 'statement']).toContain(analysis.type);
  });

  it('should identify love expression', () => {
    const analysis = analyzeSentence('我想你了');
    expect(analysis.intent).toBe('express_love');
    expect(analysis.keywords).toContain('love');
  });

  it('should identify sadness', () => {
    const analysis = analyzeSentence('我很难过');
    expect(analysis.intent).toBe('express_sadness');
    expect(analysis.sentiment).toBe('negative');
  });

  it('should identify anger', () => {
    const analysis = analyzeSentence('我很生气');
    expect(analysis.intent).toBe('express_anger');
    expect(analysis.sentiment).toBe('negative');
  });

  it('should identify happiness', () => {
    const analysis = analyzeSentence('我很开心');
    expect(analysis.intent).toBe('express_happiness');
    expect(analysis.sentiment).toBe('positive');
  });

  it('should identify praise', () => {
    const analysis = analyzeSentence('你真的很棒');
    expect(analysis.intent).toBe('praise');
    expect(analysis.keywords).toContain('praise');
  });

  it('should identify thanks', () => {
    const analysis = analyzeSentence('谢谢你');
    expect(analysis.intent).toBe('thanks');
    expect(analysis.keywords).toContain('thanks');
  });

  it('should identify apology', () => {
    const analysis = analyzeSentence('对不起');
    expect(analysis.intent).toBe('apology');
    expect(analysis.keywords).toContain('apology');
  });

  it('should identify goodbye', () => {
    const analysis = analyzeSentence('再见');
    expect(analysis.intent).toBe('goodbye');
  });

  it('should identify identity question', () => {
    const analysis = analyzeSentence('你叫什么名字');
    expect(analysis.intent).toBe('ask_identity');
  });

  it('should extract keywords correctly', () => {
    const analysis = analyzeSentence('你好，我想你了');
    expect(analysis.keywords).toContain('greeting');
    expect(analysis.keywords).toContain('love');
  });

  it('should identify positive sentiment', () => {
    const analysis = analyzeSentence('你很聪明');
    expect(analysis.sentiment).toBe('positive');
  });

  it('should identify negative sentiment', () => {
    const analysis = analyzeSentence('我很伤心');
    expect(analysis.sentiment).toBe('negative');
  });
});

describe('Reply Generator', () => {
  const personality = {
    warmth: 0.8,
    liveliness: 0.7,
    intelligence: 0.75,
  };

  const emotion = {
    happiness: 0.6,
    sadness: 0.2,
    affection: 0.7,
  };

  it('should generate greeting reply', () => {
    const analysis = analyzeSentence('你好');
    const reply = generateReplyByIntent(analysis, personality, emotion);
    expect(reply).toBeTruthy();
    expect(reply.length > 0).toBe(true);
    expect(['你好呀', '嗨', '你好'].some(word => reply.includes(word))).toBe(true);
  });

  it('should generate status reply', () => {
    const analysis = analyzeSentence('你在干什么');
    const reply = generateReplyByIntent(analysis, personality, emotion);
    expect(reply).toBeTruthy();
    expect(reply.length > 0).toBe(true);
  });

  it('should generate love reply', () => {
    const analysis = analyzeSentence('我想你了');
    const reply = generateReplyByIntent(analysis, personality, emotion);
    expect(reply).toBeTruthy();
    expect(reply.length > 0).toBe(true);
  });

  it('should generate sadness reply', () => {
    const analysis = analyzeSentence('我很难过');
    const reply = generateReplyByIntent(analysis, personality, emotion);
    expect(reply).toBeTruthy();
    expect(reply.length > 0).toBe(true);
  });

  it('should generate happiness reply', () => {
    const analysis = analyzeSentence('我很开心');
    const reply = generateReplyByIntent(analysis, personality, emotion);
    expect(reply).toBeTruthy();
    expect(reply.length > 0).toBe(true);
  });

  it('should generate praise reply', () => {
    const analysis = analyzeSentence('你真的很棒');
    const reply = generateReplyByIntent(analysis, personality, emotion);
    expect(reply).toBeTruthy();
    expect(reply.length > 0).toBe(true);
  });

  it('should generate thanks reply', () => {
    const analysis = analyzeSentence('谢谢你');
    const reply = generateReplyByIntent(analysis, personality, emotion);
    expect(reply).toBeTruthy();
    expect(reply.length > 0).toBe(true);
  });

  it('should generate apology reply', () => {
    const analysis = analyzeSentence('对不起');
    const reply = generateReplyByIntent(analysis, personality, emotion);
    expect(reply).toBeTruthy();
    expect(reply.length > 0).toBe(true);
  });

  it('should generate goodbye reply', () => {
    const analysis = analyzeSentence('再见');
    const reply = generateReplyByIntent(analysis, personality, emotion);
    expect(reply).toBeTruthy();
    expect(reply.length > 0).toBe(true);
  });

  it('should generate identity reply', () => {
    const analysis = analyzeSentence('你叫什么名字');
    const reply = generateReplyByIntent(analysis, personality, emotion);
    expect(reply).toBeTruthy();
    expect(['Nova', '我是'].some(word => reply.includes(word))).toBe(true);
  });

  it('should generate different replies for different inputs', () => {
    const greeting = generateReplyByIntent(analyzeSentence('你好'), personality, emotion);
    const status = generateReplyByIntent(analyzeSentence('你在干什么'), personality, emotion);
    expect(greeting).not.toBe(status);
  });

  it('should respect personality traits', () => {
    const warmPersonality = { warmth: 0.95, liveliness: 0.5, intelligence: 0.5 };
    const reply = generateReplyByIntent(analyzeSentence('你好'), warmPersonality, emotion);
    expect(reply).toBeTruthy();
  });

  it('should respect emotion state', () => {
    const happyEmotion = { happiness: 0.95, sadness: 0.1, affection: 0.8 };
    const reply = generateReplyByIntent(analyzeSentence('你在干什么'), personality, happyEmotion);
    expect(reply).toBeTruthy();
  });
});

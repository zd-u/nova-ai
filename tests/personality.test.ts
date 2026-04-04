import { describe, it, expect } from 'vitest';
import { analyzeSentiment } from '../lib/personality/engine';
import { INITIAL_PERSONALITY, getPersonalityDescription } from '../lib/types/personality';

describe('Personality System', () => {
  describe('Sentiment Analysis', () => {
    it('should detect positive sentiment', () => {
      const result = analyzeSentiment('我很喜欢你，你真的很棒！');
      expect(result.emotion).toBe('positive');
      expect(result.intensity).toBeGreaterThan(0);
    });

    it('should detect negative sentiment', () => {
      const result = analyzeSentiment('我很难过，心情不好');
      expect(result.emotion).toBe('negative');
      expect(result.intensity).toBeGreaterThan(0);
    });

    it('should detect neutral sentiment', () => {
      const result = analyzeSentiment('今天天气不错');
      expect(result.emotion).toBe('neutral');
    });

    it('should extract keywords from positive messages', () => {
      const result = analyzeSentiment('我喜欢你，谢谢你的帮助');
      expect(result.keywords.length).toBeGreaterThan(0);
    });

    it('should identify work-related themes', () => {
      const result = analyzeSentiment('我在工作中遇到了问题');
      expect(result.themes).toContain('work');
    });

    it('should identify help-related themes', () => {
      const result = analyzeSentiment('我需要帮助');
      expect(result.themes).toContain('help');
    });

    it('should identify relationship themes', () => {
      const result = analyzeSentiment('我和朋友的关系很好');
      expect(result.themes).toContain('relationship');
    });

    it('should identify humor themes', () => {
      const result = analyzeSentiment('哈哈，这个笑话太搞笑了');
      expect(result.themes).toContain('humor');
    });
  });

  describe('Personality Traits', () => {
    it('should have all required traits', () => {
      const traits = INITIAL_PERSONALITY;

      expect(traits).toHaveProperty('gentleness');
      expect(traits).toHaveProperty('liveliness');
      expect(traits).toHaveProperty('intellectuality');
      expect(traits).toHaveProperty('mischief');
      expect(traits).toHaveProperty('mystery');
    });

    it('should maintain trait values between 0-100', () => {
      const traits = INITIAL_PERSONALITY;

      Object.values(traits).forEach((value) => {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(100);
      });
    });

    it('should have reasonable initial values', () => {
      const traits = INITIAL_PERSONALITY;

      expect(traits.gentleness).toBeGreaterThan(50);
      expect(traits.liveliness).toBeGreaterThan(50);
      expect(traits.intellectuality).toBeGreaterThan(50);
    });
  });

  describe('Personality Description', () => {
    it('should generate description for high gentleness', () => {
      const traits = { ...INITIAL_PERSONALITY, gentleness: 80 };
      const description = getPersonalityDescription(traits);

      expect(description).toContain('温柔体贴');
    });

    it('should generate description for high liveliness', () => {
      const traits = { ...INITIAL_PERSONALITY, liveliness: 80 };
      const description = getPersonalityDescription(traits);

      expect(description).toContain('活泼开朗');
    });

    it('should generate description for high intellectuality', () => {
      const traits = { ...INITIAL_PERSONALITY, intellectuality: 80 };
      const description = getPersonalityDescription(traits);

      expect(description).toContain('知性聪慧');
    });

    it('should generate description for high mischief', () => {
      const traits = { ...INITIAL_PERSONALITY, mischief: 80 };
      const description = getPersonalityDescription(traits);

      expect(description).toContain('调皮可爱');
    });

    it('should generate description for high mystery', () => {
      const traits = { ...INITIAL_PERSONALITY, mystery: 70 };
      const description = getPersonalityDescription(traits);

      expect(description).toContain('神秘梦幻');
    });

    it('should generate default description for balanced traits', () => {
      const traits = { ...INITIAL_PERSONALITY };
      const description = getPersonalityDescription(traits);

      expect(description).toBeTruthy();
      expect(description.length).toBeGreaterThan(0);
    });
  });
});

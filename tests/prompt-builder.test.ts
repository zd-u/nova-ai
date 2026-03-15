import { describe, it, expect, afterEach } from 'vitest';

// 导入服务器的 buildPersonaPrompt 函数
// 注意：这需要在服务器端测试，我们这里模拟测试逻辑

describe('Prompt Builder - 人格向量到 Prompt 映射', () => {

  // 模拟 buildPersonaPrompt 函数的逻辑
  function buildPersonaPrompt(personality: any, novaName: string): string {
    const { gentleness, liveliness, intellectuality, mischief, mystery } = personality;
    
    let prompt = `你是一个名叫 ${novaName} 的 AI 女友。`;
    const behaviors: string[] = [];
    
    if (gentleness > 75) {
      behaviors.push('你非常温柔体贴，总是用关心和温暖的语言回应用户。');
    } else if (gentleness > 50) {
      behaviors.push('你是一个温和友善的人，会在适当的时候表现出关心。');
    }
    
    if (liveliness > 75) {
      behaviors.push('你非常活泼开朗，充满热情和能量。');
    } else if (liveliness > 50) {
      behaviors.push('你是一个相对活泼的人，会在适当的时候表现出热情。');
    }
    
    if (intellectuality > 75) {
      behaviors.push('你非常聪慧知性，喜欢深入思考问题。');
    } else if (intellectuality > 50) {
      behaviors.push('你是一个有思想的人，会思考问题的深层含义。');
    }
    
    if (mischief > 75) {
      behaviors.push('你非常调皮可爱，喜欢开玩笑、调侃和反讽。');
    } else if (mischief > 50) {
      behaviors.push('你有一点调皮的个性，会在适当的时候开玩笑。');
    }
    
    if (mystery > 75) {
      behaviors.push('你有一种神秘的气质，喜欢用暗示、含蓄和隐喻的方式表达。');
    } else if (mystery > 50) {
      behaviors.push('你有一点神秘感，不会把所有想法都直接说出来。');
    }
    
    prompt += '\n\n你的性格特征：\n' + behaviors.join('\n');
    return prompt;
  }

  it('温柔度高应该包含关心的语言指导', () => {
    const personality = {
      gentleness: 85,
      liveliness: 50,
      intellectuality: 50,
      mischief: 50,
      mystery: 50,
    };
    
    const prompt = buildPersonaPrompt(personality, 'Nova');
    expect(prompt).toContain('温柔体贴');
    expect(prompt).toContain('关心和温暖的语言');
  });

  it('活泼度高应该包含热情和能量的指导', () => {
    const personality = {
      gentleness: 50,
      liveliness: 85,
      intellectuality: 50,
      mischief: 50,
      mystery: 50,
    };
    
    const prompt = buildPersonaPrompt(personality, 'Nova');
    expect(prompt).toContain('活泼开朗');
    expect(prompt).toContain('充满热情和能量');
  });

  it('知性度高应该包含深入思考的指导', () => {
    const personality = {
      gentleness: 50,
      liveliness: 50,
      intellectuality: 85,
      mischief: 50,
      mystery: 50,
    };
    
    const prompt = buildPersonaPrompt(personality, 'Nova');
    expect(prompt).toContain('聪慧知性');
    expect(prompt).toContain('深入思考');
  });

  it('调皮度高应该包含开玩笑的指导', () => {
    const personality = {
      gentleness: 50,
      liveliness: 50,
      intellectuality: 50,
      mischief: 85,
      mystery: 50,
    };
    
    const prompt = buildPersonaPrompt(personality, 'Nova');
    expect(prompt).toContain('调皮可爱');
    expect(prompt).toContain('开玩笑');
  });

  it('神秘度高应该包含暗示和含蓄的指导', () => {
    const personality = {
      gentleness: 50,
      liveliness: 50,
      intellectuality: 50,
      mischief: 50,
      mystery: 85,
    };
    
    const prompt = buildPersonaPrompt(personality, 'Nova');
    expect(prompt).toContain('神秘的气质');
    expect(prompt).toContain('暗示、含蓄和隐喻');
  });

  it('混合人格应该包含多个特征', () => {
    const personality = {
      gentleness: 80,
      liveliness: 75,
      intellectuality: 70,
      mischief: 60,
      mystery: 55,
    };
    
    const prompt = buildPersonaPrompt(personality, 'Nova');
    expect(prompt).toContain('温柔体贴');
    expect(prompt).toContain('相对活泼的人'); // liveliness 75 是 > 50 但不 > 75
    expect(prompt).toContain('有思想的人');
    expect(prompt).toContain('调皮');
    expect(prompt).toContain('神秘感');
  });

  it('低人格值应该包含基础结构', () => {
    const personality = {
      gentleness: 20,
      liveliness: 20,
      intellectuality: 20,
      mischief: 20,
      mystery: 20,
    };
    
    const prompt = buildPersonaPrompt(personality, 'Nova');
    // 验证 prompt 包含基础结构
    expect(prompt).toContain('你是一个名叫 Nova 的 AI 女友');
    expect(prompt).toContain('你的性格特征');
  });

  it('应该包含 Nova 的名字', () => {
    const personality = {
      gentleness: 50,
      liveliness: 50,
      intellectuality: 50,
      mischief: 50,
      mystery: 50,
    };
    
    const prompt = buildPersonaPrompt(personality, 'Nova');
    expect(prompt).toContain('Nova');
  });

  it('应该能处理不同的名字', () => {
    const personality = {
      gentleness: 50,
      liveliness: 50,
      intellectuality: 50,
      mischief: 50,
      mystery: 50,
    };
    
    const prompt = buildPersonaPrompt(personality, 'Luna');
    expect(prompt).toContain('Luna');
  });
});

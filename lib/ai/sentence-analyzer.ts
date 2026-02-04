/**
 * 中文句子结构分析引擎
 * 能够分析句子结构、提取关键信息、理解用户意图
 */

export interface SentenceAnalysis {
  original: string;
  cleaned: string;
  type: 'question' | 'statement' | 'exclamation' | 'unknown';
  keywords: string[];
  mainVerb: string | null;
  subject: string | null;
  object: string | null;
  sentiment: 'positive' | 'negative' | 'neutral';
  intent: string;
  confidence: number;
}

/**
 * 分析中文句子的结构和含义
 */
export function analyzeSentence(text: string): SentenceAnalysis {
  const cleaned = text.trim();
  
  // 1. 识别句子类型
  const type = identifySentenceType(cleaned);
  
  // 2. 提取关键词
  const keywords = extractKeywords(cleaned);
  
  // 3. 识别主要动词
  const mainVerb = extractMainVerb(cleaned);
  
  // 4. 提取主语、宾语
  const { subject, object } = extractSubjectObject(cleaned);
  
  // 5. 分析情感
  const sentiment = analyzeSentiment(cleaned);
  
  // 6. 判断意图
  const { intent, confidence } = classifyIntent(cleaned, type, keywords, mainVerb, sentiment);
  
  return {
    original: text,
    cleaned,
    type,
    keywords,
    mainVerb,
    subject,
    object,
    sentiment,
    intent,
    confidence,
  };
}

/**
 * 识别句子类型
 */
function identifySentenceType(text: string): 'question' | 'statement' | 'exclamation' | 'unknown' {
  if (text.includes('？') || text.includes('?') || 
      text.startsWith('你') || text.startsWith('我') || 
      text.match(/^(什么|怎么|为什么|哪|谁|几|多少)/)) {
    return 'question';
  }
  
  if (text.includes('！') || text.includes('!')) {
    return 'exclamation';
  }
  
  if (text.includes('。') || text.includes('.')) {
    return 'statement';
  }
  
  return 'statement';
}

/**
 * 提取关键词
 */
function extractKeywords(text: string): string[] {
  const keywords: string[] = [];
  
  // 常见关键词库
  const keywordPatterns = [
    // 问候
    { pattern: /你好|嗨|hello|hi/gi, keyword: 'greeting' },
    // 告别
    { pattern: /再见|拜拜|bye|goodbye/gi, keyword: 'goodbye' },
    // 爱意表达
    { pattern: /爱|喜欢|想你|思念|想念|miss/gi, keyword: 'love' },
    // 悲伤
    { pattern: /难过|伤心|哭|悲伤|难受|不开心|sad|cry/gi, keyword: 'sad' },
    // 生气
    { pattern: /生气|愤怒|讨厌|烦|angry|mad|hate/gi, keyword: 'angry' },
    // 开心
    { pattern: /开心|高兴|快乐|哈哈|happy|glad|fun/gi, keyword: 'happy' },
    // 状态询问
    { pattern: /在干什么|做什么|干嘛|在吗|doing|what/gi, keyword: 'status' },
    // 身份询问
    { pattern: /你是谁|叫什么|名字|who are you|name/gi, keyword: 'identity' },
    // 赞美
    { pattern: /棒|厉害|聪明|漂亮|美|nice|great|awesome/gi, keyword: 'praise' },
    // 感谢
    { pattern: /谢谢|感谢|谢|thanks|thank you/gi, keyword: 'thanks' },
    // 道歉
    { pattern: /对不起|抱歉|sorry|apologize/gi, keyword: 'apology' },
  ];
  
  for (const { pattern, keyword } of keywordPatterns) {
    if (pattern.test(text)) {
      keywords.push(keyword);
    }
  }
  
  return keywords;
}

/**
 * 提取主要动词
 */
function extractMainVerb(text: string): string | null {
  const verbs = [
    '是', '在', '有', '做', '说', '想', '喜欢', '爱', '讨厌', '生气', 
    '开心', '难过', '等', '给', '告诉', '问', '知道', '看', '听', '来',
    '去', '回', '睡', '吃', '喝', '玩', '笑', '哭', '跑', '走'
  ];
  
  for (const verb of verbs) {
    if (text.includes(verb)) {
      return verb;
    }
  }
  
  return null;
}

/**
 * 提取主语和宾语
 */
function extractSubjectObject(text: string): { subject: string | null; object: string | null } {
  let subject: string | null = null;
  let object: string | null = null;
  
  // 识别主语（通常在句子开头）
  if (text.startsWith('我')) {
    subject = '我';
  } else if (text.startsWith('你')) {
    subject = '你';
  } else if (text.startsWith('她')) {
    subject = '她';
  } else if (text.startsWith('他')) {
    subject = '他';
  }
  
  // 简单的宾语提取（在动词后面）
  const verbPatterns = ['想', '喜欢', '爱', '讨厌', '说', '问', '告诉'];
  for (const verb of verbPatterns) {
    const index = text.indexOf(verb);
    if (index !== -1) {
      const afterVerb = text.substring(index + verb.length).trim();
      if (afterVerb.length > 0 && afterVerb.length < 20) {
        object = afterVerb.replace(/[？?。!！]/g, '').trim();
      }
    }
  }
  
  return { subject, object };
}

/**
 * 分析情感
 */
function analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
  const positiveWords = ['好', '开心', '快乐', '喜欢', '爱', '棒', '厉害', '聪明', '漂亮', '美'];
  const negativeWords = ['坏', '难过', '伤心', '讨厌', '生气', '烦', '累', '困', '差'];
  
  let positiveCount = 0;
  let negativeCount = 0;
  
  for (const word of positiveWords) {
    if (text.includes(word)) positiveCount++;
  }
  
  for (const word of negativeWords) {
    if (text.includes(word)) negativeCount++;
  }
  
  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
}

/**
 * 分类意图
 */
function classifyIntent(
  text: string,
  type: string,
  keywords: string[],
  mainVerb: string | null,
  sentiment: string
): { intent: string; confidence: number } {
  let intent = 'unknown';
  let confidence = 0;
  
  // 基于关键词分类
  if (keywords.includes('greeting')) {
    intent = 'greeting';
    confidence = 0.9;
  } else if (keywords.includes('goodbye')) {
    intent = 'goodbye';
    confidence = 0.9;
  } else if (keywords.includes('love')) {
    intent = 'express_love';
    confidence = 0.85;
  } else if (keywords.includes('sad')) {
    intent = 'express_sadness';
    confidence = 0.85;
  } else if (keywords.includes('angry')) {
    intent = 'express_anger';
    confidence = 0.85;
  } else if (keywords.includes('happy')) {
    intent = 'express_happiness';
    confidence = 0.85;
  } else if (keywords.includes('status')) {
    intent = 'ask_status';
    confidence = 0.9;
  } else if (keywords.includes('identity')) {
    intent = 'ask_identity';
    confidence = 0.9;
  } else if (keywords.includes('praise')) {
    intent = 'praise';
    confidence = 0.8;
  } else if (keywords.includes('thanks')) {
    intent = 'thanks';
    confidence = 0.9;
  } else if (keywords.includes('apology')) {
    intent = 'apology';
    confidence = 0.9;
  } else if (type === 'question') {
    intent = 'question';
    confidence = 0.7;
  } else if (type === 'exclamation') {
    intent = 'exclamation';
    confidence = 0.7;
  } else {
    intent = 'chat';
    confidence = 0.5;
  }
  
  return { intent, confidence };
}

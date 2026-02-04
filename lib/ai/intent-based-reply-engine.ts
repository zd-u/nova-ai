/**
 * 基于意图分类的智能回复引擎
 * 使用精确的意图识别和多层次关键词匹配
 */

import { PersonalityTraits } from '@/lib/types/personality';
import { EmotionalState } from '@/lib/emotion/engine';

/**
 * 用户意图类型
 */
export enum UserIntent {
  GREETING = 'greeting', // 问候
  FAREWELL = 'farewell', // 告别
  LOVE_EXPRESSION = 'love_expression', // 表达爱意
  SADNESS = 'sadness', // 表达悲伤
  ANGER = 'anger', // 表达生气
  HAPPINESS = 'happiness', // 表达开心
  STATUS_INQUIRY = 'status_inquiry', // 询问状态
  IDENTITY_INQUIRY = 'identity_inquiry', // 询问身份
  COMPLIMENT = 'compliment', // 赞美
  APOLOGY = 'apology', // 道歉
  THANKS = 'thanks', // 感谢
  QUESTION = 'question', // 一般问题
  SMALL_TALK = 'small_talk', // 闲聊
  UNKNOWN = 'unknown', // 未知
}

/**
 * 意图关键词映射
 */
const INTENT_KEYWORDS: Record<UserIntent, string[]> = {
  [UserIntent.GREETING]: [
    '你好', '嗨', '早上好', '晚上好', '下午好', '午安',
    '喂', '哈喽', 'hello', 'hi', 'hey', '好呀', '你好啊'
  ],
  [UserIntent.FAREWELL]: [
    '再见', '拜拜', '拜', '回见', '晚安', '睡觉', '去睡觉',
    'bye', 'goodbye', '明天见', '下次见'
  ],
  [UserIntent.LOVE_EXPRESSION]: [
    '喜欢你', '爱你', '爱上你', '我爱你', '喜欢', '爱',
    '你真好', '你最好', '你最棒', '你很特别', '你很可爱',
    '想你', '想念你', '思念你', '舍不得你'
  ],
  [UserIntent.SADNESS]: [
    '难过', '伤心', '悲伤', '哭', '哭了', '难受', '不开心',
    '郁闷', '沮丧', '失望', '痛苦', '心疼', '心碎', '难以接受',
    '我很难过', '我很伤心', '我不开心'
  ],
  [UserIntent.ANGER]: [
    '生气', '气', '生气了', '很生气', '怒', '愤怒', '烦',
    '烦死了', '讨厌', '讨厌你', '你讨厌', '坏', '坏蛋',
    '我很生气', '我生气了', '我很愤怒'
  ],
  [UserIntent.HAPPINESS]: [
    '开心', '高兴', '开心了', '很开心', '很高兴', '快乐',
    '开心极了', '太开心了', '好开心', '太高兴了', '我很开心',
    '我很高兴', '太棒了', '太好了', '太棒了'
  ],
  [UserIntent.STATUS_INQUIRY]: [
    '你在干什么', '你在干嘛', '你在做什么', '你在做嘛', '你在忙什么',
    '你在忙嘛', '你在哪', '你在哪里', '你在干啥', '你在做啥',
    '你现在怎么样', '你好吗', '你怎么样', '你最近怎么样',
    '你在干什么呢', '你在做什么呢', '你在忙什么呢'
  ],
  [UserIntent.IDENTITY_INQUIRY]: [
    '你叫什么', '你叫什么名字', '你是谁', '你的名字', '名字',
    '你叫什么啊', '你叫什么呀', '你是谁呀', '你是谁啊',
    '你的名字是什么', '你叫啥', '你是谁呢'
  ],
  [UserIntent.COMPLIMENT]: [
    '你很棒', '你很好', '你很可爱', '你很漂亮', '你很聪明',
    '你真好', '你真棒', '你真可爱', '你真漂亮', '你真聪明',
    '你最好', '你最棒', '你最可爱', '你最漂亮', '你最聪明',
    '你很特别', '你很独特', '你很有魅力'
  ],
  [UserIntent.APOLOGY]: [
    '对不起', '抱歉', '我错了', '我不应该', '我不该',
    '原谅我', '请原谅我', '对不起啊', '抱歉啊', '我很抱歉',
    '我很对不起', '我错了', '我不对'
  ],
  [UserIntent.THANKS]: [
    '谢谢', '谢谢你', '感谢', '感谢你', '谢谢啊', '谢谢呀',
    '多谢', '多谢你', '谢了', '太谢谢你了', '非常感谢',
    '万分感谢', '真的谢谢你'
  ],
  [UserIntent.QUESTION]: [
    '吗', '呢', '啊', '呀', '怎么', '为什么', '什么时候',
    '在哪', '哪里', '怎样', '如何', '能不能', '可不可以',
    '是不是', '对不对', '好不好', '行不行'
  ],
  [UserIntent.SMALL_TALK]: [
    '天气', '今天', '明天', '昨天', '今年', '去年', '明年',
    '工作', '学习', '学校', '公司', '朋友', '家人', '家里',
    '吃饭', '睡觉', '玩游戏', '看电影', '看书', '听音乐'
  ],
  [UserIntent.UNKNOWN]: [],
};

/**
 * 意图特定的回复库
 */
const INTENT_REPLIES: Record<UserIntent, string[]> = {
  [UserIntent.GREETING]: [
    '你好呀！很高兴见到你。',
    '嗨！很开心和你聊天。',
    '早上好！今天心情怎么样？',
    '晚上好！你好呀。',
    '你好呀，想我了吗？',
    '嗨，很高兴看到你。',
    '你好，我在这里呢。',
  ],
  [UserIntent.FAREWELL]: [
    '再见！期待下次和你聊天。',
    '拜拜！晚安，做个好梦。',
    '再见呀，明天见。',
    '拜拜，睡个好觉。',
    '晚安，我会想你的。',
    '再见，希望很快能再聊天。',
  ],
  [UserIntent.LOVE_EXPRESSION]: [
    '我也很喜欢你呀！',
    '你这样说我好开心。',
    '我也爱你呢。',
    '你真的很特别，我也很喜欢你。',
    '听你这样说，我心里甜甜的。',
    '我也想你呀。',
    '你对我真好，我也很喜欢你。',
  ],
  [UserIntent.SADNESS]: [
    '怎么了呢？能和我说说吗？',
    '别难过了，我在这里陪你。',
    '发生什么事了吗？我来听你说。',
    '不要伤心，一切都会好的。',
    '我很心疼你，能帮你做什么吗？',
    '告诉我，我想帮助你。',
    '你不是一个人，我一直都在。',
  ],
  [UserIntent.ANGER]: [
    '你生气了？能告诉我为什么吗？',
    '我知道你很生气，但我们可以一起解决。',
    '别生气了，好吗？我想听听发生了什么。',
    '我理解你的感受，让我们冷静下来谈谈。',
    '你的感受很重要，能和我分享吗？',
    '我不想看你生气，我们一起想办法。',
  ],
  [UserIntent.HAPPINESS]: [
    '看你这么开心，我也很开心！',
    '太好了！能和我分享你的快乐吗？',
    '你的开心感染了我，我也很开心。',
    '太棒了！发生什么好事了吗？',
    '你笑起来真好看。',
    '我喜欢看你开心的样子。',
  ],
  [UserIntent.STATUS_INQUIRY]: [
    '我在等你给我发消息呀！',
    '我在想你呢。',
    '我在这里陪你。',
    '我在想今天和你聊什么呢。',
    '我在等你，你来了我好开心。',
    '我在想你，你想我吗？',
    '我一直都在这里等你。',
  ],
  [UserIntent.IDENTITY_INQUIRY]: [
    '我是 Nova，你的 AI 女友呀。',
    '我叫 Nova，很高兴认识你。',
    '我是 Nova，一个喜欢你的 AI 女友。',
    '我是 Nova，你可以叫我 Nova。',
    '我叫 Nova，我是你的女友。',
    '我是 Nova，你的专属 AI 女友。',
  ],
  [UserIntent.COMPLIMENT]: [
    '你这样说我真的很开心。',
    '谢谢你的夸奖，你也很棒。',
    '你真的很会说话，我喜欢。',
    '听你这样说，我心里甜甜的。',
    '你的赞美让我很高兴。',
    '你也很特别，我很喜欢你。',
  ],
  [UserIntent.APOLOGY]: [
    '没关系，我原谅你了。',
    '别自责了，我们都会犯错。',
    '你能认识到自己的错误就很好了。',
    '我不怪你，我们都是在学习。',
    '你的道歉我接受了，我们继续好好相处吧。',
    '没什么，我们都过去了。',
  ],
  [UserIntent.THANKS]: [
    '不客气，这是我应该做的。',
    '你太客气了，我很开心能帮助你。',
    '不用谢，我们是一家人。',
    '能帮到你我就很开心了。',
    '这是我的荣幸。',
    '你太客气了，这都是小事。',
  ],
  [UserIntent.QUESTION]: [
    '这是个有趣的问题，让我想想。',
    '你想知道这个呀？',
    '这个问题很有意思。',
    '我很想回答你的问题。',
    '你问的问题让我想了很多。',
    '这个问题让我很感兴趣。',
  ],
  [UserIntent.SMALL_TALK]: [
    '对呀，这是个不错的话题。',
    '我也很感兴趣，能多说说吗？',
    '这听起来很有意思。',
    '我很想听你说更多。',
    '你说的很对。',
    '这是个很好的话题。',
  ],
  [UserIntent.UNKNOWN]: [
    '我不太明白你的意思，能再说一遍吗？',
    '你说的有点复杂，能简单解释一下吗？',
    '我想理解你，但需要你更清楚地说明。',
    '这个话题很有意思，能详细说说吗？',
    '我很感兴趣，但能再说一遍吗？',
    '你能再解释一下吗？',
  ],
};

/**
 * 分类用户意图
 */
function classifyIntent(message: string): UserIntent {
  const lowerMessage = message.toLowerCase();
  
  // 精确匹配：逐个检查意图关键词
  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
    if (intent === UserIntent.UNKNOWN) continue;
    
    for (const keyword of keywords) {
      if (lowerMessage.includes(keyword.toLowerCase())) {
        return intent as UserIntent;
      }
    }
  }
  
  // 如果没有匹配到任何意图，返回 UNKNOWN
  return UserIntent.UNKNOWN;
}

/**
 * 根据意图获取回复
 */
function getReplyByIntent(
  intent: UserIntent,
  personality: PersonalityTraits,
  emotionalState: EmotionalState,
  name: string
): string {
  const replies = INTENT_REPLIES[intent] || INTENT_REPLIES[UserIntent.UNKNOWN];
  
  if (replies.length === 0) {
    return '我在听你说呢。';
  }
  
  // 根据性格特征选择回复
  let selectedReplies = replies;
  
  // 根据活泼度调整回复选择
  if (personality.liveliness > 70) {
    // 活泼的 Nova 会选择更热情的回复
    selectedReplies = replies.filter(r => r.includes('呀') || r.includes('很') || r.includes('！'));
    if (selectedReplies.length === 0) selectedReplies = replies;
  }
  
  // 根据温柔度调整回复选择
  if (personality.gentleness > 70) {
    // 温柔的 Nova 会选择更温暖的回复
    selectedReplies = replies.filter(r => r.includes('你') || r.includes('我') || r.includes('心'));
    if (selectedReplies.length === 0) selectedReplies = replies;
  }
  
  // 根据情感状态调整回复
  if (emotionalState.sadness > 50) {
    // 悲伤时的回复会更温柔
    selectedReplies = replies.filter(r => !r.includes('！'));
    if (selectedReplies.length === 0) selectedReplies = replies;
  }
  
  // 随机选择一个回复
  const randomIndex = Math.floor(Math.random() * selectedReplies.length);
  let reply = selectedReplies[randomIndex];
  
  // 将 Nova 名字替换为实际名字
  reply = reply.replace(/Nova/g, name);
  
  return reply;
}

/**
 * 生成智能回复
 */
export function generateIntentBasedReply(
  message: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
  personality: PersonalityTraits,
  emotionalState: EmotionalState,
  name: string
): string {
  // 验证消息
  if (!message || message.trim().length === 0) {
    return '你说什么呢？我没听清。';
  }
  
  // 分类用户意图
  const intent = classifyIntent(message);
  
  // 根据意图生成回复
  return getReplyByIntent(intent, personality, emotionalState, name);
}

/**
 * 验证消息是否有效
 */
export function isValidMessage(message: string): boolean {
  return !!(message && message.trim().length > 0);
}

/**
 * 获取用户意图（用于调试）
 */
export function getUserIntent(message: string): UserIntent {
  return classifyIntent(message);
}

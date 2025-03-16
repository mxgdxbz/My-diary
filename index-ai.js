const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({origin: true});
const { OpenAI } = require('openai');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

// 初始化 Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

// 初始化 OpenAI - 优先使用 Firebase 配置中的 API 密钥，如果不存在则使用环境变量
let openaiApiKey;
try {
  // Use definite property access instead of optional chaining
  const config = functions.config();
  openaiApiKey = config.openai && config.openai.apikey;
  console.log('使用 Firebase 配置中的 OpenAI API 密钥');
} catch (error) {
  // 如果获取失败，使用环境变量
  console.log('无法从 Firebase 配置获取 API 密钥，使用环境变量');
}

// 初始化 OpenAI
const openai = new OpenAI({
  apiKey: openaiApiKey || process.env.OPENAI_API_KEY,
});

// 分析日记的函数
exports.analyzeDiaryWithAI = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    try {
      // 验证身份验证
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(403).json({error: '未授权访问'});
      }
      
      const idToken = authHeader.split('Bearer ')[1];
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const uid = decodedToken.uid;
      
      // 检查请求是否包含必要的数据
      const {diary, diaryId, date, mood, tags, userId, previousDiaries = []} = req.body;
      
      if (!diary || !diaryId || !userId) {
        return res.status(400).json({error: '请求缺少必要数据'});
      }
      
      // 验证用户身份
      if (userId !== uid) {
        return res.status(403).json({error: '用户身份验证失败'});
      }
      
      console.log('开始AI分析日记:', diaryId);

      // 使用 AI 分析日记
      const analysis = await analyzeContentWithAI(diary, mood, tags, date, previousDiaries);
      
      // 将分析结果保存到数据库
      await admin.firestore().collection('analyses').add({
        diaryId,
        userId,
        analysis,
        isAI: true,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
      
      console.log('日记分析完成并已保存');
      return res.status(200).json({analysis});
    } catch (error) {
      console.error('分析日记时出错:', error);
      
      // 如果 AI 分析失败，回退到基本分析
      if (error.message.includes('OpenAI') || error.message.includes('API')) {
        try {
          console.log('AI分析失败，回退到基本分析');
          const {diary, mood, tags} = req.body;
          const basicAnalysis = await analyzeContentBasic(diary, mood, tags);
          return res.status(200).json({
            analysis: basicAnalysis,
            note: '由于AI服务暂时不可用，我们提供了基本分析。'
          });
        } catch (fallbackError) {
          console.error('基本分析也失败了:', fallbackError);
        }
      }
      
      return res.status(500).json({error: '处理请求时出错', details: error.message});
    }
  });
});

// AI 增强版分析内容的函数
async function analyzeContentWithAI(content, mood, tags = [], date, previousDiaries = []) {
  try {
    console.log('准备AI分析参数，日记长度:', content.length);

    // 提取最近的5篇日记用于上下文分析
    const recentDiaries = previousDiaries
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);
    
    // 构建历史日记上下文
    let diaryHistory = '';
    if (recentDiaries.length > 0) {
      diaryHistory = '以下是用户最近的日记记录（从新到旧）：\n';
      recentDiaries.forEach((diary, index) => {
        diaryHistory += `---日记 ${index + 1} (${diary.date})---\n`;
        diaryHistory += `心情: ${diary.mood}\n`;
        diaryHistory += `内容: ${diary.content}\n`;
        diaryHistory += `标签: ${diary.tags ? diary.tags.join(', ') : '无'}\n\n`;
      });
    }
    
    // 构建 OpenAI 提示
    const systemPrompt = `你是一位温暖、善解人意的心理顾问和日记伴侣。你的任务是分析用户的日记内容，并提供深入、个性化的反馈和建议。
分析时请考虑以下要点：
1. 识别用户日记中表达的情感和情绪
2. 找出关键主题、活动和关系
3. 提供共情反馈，表明你理解他们的感受
4. 给出有建设性的建议和积极的肯定
5. 如果用户表现出负面情绪，提供支持性的回应和应对策略
6. 如果发现长期的情绪模式（基于历史日记），可以指出这些模式
7. 使用友好、温暖的语气，就像一位知心好友

请用中文回复，以亲切自然的方式撰写，不要使用明显的模板化语言。回复长度控制在200-300字之间。
避免任何可能被视为心理治疗的语言，你只是提供友好的反思和建议。可以推荐一些书籍和电影`;

    const userPrompt = `以下是我今天(${date})的日记：

心情：${mood}
内容：${content}
标签：${tags.join(', ')}

${diaryHistory}

请分析我的日记，提供你的理解和建议。尽量个性化你的回应，避免使用泛泛而谈的模板回复。在回应中，适当引用我日记中的具体内容，表示你真的读懂了我写的东西。`;

    console.log('发送AI请求');
    
    // 调用 OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // 使用最新版本 GPT 模型
      temperature: 0.7,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: 1000,
    });

    console.log('AI响应成功，生成字数:', response.choices[0].message.content.length);
    
    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('AI分析错误:', error);
    throw new Error(`OpenAI API 错误: ${error.message}`);
  }
}

// 基本分析函数 (备用方案)
async function analyzeContentBasic(content, mood, tags) {
  let analysis = '';
  
  // 根据内容长度生成不同响应
  if (content.length < 50) {
    analysis = '你的日记很简短。尝试多分享一些细节，这样可以更好地记录你的感受和思考。';
  } else if (content.length >= 50 && content.length < 200) {
    analysis = '这是一篇不错的日记。我注意到你提到了一些关键事件。考虑更深入地探讨这些事件如何影响了你的情绪。';
  } else {
    analysis = '你写了一篇很详细的日记！从你的文字中，我能感受到你丰富的情感和思考。继续保持这种深度的表达。';
  }
  
  // 根据心情添加回应
  const moodAnalysis = getMoodAnalysis(mood);
  analysis += '\n\n' + moodAnalysis;
  
  // 根据标签添加个性化建议
  if (tags && tags.length > 0) {
    const tagSuggestions = getTagSuggestions(tags);
    analysis += '\n\n' + tagSuggestions;
  }
  
  return analysis;
}

// 根据心情提供分析
function getMoodAnalysis(mood) {
  const moodResponses = {
    '😊': '看起来你今天心情不错！保持积极的态度对心理健康很有益处。',
    '😍': '你似乎感到非常开心和满足。这种积极的情绪值得珍惜。',
    '🥳': '庆祝的心情！记得享受这些快乐的时刻。',
    '😌': '你今天似乎很平静满足。平和的心态是宝贵的。',
    '🤔': '你似乎在思考某些事情。反思是个人成长的重要部分。',
    '😢': '看起来你今天有些难过。记住，所有的情绪都是暂时的，明天会更好。',
    '😡': '你似乎感到愤怒或沮丧。尝试找出这些情绪的根源，可能会帮助你处理它们。',
    '😴': '你今天可能感到疲倦。确保获得足够的休息是重要的。',
    '🤒': '你可能不太舒服。希望你尽快好起来！记得照顾好自己的健康。',
    '🥺': '你似乎感到有些脆弱或不安。记住，寻求帮助和支持是勇敢的表现。',
  };
  
  return moodResponses[mood] || '感谢分享你的心情！';
}

// 根据标签提供建议
function getTagSuggestions(tags) {
  let suggestions = '基于你的标签，这里有一些建议：';
  
  tags.forEach(tag => {
    switch(tag.toLowerCase()) {
      case '工作':
        suggestions += '\n- 工作：保持工作与生活的平衡很重要。考虑设定明确的工作边界，尝试番茄工作法提高效率。';
        break;
      case '学习':
        suggestions += '\n- 学习：定期短暂休息可以提高学习效率。尝试番茄工作法和间隔重复记忆技巧，保持学习环境整洁有助于专注。';
        break;
      case '健康':
        suggestions += '\n- 健康：定期锻炼和均衡饮食对身心健康都很重要。保持充足的睡眠，每天至少喝8杯水，定期进行健康检查。';
        break;
      case '家庭':
        suggestions += '\n- 家庭：花时间与家人在一起是建立牢固关系的关键。尝试固定的家庭活动时间，创造共同的回忆，倾听彼此的感受。';
        break;
      case '旅行':
        suggestions += '\n- 旅行：探索新地方可以拓宽视野，带来新的灵感。记录你的旅行经历，拍照片不如写下感受，考虑尝试不同类型的旅行体验。';
        break;
      case '爱好':
        suggestions += '\n- 爱好：培养爱好是减轻压力和发展创造力的好方法。每周固定时间投入你的爱好，加入相关社区分享经验。';
        break;
      case '健身':
        suggestions += '\n- 健身：坚持适合自己的运动计划，循序渐进很重要。关注正确的姿势，避免受伤，搭配合理的饮食和休息。尝试找健身伙伴增加动力。';
        break;
      case '美食':
        suggestions += '\n- 美食：享受美食的同时注意饮食均衡。尝试自己下厨探索新食谱，记录喜欢的餐厅和菜肴，偶尔尝试不同文化的料理。';
        break;
      case '阅读':
        suggestions += '\n- 阅读：养成每日阅读习惯能开阔视野。建立个人书单，加入读书俱乐部交流感想，尝试多元化的阅读主题。';
        break;
      case '写作':
        suggestions += '\n- 写作：定期写作有助于整理思绪和提高表达能力。保持写作日志，关注灵感来源，给自己设定适当的写作目标。';
        break;
      case '冥想':
        suggestions += '\n- 冥想：每天花几分钟冥想可以减轻压力，提高专注力。尝试使用指导冥想软件，关注呼吸和身体感受，保持耐心和规律性。';
        break;
      case '社交':
        suggestions += '\n- 社交：建立健康的社交圈对心理健康很重要。定期与朋友联系，参加社区活动，培养倾听和沟通技巧。';
        break;
      case '理财':
        suggestions += '\n- 理财：制定预算和储蓄计划是财务健康的基础。追踪日常支出，设立紧急资金，学习基本的投资知识。';
        break;
      case '心情':
        suggestions += '\n- 心情：关注自己的情绪变化是自我关爱的重要部分。尝试写情绪日记，学习情绪管理技巧，必要时寻求专业支持。';
        break;
      case '音乐':
        suggestions += '\n- 音乐：音乐是缓解压力的绝佳方式。创建不同心情的播放列表，尝试学习乐器，参加音乐活动拓展体验。';
        break;
      default:
        suggestions += `\n- ${tag}：继续关注这个方面，它似乎对你很重要。尝试设定一些相关的小目标，记录你在这方面的成长和收获。`;
    }
  });
  
  return suggestions;
}

// 情感分析助手函数
function detectSentiment(content) {
  // 简单的情感分析逻辑，实际项目中可以用更复杂的算法或AI
  const positiveWords = ['开心', '快乐', '高兴', '满足', '喜欢', '爱', '成功', '感恩', '感谢'];
  const negativeWords = ['难过', '伤心', '沮丧', '失望', '讨厌', '厌恶', '失败', '担心', '焦虑', '压力'];
  
  let positiveCount = 0;
  let negativeCount = 0;
  
  positiveWords.forEach(word => {
    const regex = new RegExp(word, 'g');
    const matches = content.match(regex);
    if (matches) {
      positiveCount += matches.length;
    }
  });
  
  negativeWords.forEach(word => {
    const regex = new RegExp(word, 'g');
    const matches = content.match(regex);
    if (matches) {
      negativeCount += matches.length;
    }
  });
  
  if (positiveCount > negativeCount * 2) {
    return '非常积极';
  } else if (positiveCount > negativeCount) {
    return '积极';
  } else if (negativeCount > positiveCount * 2) {
    return '非常消极';
  } else if (negativeCount > positiveCount) {
    return '消极';
  } else {
    return '中性';
  }
}

// 导出其他可能需要的函数
exports.analyzeContentWithAI = analyzeContentWithAI; 
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({origin: true});

admin.initializeApp();

// 分析日记的函数
exports.analyzeDiary = functions.https.onRequest((req, res) => {
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
      const {diary, diaryId, date, mood, tags, userId} = req.body;
      
      if (!diary || !diaryId || !userId) {
        return res.status(400).json({error: '请求缺少必要数据'});
      }
      
      // 验证用户身份
      if (userId !== uid) {
        return res.status(403).json({error: '用户身份验证失败'});
      }
      
      // 分析日记
      const analysis = await analyzeContent(diary, mood, tags);
      
      // 将分析结果保存到数据库
      await admin.firestore().collection('analyses').add({
        diaryId,
        userId,
        analysis,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
      
      return res.status(200).json({analysis});
    } catch (error) {
      console.error('分析日记时出错:', error);
      return res.status(500).json({error: '处理请求时出错', details: error.message});
    }
  });
});

// 分析内容的辅助函数
async function analyzeContent(content, mood, tags) {
  // 这里实现原 Python 代码中的分析逻辑
  // 如果需要 AI 集成，可以使用类似 OpenAI API 的服务
  
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
        suggestions += '\n- 工作：保持工作与生活的平衡很重要。考虑设定明确的工作边界。';
        break;
      case '学习':
        suggestions += '\n- 学习：定期短暂休息可以提高学习效率。尝试番茄工作法。';
        break;
      case '健康':
        suggestions += '\n- 健康：定期锻炼和均衡饮食对身心健康都很重要。';
        break;
      case '家庭':
        suggestions += '\n- 家庭：花时间与家人在一起是建立牢固关系的关键。';
        break;
      case '旅行':
        suggestions += '\n- 旅行：探索新地方可以拓宽视野，带来新的灵感。';
        break;
      case '爱好':
        suggestions += '\n- 爱好：培养爱好是减轻压力和发展创造力的好方法。';
        break;
      default:
        suggestions += `\n- ${tag}：继续关注这个方面，它似乎对你很重要。`;
    }
  });
  
  return suggestions;
} 
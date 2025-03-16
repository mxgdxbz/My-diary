# AI 增强的日记分析功能

这个文档描述了如何设置和部署 AI 增强版的日记分析功能。该功能使用 OpenAI API 来提供更个性化、更深入的日记分析，帮助用户获得更有价值的反馈。

## 功能特点

- 使用 OpenAI API 进行深度内容分析
- 基于用户历史日记进行上下文感知的分析
- 智能识别情绪和主题
- 提供个性化的建议和反馈
- 备用机制：当 AI 服务不可用时自动回退到基本分析

## 安装与设置

1. 安装所需依赖：

```bash
cd functions
npm install openai dotenv cors
```

2. 设置 OpenAI API 密钥：

创建或编辑 `.env` 文件，添加你的 OpenAI API 密钥：

```
OPENAI_API_KEY=你的OpenAI密钥
```

3. 修改 functions/package.json，将 main 字段设置为 "index-ai.js"

```json
{
  "main": "index-ai.js",
  // 其他配置...
}
```

4. 部署到 Firebase Functions：

我们提供了两种部署方式：

方式一：使用特定配置文件部署
```bash
# 设置环境变量
firebase functions:config:set openai.apikey="你的OpenAI密钥"

# 使用特定配置文件部署函数
firebase deploy --only functions:analyzeDiaryWithAI --config firebase-ai.json
```

方式二：使用部署脚本
```bash
# 设置环境变量
export OPENAI_API_KEY=你的OpenAI密钥

# 执行部署脚本
./deploy-ai.sh
```

注意：这种部署方式会避免同时部署 Python 函数，只部署 JavaScript 的 AI 函数。

## 使用方法

前端应用可以通过以下方式调用 AI 分析功能：

```javascript
const response = await fetch('https://us-central1-diary-darling.cloudfunctions.net/analyzeDiaryWithAI', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}` // 用户认证令牌
  },
  body: JSON.stringify({
    diary: '日记内容',
    diaryId: '日记ID',
    date: '日期',
    mood: '心情',
    userId: '用户ID',
    tags: ['标签1', '标签2'],
    previousDiaries: [] // 可选：用户之前的日记，用于上下文分析
  }),
});

const data = await response.json();
console.log(data.analysis); // AI 生成的分析
```

## 故障排除

如果遇到 AI 分析服务的问题：

1. 检查 Firebase Functions 日志：
```bash
firebase functions:log
```

2. 验证 OpenAI API 密钥是否正确设置
3. 确认网络连接和 API 配额
4. 如果 AI 分析失败，功能将自动回退到基本分析方法

## 注意事项

- OpenAI API 可能会产生费用，请监控你的使用情况
- 确保用户数据的隐私和安全
- 考虑实现速率限制，避免过度使用 API

## 定制和扩展

你可以修改 `analyzeContentWithAI` 函数中的 prompt 模板，以调整 AI 分析的风格和内容。系统提示（system prompt）定义了 AI 的角色和分析指南，而用户提示（user prompt）则包含了待分析的日记内容。 
#!/bin/bash

# 部署 AI 增强版日记分析功能

# 从 .env 文件加载环境变量
if [ -f .env ]; then
    echo "从 .env 文件加载环境变量..."
    export $(grep -v '^#' .env | xargs)
fi

# 检查是否设置了 OpenAI API 密钥
if [ -z "$OPENAI_API_KEY" ]; then
    echo "错误: 环境变量 OPENAI_API_KEY 未设置。"
    echo "请确保 .env 文件中包含有效的 OPENAI_API_KEY，或者手动设置环境变量:"
    echo "export OPENAI_API_KEY=你的密钥"
    exit 1
fi

# 显示找到的密钥（隐藏部分内容）
MASKED_KEY="${OPENAI_API_KEY:0:8}...${OPENAI_API_KEY: -8}"
echo "找到 API 密钥: $MASKED_KEY"

# 安装依赖
echo "正在安装依赖..."
npm install

# 设置 Firebase 环境变量
echo "正在设置 Firebase 环境变量..."
firebase functions:config:set openai.apikey="$OPENAI_API_KEY"

# 部署函数
echo "正在部署 AI 增强功能..."
firebase deploy --only functions:analyzeDiaryWithAI --config firebase-ai.json

echo "部署完成！"
echo "您可以在 Firebase 控制台查看函数状态和日志。" 
#!/bin/bash

# 设置项目
PROJECT_ID="diary-darling"

echo "=== 开始部署 Python 函数至 $PROJECT_ID ==="

# 查找 Firebase CLI
if command -v firebase &> /dev/null; then
    FIREBASE_CMD="firebase"
elif [ -f "../node_modules/.bin/firebase" ]; then
    FIREBASE_CMD="../node_modules/.bin/firebase"
elif [ -f "$(npm root -g)/firebase-tools/lib/bin/firebase.js" ]; then
    FIREBASE_CMD="$(npm root -g)/firebase-tools/lib/bin/firebase.js"
else
    echo "错误: 找不到 Firebase CLI。请确保已安装 Firebase CLI:"
    echo "npm install -g firebase-tools"
    echo "或在项目中本地安装:"
    echo "npm install firebase-tools"
    exit 1
fi

echo "使用 Firebase CLI: $FIREBASE_CMD"

# 安装依赖项
echo "正在安装 Node.js 依赖项..."
./install-deps.sh

# 确保已登录
$FIREBASE_CMD use $PROJECT_ID

# 部署函数
echo "正在部署 analyzeDiary 函数..."
$FIREBASE_CMD deploy --only functions:python-functions:analyzeDiary

echo "=== 部署完成 ===" 
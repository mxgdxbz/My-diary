#!/bin/bash

echo "=== 安装 Node.js 依赖项 ==="

# 清理 node_modules 目录（如果存在）
if [ -d "node_modules" ]; then
    echo "清理现有的 node_modules 目录..."
    rm -rf node_modules
fi

# 清理 package-lock.json（如果存在）
if [ -f "package-lock.json" ]; then
    echo "清理现有的 package-lock.json..."
    rm package-lock.json
fi

# 安装 Node.js 依赖项
echo "安装依赖项..."
npm install

echo "=== 依赖项安装完成 ===" 
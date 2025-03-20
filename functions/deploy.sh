#!/bin/bash

# 设置项目
PROJECT_ID="diary-darling"

echo "=== 开始部署至 $PROJECT_ID ==="

# 确保已登录
firebase use $PROJECT_ID

# 部署函数
echo "正在部署 analyzeDiary 函数..."
firebase deploy --only functions:analyzeDiary

echo "=== 部署完成 ===" 
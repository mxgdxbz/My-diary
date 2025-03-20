#!/bin/bash

echo "=== 设置 Python 函数开发环境 ==="

# 检查 Node.js 和 npm
if ! command -v node &> /dev/null || ! command -v npm &> /dev/null; then
    echo "错误: 需要 Node.js 和 npm。请从 https://nodejs.org 安装。"
    exit 1
fi

# 安装 Firebase CLI
echo "正在安装 Firebase CLI..."
npm install -g firebase-tools

# 创建 Python 虚拟环境
echo "正在创建 Python 虚拟环境..."
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
else
    echo "错误: 找不到 Python。请安装 Python 3.11 或更高版本。"
    exit 1
fi

# 检查 Python 版本
PY_VERSION=$($PYTHON_CMD -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
echo "检测到 Python 版本: $PY_VERSION"

# 创建虚拟环境
if [ ! -d "venv" ]; then
    $PYTHON_CMD -m venv venv
    echo "已创建虚拟环境。"
else
    echo "虚拟环境已存在。"
fi

# 激活虚拟环境并安装依赖项
echo "正在安装 Python 依赖项..."
if [[ "$OSTYPE" == "darwin"* ]] || [[ "$OSTYPE" == "linux-gnu"* ]]; then
    source venv/bin/activate
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    source venv/Scripts/activate
fi

pip install -r requirements.txt

echo "=== 设置完成 ==="
echo "现在您可以运行 ./deploy.sh 来部署函数。" 
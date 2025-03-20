#!/bin/bash

echo "启动样式预览检查..."

# 构建生产版本
echo "构建生产版本..."
npm run build

# 启动预览服务器
echo "启动预览服务器..."
npm run preview &
PREVIEW_PID=$!

# 等待服务器启动
sleep 3

# 打开默认浏览器预览
echo "正在打开浏览器进行预览..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    open http://localhost:4173
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    xdg-open http://localhost:4173
elif [[ "$OSTYPE" == "msys" ]]; then
    # Windows
    start http://localhost:4173
fi

echo "请检查以下内容："
echo "1. 壁纸加载是否正常"
echo "2. 暗色/亮色模式切换效果"
echo "3. 磨砂玻璃效果"
echo "4. 动画过渡是否流畅"
echo "5. 响应式布局在不同尺寸下的表现"
echo "6. 字体显示是否清晰"
echo "7. 按钮和交互元素的状态变化"

echo "按回车键结束预览..."
read

# 关闭预览服务器
kill $PREVIEW_PID

echo "预览检查完成！" 
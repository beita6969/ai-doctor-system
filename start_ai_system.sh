#!/bin/bash

# AI智能医生诊断系统 - 启动脚本
# Start Script for AI Doctor Diagnosis System

echo "🩺 启动AI智能医生诊断系统"
echo "========================="

# 激活虚拟环境
if [ -d "venv" ]; then
    source venv/bin/activate
    echo "✓ 已激活虚拟环境"
else
    echo "⚠️  虚拟环境不存在，使用系统Python"
fi

# 检查依赖
echo "📋 检查系统依赖..."
python3 -c "import flask, anthropic" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "❌ 缺少必要依赖，请运行: pip install -r requirements.txt"
    exit 1
fi
echo "✓ 依赖检查通过"

# 创建必要目录
mkdir -p brats_tumor_app/static/uploads

# 启动服务器
echo "🚀 正在启动服务器..."
echo "📝 启动信息："
echo "   - 访问地址：http://localhost:5002"
echo "   - 停止服务：按 Ctrl+C"
echo ""

# 启动应用（前台运行）
python3 ai_doctor_simple.py
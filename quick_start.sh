#!/bin/bash

# AI智能医生诊断系统 - 快速启动脚本
# Quick Start Script for AI Doctor Diagnosis System

echo "🩺 AI智能医生诊断系统 快速启动"
echo "=================================="

# 检查Python版本
echo "📋 检查系统环境..."
if ! command -v python3 &> /dev/null; then
    echo "❌ 错误：未找到Python3，请先安装Python 3.8+"
    exit 1
fi

PYTHON_VERSION=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
echo "✓ Python版本: $PYTHON_VERSION"

# 检查是否存在虚拟环境
if [ ! -d "venv" ]; then
    echo "📦 创建虚拟环境..."
    python3 -m venv venv
    if [ $? -ne 0 ]; then
        echo "❌ 创建虚拟环境失败"
        exit 1
    fi
    echo "✓ 虚拟环境创建成功"
else
    echo "✓ 虚拟环境已存在"
fi

# 激活虚拟环境
echo "🔧 激活虚拟环境..."
source venv/bin/activate

# 安装依赖
echo "📥 安装依赖包..."
pip install --upgrade pip
pip install -r requirements.txt
if [ $? -ne 0 ]; then
    echo "❌ 依赖安装失败，请检查网络连接"
    exit 1
fi
echo "✓ 依赖安装完成"

# 检查API密钥配置
echo "🔑 检查API配置..."
if grep -q "sk-ant-api03-ssVc4OQeJBpe" ai_doctor_simple.py; then
    echo "⚠️  警告：请配置您的Claude API密钥"
    echo "   编辑 ai_doctor_simple.py 文件中的 ANTHROPIC_API_KEY"
    echo "   获取API密钥：https://www.anthropic.com"
fi

# 创建上传目录
mkdir -p brats_tumor_app/static/uploads

echo ""
echo "🚀 准备启动AI医生系统..."
echo "📝 启动信息："
echo "   - 访问地址：http://localhost:5002"
echo "   - 停止服务：按 Ctrl+C"
echo ""
echo "⚡ 正在启动服务器..."

# 启动应用
python ai_doctor_simple.py
# 🩺 AI智能医生诊断系统

一个基于Claude AI的智能医疗诊断系统，提供专业的医学诊断、处方开具和病历报告生成服务。

![AI Doctor System](https://img.shields.io/badge/AI-Doctor-blue.svg)
![Python](https://img.shields.io/badge/Python-3.8+-green.svg)
![Flask](https://img.shields.io/badge/Flask-2.0+-orange.svg)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

## ✨ 主要功能

- **🔍 智能诊断** - 基于症状描述提供专业医学诊断
- **💊 处方管理** - 智能生成个性化用药处方
- **📄 病历报告** - 自动生成专业医疗报告（PDF/DOCX）
- **📊 历史记录** - 完整的诊断历史管理
- **🎨 现代界面** - 响应式设计，支持多设备访问

## 🚀 快速开始

### 方法一：一键启动（推荐）

```bash
# 克隆仓库
git clone https://github.com/yourusername/ai-doctor-system.git
cd ai-doctor-system

# 运行一键启动脚本
chmod +x quick_start.sh
./quick_start.sh
```

### 方法二：手动安装

1. **克隆项目**
```bash
git clone https://github.com/yourusername/ai-doctor-system.git
cd ai-doctor-system
```

2. **创建虚拟环境**
```bash
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

3. **安装依赖**
```bash
pip install -r requirements.txt
```

4. **配置API密钥**
   - 编辑 `ai_doctor_simple.py` 文件
   - 将 `ANTHROPIC_API_KEY` 替换为您的Claude API密钥

5. **启动应用**
```bash
python ai_doctor_simple.py
```

6. **访问系统**
   - 打开浏览器访问：http://localhost:5002

## 📋 系统要求

- **Python**: 3.8+
- **操作系统**: Windows / macOS / Linux
- **内存**: 建议 2GB+
- **网络**: 需要互联网连接（访问Claude API）

## 🔧 依赖包

- `Flask` - Web框架
- `anthropic` - Claude AI API客户端
- `python-docx` - Word文档生成
- `reportlab` - PDF报告生成
- `flask-cors` - 跨域支持

## 📁 项目结构

```
ai-doctor-system/
├── ai_doctor_simple.py          # 主应用程序
├── brats_tumor_app/
│   ├── models/
│   │   └── ai_doctor.py         # AI医生核心模块
│   ├── templates/
│   │   └── ai_doctor_enhanced.html  # 前端模板
│   └── static/
│       ├── css/
│       │   └── ai_doctor_enhanced.css  # 样式文件
│       └── js/
│           └── ai_doctor_enhanced.js   # 前端脚本
├── requirements.txt             # Python依赖
├── quick_start.sh              # 快速启动脚本
├── start_ai_system.sh          # 系统启动脚本
└── README.md                   # 项目文档
```

## 🎯 使用指南

### 智能诊断
1. 点击"智能诊断"标签
2. 填写患者基本信息（年龄、性别等）
3. 详细描述症状
4. 点击"开始诊断"获取AI分析结果

### 处方管理
1. 完成诊断后，点击"生成处方"
2. 填写患者过敏史等额外信息
3. 获取个性化用药建议
4. 查看药物相互作用和注意事项

### 病历报告
1. 完成诊断和处方后
2. 点击"生成病历报告"
3. 选择报告格式（PDF或DOCX）
4. 下载专业医疗报告

## ⚠️ 重要声明

**本系统仅供医学参考和教育用途，不能替代专业医生的诊断和治疗建议。任何医疗决策都应咨询专业医生。**

## 🔐 API配置

获取Claude API密钥：
1. 访问 [Anthropic官网](https://www.anthropic.com)
2. 注册账户并获取API密钥
3. 将密钥配置到 `ai_doctor_simple.py` 文件中

## 🤝 贡献指南

欢迎提交Issue和Pull Request来改进项目！

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🆘 常见问题

**Q: 系统无法启动？**
A: 检查Python版本（需要3.8+）和依赖安装是否完整

**Q: AI诊断返回错误？**
A: 检查API密钥配置和网络连接

**Q: 如何更新API密钥？**
A: 编辑 `ai_doctor_simple.py` 文件中的 `ANTHROPIC_API_KEY` 变量

## 📞 支持

如有问题，请提交Issue或联系开发者。

---

**⭐ 如果这个项目对您有帮助，请给个Star支持一下！**
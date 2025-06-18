# 配置指南

## API密钥配置

### 1. 获取Claude API密钥

1. 访问 [Anthropic官网](https://www.anthropic.com)
2. 注册账户并获取API密钥
3. 复制您的API密钥

### 2. 配置API密钥

**方法一：直接修改代码文件**

编辑 `ai_doctor_simple.py` 文件，找到第35行：

```python
ANTHROPIC_API_KEY = 'YOUR_ANTHROPIC_API_KEY'
```

将 `'YOUR_ANTHROPIC_API_KEY'` 替换为您的真实API密钥。

**方法二：使用环境变量（推荐）**

您也可以创建 `.env` 文件来存储API密钥：

1. 在项目根目录创建 `.env` 文件：
```bash
touch .env
```

2. 在 `.env` 文件中添加：
```
ANTHROPIC_API_KEY=your_actual_api_key_here
```

3. 修改 `ai_doctor_simple.py` 使用环境变量：
```python
import os
from dotenv import load_dotenv

load_dotenv()
ANTHROPIC_API_KEY = os.getenv('ANTHROPIC_API_KEY', 'YOUR_ANTHROPIC_API_KEY')
```

### 3. 安全提醒

- **不要**将真实的API密钥提交到Git仓库
- `.env` 文件已在 `.gitignore` 中被忽略
- 定期轮换您的API密钥
- 监控API使用情况

## 其他配置选项

### 服务器配置

- **端口**: 默认5002，可在 `ai_doctor_simple.py` 最后一行修改
- **主机**: 默认绑定所有地址 (0.0.0.0)
- **调试模式**: 生产环境建议关闭 `debug=False`

### 文件上传限制

- **最大文件大小**: 500MB（可在代码中修改）
- **允许的文件类型**: 当前支持医学影像格式

---

**注意**: 首次运行前请确保完成API密钥配置，否则系统将无法正常工作。
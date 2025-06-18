# GitHub仓库创建和推送指南

## 方法一：通过GitHub CLI（推荐）

如果您安装了GitHub CLI：

```bash
# 在项目目录中运行
cd "/Users/zhangmingda/Desktop/康彦"

# 创建GitHub仓库并推送
gh repo create ai-doctor-system --public --description "🩺 AI智能医生诊断系统 - 基于Claude AI的智能医疗诊断、处方管理和病历报告生成系统" --push --source .
```

## 方法二：通过GitHub网站

### 1. 在GitHub上创建新仓库

1. 访问 https://github.com/new
2. 填写仓库信息：
   - **Repository name**: `ai-doctor-system`
   - **Description**: `🩺 AI智能医生诊断系统 - 基于Claude AI的智能医疗诊断、处方管理和病历报告生成系统`
   - **Visibility**: Public（公开）
   - **不要**初始化README、.gitignore或LICENSE（我们已经创建了）

3. 点击 "Create repository"

### 2. 推送本地代码到GitHub

在终端中运行以下命令：

```bash
cd "/Users/zhangmingda/Desktop/康彦"

# 添加远程仓库（替换 YOUR_USERNAME 为您的GitHub用户名）
git remote add origin https://github.com/YOUR_USERNAME/ai-doctor-system.git

# 推送代码到GitHub
git push -u origin main
```

## 方法三：使用SSH（如果已配置SSH密钥）

```bash
cd "/Users/zhangmingda/Desktop/康彦"

# 添加远程仓库（SSH方式）
git remote add origin git@github.com:YOUR_USERNAME/ai-doctor-system.git

# 推送代码
git push -u origin main
```

## 项目信息

- **项目名称**: AI智能医生诊断系统
- **仓库名**: ai-doctor-system
- **主要语言**: Python
- **框架**: Flask
- **特性标签**: ai, medical, diagnosis, flask, python, claude-ai

## 推送成功后

仓库地址将是：`https://github.com/YOUR_USERNAME/ai-doctor-system`

## 下一步

1. 在GitHub仓库页面设置Topics标签：
   - `ai`
   - `medical`
   - `diagnosis`
   - `flask`
   - `python`
   - `claude-ai`
   - `healthcare`

2. 可以考虑添加GitHub Actions进行CI/CD

3. 添加贡献指南和问题模板

---

**注意**: 请记得在推送前确保API密钥等敏感信息已被正确处理（当前代码中包含示例密钥，推送前应修改）。
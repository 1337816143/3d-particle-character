#!/usr/bin/env python3
"""
GitHub Pages 自动部署工具
用于快速上传文件到GitHub仓库并部署到GitHub Pages
"""

import os
import sys
import base64
from pathlib import Path

# 配置信息 - 请修改这些值
GITHUB_USERNAME = "YOUR_USERNAME"  # 你的GitHub用户名
REPO_NAME = "3d-particle-character"  # 仓库名称
BRANCH = "main"  # 分支名称

# 需要上传的文件
FILES_TO_UPLOAD = [
    "project_3d_3_final.html",
    "config.json",
    "model.glb"
]

def print_header(text):
    print(f"\n{'='*60}")
    print(f"  {text}")
    print(f"{'='*60}\n")

def print_step(step, text):
    print(f"\n[{step}] {text}")

def print_success(text):
    print(f"  ✅ {text}")

def print_warning(text):
    print(f"  ⚠️  {text}")

def print_error(text):
    print(f"  ❌ {text}")

def check_files_exist():
    """检查所有需要上传的文件是否存在"""
    print_step(1, "检查文件...")
    
    missing_files = []
    for file in FILES_TO_UPLOAD:
        if not os.path.exists(file):
            missing_files.append(file)
            print_error(f"文件不存在: {file}")
    
    if missing_files:
        print_error(f"缺少 {len(missing_files)} 个文件，请确保所有文件都在当前目录")
        return False
    
    print_success(f"所有 {len(FILES_TO_UPLOAD)} 个文件都存在")
    return True

def generate_github_commands():
    """生成GitHub命令"""
    print_step(2, "生成部署命令...")
    
    print_header("方法1：使用GitHub CLI（推荐）")
    print("""
# 1. 安装 GitHub CLI（如果还没有）
# Windows: 下载 https://cli.github.com/
# Mac: brew install gh
# Linux: sudo apt install gh

# 2. 登录 GitHub
gh auth login

# 3. 创建仓库（如果还没有）
gh repo create {REPO_NAME} --public

# 4. 初始化本地仓库
git init
git add .
git commit -m "Initial commit"

# 5. 添加远程仓库
git remote add origin https://github.com/{GITHUB_USERNAME}/{REPO_NAME}.git

# 6. 推送到 GitHub
git branch -M main
git push -u origin main

# 7. 启用 GitHub Pages
gh api repos/{GITHUB_USERNAME}/{REPO_NAME}/pages -X PUT -f source_branch=main
""".format(
        GITHUB_USERNAME=GITHUB_USERNAME,
        REPO_NAME=REPO_NAME
    ))
    
    print_header("方法2：手动上传（无需Git）")
    print(f"""
1. 访问: https://github.com/new
2. 仓库名称: {REPO_NAME}
3. 选择: Public
4. 点击: Create repository
5. 上传文件:
""")
    
    for file in FILES_TO_UPLOAD:
        print(f"   - {file}")
    
    print(f"""
6. 提交信息: Initial commit
7. 点击: Commit changes

8. 启用 GitHub Pages:
   - 进入仓库 Settings
   - 左侧点击 Pages
   - Source 选择: Deploy from a branch
   - Branch 选择: {BRANCH}
   - 点击: Save

9. 等待1-2分钟，访问:
   https://{GITHUB_USERNAME}.github.io/{REPO_NAME}/project_3d_3_final.html
""".format(
        GITHUB_USERNAME=GITHUB_USERNAME,
        REPO_NAME=REPO_NAME,
        BRANCH=BRANCH
    ))

def generate_config_template():
    """生成配置文件模板"""
    print_step(3, "生成配置文件模板...")
    
    config_template = f"""{{
  "modelName": "model.glb",
  "modelUrl": "https://raw.githubusercontent.com/{GITHUB_USERNAME}/{REPO_NAME}/{BRANCH}/model.glb",
  "photos": [],
  "musicUrl": "",
  "letter": "在这个特别的时刻，\\n我想告诉你，\\n你是我眼中的万千星河。\\n\\n(请点击右上角上传书信修改此内容)",
  "theme": 0
}}"""
    
    print_header("config.json 内容")
    print(config_template)
    
    # 保存到文件
    with open('config_template.json', 'w', encoding='utf-8') as f:
        f.write(config_template)
    
    print_success("已生成 config_template.json，请根据需要修改后重命名为 config.json")

def main():
    print_header("🚀 GitHub Pages 自动部署工具")
    
    # 检查文件
    if not check_files_exist():
        sys.exit(1)
    
    # 生成命令
    generate_github_commands()
    
    # 生成配置模板
    generate_config_template()
    
    print_header("📝 下一步操作")
    print("""
1. 修改本脚本中的配置信息:
   - GITHUB_USERNAME: 你的GitHub用户名
   - REPO_NAME: 仓库名称

2. 运行生成的命令部署到 GitHub

3. 修改 config.json 添加你的照片、音乐等

4. 分享 GitHub Pages URL 给朋友！

详细教程请查看: 部署教程.md
""")

if __name__ == "__main__":
    main()
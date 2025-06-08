#!/bin/bash

# AI导航页自动部署脚本

echo "🚀 开始部署AI导航页..."

# 1. 构建项目
echo "📦 构建项目..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ 构建失败！"
    exit 1
fi

# 2. 切换到gh-pages分支
echo "🔄 切换到gh-pages分支..."
git checkout gh-pages

# 3. 清理旧文件（保留.git目录）
echo "🧹 清理旧文件..."
find . -maxdepth 1 ! -name '.git' ! -name '.' ! -name '..' -exec rm -rf {} +

# 4. 复制新的构建文件
echo "📋 复制构建文件..."
cp -r dist/* .

# 5. 提交更改
echo "💾 提交更改..."
git add .
git commit -m "部署：更新网站 $(date '+%Y-%m-%d %H:%M:%S')"

# 6. 推送到远程仓库
echo "⬆️ 推送到Gitee..."
git push origin gh-pages

# 7. 切换回master分支
echo "🔄 切换回master分支..."
git checkout master

echo "✅ 部署完成！"
echo "🌐 请访问: https://guoyi6.gitee.io/ai-navigation"
echo "📝 注意：Gitee Pages可能需要几分钟时间更新" 
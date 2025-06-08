#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

console.log('🚀 开始部署测试...')

// 检查必要文件
const requiredFiles = [
  'package.json',
  'vite.config.ts',
  'src/main.ts',
  'src/App.vue',
  'public/logo.svg',
  'data/config.json'
]

console.log('📋 检查必要文件...')
let allFilesExist = true

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`)
  } else {
    console.log(`❌ ${file} - 文件不存在`)
    allFilesExist = false
  }
})

if (!allFilesExist) {
  console.log('❌ 部署测试失败：缺少必要文件')
  process.exit(1)
}

// 检查配置文件
console.log('\n🔧 检查配置文件...')

try {
  const viteConfig = fs.readFileSync('vite.config.ts', 'utf8')
  
  if (viteConfig.includes("base: './'")) {
    console.log('✅ Vite base 配置正确')
  } else {
    console.log('⚠️  Vite base 配置可能有问题')
  }
  
  if (viteConfig.includes('createWebHashHistory')) {
    console.log('✅ 路由配置为 Hash 模式')
  } else {
    console.log('⚠️  路由可能不是 Hash 模式')
  }
  
} catch (error) {
  console.log('❌ 读取配置文件失败:', error.message)
}

// 检查数据文件
console.log('\n📊 检查数据文件...')

try {
  const configData = JSON.parse(fs.readFileSync('data/config.json', 'utf8'))
  console.log('✅ config.json 格式正确')
  
  const categoriesData = JSON.parse(fs.readFileSync('data/categories.json', 'utf8'))
  console.log('✅ categories.json 格式正确')
  
  const navigationData = JSON.parse(fs.readFileSync('data/navigation_001.json', 'utf8'))
  console.log('✅ navigation_001.json 格式正确')
  
} catch (error) {
  console.log('❌ 数据文件格式错误:', error.message)
}

console.log('\n🎉 部署测试完成！')
console.log('\n📝 部署建议：')
console.log('1. 运行 npm run build 构建项目')
console.log('2. 将 dist 目录上传到 Gitee Pages')
console.log('3. 配置 Gitee Pages 使用 dist 目录')
console.log('4. 访问 https://您的用户名.gitee.io/仓库名/') 
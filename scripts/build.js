#!/usr/bin/env node

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const { gzipSync } = require('zlib')

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logStep(step, message) {
  log(`[${step}] ${message}`, 'cyan')
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green')
}

function logError(message) {
  log(`❌ ${message}`, 'red')
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow')
}

// 获取文件大小
function getFileSize(filePath) {
  const stats = fs.statSync(filePath)
  return (stats.size / 1024).toFixed(2) + ' KB'
}

// 获取Gzip压缩后大小
function getGzipSize(filePath) {
  const content = fs.readFileSync(filePath)
  const compressed = gzipSync(content)
  return (compressed.length / 1024).toFixed(2) + ' KB'
}

// 分析构建产物
function analyzeBuildOutput() {
  const distPath = path.join(process.cwd(), 'dist')
  
  if (!fs.existsSync(distPath)) {
    logError('构建目录不存在')
    return
  }

  logStep('ANALYZE', '分析构建产物...')
  
  const assets = []
  
  function scanDirectory(dir, prefix = '') {
    const files = fs.readdirSync(dir)
    
    files.forEach(file => {
      const filePath = path.join(dir, file)
      const relativePath = path.join(prefix, file)
      const stats = fs.statSync(filePath)
      
      if (stats.isDirectory()) {
        scanDirectory(filePath, relativePath)
      } else {
        const size = stats.size
        const gzipSize = gzipSync(fs.readFileSync(filePath)).length
        
        assets.push({
          path: relativePath,
          size,
          gzipSize,
          type: path.extname(file).slice(1) || 'other'
        })
      }
    })
  }
  
  scanDirectory(distPath)
  
  // 按大小排序
  assets.sort((a, b) => b.size - a.size)
  
  // 统计信息
  const totalSize = assets.reduce((sum, asset) => sum + asset.size, 0)
  const totalGzipSize = assets.reduce((sum, asset) => sum + asset.gzipSize, 0)
  
  log('\n📊 构建产物分析:', 'bright')
  log(`总大小: ${(totalSize / 1024).toFixed(2)} KB`)
  log(`Gzip后: ${(totalGzipSize / 1024).toFixed(2)} KB`)
  log(`压缩率: ${((1 - totalGzipSize / totalSize) * 100).toFixed(1)}%`)
  
  // 按类型分组
  const typeStats = {}
  assets.forEach(asset => {
    if (!typeStats[asset.type]) {
      typeStats[asset.type] = { count: 0, size: 0, gzipSize: 0 }
    }
    typeStats[asset.type].count++
    typeStats[asset.type].size += asset.size
    typeStats[asset.type].gzipSize += asset.gzipSize
  })
  
  log('\n📁 文件类型统计:', 'bright')
  Object.entries(typeStats).forEach(([type, stats]) => {
    log(`${type.toUpperCase()}: ${stats.count} 个文件, ${(stats.size / 1024).toFixed(2)} KB (${(stats.gzipSize / 1024).toFixed(2)} KB gzipped)`)
  })
  
  // 显示最大的文件
  log('\n📋 最大的文件 (前10个):', 'bright')
  assets.slice(0, 10).forEach(asset => {
    log(`${asset.path}: ${(asset.size / 1024).toFixed(2)} KB (${(asset.gzipSize / 1024).toFixed(2)} KB gzipped)`)
  })
  
  // 检查大文件警告
  const largeFiles = assets.filter(asset => asset.size > 500 * 1024) // 500KB
  if (largeFiles.length > 0) {
    logWarning(`发现 ${largeFiles.length} 个大文件 (>500KB):`)
    largeFiles.forEach(file => {
      logWarning(`  ${file.path}: ${(file.size / 1024).toFixed(2)} KB`)
    })
  }
}

// 检查环境变量
function checkEnvironment() {
  logStep('ENV', '检查环境变量...')
  
  const requiredEnvVars = [
    'VITE_GITEE_TOKEN',
    'VITE_GITEE_OWNER',
    'VITE_GITEE_REPO'
  ]
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName])
  
  if (missingVars.length > 0) {
    logWarning(`缺少环境变量: ${missingVars.join(', ')}`)
    logWarning('请确保在 .env 文件中设置了这些变量')
  } else {
    logSuccess('环境变量检查通过')
  }
}

// 清理构建目录
function cleanBuildDirectory() {
  logStep('CLEAN', '清理构建目录...')
  
  const distPath = path.join(process.cwd(), 'dist')
  
  if (fs.existsSync(distPath)) {
    fs.rmSync(distPath, { recursive: true, force: true })
    logSuccess('构建目录已清理')
  } else {
    log('构建目录不存在，跳过清理')
  }
}

// 执行构建
function runBuild() {
  logStep('BUILD', '开始构建...')
  
  try {
    execSync('npm run build', { stdio: 'inherit' })
    logSuccess('构建完成')
  } catch (error) {
    logError('构建失败')
    process.exit(1)
  }
}

// 生成构建报告
function generateBuildReport() {
  logStep('REPORT', '生成构建报告...')
  
  const report = {
    buildTime: new Date().toISOString(),
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    environment: process.env.NODE_ENV || 'production',
    gitCommit: null,
    gitBranch: null
  }
  
  // 获取Git信息
  try {
    report.gitCommit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim()
    report.gitBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim()
  } catch (error) {
    logWarning('无法获取Git信息')
  }
  
  // 保存报告
  const reportPath = path.join(process.cwd(), 'dist', 'build-report.json')
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
  
  logSuccess(`构建报告已保存到: ${reportPath}`)
}

// 优化建议
function provideBuildOptimizations() {
  log('\n💡 构建优化建议:', 'bright')
  
  const suggestions = [
    '使用 CDN 加载大型第三方库',
    '启用 Gzip 压缩',
    '配置浏览器缓存策略',
    '使用 WebP 格式的图片',
    '启用代码分割和懒加载',
    '移除未使用的 CSS 和 JavaScript',
    '使用 Service Worker 进行缓存'
  ]
  
  suggestions.forEach((suggestion, index) => {
    log(`${index + 1}. ${suggestion}`)
  })
}

// 主函数
function main() {
  const startTime = Date.now()
  
  log('🚀 开始构建 AI导航页面...', 'bright')
  log('=' * 50, 'cyan')
  
  try {
    // 检查环境
    checkEnvironment()
    
    // 清理构建目录
    cleanBuildDirectory()
    
    // 执行构建
    runBuild()
    
    // 分析构建产物
    analyzeBuildOutput()
    
    // 生成构建报告
    generateBuildReport()
    
    // 提供优化建议
    provideBuildOptimizations()
    
    const endTime = Date.now()
    const buildTime = ((endTime - startTime) / 1000).toFixed(2)
    
    log('\n' + '=' * 50, 'cyan')
    logSuccess(`构建完成! 耗时: ${buildTime}s`)
    log('🎉 项目已准备好部署到 Gitee Pages', 'green')
    
  } catch (error) {
    logError(`构建过程中发生错误: ${error.message}`)
    process.exit(1)
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main()
}

module.exports = {
  main,
  analyzeBuildOutput,
  checkEnvironment,
  cleanBuildDirectory,
  runBuild,
  generateBuildReport
} 
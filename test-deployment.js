const fs = require('fs');
const path = require('path');

console.log('🚀 AI导航页部署测试');
console.log('==================');

// 检查必要文件
const requiredFiles = [
  'dist/index.html',
  'dist/logo.svg',
  'package.json',
  'vite.config.ts'
];

console.log('\n📁 检查必要文件...');
let allFilesExist = true;
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - 文件不存在`);
    allFilesExist = false;
  }
});

// 检查构建产物
console.log('\n🏗️ 检查构建产物...');
const distDir = 'dist';
if (fs.existsSync(distDir)) {
  const distContents = fs.readdirSync(distDir);
  console.log(`✅ dist目录存在，包含 ${distContents.length} 个文件/目录`);
  console.log(`   内容: ${distContents.join(', ')}`);
  
  // 检查关键文件
  const keyFiles = ['index.html', 'js', 'css'];
  keyFiles.forEach(file => {
    if (distContents.includes(file)) {
      console.log(`✅ ${file} 存在`);
    } else {
      console.log(`❌ ${file} 缺失`);
      allFilesExist = false;
    }
  });
} else {
  console.log('❌ dist目录不存在');
  allFilesExist = false;
}

// 检查package.json配置
console.log('\n📦 检查package.json配置...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  console.log(`✅ 项目名称: ${packageJson.name}`);
  console.log(`✅ 版本: ${packageJson.version}`);
  
  if (packageJson.scripts && packageJson.scripts.build) {
    console.log('✅ build脚本存在');
  } else {
    console.log('❌ build脚本缺失');
  }
  
  if (packageJson.scripts && packageJson.scripts.preview) {
    console.log('✅ preview脚本存在');
  } else {
    console.log('⚠️ preview脚本缺失（可选）');
  }
} catch (error) {
  console.log('❌ package.json读取失败');
  allFilesExist = false;
}

// 检查vite配置
console.log('\n⚙️ 检查vite配置...');
try {
  const viteConfig = fs.readFileSync('vite.config.ts', 'utf8');
  if (viteConfig.includes("base: './'")) {
    console.log('✅ 相对路径配置正确');
  } else {
    console.log('⚠️ 建议设置 base: "./" 用于静态部署');
  }
  
  if (viteConfig.includes('createWebHashHistory')) {
    console.log('✅ 路由配置适合静态部署');
  } else {
    console.log('⚠️ 建议使用 createWebHashHistory 用于静态部署');
  }
} catch (error) {
  console.log('❌ vite.config.ts读取失败');
}

// 总结
console.log('\n📊 测试结果');
console.log('============');
if (allFilesExist) {
  console.log('🎉 所有必要文件都存在！');
  console.log('✅ 项目已准备好部署到Gitee Pages');
  console.log('\n📋 部署步骤:');
  console.log('1. 将dist目录内容上传到Gitee仓库');
  console.log('2. 在Gitee仓库设置中启用Pages服务');
  console.log('3. 选择部署分支和目录');
  console.log('4. 等待部署完成');
} else {
  console.log('❌ 存在问题，请修复后重新测试');
}

console.log('\n🌐 本地预览:');
console.log('- 开发服务器: http://localhost:3002');
console.log('- 构建预览: npm run preview'); 
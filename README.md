# AI导航 - 最全面的AI工具导航平台

一个现代化的AI工具导航网站，基于Vue 3 + TypeScript + Element Plus构建，支持分类管理、搜索功能和后台管理。

## ✨ 特性

- 🎯 **智能分类** - 支持无限层级的分类管理
- 🔍 **全局搜索** - 实时搜索，支持关键词高亮
- 📱 **响应式设计** - 完美适配桌面端和移动端
- 🎨 **现代化UI** - 基于Element Plus的美观界面
- ⚡ **高性能** - 懒加载和虚拟滚动优化
- 🔧 **后台管理** - 完整的数据管理功能
- 🌙 **主题切换** - 支持亮色/暗色主题
- 📊 **数据分片** - 自动分片确保加载速度

## 🚀 快速开始

### 环境要求

- Node.js >= 16.0.0
- npm >= 7.0.0 或 yarn >= 1.22.0

### 安装依赖

```bash
# 使用npm
npm install

# 或使用yarn
yarn install
```

### 环境配置

1. 复制环境变量文件：
```bash
cp .env.example .env
```

2. 修改 `.env` 文件中的配置：
```env
# Gitee API配置
VITE_GITEE_TOKEN=your-gitee-token
VITE_GITEE_OWNER=your-username
VITE_GITEE_REPO=ai-navigation
```

### 开发运行

```bash
# 启动开发服务器
npm run dev

# 或
yarn dev
```

访问 http://localhost:3000 查看应用。

### 构建部署

```bash
# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

## 📁 项目结构

```
ai-navigation/
├── public/                     # 静态资源
├── src/
│   ├── components/             # 公共组件
│   │   ├── Layout/             # 布局组件
│   │   ├── Navigation/         # 导航相关组件
│   │   ├── Category/           # 分类相关组件
│   │   ├── Search/             # 搜索组件
│   │   └── Common/             # 通用组件
│   ├── views/                  # 页面组件
│   │   ├── Home/               # 首页
│   │   ├── Category/           # 分类页面
│   │   ├── Search/             # 搜索页面
│   │   └── Admin/              # 后台管理
│   ├── stores/                 # Pinia状态管理
│   ├── services/               # API服务
│   ├── utils/                  # 工具函数
│   ├── types/                  # TypeScript类型定义
│   └── styles/                 # 样式文件
├── data/                       # JSON数据文件
│   ├── categories.json         # 分类数据
│   ├── navigation_001.json     # 导航数据
│   └── config.json             # 配置数据
└── scripts/                    # 构建和部署脚本
```

## 🔧 技术栈

### 前端技术

- **Vue 3** - 渐进式JavaScript框架
- **TypeScript** - JavaScript的超集
- **Vite** - 下一代前端构建工具
- **Element Plus** - Vue 3组件库
- **Pinia** - Vue状态管理
- **Vue Router** - Vue路由管理
- **Axios** - HTTP客户端
- **SCSS** - CSS预处理器

### 开发工具

- **ESLint** - 代码质量检查
- **Prettier** - 代码格式化
- **Husky** - Git钩子
- **Vitest** - 单元测试框架

## 📊 数据管理

### 数据结构

项目使用JSON文件存储数据，支持以下数据类型：

- **分类数据** (`categories.json`) - 存储分类信息和层级关系
- **导航数据** (`navigation_*.json`) - 存储导航项目信息
- **配置数据** (`config.json`) - 存储应用配置

### 数据分片

为确保加载性能，导航数据会自动分片：
- 单个JSON文件最多100行数据
- 超出限制时自动创建新文件
- 支持按分类或时间分片

### Gitee集成

使用Gitee API进行数据管理：
- 支持文件的增删改查
- 版本控制和回滚
- 冲突检测和解决

## 🎨 主题定制

### CSS变量

项目使用CSS变量支持主题切换：

```css
:root {
  --primary-color: #1890ff;
  --success-color: #52c41a;
  --warning-color: #faad14;
  --error-color: #ff4d4f;
  /* 更多变量... */
}
```

### 暗色主题

```css
[data-theme='dark'] {
  --text-primary: #ffffff;
  --bg-primary: #141414;
  /* 暗色主题变量... */
}
```

## 🔍 搜索功能

### 搜索引擎

使用Fuse.js实现模糊搜索：
- 支持中文和英文搜索
- 搜索结果权重排序
- 关键词高亮显示

### 搜索范围

- 导航标题
- 导航描述
- 分类名称
- 标签信息

## 📱 响应式设计

### 断点设置

```scss
// 移动端
@media (max-width: 767px)

// 平板端
@media (min-width: 768px) and (max-width: 1023px)

// 桌面端
@media (min-width: 1024px)

// 大屏幕
@media (min-width: 1200px)
```

### 移动端适配

- 侧边栏转换为抽屉模式
- 触摸友好的交互设计
- 优化的卡片布局

## 🚀 部署指南

### Gitee Pages部署

1. 构建项目：
```bash
npm run build
```

2. 将`dist`目录内容推送到Gitee仓库

3. 在Gitee仓库设置中启用Pages服务

### 自定义域名

在`public`目录下创建`CNAME`文件：
```
your-domain.com
```

## 🤝 贡献指南

1. Fork本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建Pull Request

## 📄 许可证

本项目基于MIT许可证开源 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [Vue.js](https://vuejs.org/) - 渐进式JavaScript框架
- [Element Plus](https://element-plus.org/) - Vue 3组件库
- [Vite](https://vitejs.dev/) - 下一代前端构建工具
- [TypeScript](https://www.typescriptlang.org/) - JavaScript的超集

## 📞 联系我们

- 项目地址：[https://gitee.com/GuoYi6/ai-navigation](https://gitee.com/GuoYi6/ai-navigation)
- 问题反馈：[Issues](https://gitee.com/GuoYi6/ai-navigation/issues)
- 邮箱：your-email@example.com

---

⭐ 如果这个项目对你有帮助，请给它一个星标！

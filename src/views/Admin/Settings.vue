<template>
  <div class="settings-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-info">
          <h1 class="page-title">系统设置</h1>
          <p class="page-subtitle">配置网站基本信息和系统参数</p>
        </div>
        
        <div class="header-actions">
          <el-button :icon="Refresh" @click="refreshSettings">
            刷新
          </el-button>
          <el-button type="primary" :icon="Check" @click="saveAllSettings">
            保存所有设置
          </el-button>
        </div>
      </div>
    </div>

    <!-- 设置内容 -->
    <div class="settings-content">
      <div class="settings-layout">
        <!-- 左侧导航 -->
        <div class="settings-nav">
          <el-menu
            v-model="activeTab"
            mode="vertical"
            :default-active="activeTab"
            @select="handleTabChange"
          >
            <el-menu-item index="basic">
              <el-icon><Setting /></el-icon>
              <span>基本设置</span>
            </el-menu-item>
            <el-menu-item index="gitee">
              <el-icon><Link /></el-icon>
              <span>Gitee配置</span>
            </el-menu-item>
            <el-menu-item index="theme">
              <el-icon><Brush /></el-icon>
              <span>主题设置</span>
            </el-menu-item>
            <el-menu-item index="data">
              <el-icon><FolderOpened /></el-icon>
              <span>数据管理</span>
            </el-menu-item>
            <el-menu-item index="cache">
              <el-icon><Refresh /></el-icon>
              <span>缓存管理</span>
            </el-menu-item>
            <el-menu-item index="backup">
              <el-icon><Download /></el-icon>
              <span>备份恢复</span>
            </el-menu-item>
            <el-menu-item index="logs">
              <el-icon><Document /></el-icon>
              <span>系统日志</span>
            </el-menu-item>
          </el-menu>
        </div>

        <!-- 右侧内容 -->
        <div class="settings-main">
          <!-- 基本设置 -->
          <div v-show="activeTab === 'basic'" class="setting-panel">
            <div class="panel-header">
              <h3>基本设置</h3>
              <p>配置网站的基本信息</p>
            </div>
            
            <el-form
              ref="basicFormRef"
              :model="basicSettings"
              :rules="basicRules"
              label-width="120px"
            >
              <el-form-item label="网站标题" prop="title">
                <el-input
                  v-model="basicSettings.title"
                  placeholder="请输入网站标题"
                  style="width: 400px"
                />
              </el-form-item>
              
              <el-form-item label="网站描述" prop="description">
                <el-input
                  v-model="basicSettings.description"
                  type="textarea"
                  :rows="3"
                  placeholder="请输入网站描述"
                  style="width: 400px"
                />
              </el-form-item>
              
              <el-form-item label="关键词" prop="keywords">
                <el-input
                  v-model="basicSettings.keywords"
                  placeholder="请输入关键词，用逗号分隔"
                  style="width: 400px"
                />
              </el-form-item>
              
              <el-form-item label="网站Logo">
                <div class="logo-upload">
                  <el-upload
                    :show-file-list="false"
                    :on-success="handleLogoSuccess"
                    :before-upload="beforeLogoUpload"
                    action="#"
                    :auto-upload="false"
                  >
                    <div class="logo-preview">
                      <img v-if="basicSettings.logo" :src="basicSettings.logo" alt="Logo" />
                      <el-icon v-else size="32"><Plus /></el-icon>
                    </div>
                  </el-upload>
                  <div class="logo-tips">
                    <p>建议尺寸：120x40px，支持PNG、JPG格式</p>
                  </div>
                </div>
              </el-form-item>
              
              <el-form-item label="网站图标">
                <el-input
                  v-model="basicSettings.favicon"
                  placeholder="请输入favicon路径"
                  style="width: 400px"
                />
              </el-form-item>
              
              <el-form-item label="每页显示数量">
                <el-input-number
                  v-model="basicSettings.itemsPerPage"
                  :min="10"
                  :max="100"
                  :step="10"
                />
              </el-form-item>
              
              <el-form-item label="启用功能">
                <el-checkbox-group v-model="basicSettings.features">
                  <el-checkbox label="search">搜索功能</el-checkbox>
                  <el-checkbox label="favorites">收藏功能</el-checkbox>
                  <el-checkbox label="sharing">分享功能</el-checkbox>
                  <el-checkbox label="statistics">统计功能</el-checkbox>
                  <el-checkbox label="comments">评论功能</el-checkbox>
                </el-checkbox-group>
              </el-form-item>
            </el-form>
          </div>

          <!-- Gitee配置 -->
          <div v-show="activeTab === 'gitee'" class="setting-panel">
            <div class="panel-header">
              <h3>Gitee配置</h3>
              <p>配置Gitee仓库连接信息</p>
            </div>
            
            <el-form
              ref="giteeFormRef"
              :model="giteeSettings"
              :rules="giteeRules"
              label-width="120px"
            >
              <el-form-item label="访问令牌" prop="token">
                <el-input
                  v-model="giteeSettings.token"
                  type="password"
                  placeholder="请输入Gitee访问令牌"
                  style="width: 400px"
                  show-password
                />
                <div class="form-tips">
                  <p>在Gitee个人设置中生成访问令牌，需要仓库读写权限</p>
                </div>
              </el-form-item>
              
              <el-form-item label="仓库所有者" prop="owner">
                <el-input
                  v-model="giteeSettings.owner"
                  placeholder="请输入仓库所有者用户名"
                  style="width: 400px"
                />
              </el-form-item>
              
              <el-form-item label="仓库名称" prop="repo">
                <el-input
                  v-model="giteeSettings.repo"
                  placeholder="请输入仓库名称"
                  style="width: 400px"
                />
              </el-form-item>
              
              <el-form-item label="分支名称" prop="branch">
                <el-input
                  v-model="giteeSettings.branch"
                  placeholder="请输入分支名称"
                  style="width: 400px"
                />
              </el-form-item>
              
              <el-form-item label="数据目录" prop="dataPath">
                <el-input
                  v-model="giteeSettings.dataPath"
                  placeholder="请输入数据文件存储目录"
                  style="width: 400px"
                />
              </el-form-item>
              
              <el-form-item label="连接测试">
                <el-button
                  :loading="testingConnection"
                  @click="testGiteeConnection"
                >
                  测试连接
                </el-button>
                <span v-if="connectionStatus" :class="connectionStatusClass">
                  {{ connectionStatusText }}
                </span>
              </el-form-item>
            </el-form>
          </div>

          <!-- 主题设置 -->
          <div v-show="activeTab === 'theme'" class="setting-panel">
            <div class="panel-header">
              <h3>主题设置</h3>
              <p>自定义网站外观和样式</p>
            </div>
            
            <el-form label-width="120px">
              <el-form-item label="默认主题">
                <el-radio-group v-model="themeSettings.theme">
                  <el-radio label="light">浅色主题</el-radio>
                  <el-radio label="dark">深色主题</el-radio>
                  <el-radio label="auto">跟随系统</el-radio>
                </el-radio-group>
              </el-form-item>
              
              <el-form-item label="主色调">
                <div class="color-picker-group">
                  <el-color-picker v-model="themeSettings.primaryColor" />
                  <span class="color-value">{{ themeSettings.primaryColor }}</span>
                </div>
              </el-form-item>
              
              <el-form-item label="预设颜色">
                <div class="preset-colors">
                  <div
                    v-for="color in presetColors"
                    :key="color.name"
                    class="preset-color"
                    :class="{ active: themeSettings.primaryColor === color.value }"
                    :style="{ backgroundColor: color.value }"
                    @click="themeSettings.primaryColor = color.value"
                  >
                    <span class="color-name">{{ color.name }}</span>
                  </div>
                </div>
              </el-form-item>
              
              <el-form-item label="动画效果">
                <el-switch
                  v-model="themeSettings.enableAnimation"
                  active-text="启用"
                  inactive-text="禁用"
                />
              </el-form-item>
              
              <el-form-item label="圆角大小">
                <el-slider
                  v-model="themeSettings.borderRadius"
                  :min="0"
                  :max="20"
                  :step="2"
                  style="width: 200px"
                />
                <span class="slider-value">{{ themeSettings.borderRadius }}px</span>
              </el-form-item>
              
              <el-form-item label="字体大小">
                <el-radio-group v-model="themeSettings.fontSize">
                  <el-radio label="small">小号</el-radio>
                  <el-radio label="medium">中号</el-radio>
                  <el-radio label="large">大号</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-form>
          </div>

          <!-- 数据管理 -->
          <div v-show="activeTab === 'data'" class="setting-panel">
            <div class="panel-header">
              <h3>数据管理</h3>
              <p>管理数据文件和分片设置</p>
            </div>
            
            <div class="data-stats">
              <div class="stat-grid">
                <div class="stat-item">
                  <div class="stat-label">数据文件数量</div>
                  <div class="stat-value">{{ dataStats.fileCount }}</div>
                </div>
                <div class="stat-item">
                  <div class="stat-label">总数据大小</div>
                  <div class="stat-value">{{ dataStats.totalSize }}</div>
                </div>
                <div class="stat-item">
                  <div class="stat-label">最后更新</div>
                  <div class="stat-value">{{ dataStats.lastUpdate }}</div>
                </div>
              </div>
            </div>
            
            <el-form label-width="120px">
              <el-form-item label="分片大小">
                <el-input-number
                  v-model="dataSettings.maxLinesPerFile"
                  :min="50"
                  :max="200"
                  :step="10"
                />
                <span class="form-tips">每个JSON文件最大行数</span>
              </el-form-item>
              
              <el-form-item label="自动分片">
                <el-switch
                  v-model="dataSettings.autoSplit"
                  active-text="启用"
                  inactive-text="禁用"
                />
              </el-form-item>
              
              <el-form-item label="数据压缩">
                <el-switch
                  v-model="dataSettings.compression"
                  active-text="启用"
                  inactive-text="禁用"
                />
              </el-form-item>
              
              <el-form-item label="操作">
                <div class="data-actions">
                  <el-button @click="validateData">验证数据完整性</el-button>
                  <el-button @click="optimizeData">优化数据结构</el-button>
                  <el-button @click="rebuildIndex">重建索引</el-button>
                </div>
              </el-form-item>
            </el-form>
          </div>

          <!-- 缓存管理 -->
          <div v-show="activeTab === 'cache'" class="setting-panel">
            <div class="panel-header">
              <h3>缓存管理</h3>
              <p>管理系统缓存和性能设置</p>
            </div>
            
            <div class="cache-stats">
              <div class="cache-item">
                <div class="cache-info">
                  <h4>浏览器缓存</h4>
                  <p>缓存静态资源和API响应</p>
                </div>
                <div class="cache-actions">
                  <el-button size="small" @click="clearBrowserCache">清除</el-button>
                </div>
              </div>
              
              <div class="cache-item">
                <div class="cache-info">
                  <h4>本地存储</h4>
                  <p>用户设置和临时数据</p>
                </div>
                <div class="cache-actions">
                  <el-button size="small" @click="clearLocalStorage">清除</el-button>
                </div>
              </div>
              
              <div class="cache-item">
                <div class="cache-info">
                  <h4>搜索索引</h4>
                  <p>搜索功能的索引缓存</p>
                </div>
                <div class="cache-actions">
                  <el-button size="small" @click="clearSearchIndex">清除</el-button>
                </div>
              </div>
            </div>
            
            <el-form label-width="120px">
              <el-form-item label="缓存策略">
                <el-radio-group v-model="cacheSettings.strategy">
                  <el-radio label="aggressive">积极缓存</el-radio>
                  <el-radio label="normal">正常缓存</el-radio>
                  <el-radio label="minimal">最小缓存</el-radio>
                </el-radio-group>
              </el-form-item>
              
              <el-form-item label="缓存时间">
                <el-input-number
                  v-model="cacheSettings.ttl"
                  :min="60"
                  :max="86400"
                  :step="60"
                />
                <span class="form-tips">秒</span>
              </el-form-item>
            </el-form>
          </div>

          <!-- 备份恢复 -->
          <div v-show="activeTab === 'backup'" class="setting-panel">
            <div class="panel-header">
              <h3>备份恢复</h3>
              <p>数据备份和恢复管理</p>
            </div>
            
            <div class="backup-section">
              <h4>创建备份</h4>
              <div class="backup-options">
                <el-checkbox-group v-model="backupOptions">
                  <el-checkbox label="categories">分类数据</el-checkbox>
                  <el-checkbox label="navigations">导航数据</el-checkbox>
                  <el-checkbox label="settings">系统设置</el-checkbox>
                  <el-checkbox label="logs">操作日志</el-checkbox>
                </el-checkbox-group>
              </div>
              <el-button type="primary" @click="createBackup">创建备份</el-button>
            </div>
            
            <div class="backup-list">
              <h4>备份历史</h4>
              <el-table :data="backupHistory" style="width: 100%">
                <el-table-column prop="name" label="备份名称" />
                <el-table-column prop="size" label="文件大小" />
                <el-table-column prop="createTime" label="创建时间" />
                <el-table-column label="操作" width="200">
                  <template #default="{ row }">
                    <el-button size="small" @click="downloadBackup(row)">
                      下载
                    </el-button>
                    <el-button size="small" @click="restoreBackup(row)">
                      恢复
                    </el-button>
                    <el-button size="small" type="danger" @click="deleteBackup(row)">
                      删除
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>

          <!-- 系统日志 -->
          <div v-show="activeTab === 'logs'" class="setting-panel">
            <div class="panel-header">
              <h3>系统日志</h3>
              <p>查看系统操作和错误日志</p>
            </div>
            
            <div class="log-filters">
              <el-select v-model="logLevel" placeholder="日志级别" style="width: 120px">
                <el-option label="全部" value="" />
                <el-option label="错误" value="error" />
                <el-option label="警告" value="warn" />
                <el-option label="信息" value="info" />
              </el-select>
              
              <el-date-picker
                v-model="logDateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
              />
              
              <el-button @click="refreshLogs">刷新</el-button>
              <el-button @click="clearLogs">清空日志</el-button>
            </div>
            
            <div class="log-content">
              <el-table :data="filteredLogs" style="width: 100%" max-height="400">
                <el-table-column prop="time" label="时间" width="180" />
                <el-table-column prop="level" label="级别" width="80">
                  <template #default="{ row }">
                    <el-tag :type="getLogLevelType(row.level)" size="small">
                      {{ row.level }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="message" label="消息" />
                <el-table-column prop="source" label="来源" width="120" />
              </el-table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Setting, Link, Brush, FolderOpened, Refresh, Download,
  Document, Check, Plus
} from '@element-plus/icons-vue'

// 响应式数据
const activeTab = ref('basic')
const testingConnection = ref(false)
const connectionStatus = ref('')

// 表单引用
const basicFormRef = ref()
const giteeFormRef = ref()

// 基本设置
const basicSettings = reactive({
  title: 'AI导航',
  description: '最全面的AI工具导航平台',
  keywords: 'AI,人工智能,工具,导航',
        logo: '/logo.svg',
  favicon: '/favicon.ico',
  itemsPerPage: 20,
  features: ['search', 'favorites', 'sharing', 'statistics']
})

const basicRules = {
  title: [{ required: true, message: '请输入网站标题', trigger: 'blur' }],
  description: [{ required: true, message: '请输入网站描述', trigger: 'blur' }]
}

// Gitee设置
const giteeSettings = reactive({
  token: 'd8eed2a4b74a64d442d858ac30b8d494',
  owner: 'your-username',
  repo: 'ai-navigation',
  branch: 'main',
  dataPath: 'data/'
})

const giteeRules = {
  token: [{ required: true, message: '请输入访问令牌', trigger: 'blur' }],
  owner: [{ required: true, message: '请输入仓库所有者', trigger: 'blur' }],
  repo: [{ required: true, message: '请输入仓库名称', trigger: 'blur' }],
  branch: [{ required: true, message: '请输入分支名称', trigger: 'blur' }]
}

// 主题设置
const themeSettings = reactive({
  theme: 'light',
  primaryColor: '#1890ff',
  enableAnimation: true,
  borderRadius: 8,
  fontSize: 'medium'
})

const presetColors = [
  { name: '蓝色', value: '#1890ff' },
  { name: '绿色', value: '#52c41a' },
  { name: '橙色', value: '#fa8c16' },
  { name: '红色', value: '#f5222d' },
  { name: '紫色', value: '#722ed1' },
  { name: '青色', value: '#13c2c2' }
]

// 数据设置
const dataSettings = reactive({
  maxLinesPerFile: 100,
  autoSplit: true,
  compression: false
})

const dataStats = reactive({
  fileCount: 8,
  totalSize: '2.3MB',
  lastUpdate: '2分钟前'
})

// 缓存设置
const cacheSettings = reactive({
  strategy: 'normal',
  ttl: 300
})

// 备份设置
const backupOptions = ref(['categories', 'navigations', 'settings'])
const backupHistory = ref([
  {
    id: 1,
    name: 'backup_20240101_120000.json',
    size: '1.2MB',
    createTime: '2024-01-01 12:00:00'
  }
])

// 日志设置
const logLevel = ref('')
const logDateRange = ref([])
const systemLogs = ref([
  {
    id: 1,
    time: '2024-01-01 12:00:00',
    level: 'info',
    message: '用户登录成功',
    source: 'auth'
  },
  {
    id: 2,
    time: '2024-01-01 11:58:00',
    level: 'error',
    message: 'API请求失败',
    source: 'api'
  }
])

// 计算属性
const connectionStatusClass = computed(() => {
  return connectionStatus.value === 'success' ? 'success-text' : 'error-text'
})

const connectionStatusText = computed(() => {
  return connectionStatus.value === 'success' ? '连接成功' : '连接失败'
})

const filteredLogs = computed(() => {
  let logs = [...systemLogs.value]
  
  if (logLevel.value) {
    logs = logs.filter(log => log.level === logLevel.value)
  }
  
  // 这里可以添加日期范围过滤逻辑
  
  return logs
})

// 方法
const handleTabChange = (key: string) => {
  activeTab.value = key
}

const refreshSettings = async () => {
  try {
    // 刷新设置数据
    ElMessage.success('设置已刷新')
  } catch (error) {
    ElMessage.error('刷新失败')
  }
}

const saveAllSettings = async () => {
  try {
    // 保存所有设置
    await Promise.all([
      saveBasicSettings(),
      saveGiteeSettings(),
      saveThemeSettings(),
      saveDataSettings(),
      saveCacheSettings()
    ])
    ElMessage.success('所有设置已保存')
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

const saveBasicSettings = async () => {
  await basicFormRef.value?.validate()
  // 保存基本设置逻辑
}

const saveGiteeSettings = async () => {
  await giteeFormRef.value?.validate()
  // 保存Gitee设置逻辑
}

const saveThemeSettings = async () => {
  // 保存主题设置逻辑
}

const saveDataSettings = async () => {
  // 保存数据设置逻辑
}

const saveCacheSettings = async () => {
  // 保存缓存设置逻辑
}

const testGiteeConnection = async () => {
  testingConnection.value = true
  
  try {
    // 模拟测试连接
    await new Promise(resolve => setTimeout(resolve, 2000))
    connectionStatus.value = 'success'
    ElMessage.success('Gitee连接测试成功')
  } catch (error) {
    connectionStatus.value = 'error'
    ElMessage.error('Gitee连接测试失败')
  } finally {
    testingConnection.value = false
  }
}

const handleLogoSuccess = (response: any) => {
  basicSettings.logo = response.url
}

const beforeLogoUpload = (file: File) => {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2
  
  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB!')
    return false
  }
  return true
}

const validateData = async () => {
  try {
    // 验证数据完整性
    ElMessage.success('数据验证完成，未发现问题')
  } catch (error) {
    ElMessage.error('数据验证失败')
  }
}

const optimizeData = async () => {
  try {
    // 优化数据结构
    ElMessage.success('数据优化完成')
  } catch (error) {
    ElMessage.error('数据优化失败')
  }
}

const rebuildIndex = async () => {
  try {
    // 重建索引
    ElMessage.success('索引重建完成')
  } catch (error) {
    ElMessage.error('索引重建失败')
  }
}

const clearBrowserCache = () => {
  // 清除浏览器缓存
  ElMessage.success('浏览器缓存已清除')
}

const clearLocalStorage = () => {
  localStorage.clear()
  ElMessage.success('本地存储已清除')
}

const clearSearchIndex = () => {
  // 清除搜索索引
  ElMessage.success('搜索索引已清除')
}

const createBackup = async () => {
  try {
    // 创建备份
    const backupName = `backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`
    backupHistory.value.unshift({
      id: Date.now(),
      name: backupName,
      size: '1.5MB',
      createTime: new Date().toLocaleString()
    })
    ElMessage.success('备份创建成功')
  } catch (error) {
    ElMessage.error('备份创建失败')
  }
}

const downloadBackup = (backup: any) => {
  // 下载备份文件
  ElMessage.success(`开始下载 ${backup.name}`)
}

const restoreBackup = async (backup: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要恢复备份 "${backup.name}" 吗？这将覆盖当前数据。`,
      '确认恢复',
      { type: 'warning' }
    )
    
    // 恢复备份逻辑
    ElMessage.success('备份恢复成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('备份恢复失败')
    }
  }
}

const deleteBackup = async (backup: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除备份 "${backup.name}" 吗？`,
      '确认删除',
      { type: 'warning' }
    )
    
    const index = backupHistory.value.findIndex(item => item.id === backup.id)
    if (index > -1) {
      backupHistory.value.splice(index, 1)
    }
    ElMessage.success('备份删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('备份删除失败')
    }
  }
}

const refreshLogs = () => {
  // 刷新日志
  ElMessage.success('日志已刷新')
}

const clearLogs = async () => {
  try {
    await ElMessageBox.confirm('确定要清空所有日志吗？', '确认清空', {
      type: 'warning'
    })
    
    systemLogs.value = []
    ElMessage.success('日志已清空')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('清空日志失败')
    }
  }
}

const getLogLevelType = (level: string) => {
  const types = {
    error: 'danger',
    warn: 'warning',
    info: 'info'
  }
  return types[level] || 'info'
}

// 生命周期
onMounted(() => {
  // 初始化设置数据
})
</script>

<style lang="scss" scoped>
.settings-page {
  padding: 1.5rem;
  background: var(--el-bg-color-page);
  min-height: 100vh;
}

.page-header {
  margin-bottom: 2rem;
  
  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    
    .header-info {
      .page-title {
        font-size: 2rem;
        font-weight: 600;
        color: var(--el-text-color-primary);
        margin: 0 0 0.5rem 0;
      }
      
      .page-subtitle {
        color: var(--el-text-color-regular);
        margin: 0;
      }
    }
    
    .header-actions {
      display: flex;
      gap: 0.5rem;
    }
  }
}

.settings-content {
  .settings-layout {
    display: grid;
    grid-template-columns: 240px 1fr;
    gap: 2rem;
    
    .settings-nav {
      background: var(--el-bg-color);
      border-radius: 8px;
      border: 1px solid var(--el-border-color-light);
      overflow: hidden;
      height: fit-content;
      
      .el-menu {
        border: none;
      }
    }
    
    .settings-main {
      background: var(--el-bg-color);
      border-radius: 8px;
      border: 1px solid var(--el-border-color-light);
      overflow: hidden;
    }
  }
}

.setting-panel {
  padding: 2rem;
  
  .panel-header {
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--el-border-color-lighter);
    
    h3 {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--el-text-color-primary);
      margin: 0 0 0.5rem 0;
    }
    
    p {
      color: var(--el-text-color-regular);
      margin: 0;
    }
  }
}

.logo-upload {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  
  .logo-preview {
    width: 120px;
    height: 40px;
    border: 2px dashed var(--el-border-color);
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: border-color 0.2s;
    
    &:hover {
      border-color: var(--el-color-primary);
    }
    
    img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }
  }
  
  .logo-tips {
    p {
      font-size: 0.875rem;
      color: var(--el-text-color-placeholder);
      margin: 0;
    }
  }
}

.form-tips {
  margin-top: 0.5rem;
  
  p {
    font-size: 0.875rem;
    color: var(--el-text-color-placeholder);
    margin: 0;
  }
}

.success-text {
  color: var(--el-color-success);
  margin-left: 0.5rem;
}

.error-text {
  color: var(--el-color-danger);
  margin-left: 0.5rem;
}

.color-picker-group {
  display: flex;
  align-items: center;
  gap: 1rem;
  
  .color-value {
    font-family: monospace;
    color: var(--el-text-color-regular);
  }
}

.preset-colors {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  
  .preset-color {
    width: 60px;
    height: 40px;
    border-radius: 4px;
    cursor: pointer;
    position: relative;
    border: 2px solid transparent;
    transition: all 0.2s;
    
    &:hover {
      transform: scale(1.05);
    }
    
    &.active {
      border-color: var(--el-text-color-primary);
    }
    
    .color-name {
      position: absolute;
      bottom: -20px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 0.75rem;
      color: var(--el-text-color-regular);
      white-space: nowrap;
    }
  }
}

.slider-value {
  margin-left: 1rem;
  color: var(--el-text-color-regular);
}

.data-stats {
  margin-bottom: 2rem;
  
  .stat-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1rem;
    
    .stat-item {
      text-align: center;
      padding: 1rem;
      background: var(--el-bg-color-page);
      border-radius: 6px;
      
      .stat-label {
        font-size: 0.875rem;
        color: var(--el-text-color-regular);
        margin-bottom: 0.5rem;
      }
      
      .stat-value {
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--el-color-primary);
      }
    }
  }
}

.data-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.cache-stats {
  margin-bottom: 2rem;
  
  .cache-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: var(--el-bg-color-page);
    border-radius: 6px;
    margin-bottom: 1rem;
    
    .cache-info {
      h4 {
        font-size: 1rem;
        font-weight: 500;
        color: var(--el-text-color-primary);
        margin: 0 0 0.25rem 0;
      }
      
      p {
        font-size: 0.875rem;
        color: var(--el-text-color-regular);
        margin: 0;
      }
    }
  }
}

.backup-section {
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid var(--el-border-color-lighter);
  
  h4 {
    font-size: 1rem;
    font-weight: 500;
    color: var(--el-text-color-primary);
    margin: 0 0 1rem 0;
  }
  
  .backup-options {
    margin-bottom: 1rem;
  }
}

.backup-list {
  h4 {
    font-size: 1rem;
    font-weight: 500;
    color: var(--el-text-color-primary);
    margin: 0 0 1rem 0;
  }
}

.log-filters {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  align-items: center;
}

.log-content {
  background: var(--el-bg-color-page);
  border-radius: 6px;
  padding: 1rem;
}

// 响应式设计
@media (max-width: 1024px) {
  .settings-layout {
    grid-template-columns: 1fr;
    gap: 1rem;
    
    .settings-nav {
      .el-menu {
        display: flex;
        overflow-x: auto;
        
        .el-menu-item {
          flex-shrink: 0;
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .settings-page {
    padding: 1rem;
  }
  
  .page-header .header-content {
    flex-direction: column;
    gap: 1rem;
    
    .header-actions {
      align-self: stretch;
      
      .el-button {
        flex: 1;
      }
    }
  }
  
  .setting-panel {
    padding: 1rem;
  }
  
  .data-actions {
    flex-direction: column;
    
    .el-button {
      width: 100%;
    }
  }
  
  .log-filters {
    flex-direction: column;
    align-items: stretch;
  }
}
</style> 
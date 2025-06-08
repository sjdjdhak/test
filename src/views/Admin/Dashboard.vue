<template>
  <div class="admin-dashboard">
    <!-- 页面头部 -->
    <div class="dashboard-header">
      <div class="header-content">
        <div class="header-info">
          <h1 class="page-title">仪表板</h1>
          <p class="page-subtitle">欢迎回来，管理员</p>
        </div>
        
        <div class="header-actions">
          <el-button type="primary" :icon="Plus" @click="showAddDialog = true">
            添加导航
          </el-button>
          <el-button :icon="Refresh" @click="refreshData">
            刷新数据
          </el-button>
        </div>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-section">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">
            <el-icon size="32" color="#1890ff">
              <DataLine />
            </el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ totalNavigations }}</div>
            <div class="stat-label">总导航数</div>
            <div class="stat-change positive">
              <el-icon><ArrowUp /></el-icon>
              +{{ recentNavigations }} 本周新增
            </div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <el-icon size="32" color="#52c41a">
              <FolderOpened />
            </el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ totalCategories }}</div>
            <div class="stat-label">分类数量</div>
            <div class="stat-change">
              <el-icon><Minus /></el-icon>
              无变化
            </div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <el-icon size="32" color="#fa8c16">
              <View />
            </el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ formatNumber(totalVisits) }}</div>
            <div class="stat-label">总访问量</div>
            <div class="stat-change positive">
              <el-icon><ArrowUp /></el-icon>
              +{{ formatNumber(weeklyVisits) }} 本周
            </div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <el-icon size="32" color="#eb2f96">
              <Star />
            </el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ featuredCount }}</div>
            <div class="stat-label">推荐项目</div>
            <div class="stat-change">
              <el-icon><Minus /></el-icon>
              无变化
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <div class="content-grid">
        <!-- 左侧内容 -->
        <div class="left-content">
          <!-- 快速操作 -->
          <div class="section-card">
            <div class="card-header">
              <h3 class="card-title">快速操作</h3>
            </div>
            <div class="card-content">
              <div class="quick-actions">
                <div class="action-item" @click="navigateTo('/admin/navigation')">
                  <div class="action-icon">
                    <el-icon><Link /></el-icon>
                  </div>
                  <div class="action-info">
                    <div class="action-title">管理导航</div>
                    <div class="action-desc">添加、编辑或删除导航项</div>
                  </div>
                </div>

                <div class="action-item" @click="navigateTo('/admin/category')">
                  <div class="action-icon">
                    <el-icon><Folder /></el-icon>
                  </div>
                  <div class="action-info">
                    <div class="action-title">管理分类</div>
                    <div class="action-desc">组织和管理分类结构</div>
                  </div>
                </div>

                <div class="action-item" @click="showImportDialog = true">
                  <div class="action-icon">
                    <el-icon><Upload /></el-icon>
                  </div>
                  <div class="action-info">
                    <div class="action-title">批量导入</div>
                    <div class="action-desc">从文件批量导入导航数据</div>
                  </div>
                </div>

                <div class="action-item" @click="exportData">
                  <div class="action-icon">
                    <el-icon><Download /></el-icon>
                  </div>
                  <div class="action-info">
                    <div class="action-title">导出数据</div>
                    <div class="action-desc">导出所有导航数据</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 访问统计图表 -->
          <div class="section-card">
            <div class="card-header">
              <h3 class="card-title">访问统计</h3>
              <el-select v-model="chartPeriod" size="small" style="width: 100px">
                <el-option label="7天" value="7d" />
                <el-option label="30天" value="30d" />
                <el-option label="90天" value="90d" />
              </el-select>
            </div>
            <div class="card-content">
              <div class="chart-container">
                <div class="chart-placeholder">
                  <el-icon size="48" color="#ddd">
                    <TrendCharts />
                  </el-icon>
                  <p>访问统计图表</p>
                  <small>（图表组件待集成）</small>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧内容 -->
        <div class="right-content">
          <!-- 最近活动 -->
          <div class="section-card">
            <div class="card-header">
              <h3 class="card-title">最近活动</h3>
              <el-link type="primary" @click="navigateTo('/admin/logs')">
                查看全部
              </el-link>
            </div>
            <div class="card-content">
              <div class="activity-list">
                <div
                  v-for="activity in recentActivities"
                  :key="activity.id"
                  class="activity-item"
                >
                  <div class="activity-icon">
                    <el-icon :color="getActivityColor(activity.type)">
                      <component :is="getActivityIcon(activity.type)" />
                    </el-icon>
                  </div>
                  <div class="activity-content">
                    <div class="activity-text">{{ activity.description }}</div>
                    <div class="activity-time">{{ formatTime(activity.time) }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 热门导航 -->
          <div class="section-card">
            <div class="card-header">
              <h3 class="card-title">热门导航</h3>
              <el-link type="primary" @click="navigateTo('/admin/navigation')">
                管理全部
              </el-link>
            </div>
            <div class="card-content">
              <div class="popular-list">
                <div
                  v-for="(item, index) in popularNavigations"
                  :key="item.id"
                  class="popular-item"
                >
                  <div class="popular-rank">{{ index + 1 }}</div>
                  <div class="popular-icon">
                    <img :src="item.icon" :alt="item.title" />
                  </div>
                  <div class="popular-info">
                    <div class="popular-title">{{ item.title }}</div>
                    <div class="popular-visits">{{ item.visitCount }} 次访问</div>
                  </div>
                  <div class="popular-actions">
                    <el-button size="small" text @click="editNavigation(item)">
                      编辑
                    </el-button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 系统状态 -->
          <div class="section-card">
            <div class="card-header">
              <h3 class="card-title">系统状态</h3>
            </div>
            <div class="card-content">
              <div class="status-list">
                <div class="status-item">
                  <div class="status-label">数据同步</div>
                  <div class="status-value">
                    <el-tag type="success" size="small">正常</el-tag>
                  </div>
                </div>
                <div class="status-item">
                  <div class="status-label">最后同步</div>
                  <div class="status-value">{{ lastSyncTime }}</div>
                </div>
                <div class="status-item">
                  <div class="status-label">数据文件</div>
                  <div class="status-value">{{ dataFileCount }} 个</div>
                </div>
                <div class="status-item">
                  <div class="status-label">存储使用</div>
                  <div class="status-value">
                    <el-progress 
                      :percentage="storageUsage" 
                      :stroke-width="6"
                      :show-text="false"
                    />
                    <span class="storage-text">{{ storageUsage }}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加导航对话框 -->
    <el-dialog
      v-model="showAddDialog"
      title="添加导航"
      width="600px"
      @close="resetAddForm"
    >
      <el-form
        ref="addFormRef"
        :model="addForm"
        :rules="addFormRules"
        label-width="80px"
      >
        <el-form-item label="标题" prop="title">
          <el-input v-model="addForm.title" placeholder="请输入导航标题" />
        </el-form-item>
        <el-form-item label="网址" prop="url">
          <el-input v-model="addForm.url" placeholder="请输入网址" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="addForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入描述"
          />
        </el-form-item>
        <el-form-item label="分类" prop="categoryId">
          <el-select v-model="addForm.categoryId" placeholder="选择分类">
            <el-option
              v-for="category in categories"
              :key="category.id"
              :label="category.name"
              :value="category.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="标签">
          <el-input
            v-model="addForm.tagsInput"
            placeholder="请输入标签，用逗号分隔"
          />
        </el-form-item>
        <el-form-item label="推荐">
          <el-switch v-model="addForm.featured" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="handleAddNavigation">确定</el-button>
      </template>
    </el-dialog>

    <!-- 导入对话框 -->
    <el-dialog
      v-model="showImportDialog"
      title="批量导入"
      width="500px"
    >
      <div class="import-content">
        <el-upload
          ref="uploadRef"
          :auto-upload="false"
          :on-change="handleFileChange"
          accept=".json,.csv"
          drag
        >
          <el-icon size="48"><UploadFilled /></el-icon>
          <div class="upload-text">
            <p>将文件拖到此处，或<em>点击上传</em></p>
            <p class="upload-tip">支持 JSON 和 CSV 格式</p>
          </div>
        </el-upload>
      </div>
      
      <template #footer>
        <el-button @click="showImportDialog = false">取消</el-button>
        <el-button type="primary" @click="handleImport">导入</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus, Refresh, DataLine, FolderOpened, View, Star,
  ArrowUp, Minus, Link, Folder, Upload, Download,
  TrendCharts, UploadFilled
} from '@element-plus/icons-vue'
import { useNavigationStore } from '@/stores/navigation'
import { useCategoryStore } from '@/stores/category'
import type { Navigation } from '@/types/navigation'

const router = useRouter()
const navigationStore = useNavigationStore()
const categoryStore = useCategoryStore()

// 响应式数据
const showAddDialog = ref(false)
const showImportDialog = ref(false)
const chartPeriod = ref('7d')
const addFormRef = ref()
const uploadRef = ref()

// 表单数据
const addForm = reactive({
  title: '',
  url: '',
  description: '',
  categoryId: '',
  tagsInput: '',
  featured: false
})

const addFormRules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  url: [
    { required: true, message: '请输入网址', trigger: 'blur' },
    { type: 'url', message: '请输入有效的网址', trigger: 'blur' }
  ],
  categoryId: [{ required: true, message: '请选择分类', trigger: 'change' }]
}

// 计算属性
const totalNavigations = computed(() => navigationStore.navigations.length)
const totalCategories = computed(() => categoryStore.categories.length)
const totalVisits = computed(() => 
  navigationStore.navigations.reduce((sum, nav) => sum + nav.visitCount, 0)
)
const featuredCount = computed(() => 
  navigationStore.navigations.filter(nav => nav.featured).length
)
const recentNavigations = computed(() => {
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
  return navigationStore.navigations.filter(nav => 
    new Date(nav.createTime) > oneWeekAgo
  ).length
})
const weeklyVisits = computed(() => 12500) // 模拟数据
const categories = computed(() => categoryStore.flatCategories)
const popularNavigations = computed(() => 
  [...navigationStore.navigations]
    .sort((a, b) => b.visitCount - a.visitCount)
    .slice(0, 5)
)

// 模拟数据
const recentActivities = ref([
  {
    id: 1,
    type: 'add',
    description: '添加了新导航 "ChatGPT"',
    time: new Date(Date.now() - 1000 * 60 * 30)
  },
  {
    id: 2,
    type: 'edit',
    description: '编辑了分类 "AI工具"',
    time: new Date(Date.now() - 1000 * 60 * 60 * 2)
  },
  {
    id: 3,
    type: 'delete',
    description: '删除了导航 "旧工具"',
    time: new Date(Date.now() - 1000 * 60 * 60 * 5)
  },
  {
    id: 4,
    type: 'sync',
    description: '数据同步完成',
    time: new Date(Date.now() - 1000 * 60 * 60 * 8)
  }
])

const lastSyncTime = ref('2分钟前')
const dataFileCount = ref(8)
const storageUsage = ref(65)

// 方法
const formatNumber = (num: number) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

const formatTime = (time: Date) => {
  const now = new Date()
  const diff = now.getTime() - time.getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days > 0) return `${days}天前`
  if (hours > 0) return `${hours}小时前`
  if (minutes > 0) return `${minutes}分钟前`
  return '刚刚'
}

const getActivityIcon = (type: string) => {
  const icons = {
    add: 'Plus',
    edit: 'Edit',
    delete: 'Delete',
    sync: 'Refresh'
  }
  return icons[type] || 'InfoFilled'
}

const getActivityColor = (type: string) => {
  const colors = {
    add: '#52c41a',
    edit: '#1890ff',
    delete: '#ff4d4f',
    sync: '#722ed1'
  }
  return colors[type] || '#666'
}

const navigateTo = (path: string) => {
  router.push(path)
}

const refreshData = async () => {
  try {
    await Promise.all([
      navigationStore.fetchNavigations(),
      categoryStore.fetchCategories()
    ])
    ElMessage.success('数据刷新成功')
  } catch (error) {
    ElMessage.error('数据刷新失败')
  }
}

const resetAddForm = () => {
  Object.assign(addForm, {
    title: '',
    url: '',
    description: '',
    categoryId: '',
    tagsInput: '',
    featured: false
  })
  addFormRef.value?.resetFields()
}

const handleAddNavigation = async () => {
  try {
    await addFormRef.value.validate()
    
    const navigationData = {
      ...addForm,
      tags: addForm.tagsInput.split(',').map(tag => tag.trim()).filter(Boolean)
    }
    
    await navigationStore.createNavigation(navigationData)
    ElMessage.success('添加成功')
    showAddDialog.value = false
    resetAddForm()
  } catch (error) {
    ElMessage.error('添加失败')
  }
}

const editNavigation = (navigation: Navigation) => {
  router.push(`/admin/navigation/edit/${navigation.id}`)
}

const handleFileChange = (file: any) => {
  console.log('Selected file:', file)
}

const handleImport = () => {
  ElMessage.info('导入功能开发中...')
  showImportDialog.value = false
}

const exportData = async () => {
  try {
    const data = {
      navigations: navigationStore.navigations,
      categories: categoryStore.categories,
      exportTime: new Date().toISOString()
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json'
    })
    
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ai-navigation-export-${Date.now()}.json`
    a.click()
    
    URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error('导出失败')
  }
}

// 生命周期
onMounted(async () => {
  await Promise.all([
    navigationStore.fetchNavigations(),
    categoryStore.fetchCategories()
  ])
})
</script>

<style lang="scss" scoped>
.admin-dashboard {
  padding: 1.5rem;
  background: var(--el-bg-color-page);
  min-height: 100vh;
}

.dashboard-header {
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

.stats-section {
  margin-bottom: 2rem;
  
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
    
    .stat-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.5rem;
      background: var(--el-bg-color);
      border-radius: 8px;
      border: 1px solid var(--el-border-color-light);
      
      .stat-icon {
        flex-shrink: 0;
        width: 64px;
        height: 64px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--el-bg-color-page);
        border-radius: 8px;
      }
      
      .stat-content {
        flex: 1;
        
        .stat-value {
          font-size: 2rem;
          font-weight: 600;
          color: var(--el-text-color-primary);
          line-height: 1;
        }
        
        .stat-label {
          color: var(--el-text-color-regular);
          font-size: 0.875rem;
          margin: 0.25rem 0;
        }
        
        .stat-change {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.75rem;
          
          &.positive {
            color: var(--el-color-success);
          }
          
          &.negative {
            color: var(--el-color-danger);
          }
        }
      }
    }
  }
}

.main-content {
  .content-grid {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 1.5rem;
  }
}

.section-card {
  background: var(--el-bg-color);
  border-radius: 8px;
  border: 1px solid var(--el-border-color-light);
  margin-bottom: 1.5rem;
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid var(--el-border-color-light);
    
    .card-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--el-text-color-primary);
      margin: 0;
    }
  }
  
  .card-content {
    padding: 1.5rem;
  }
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  
  .action-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    border: 1px solid var(--el-border-color-light);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    
    &:hover {
      border-color: var(--el-color-primary);
      background: var(--el-color-primary-light-9);
    }
    
    .action-icon {
      flex-shrink: 0;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--el-color-primary-light-8);
      color: var(--el-color-primary);
      border-radius: 6px;
    }
    
    .action-info {
      flex: 1;
      
      .action-title {
        font-weight: 500;
        color: var(--el-text-color-primary);
        margin-bottom: 0.25rem;
      }
      
      .action-desc {
        font-size: 0.875rem;
        color: var(--el-text-color-regular);
      }
    }
  }
}

.chart-container {
  height: 300px;
  
  .chart-placeholder {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: var(--el-text-color-placeholder);
    
    p {
      margin: 0.5rem 0;
      font-size: 1rem;
    }
    
    small {
      font-size: 0.75rem;
    }
  }
}

.activity-list {
  .activity-item {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 0.75rem 0;
    border-bottom: 1px solid var(--el-border-color-lighter);
    
    &:last-child {
      border-bottom: none;
    }
    
    .activity-icon {
      flex-shrink: 0;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--el-bg-color-page);
      border-radius: 50%;
    }
    
    .activity-content {
      flex: 1;
      
      .activity-text {
        color: var(--el-text-color-primary);
        font-size: 0.875rem;
        margin-bottom: 0.25rem;
      }
      
      .activity-time {
        color: var(--el-text-color-placeholder);
        font-size: 0.75rem;
      }
    }
  }
}

.popular-list {
  .popular-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 0;
    border-bottom: 1px solid var(--el-border-color-lighter);
    
    &:last-child {
      border-bottom: none;
    }
    
    .popular-rank {
      flex-shrink: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--el-color-primary);
      color: white;
      border-radius: 50%;
      font-size: 0.75rem;
      font-weight: 600;
    }
    
    .popular-icon {
      flex-shrink: 0;
      width: 32px;
      height: 32px;
      
      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 4px;
      }
    }
    
    .popular-info {
      flex: 1;
      min-width: 0;
      
      .popular-title {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--el-text-color-primary);
        margin-bottom: 0.25rem;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      
      .popular-visits {
        font-size: 0.75rem;
        color: var(--el-text-color-regular);
      }
    }
    
    .popular-actions {
      flex-shrink: 0;
    }
  }
}

.status-list {
  .status-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 0;
    border-bottom: 1px solid var(--el-border-color-lighter);
    
    &:last-child {
      border-bottom: none;
    }
    
    .status-label {
      color: var(--el-text-color-regular);
      font-size: 0.875rem;
    }
    
    .status-value {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      
      .storage-text {
        font-size: 0.75rem;
        color: var(--el-text-color-regular);
      }
    }
  }
}

.import-content {
  .upload-text {
    text-align: center;
    margin-top: 1rem;
    
    p {
      margin: 0.5rem 0;
      color: var(--el-text-color-regular);
    }
    
    .upload-tip {
      font-size: 0.875rem;
      color: var(--el-text-color-placeholder);
    }
    
    em {
      color: var(--el-color-primary);
      font-style: normal;
    }
  }
}

// 响应式设计
@media (max-width: 1024px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .admin-dashboard {
    padding: 1rem;
  }
  
  .dashboard-header .header-content {
    flex-direction: column;
    gap: 1rem;
    
    .header-actions {
      align-self: stretch;
      
      .el-button {
        flex: 1;
      }
    }
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .quick-actions {
    grid-template-columns: 1fr;
  }
}
</style> 
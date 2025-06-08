<template>
  <div class="navigation-manage">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-info">
          <h1 class="page-title">导航管理</h1>
          <p class="page-subtitle">管理所有导航项目</p>
        </div>
        
        <div class="header-actions">
          <el-button :icon="Upload" @click="showImportDialog = true">
            批量导入
          </el-button>
          <el-button :icon="Download" @click="exportNavigations">
            导出数据
          </el-button>
          <el-button type="primary" :icon="Plus" @click="showAddDialog = true">
            添加导航
          </el-button>
        </div>
      </div>
    </div>

    <!-- 筛选和搜索 -->
    <div class="filter-section">
      <div class="filter-content">
        <div class="filter-left">
          <el-input
            v-model="searchQuery"
            placeholder="搜索导航标题、描述或网址..."
            :prefix-icon="Search"
            clearable
            style="width: 300px"
            @input="handleSearch"
          />
          
          <el-select
            v-model="filterCategory"
            placeholder="选择分类"
            clearable
            style="width: 150px"
            @change="handleFilter"
          >
            <el-option label="全部分类" value="" />
            <el-option
              v-for="category in categories"
              :key="category.id"
              :label="category.name"
              :value="category.id"
            />
          </el-select>
          
          <el-select
            v-model="filterStatus"
            placeholder="状态"
            style="width: 120px"
            @change="handleFilter"
          >
            <el-option label="全部" value="" />
            <el-option label="启用" value="active" />
            <el-option label="禁用" value="inactive" />
            <el-option label="推荐" value="featured" />
          </el-select>
        </div>
        
        <div class="filter-right">
          <el-button-group>
            <el-button
              :type="viewMode === 'table' ? 'primary' : 'default'"
              :icon="List"
              @click="viewMode = 'table'"
            >
              列表
            </el-button>
            <el-button
              :type="viewMode === 'grid' ? 'primary' : 'default'"
              :icon="Grid"
              @click="viewMode = 'grid'"
            >
              网格
            </el-button>
          </el-button-group>
        </div>
      </div>
    </div>

    <!-- 批量操作栏 -->
    <div v-if="selectedItems.length > 0" class="batch-actions">
      <div class="batch-info">
        已选择 <strong>{{ selectedItems.length }}</strong> 项
      </div>
      <div class="batch-buttons">
        <el-button size="small" @click="batchSetFeatured(true)">
          设为推荐
        </el-button>
        <el-button size="small" @click="batchSetFeatured(false)">
          取消推荐
        </el-button>
        <el-button size="small" @click="batchSetStatus(true)">
          启用
        </el-button>
        <el-button size="small" @click="batchSetStatus(false)">
          禁用
        </el-button>
        <el-button size="small" type="danger" @click="batchDelete">
          删除
        </el-button>
        <el-button size="small" @click="clearSelection">
          取消选择
        </el-button>
      </div>
    </div>

    <!-- 导航列表 -->
    <div class="navigation-content">
      <!-- 表格视图 -->
      <div v-if="viewMode === 'table'" class="table-view">
        <el-table
          ref="tableRef"
          :data="paginatedNavigations"
          @selection-change="handleSelectionChange"
          @sort-change="handleSortChange"
        >
          <el-table-column type="selection" width="55" />
          
          <el-table-column label="导航信息" min-width="300">
            <template #default="{ row }">
              <div class="navigation-info">
                <div class="nav-icon">
                  <img :src="row.icon" :alt="row.title" />
                </div>
                <div class="nav-details">
                  <div class="nav-title">
                    {{ row.title }}
                    <el-tag v-if="row.featured" type="warning" size="small">
                      推荐
                    </el-tag>
                  </div>
                  <div class="nav-url">{{ row.url }}</div>
                  <div class="nav-description">{{ row.description }}</div>
                </div>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column label="分类" width="120">
            <template #default="{ row }">
              <el-tag :color="getCategoryColor(row.categoryId)" size="small">
                {{ getCategoryName(row.categoryId) }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column label="标签" width="200">
            <template #default="{ row }">
              <div class="nav-tags">
                <el-tag
                  v-for="tag in row.tags.slice(0, 3)"
                  :key="tag"
                  size="small"
                  type="info"
                  class="tag-item"
                >
                  {{ tag }}
                </el-tag>
                <span v-if="row.tags.length > 3" class="more-tags">
                  +{{ row.tags.length - 3 }}
                </span>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column 
            label="访问量" 
            prop="visitCount" 
            width="100" 
            sortable="custom"
          />
          
          <el-table-column 
            label="评分" 
            prop="rating" 
            width="80" 
            sortable="custom"
          >
            <template #default="{ row }">
              <div class="rating-display">
                <el-icon color="#faad14"><Star /></el-icon>
                {{ row.rating }}
              </div>
            </template>
          </el-table-column>
          
          <el-table-column label="状态" width="80">
            <template #default="{ row }">
              <el-switch
                v-model="row.isActive"
                @change="toggleNavigationStatus(row)"
              />
            </template>
          </el-table-column>
          
          <el-table-column 
            label="创建时间" 
            prop="createTime" 
            width="120" 
            sortable="custom"
          >
            <template #default="{ row }">
              {{ formatDate(row.createTime) }}
            </template>
          </el-table-column>
          
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <div class="table-actions">
                <el-button size="small" text @click="editNavigation(row)">
                  编辑
                </el-button>
                <el-button size="small" text @click="duplicateNavigation(row)">
                  复制
                </el-button>
                <el-button 
                  size="small" 
                  text 
                  type="danger" 
                  @click="deleteNavigation(row)"
                >
                  删除
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
      
      <!-- 网格视图 -->
      <div v-else class="grid-view">
        <div class="navigation-grid">
          <div
            v-for="navigation in paginatedNavigations"
            :key="navigation.id"
            class="navigation-card"
            :class="{ selected: selectedItems.includes(navigation.id) }"
            @click="toggleSelection(navigation)"
          >
            <div class="card-header">
              <div class="card-checkbox">
                <el-checkbox
                  :model-value="selectedItems.includes(navigation.id)"
                  @click.stop
                  @change="toggleSelection(navigation)"
                />
              </div>
              <div class="card-status">
                <el-tag v-if="navigation.featured" type="warning" size="small">
                  推荐
                </el-tag>
                <el-tag 
                  :type="navigation.isActive ? 'success' : 'info'" 
                  size="small"
                >
                  {{ navigation.isActive ? '启用' : '禁用' }}
                </el-tag>
              </div>
            </div>
            
            <div class="card-content">
              <div class="nav-icon">
                <img :src="navigation.icon" :alt="navigation.title" />
              </div>
              
              <div class="nav-info">
                <h3 class="nav-title">{{ navigation.title }}</h3>
                <p class="nav-description">{{ navigation.description }}</p>
                <div class="nav-url">{{ navigation.url }}</div>
                
                <div class="nav-meta">
                  <el-tag :color="getCategoryColor(navigation.categoryId)" size="small">
                    {{ getCategoryName(navigation.categoryId) }}
                  </el-tag>
                  <div class="nav-stats">
                    <span class="stat-item">
                      <el-icon><View /></el-icon>
                      {{ navigation.visitCount }}
                    </span>
                    <span class="stat-item">
                      <el-icon><Star /></el-icon>
                      {{ navigation.rating }}
                    </span>
                  </div>
                </div>
                
                <div class="nav-tags">
                  <el-tag
                    v-for="tag in navigation.tags.slice(0, 2)"
                    :key="tag"
                    size="small"
                    type="info"
                  >
                    {{ tag }}
                  </el-tag>
                  <span v-if="navigation.tags.length > 2" class="more-tags">
                    +{{ navigation.tags.length - 2 }}
                  </span>
                </div>
              </div>
            </div>
            
            <div class="card-actions">
              <el-button size="small" @click.stop="editNavigation(navigation)">
                编辑
              </el-button>
              <el-button size="small" @click.stop="duplicateNavigation(navigation)">
                复制
              </el-button>
              <el-button 
                size="small" 
                type="danger" 
                @click.stop="deleteNavigation(navigation)"
              >
                删除
              </el-button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 空状态 -->
      <div v-if="filteredNavigations.length === 0" class="empty-state">
        <el-empty description="没有找到导航项目">
          <el-button type="primary" @click="showAddDialog = true">
            添加第一个导航
          </el-button>
        </el-empty>
      </div>
    </div>

    <!-- 分页 -->
    <div v-if="totalPages > 1" class="pagination-container">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="filteredNavigations.length"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      />
    </div>

    <!-- 添加/编辑对话框 -->
    <NavigationEditDialog
      v-model="showEditDialog"
      :navigation="editingNavigation"
      :categories="categories"
      @save="handleSaveNavigation"
    />

    <!-- 导入对话框 -->
    <ImportDialog
      v-model="showImportDialog"
      @import="handleImport"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus, Upload, Download, Search, List, Grid,
  Star, View
} from '@element-plus/icons-vue'
import NavigationEditDialog from '@/components/Admin/NavigationEditDialog.vue'
import ImportDialog from '@/components/Admin/ImportDialog.vue'
import { useNavigationStore } from '@/stores/navigation'
import { useCategoryStore } from '@/stores/category'
import type { Navigation } from '@/types/navigation'

const navigationStore = useNavigationStore()
const categoryStore = useCategoryStore()

// 响应式数据
const searchQuery = ref('')
const filterCategory = ref('')
const filterStatus = ref('')
const viewMode = ref<'table' | 'grid'>('table')
const selectedItems = ref<string[]>([])
const currentPage = ref(1)
const pageSize = ref(20)
const sortField = ref('')
const sortOrder = ref<'ascending' | 'descending'>('ascending')

const showAddDialog = ref(false)
const showEditDialog = ref(false)
const showImportDialog = ref(false)
const editingNavigation = ref<Navigation | null>(null)

const tableRef = ref()

// 计算属性
const categories = computed(() => categoryStore.flatCategories)

const filteredNavigations = computed(() => {
  let items = [...navigationStore.navigations]
  
  // 搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    items = items.filter(item =>
      item.title.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      item.url.toLowerCase().includes(query) ||
      item.tags.some(tag => tag.toLowerCase().includes(query))
    )
  }
  
  // 分类过滤
  if (filterCategory.value) {
    items = items.filter(item => item.categoryId === filterCategory.value)
  }
  
  // 状态过滤
  if (filterStatus.value) {
    switch (filterStatus.value) {
      case 'active':
        items = items.filter(item => item.isActive)
        break
      case 'inactive':
        items = items.filter(item => !item.isActive)
        break
      case 'featured':
        items = items.filter(item => item.featured)
        break
    }
  }
  
  // 排序
  if (sortField.value) {
    items.sort((a, b) => {
      const aVal = a[sortField.value as keyof Navigation]
      const bVal = b[sortField.value as keyof Navigation]
      
      let result = 0
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        result = aVal.localeCompare(bVal)
      } else if (typeof aVal === 'number' && typeof bVal === 'number') {
        result = aVal - bVal
      } else {
        result = String(aVal).localeCompare(String(bVal))
      }
      
      return sortOrder.value === 'ascending' ? result : -result
    })
  }
  
  return items
})

const totalPages = computed(() => {
  return Math.ceil(filteredNavigations.value.length / pageSize.value)
})

const paginatedNavigations = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredNavigations.value.slice(start, end)
})

// 方法
const handleSearch = () => {
  currentPage.value = 1
}

const handleFilter = () => {
  currentPage.value = 1
}

const handleSortChange = ({ prop, order }: any) => {
  sortField.value = prop
  sortOrder.value = order
}

const handleSelectionChange = (selection: Navigation[]) => {
  selectedItems.value = selection.map(item => item.id)
}

const toggleSelection = (navigation: Navigation) => {
  const index = selectedItems.value.indexOf(navigation.id)
  if (index > -1) {
    selectedItems.value.splice(index, 1)
  } else {
    selectedItems.value.push(navigation.id)
  }
}

const clearSelection = () => {
  selectedItems.value = []
  tableRef.value?.clearSelection()
}

const handlePageChange = (page: number) => {
  currentPage.value = page
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
}

const getCategoryName = (categoryId: string) => {
  const category = categories.value.find(c => c.id === categoryId)
  return category?.name || '未分类'
}

const getCategoryColor = (categoryId: string) => {
  const category = categories.value.find(c => c.id === categoryId)
  return category?.color || '#909399'
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString()
}

const editNavigation = (navigation: Navigation) => {
  editingNavigation.value = navigation
  showEditDialog.value = true
}

const duplicateNavigation = async (navigation: Navigation) => {
  try {
    const duplicated = {
      ...navigation,
      id: undefined,
      title: `${navigation.title} (副本)`,
      createTime: new Date().toISOString(),
      updateTime: new Date().toISOString()
    }
    
    await navigationStore.createNavigation(duplicated)
    ElMessage.success('复制成功')
  } catch (error) {
    ElMessage.error('复制失败')
  }
}

const deleteNavigation = async (navigation: Navigation) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除导航 "${navigation.title}" 吗？`,
      '确认删除',
      {
        type: 'warning'
      }
    )
    
    await navigationStore.deleteNavigation(navigation.id)
    ElMessage.success('删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const toggleNavigationStatus = async (navigation: Navigation) => {
  try {
    await navigationStore.updateNavigation(navigation.id, {
      isActive: navigation.isActive
    })
    ElMessage.success(`已${navigation.isActive ? '启用' : '禁用'}`)
  } catch (error) {
    ElMessage.error('状态更新失败')
    navigation.isActive = !navigation.isActive // 回滚状态
  }
}

const batchSetFeatured = async (featured: boolean) => {
  try {
    await Promise.all(
      selectedItems.value.map(id =>
        navigationStore.updateNavigation(id, { featured })
      )
    )
    ElMessage.success(`已${featured ? '设为' : '取消'}推荐`)
    clearSelection()
  } catch (error) {
    ElMessage.error('批量操作失败')
  }
}

const batchSetStatus = async (isActive: boolean) => {
  try {
    await Promise.all(
      selectedItems.value.map(id =>
        navigationStore.updateNavigation(id, { isActive })
      )
    )
    ElMessage.success(`已批量${isActive ? '启用' : '禁用'}`)
    clearSelection()
  } catch (error) {
    ElMessage.error('批量操作失败')
  }
}

const batchDelete = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedItems.value.length} 个导航吗？`,
      '确认删除',
      {
        type: 'warning'
      }
    )
    
    await Promise.all(
      selectedItems.value.map(id => navigationStore.deleteNavigation(id))
    )
    
    ElMessage.success('批量删除成功')
    clearSelection()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量删除失败')
    }
  }
}

const handleSaveNavigation = async (navigationData: any) => {
  try {
    if (editingNavigation.value) {
      await navigationStore.updateNavigation(editingNavigation.value.id, navigationData)
      ElMessage.success('更新成功')
    } else {
      await navigationStore.createNavigation(navigationData)
      ElMessage.success('添加成功')
    }
    
    showEditDialog.value = false
    editingNavigation.value = null
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

const handleImport = async (data: any[]) => {
  try {
    await navigationStore.batchImport(data)
    ElMessage.success(`成功导入 ${data.length} 个导航`)
    showImportDialog.value = false
  } catch (error) {
    ElMessage.error('导入失败')
  }
}

const exportNavigations = () => {
  try {
    const data = filteredNavigations.value
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json'
    })
    
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `navigations-${Date.now()}.json`
    a.click()
    
    URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error('导出失败')
  }
}

// 监听添加对话框
watch(showAddDialog, (show) => {
  if (show) {
    editingNavigation.value = null
    showEditDialog.value = true
    showAddDialog.value = false
  }
})

// 生命周期
onMounted(async () => {
  await Promise.all([
    navigationStore.fetchNavigations(),
    categoryStore.fetchCategories()
  ])
})
</script>

<style lang="scss" scoped>
.navigation-manage {
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

.filter-section {
  background: var(--el-bg-color);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  border: 1px solid var(--el-border-color-light);
  
  .filter-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    
    .filter-left {
      display: flex;
      gap: 1rem;
      flex: 1;
    }
  }
}

.batch-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--el-color-primary-light-9);
  border: 1px solid var(--el-color-primary-light-7);
  border-radius: 6px;
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
  
  .batch-info {
    color: var(--el-color-primary);
    font-size: 0.875rem;
  }
  
  .batch-buttons {
    display: flex;
    gap: 0.5rem;
  }
}

.navigation-content {
  background: var(--el-bg-color);
  border-radius: 8px;
  border: 1px solid var(--el-border-color-light);
  overflow: hidden;
}

.table-view {
  .navigation-info {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    
    .nav-icon {
      flex-shrink: 0;
      width: 40px;
      height: 40px;
      
      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 4px;
      }
    }
    
    .nav-details {
      flex: 1;
      min-width: 0;
      
      .nav-title {
        font-weight: 500;
        color: var(--el-text-color-primary);
        margin-bottom: 0.25rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      
      .nav-url {
        font-size: 0.875rem;
        color: var(--el-color-primary);
        margin-bottom: 0.25rem;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      
      .nav-description {
        font-size: 0.875rem;
        color: var(--el-text-color-regular);
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
    }
  }
  
  .nav-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
    
    .tag-item {
      font-size: 0.75rem;
    }
    
    .more-tags {
      font-size: 0.75rem;
      color: var(--el-text-color-placeholder);
    }
  }
  
  .rating-display {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.875rem;
  }
  
  .table-actions {
    display: flex;
    gap: 0.25rem;
  }
}

.grid-view {
  padding: 1.5rem;
  
  .navigation-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 1rem;
    
    .navigation-card {
      border: 1px solid var(--el-border-color-light);
      border-radius: 8px;
      padding: 1rem;
      cursor: pointer;
      transition: all 0.2s;
      
      &:hover {
        border-color: var(--el-color-primary);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }
      
      &.selected {
        border-color: var(--el-color-primary);
        background: var(--el-color-primary-light-9);
      }
      
      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 1rem;
        
        .card-status {
          display: flex;
          gap: 0.5rem;
        }
      }
      
      .card-content {
        display: flex;
        gap: 1rem;
        margin-bottom: 1rem;
        
        .nav-icon {
          flex-shrink: 0;
          width: 48px;
          height: 48px;
          
          img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 6px;
          }
        }
        
        .nav-info {
          flex: 1;
          min-width: 0;
          
          .nav-title {
            font-size: 1rem;
            font-weight: 600;
            color: var(--el-text-color-primary);
            margin: 0 0 0.5rem 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          
          .nav-description {
            font-size: 0.875rem;
            color: var(--el-text-color-regular);
            margin: 0 0 0.5rem 0;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          
          .nav-url {
            font-size: 0.75rem;
            color: var(--el-color-primary);
            margin-bottom: 0.75rem;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          
          .nav-meta {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.75rem;
            
            .nav-stats {
              display: flex;
              gap: 1rem;
              
              .stat-item {
                display: flex;
                align-items: center;
                gap: 0.25rem;
                font-size: 0.75rem;
                color: var(--el-text-color-regular);
              }
            }
          }
          
          .nav-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 0.25rem;
            
            .more-tags {
              font-size: 0.75rem;
              color: var(--el-text-color-placeholder);
            }
          }
        }
      }
      
      .card-actions {
        display: flex;
        gap: 0.5rem;
        justify-content: flex-end;
      }
    }
  }
}

.empty-state {
  padding: 3rem;
  text-align: center;
}

.pagination-container {
  display: flex;
  justify-content: center;
  padding: 1.5rem;
  background: var(--el-bg-color);
  border-top: 1px solid var(--el-border-color-light);
}

// 响应式设计
@media (max-width: 1024px) {
  .filter-content {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
    
    .filter-left {
      flex-direction: column;
    }
  }
  
  .navigation-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  }
}

@media (max-width: 768px) {
  .navigation-manage {
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
  
  .batch-actions {
    flex-direction: column;
    gap: 0.75rem;
    
    .batch-buttons {
      justify-content: center;
      flex-wrap: wrap;
    }
  }
  
  .navigation-grid {
    grid-template-columns: 1fr;
  }
}
</style> 
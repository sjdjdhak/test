<template>
  <div class="category-manage">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-info">
          <h1 class="page-title">分类管理</h1>
          <p class="page-subtitle">管理导航分类结构</p>
        </div>
        
        <div class="header-actions">
          <el-button :icon="Refresh" @click="refreshData">
            刷新
          </el-button>
          <el-button :icon="Sort" @click="showSortDialog = true">
            批量排序
          </el-button>
          <el-button type="primary" :icon="Plus" @click="showAddDialog = true">
            添加分类
          </el-button>
        </div>
      </div>
    </div>

    <!-- 统计信息 -->
    <div class="stats-section">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">
            <el-icon size="24" color="#1890ff">
              <FolderOpened />
            </el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ totalCategories }}</div>
            <div class="stat-label">总分类数</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">
            <el-icon size="24" color="#52c41a">
              <Grid />
            </el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ maxDepth }}</div>
            <div class="stat-label">最大层级</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">
            <el-icon size="24" color="#fa8c16">
              <Link />
            </el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ totalNavigations }}</div>
            <div class="stat-label">关联导航</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">
            <el-icon size="24" color="#eb2f96">
              <Warning />
            </el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ emptyCategories }}</div>
            <div class="stat-label">空分类</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 操作工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-input
          v-model="searchQuery"
          placeholder="搜索分类名称..."
          :prefix-icon="Search"
          clearable
          style="width: 300px"
          @input="handleSearch"
        />
        
        <el-button-group>
          <el-button 
            :type="showMode === 'tree' ? 'primary' : 'default'"
            :icon="Grid"
            @click="showMode = 'tree'"
          >
            树形视图
          </el-button>
          <el-button 
            :type="showMode === 'list' ? 'primary' : 'default'"
            :icon="List"
            @click="showMode = 'list'"
          >
            列表视图
          </el-button>
        </el-button-group>
      </div>
      
      <div class="toolbar-right">
        <el-switch
          v-model="showEmpty"
          active-text="显示空分类"
          @change="handleFilterChange"
        />
        
        <el-switch
          v-model="expandAll"
          active-text="展开全部"
          @change="handleExpandChange"
        />
      </div>
    </div>

    <!-- 分类内容 -->
    <div class="category-content">
      <!-- 树形视图 -->
      <div v-if="showMode === 'tree'" class="tree-view">
        <el-tree
          ref="treeRef"
          :data="filteredCategories"
          :props="treeProps"
          :default-expand-all="expandAll"
          :expand-on-click-node="false"
          :allow-drag="allowDrag"
          :allow-drop="allowDrop"
          draggable
          node-key="id"
          @node-drag-end="handleDragEnd"
        >
          <template #default="{ node, data }">
            <div class="tree-node">
              <div class="node-content">
                <div class="node-icon">
                  <el-icon :color="data.color" size="18">
                    <component :is="data.icon" />
                  </el-icon>
                </div>
                
                <div class="node-info">
                  <div class="node-title">
                    {{ data.name }}
                    <el-tag v-if="!data.isActive" type="info" size="small">
                      禁用
                    </el-tag>
                  </div>
                  <div class="node-meta">
                    <span class="node-count">{{ getNavigationCount(data.id) }} 个导航</span>
                    <span class="node-level">层级 {{ data.level + 1 }}</span>
                  </div>
                </div>
              </div>
              
              <div class="node-actions">
                <el-button size="small" text @click="addSubCategory(data)">
                  <el-icon><Plus /></el-icon>
                </el-button>
                <el-button size="small" text @click="editCategory(data)">
                  <el-icon><Edit /></el-icon>
                </el-button>
                <el-button 
                  size="small" 
                  text 
                  type="danger" 
                  @click="deleteCategory(data)"
                >
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
            </div>
          </template>
        </el-tree>
      </div>
      
      <!-- 列表视图 -->
      <div v-else class="list-view">
        <el-table
          :data="flatCategories"
          row-key="id"
          @sort-change="handleSortChange"
        >
          <el-table-column label="分类信息" min-width="300">
            <template #default="{ row }">
              <div class="category-info">
                <div class="category-indent" :style="{ paddingLeft: `${row.level * 20}px` }">
                  <div class="category-icon">
                    <el-icon :color="row.color" size="20">
                      <component :is="row.icon" />
                    </el-icon>
                  </div>
                  <div class="category-details">
                    <div class="category-name">
                      {{ row.name }}
                      <el-tag v-if="!row.isActive" type="info" size="small">
                        禁用
                      </el-tag>
                    </div>
                    <div class="category-description">{{ row.description }}</div>
                  </div>
                </div>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column label="层级" width="80" prop="level" sortable="custom">
            <template #default="{ row }">
              {{ row.level + 1 }}
            </template>
          </el-table-column>
          
          <el-table-column label="导航数量" width="100" sortable="custom">
            <template #default="{ row }">
              {{ getNavigationCount(row.id) }}
            </template>
          </el-table-column>
          
          <el-table-column label="排序" width="80" prop="order" sortable="custom" />
          
          <el-table-column label="状态" width="80">
            <template #default="{ row }">
              <el-switch
                v-model="row.isActive"
                @change="toggleCategoryStatus(row)"
              />
            </template>
          </el-table-column>
          
          <el-table-column label="创建时间" width="120" prop="createTime" sortable="custom">
            <template #default="{ row }">
              {{ formatDate(row.createTime) }}
            </template>
          </el-table-column>
          
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <div class="table-actions">
                <el-button size="small" text @click="addSubCategory(row)">
                  添加子分类
                </el-button>
                <el-button size="small" text @click="editCategory(row)">
                  编辑
                </el-button>
                <el-button 
                  size="small" 
                  text 
                  type="danger" 
                  @click="deleteCategory(row)"
                >
                  删除
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
      
      <!-- 空状态 -->
      <div v-if="filteredCategories.length === 0" class="empty-state">
        <Empty
          type="folder"
          title="暂无分类"
          description="还没有创建任何分类，点击下方按钮开始创建"
        >
          <template #actions>
            <el-button type="primary" @click="showAddDialog = true">
              创建第一个分类
            </el-button>
          </template>
        </Empty>
      </div>
    </div>

    <!-- 添加/编辑分类对话框 -->
    <el-dialog
      v-model="showEditDialog"
      :title="editingCategory ? '编辑分类' : '添加分类'"
      width="600px"
      @close="resetForm"
    >
      <el-form
        ref="formRef"
        :model="categoryForm"
        :rules="formRules"
        label-width="80px"
      >
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="categoryForm.name" placeholder="请输入分类名称" />
        </el-form-item>
        
        <el-form-item label="父级分类" prop="parentId">
          <el-tree-select
            v-model="categoryForm.parentId"
            :data="parentCategoryOptions"
            :props="{ label: 'name', value: 'id' }"
            placeholder="选择父级分类（可选）"
            clearable
            check-strictly
          />
        </el-form-item>
        
        <el-form-item label="分类描述" prop="description">
          <el-input
            v-model="categoryForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入分类描述"
          />
        </el-form-item>
        
        <el-form-item label="分类图标" prop="icon">
          <div class="icon-selector">
            <el-input
              v-model="categoryForm.icon"
              placeholder="图标名称"
              style="width: 200px"
            />
            <div class="icon-preview">
              <el-icon :color="categoryForm.color" size="24">
                <component :is="categoryForm.icon" />
              </el-icon>
            </div>
          </div>
        </el-form-item>
        
        <el-form-item label="分类颜色" prop="color">
          <el-color-picker v-model="categoryForm.color" />
        </el-form-item>
        
        <el-form-item label="排序权重" prop="order">
          <el-input-number
            v-model="categoryForm.order"
            :min="0"
            :max="999"
            placeholder="数值越大排序越靠前"
          />
        </el-form-item>
        
        <el-form-item label="状态">
          <el-switch
            v-model="categoryForm.isActive"
            active-text="启用"
            inactive-text="禁用"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSaveCategory">确定</el-button>
      </template>
    </el-dialog>

    <!-- 批量排序对话框 -->
    <el-dialog
      v-model="showSortDialog"
      title="批量排序"
      width="800px"
    >
      <div class="sort-content">
        <div class="sort-tips">
          <el-alert
            title="拖拽分类项目可以调整排序，排序将影响前端显示顺序"
            type="info"
            :closable="false"
          />
        </div>
        
        <div class="sort-list">
          <draggable
            v-model="sortableCategories"
            item-key="id"
            @end="handleSortEnd"
          >
            <template #item="{ element }">
              <div class="sort-item">
                <div class="sort-handle">
                  <el-icon><Rank /></el-icon>
                </div>
                <div class="sort-info">
                  <el-icon :color="element.color">
                    <component :is="element.icon" />
                  </el-icon>
                  <span>{{ element.name }}</span>
                </div>
                <div class="sort-order">{{ element.order }}</div>
              </div>
            </template>
          </draggable>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="showSortDialog = false">取消</el-button>
        <el-button type="primary" @click="applySortChanges">应用排序</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus, Refresh, Sort, Search, Grid, List,
  FolderOpened, Link, Warning, Edit, Delete, Rank
} from '@element-plus/icons-vue'
import draggable from 'vuedraggable'
import Empty from '@/components/Common/Empty.vue'
import { useCategoryStore } from '@/stores/category'
import { useNavigationStore } from '@/stores/navigation'
import type { Category } from '@/types/category'

const categoryStore = useCategoryStore()
const navigationStore = useNavigationStore()

// 响应式数据
const searchQuery = ref('')
const showMode = ref<'tree' | 'list'>('tree')
const showEmpty = ref(true)
const expandAll = ref(false)
const showEditDialog = ref(false)
const showAddDialog = ref(false)
const showSortDialog = ref(false)
const editingCategory = ref<Category | null>(null)
const parentCategory = ref<Category | null>(null)

const treeRef = ref()
const formRef = ref()

// 表单数据
const categoryForm = reactive({
  name: '',
  parentId: '',
  description: '',
  icon: 'Folder',
  color: '#1890ff',
  order: 0,
  isActive: true
})

const formRules = {
  name: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
    { min: 1, max: 20, message: '长度在 1 到 20 个字符', trigger: 'blur' }
  ],
  description: [
    { max: 100, message: '描述不能超过100个字符', trigger: 'blur' }
  ]
}

const treeProps = {
  children: 'children',
  label: 'name'
}

// 排序相关
const sortableCategories = ref<Category[]>([])

// 计算属性
const totalCategories = computed(() => categoryStore.categories.length)
const maxDepth = computed(() => {
  const getMaxDepth = (categories: Category[], depth = 0): number => {
    let max = depth
    categories.forEach(category => {
      if (category.children && category.children.length > 0) {
        max = Math.max(max, getMaxDepth(category.children, depth + 1))
      }
    })
    return max
  }
  return getMaxDepth(categoryStore.categories) + 1
})
const totalNavigations = computed(() => navigationStore.navigations.length)
const emptyCategories = computed(() => {
  return categoryStore.flatCategories.filter(cat => 
    getNavigationCount(cat.id) === 0
  ).length
})

const filteredCategories = computed(() => {
  let categories = [...categoryStore.categories]
  
  // 搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    categories = filterCategoriesBySearch(categories, query)
  }
  
  // 空分类过滤
  if (!showEmpty.value) {
    categories = filterEmptyCategories(categories)
  }
  
  return categories
})

const flatCategories = computed(() => {
  return categoryStore.flatCategories.filter(category => {
    if (searchQuery.value) {
      return category.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    }
    if (!showEmpty.value && getNavigationCount(category.id) === 0) {
      return false
    }
    return true
  })
})

const parentCategoryOptions = computed(() => {
  const options = [...categoryStore.categories]
  if (editingCategory.value) {
    // 编辑时排除自己和子分类
    return filterSelfAndChildren(options, editingCategory.value.id)
  }
  return options
})

// 方法
const filterCategoriesBySearch = (categories: Category[], query: string): Category[] => {
  return categories.filter(category => {
    const matchSelf = category.name.toLowerCase().includes(query)
    const matchChildren = category.children && 
      filterCategoriesBySearch(category.children, query).length > 0
    
    if (matchSelf || matchChildren) {
      return {
        ...category,
        children: category.children ? 
          filterCategoriesBySearch(category.children, query) : []
      }
    }
    return false
  }).filter(Boolean)
}

const filterEmptyCategories = (categories: Category[]): Category[] => {
  return categories.filter(category => {
    const hasNavigations = getNavigationCount(category.id) > 0
    const hasValidChildren = category.children && 
      filterEmptyCategories(category.children).length > 0
    
    if (hasNavigations || hasValidChildren) {
      return {
        ...category,
        children: category.children ? 
          filterEmptyCategories(category.children) : []
      }
    }
    return false
  }).filter(Boolean)
}

const filterSelfAndChildren = (categories: Category[], excludeId: string): Category[] => {
  return categories.filter(category => {
    if (category.id === excludeId) return false
    
    return {
      ...category,
      children: category.children ? 
        filterSelfAndChildren(category.children, excludeId) : []
    }
  })
}

const getNavigationCount = (categoryId: string) => {
  return navigationStore.getNavigationsByCategory(categoryId).length
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString()
}

const handleSearch = () => {
  // 搜索逻辑已在计算属性中处理
}

const handleFilterChange = () => {
  // 过滤逻辑已在计算属性中处理
}

const handleExpandChange = () => {
  if (treeRef.value) {
    if (expandAll.value) {
      treeRef.value.expandAll()
    } else {
      treeRef.value.collapseAll()
    }
  }
}

const handleSortChange = ({ prop, order }: any) => {
  // 排序逻辑
  console.log('Sort change:', prop, order)
}

const allowDrag = (node: any) => {
  return true
}

const allowDrop = (draggingNode: any, dropNode: any, type: string) => {
  // 不允许拖拽到子节点
  if (type === 'inner') {
    return dropNode.level < 2 // 最多3级
  }
  return true
}

const handleDragEnd = (draggingNode: any, dropNode: any, dropType: string) => {
  console.log('Drag end:', draggingNode, dropNode, dropType)
  // 这里处理拖拽排序逻辑
  ElMessage.success('排序已更新')
}

const addSubCategory = (parentCat?: Category) => {
  parentCategory.value = parentCat || null
  categoryForm.parentId = parentCat?.id || ''
  editingCategory.value = null
  showEditDialog.value = true
}

const editCategory = (category: Category) => {
  editingCategory.value = category
  Object.assign(categoryForm, {
    name: category.name,
    parentId: category.parentId || '',
    description: category.description,
    icon: category.icon,
    color: category.color,
    order: category.order,
    isActive: category.isActive
  })
  showEditDialog.value = true
}

const deleteCategory = async (category: Category) => {
  const navigationCount = getNavigationCount(category.id)
  const hasChildren = category.children && category.children.length > 0
  
  let confirmMessage = `确定要删除分类 "${category.name}" 吗？`
  if (navigationCount > 0) {
    confirmMessage += `\n该分类下有 ${navigationCount} 个导航项目。`
  }
  if (hasChildren) {
    confirmMessage += `\n该分类下有子分类，删除后子分类将移动到上级。`
  }
  
  try {
    await ElMessageBox.confirm(confirmMessage, '确认删除', {
      type: 'warning'
    })
    
    await categoryStore.deleteCategory(category.id)
    ElMessage.success('删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const toggleCategoryStatus = async (category: Category) => {
  try {
    await categoryStore.updateCategory(category.id, {
      isActive: category.isActive
    })
    ElMessage.success(`已${category.isActive ? '启用' : '禁用'}`)
  } catch (error) {
    ElMessage.error('状态更新失败')
    category.isActive = !category.isActive // 回滚状态
  }
}

const resetForm = () => {
  Object.assign(categoryForm, {
    name: '',
    parentId: '',
    description: '',
    icon: 'Folder',
    color: '#1890ff',
    order: 0,
    isActive: true
  })
  editingCategory.value = null
  parentCategory.value = null
  formRef.value?.resetFields()
}

const handleSaveCategory = async () => {
  try {
    await formRef.value.validate()
    
    const categoryData = {
      ...categoryForm,
      parentId: categoryForm.parentId || null
    }
    
    if (editingCategory.value) {
      await categoryStore.updateCategory(editingCategory.value.id, categoryData)
      ElMessage.success('更新成功')
    } else {
      await categoryStore.createCategory(categoryData)
      ElMessage.success('添加成功')
    }
    
    showEditDialog.value = false
    resetForm()
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

const handleSortEnd = () => {
  // 更新排序权重
  sortableCategories.value.forEach((category, index) => {
    category.order = sortableCategories.value.length - index
  })
}

const applySortChanges = async () => {
  try {
    await Promise.all(
      sortableCategories.value.map(category =>
        categoryStore.updateCategory(category.id, { order: category.order })
      )
    )
    ElMessage.success('排序已保存')
    showSortDialog.value = false
  } catch (error) {
    ElMessage.error('排序保存失败')
  }
}

const refreshData = async () => {
  try {
    await Promise.all([
      categoryStore.fetchCategories(),
      navigationStore.fetchNavigations()
    ])
    ElMessage.success('数据刷新成功')
  } catch (error) {
    ElMessage.error('数据刷新失败')
  }
}

// 监听添加对话框
watch(showAddDialog, (show) => {
  if (show) {
    addSubCategory()
    showAddDialog.value = false
  }
})

// 监听排序对话框
watch(showSortDialog, (show) => {
  if (show) {
    sortableCategories.value = [...categoryStore.flatCategories]
      .sort((a, b) => b.order - a.order)
  }
})

// 生命周期
onMounted(async () => {
  await refreshData()
})
</script>

<style lang="scss" scoped>
.category-manage {
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

.stats-section {
  margin-bottom: 2rem;
  
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--el-bg-color-page);
        border-radius: 8px;
      }
      
      .stat-content {
        flex: 1;
        
        .stat-value {
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--el-text-color-primary);
          line-height: 1;
        }
        
        .stat-label {
          color: var(--el-text-color-regular);
          font-size: 0.875rem;
          margin-top: 0.25rem;
        }
      }
    }
  }
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: var(--el-bg-color);
  border-radius: 8px;
  border: 1px solid var(--el-border-color-light);
  margin-bottom: 1.5rem;
  
  .toolbar-left {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  
  .toolbar-right {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
}

.category-content {
  background: var(--el-bg-color);
  border-radius: 8px;
  border: 1px solid var(--el-border-color-light);
  overflow: hidden;
}

.tree-view {
  padding: 1.5rem;
  
  .tree-node {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 0.5rem 0;
    
    .node-content {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex: 1;
      
      .node-icon {
        flex-shrink: 0;
      }
      
      .node-info {
        flex: 1;
        
        .node-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 500;
          color: var(--el-text-color-primary);
          margin-bottom: 0.25rem;
        }
        
        .node-meta {
          display: flex;
          gap: 1rem;
          font-size: 0.875rem;
          color: var(--el-text-color-regular);
        }
      }
    }
    
    .node-actions {
      display: flex;
      gap: 0.25rem;
      opacity: 0;
      transition: opacity 0.2s;
    }
    
    &:hover .node-actions {
      opacity: 1;
    }
  }
}

.list-view {
  .category-info {
    .category-indent {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      
      .category-icon {
        flex-shrink: 0;
      }
      
      .category-details {
        flex: 1;
        
        .category-name {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 500;
          color: var(--el-text-color-primary);
          margin-bottom: 0.25rem;
        }
        
        .category-description {
          font-size: 0.875rem;
          color: var(--el-text-color-regular);
        }
      }
    }
  }
  
  .table-actions {
    display: flex;
    gap: 0.25rem;
  }
}

.empty-state {
  padding: 3rem;
  text-align: center;
}

.icon-selector {
  display: flex;
  align-items: center;
  gap: 1rem;
  
  .icon-preview {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    background: var(--el-bg-color-page);
    border-radius: 6px;
    border: 1px solid var(--el-border-color-light);
  }
}

.sort-content {
  .sort-tips {
    margin-bottom: 1.5rem;
  }
  
  .sort-list {
    max-height: 400px;
    overflow-y: auto;
    
    .sort-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem;
      background: var(--el-bg-color-page);
      border: 1px solid var(--el-border-color-light);
      border-radius: 6px;
      margin-bottom: 0.5rem;
      cursor: move;
      
      &:hover {
        border-color: var(--el-color-primary);
      }
      
      .sort-handle {
        color: var(--el-text-color-placeholder);
      }
      
      .sort-info {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex: 1;
      }
      
      .sort-order {
        font-weight: 600;
        color: var(--el-color-primary);
      }
    }
  }
}

// 响应式设计
@media (max-width: 1024px) {
  .toolbar {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
    
    .toolbar-left,
    .toolbar-right {
      justify-content: center;
    }
  }
  
  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }
}

@media (max-width: 768px) {
  .category-manage {
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
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .toolbar-left {
    flex-direction: column;
    align-items: stretch;
    
    .el-input {
      width: 100% !important;
    }
  }
}
</style> 
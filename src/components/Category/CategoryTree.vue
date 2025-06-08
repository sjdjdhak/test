<template>
  <div class="category-tree">
    <!-- 搜索框 -->
    <div v-if="showSearch" class="tree-search">
      <el-input
        v-model="searchQuery"
        :placeholder="searchPlaceholder"
        :prefix-icon="Search"
        clearable
        size="small"
        @input="handleSearch"
        @clear="handleClearSearch"
      />
    </div>
    
    <!-- 全部分类选项 -->
    <div v-if="showAll" class="tree-all-item" :class="{ 'active': selectedId === null }" @click="handleSelectAll">
      <el-icon class="tree-icon">
        <Grid />
      </el-icon>
      <span class="tree-label">全部分类</span>
      <span v-if="showCount" class="tree-count">{{ totalCount }}</span>
    </div>
    
    <!-- 分类树 -->
    <div class="tree-container">
      <div v-if="loading" class="tree-loading">
        <el-skeleton animated>
          <template #template>
            <div v-for="n in 5" :key="n" class="skeleton-item">
              <el-skeleton-item variant="circle" style="width: 16px; height: 16px;" />
              <el-skeleton-item variant="text" style="width: 60%; height: 16px; margin-left: 8px;" />
            </div>
          </template>
        </el-skeleton>
      </div>
      
      <div v-else-if="filteredCategories.length === 0" class="tree-empty">
        <el-icon class="empty-icon">
          <FolderOpened />
        </el-icon>
        <span class="empty-text">{{ searchQuery ? '未找到匹配的分类' : '暂无分类数据' }}</span>
      </div>
      
      <div v-else class="tree-list">
        <CategoryTreeNode
          v-for="category in filteredCategories"
          :key="category.id"
          :category="category"
          :selected-id="selectedId"
          :expanded-ids="expandedIds"
          :collapsed="collapsed"
          :show-count="showCount"
          :show-icon="showIcon"
          :show-actions="showActions"
          :draggable="draggable"
          :level="0"
          @select="handleSelect"
          @expand="handleExpand"
          @collapse="handleCollapse"
          @edit="handleEdit"
          @delete="handleDelete"
          @add-child="handleAddChild"
          @drag-start="handleDragStart"
          @drag-end="handleDragEnd"
          @drop="handleDrop"
        />
      </div>
    </div>
    
    <!-- 操作按钮 -->
    <div v-if="showActions" class="tree-actions">
      <el-button type="primary" :icon="Plus" size="small" @click="handleAdd">
        添加分类
      </el-button>
      <el-button v-if="expandedIds.size > 0" type="text" size="small" @click="collapseAll">
        收起全部
      </el-button>
      <el-button v-else type="text" size="small" @click="expandAll">
        展开全部
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Search, Grid, FolderOpened, Plus } from '@element-plus/icons-vue'
import CategoryTreeNode from './CategoryTreeNode.vue'
import type { Category } from '@/types/category'

interface Props {
  categories: Category[]
  selectedId?: string | null
  loading?: boolean
  collapsed?: boolean
  showSearch?: boolean
  showAll?: boolean
  showCount?: boolean
  showIcon?: boolean
  showActions?: boolean
  draggable?: boolean
  searchPlaceholder?: string
  totalCount?: number
}

const props = withDefaults(defineProps<Props>(), {
  selectedId: null,
  loading: false,
  collapsed: false,
  showSearch: true,
  showAll: true,
  showCount: true,
  showIcon: true,
  showActions: false,
  draggable: false,
  searchPlaceholder: '搜索分类...',
  totalCount: 0
})

const emit = defineEmits<{
  select: [categoryId: string | null]
  expand: [categoryId: string]
  collapse: [categoryId: string]
  edit: [category: Category]
  delete: [category: Category]
  add: []
  'add-child': [parentCategory: Category]
  'drag-start': [category: Category]
  'drag-end': [category: Category]
  drop: [dragCategory: Category, dropCategory: Category, position: 'before' | 'after' | 'inner']
}>()

// 响应式数据
const searchQuery = ref('')
const expandedIds = ref(new Set<string>())
const dragCategory = ref<Category | null>(null)

// 计算属性
const filteredCategories = computed(() => {
  if (!searchQuery.value) {
    return buildTree(props.categories)
  }
  
  // 搜索时显示扁平列表
  const query = searchQuery.value.toLowerCase()
  return props.categories
    .filter(category => 
      category.name.toLowerCase().includes(query) ||
      category.description?.toLowerCase().includes(query)
    )
    .map(category => ({ ...category, children: [] }))
})

// 方法
const buildTree = (categories: Category[], parentId: string | null = null): Category[] => {
  return categories
    .filter(cat => cat.parentId === parentId)
    .sort((a, b) => a.order - b.order)
    .map(cat => ({
      ...cat,
      children: buildTree(categories, cat.id)
    }))
}

const handleSearch = (value: string) => {
  searchQuery.value = value
  if (value) {
    // 搜索时展开所有匹配项的父级
    expandMatchedParents()
  }
}

const handleClearSearch = () => {
  searchQuery.value = ''
}

const expandMatchedParents = () => {
  const query = searchQuery.value.toLowerCase()
  const matchedIds = new Set<string>()
  
  // 找到所有匹配的分类
  props.categories.forEach(category => {
    if (category.name.toLowerCase().includes(query) ||
        category.description?.toLowerCase().includes(query)) {
      matchedIds.add(category.id)
      
      // 展开所有父级
      let parentId = category.parentId
      while (parentId) {
        expandedIds.value.add(parentId)
        const parent = props.categories.find(cat => cat.id === parentId)
        parentId = parent?.parentId || null
      }
    }
  })
}

const handleSelectAll = () => {
  emit('select', null)
}

const handleSelect = (categoryId: string) => {
  emit('select', categoryId)
}

const handleExpand = (categoryId: string) => {
  expandedIds.value.add(categoryId)
  emit('expand', categoryId)
}

const handleCollapse = (categoryId: string) => {
  expandedIds.value.delete(categoryId)
  emit('collapse', categoryId)
}

const handleEdit = (category: Category) => {
  emit('edit', category)
}

const handleDelete = (category: Category) => {
  emit('delete', category)
}

const handleAdd = () => {
  emit('add')
}

const handleAddChild = (parentCategory: Category) => {
  emit('add-child', parentCategory)
}

const handleDragStart = (category: Category) => {
  dragCategory.value = category
  emit('drag-start', category)
}

const handleDragEnd = (category: Category) => {
  dragCategory.value = null
  emit('drag-end', category)
}

const handleDrop = (dropCategory: Category, position: 'before' | 'after' | 'inner') => {
  if (dragCategory.value) {
    emit('drop', dragCategory.value, dropCategory, position)
  }
}

const expandAll = () => {
  const allIds = new Set<string>()
  const addIds = (categories: Category[]) => {
    categories.forEach(cat => {
      if (cat.children && cat.children.length > 0) {
        allIds.add(cat.id)
        addIds(cat.children)
      }
    })
  }
  addIds(filteredCategories.value)
  expandedIds.value = allIds
}

const collapseAll = () => {
  expandedIds.value.clear()
}

// 初始化展开状态
onMounted(() => {
  if (!props.collapsed) {
    // 默认展开第一级
    filteredCategories.value.forEach(cat => {
      if (cat.children && cat.children.length > 0) {
        expandedIds.value.add(cat.id)
      }
    })
  }
})
</script>

<style lang="scss" scoped>
.category-tree {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.tree-search {
  margin-bottom: var(--spacing-md);
  
  :deep(.el-input) {
    .el-input__wrapper {
      border-radius: var(--border-radius-md);
    }
  }
}

.tree-all-item {
  display: flex;
  align-items: center;
  padding: var(--spacing-sm) var(--spacing-md);
  margin-bottom: var(--spacing-xs);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  
  &:hover {
    background-color: var(--bg-secondary);
  }
  
  &.active {
    background-color: var(--primary-color-light);
    color: var(--primary-color);
    
    .tree-icon {
      color: var(--primary-color);
    }
  }
  
  .tree-icon {
    font-size: var(--font-size-md);
    margin-right: var(--spacing-sm);
    color: var(--text-tertiary);
  }
  
  .tree-label {
    flex: 1;
    font-size: var(--font-size-sm);
    font-weight: 500;
  }
  
  .tree-count {
    font-size: var(--font-size-xs);
    color: var(--text-tertiary);
    background: var(--bg-tertiary);
    padding: 2px 6px;
    border-radius: var(--border-radius-sm);
  }
}

.tree-container {
  flex: 1;
  overflow-y: auto;
  
  @include scrollbar(4px);
}

.tree-loading {
  padding: var(--spacing-md);
  
  .skeleton-item {
    display: flex;
    align-items: center;
    margin-bottom: var(--spacing-sm);
  }
}

.tree-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xxl) var(--spacing-md);
  color: var(--text-tertiary);
  
  .empty-icon {
    font-size: 48px;
    margin-bottom: var(--spacing-md);
  }
  
  .empty-text {
    font-size: var(--font-size-sm);
  }
}

.tree-list {
  padding: var(--spacing-xs) 0;
}

.tree-actions {
  padding: var(--spacing-md) 0 0 0;
  border-top: 1px solid var(--border-tertiary);
  display: flex;
  gap: var(--spacing-sm);
  
  .el-button {
    flex: 1;
  }
}

// 收缩状态样式
.category-tree.collapsed {
  .tree-search,
  .tree-all-item .tree-label,
  .tree-all-item .tree-count,
  .tree-actions {
    display: none;
  }
  
  .tree-all-item {
    justify-content: center;
    padding: var(--spacing-sm);
  }
}

@include mobile {
  .category-tree {
    .tree-search {
      margin-bottom: var(--spacing-sm);
    }
    
    .tree-all-item {
      padding: var(--spacing-sm);
    }
    
    .tree-actions {
      padding-top: var(--spacing-sm);
      
      .el-button {
        font-size: var(--font-size-xs);
      }
    }
  }
}
</style> 
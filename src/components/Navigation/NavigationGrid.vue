<template>
  <div class="navigation-grid">
    <!-- 加载状态 -->
    <div v-if="loading" class="grid-loading">
      <div 
        v-for="n in skeletonCount" 
        :key="n" 
        class="skeleton-card"
      >
        <el-skeleton animated>
          <template #template>
            <div class="skeleton-header">
              <el-skeleton-item variant="circle" style="width: 48px; height: 48px;" />
              <div class="skeleton-info">
                <el-skeleton-item variant="text" style="width: 60%; height: 20px;" />
                <el-skeleton-item variant="text" style="width: 40%; height: 16px;" />
              </div>
            </div>
            <el-skeleton-item variant="text" style="width: 100%; height: 16px; margin: 12px 0;" />
            <el-skeleton-item variant="text" style="width: 80%; height: 16px; margin-bottom: 12px;" />
            <div class="skeleton-tags">
              <el-skeleton-item variant="button" style="width: 60px; height: 24px;" />
              <el-skeleton-item variant="button" style="width: 80px; height: 24px;" />
              <el-skeleton-item variant="button" style="width: 50px; height: 24px;" />
            </div>
          </template>
        </el-skeleton>
      </div>
    </div>
    
    <!-- 空状态 -->
    <div v-else-if="navigations.length === 0" class="grid-empty">
      <el-empty 
        :image-size="120"
        :description="emptyDescription"
      >
        <template #image>
          <el-icon class="empty-icon">
            <component :is="emptyIcon" />
          </el-icon>
        </template>
        <el-button v-if="showAddButton" type="primary" @click="handleAdd">
          添加导航
        </el-button>
      </el-empty>
    </div>
    
    <!-- 导航网格 -->
    <div v-else class="grid-container" :class="gridClass">
      <NavigationCard
        v-for="navigation in navigations"
        :key="navigation.id"
        :navigation="navigation"
        :show-favorite="showFavorite"
        :show-edit="showEdit"
        :max-tags="maxTags"
        @click="handleNavigationClick"
        @favorite="handleFavorite"
        @tag-click="handleTagClick"
        @category-click="handleCategoryClick"
        @edit="handleEdit"
        @delete="handleDelete"
        class="grid-item"
      />
    </div>
    
    <!-- 分页 -->
    <div v-if="showPagination && totalPages > 1" class="grid-pagination">
      <el-pagination
        :current-page="currentPage"
        :page-size="pageSize"
        :total="total"
        :page-sizes="pageSizes"
        :small="isMobile"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
    
    <!-- 加载更多 -->
    <div v-if="showLoadMore && hasMore" class="grid-load-more">
      <el-button 
        :loading="loadingMore"
        @click="handleLoadMore"
        class="load-more-btn"
      >
        {{ loadingMore ? '加载中...' : '加载更多' }}
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Search, FolderOpened, Plus } from '@element-plus/icons-vue'
import NavigationCard from './NavigationCard.vue'
import type { Navigation } from '@/types/navigation'

interface Props {
  navigations: Navigation[]
  loading?: boolean
  showFavorite?: boolean
  showEdit?: boolean
  showPagination?: boolean
  showLoadMore?: boolean
  showAddButton?: boolean
  maxTags?: number
  columns?: number | 'auto'
  gap?: string
  total?: number
  currentPage?: number
  pageSize?: number
  pageSizes?: number[]
  hasMore?: boolean
  loadingMore?: boolean
  emptyDescription?: string
  emptyIcon?: any
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  showFavorite: true,
  showEdit: false,
  showPagination: false,
  showLoadMore: false,
  showAddButton: false,
  maxTags: 3,
  columns: 'auto',
  gap: '24px',
  total: 0,
  currentPage: 1,
  pageSize: 20,
  pageSizes: () => [10, 20, 50, 100],
  hasMore: false,
  loadingMore: false,
  emptyDescription: '暂无导航数据',
  emptyIcon: Search
})

const emit = defineEmits<{
  'navigation-click': [navigation: Navigation]
  'favorite': [navigation: Navigation, favorited: boolean]
  'tag-click': [tag: string]
  'category-click': [categoryId: string]
  'edit': [navigation: Navigation]
  'delete': [navigation: Navigation]
  'add': []
  'page-change': [page: number]
  'size-change': [size: number]
  'load-more': []
}>()

// 响应式数据
const isMobile = ref(false)

// 计算属性
const skeletonCount = computed(() => {
  if (typeof props.columns === 'number') {
    return props.columns * 3 // 显示3行骨架屏
  }
  return isMobile.value ? 2 : 8 // 移动端2个，桌面端8个
})

const gridClass = computed(() => {
  const classes = []
  
  if (typeof props.columns === 'number') {
    classes.push(`grid-cols-${props.columns}`)
  } else {
    classes.push('grid-auto')
  }
  
  if (isMobile.value) {
    classes.push('grid-mobile')
  }
  
  return classes
})

const totalPages = computed(() => {
  return Math.ceil(props.total / props.pageSize)
})

// 方法
const handleNavigationClick = (navigation: Navigation) => {
  emit('navigation-click', navigation)
}

const handleFavorite = (navigation: Navigation, favorited: boolean) => {
  emit('favorite', navigation, favorited)
}

const handleTagClick = (tag: string) => {
  emit('tag-click', tag)
}

const handleCategoryClick = (categoryId: string) => {
  emit('category-click', categoryId)
}

const handleEdit = (navigation: Navigation) => {
  emit('edit', navigation)
}

const handleDelete = (navigation: Navigation) => {
  emit('delete', navigation)
}

const handleAdd = () => {
  emit('add')
}

const handleCurrentChange = (page: number) => {
  emit('page-change', page)
}

const handleSizeChange = (size: number) => {
  emit('size-change', size)
}

const handleLoadMore = () => {
  emit('load-more')
}

// 检测移动端
const checkMobile = () => {
  isMobile.value = window.innerWidth < 768
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})
</script>

<style lang="scss" scoped>
.navigation-grid {
  width: 100%;
}

.grid-loading {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: v-bind(gap);
  
  @include mobile {
    grid-template-columns: 1fr;
    gap: var(--spacing-md);
  }
}

.skeleton-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-secondary);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-lg);
  
  @include mobile {
    padding: var(--spacing-md);
  }
}

.skeleton-header {
  display: flex;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
  
  .skeleton-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }
}

.skeleton-tags {
  display: flex;
  gap: var(--spacing-xs);
  margin-top: var(--spacing-md);
}

.grid-empty {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  
  .empty-icon {
    font-size: 120px;
    color: var(--text-quaternary);
  }
}

.grid-container {
  display: grid;
  gap: v-bind(gap);
  
  &.grid-auto {
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    
    @include tablet {
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    }
    
    @include mobile {
      grid-template-columns: 1fr;
      gap: var(--spacing-md);
    }
  }
  
  &.grid-cols-1 {
    grid-template-columns: 1fr;
  }
  
  &.grid-cols-2 {
    grid-template-columns: repeat(2, 1fr);
    
    @include mobile {
      grid-template-columns: 1fr;
    }
  }
  
  &.grid-cols-3 {
    grid-template-columns: repeat(3, 1fr);
    
    @include tablet {
      grid-template-columns: repeat(2, 1fr);
    }
    
    @include mobile {
      grid-template-columns: 1fr;
    }
  }
  
  &.grid-cols-4 {
    grid-template-columns: repeat(4, 1fr);
    
    @include desktop {
      grid-template-columns: repeat(3, 1fr);
    }
    
    @include tablet {
      grid-template-columns: repeat(2, 1fr);
    }
    
    @include mobile {
      grid-template-columns: 1fr;
    }
  }
  
  &.grid-cols-5 {
    grid-template-columns: repeat(5, 1fr);
    
    @include desktop {
      grid-template-columns: repeat(4, 1fr);
    }
    
    @include tablet {
      grid-template-columns: repeat(2, 1fr);
    }
    
    @include mobile {
      grid-template-columns: 1fr;
    }
  }
  
  &.grid-cols-6 {
    grid-template-columns: repeat(6, 1fr);
    
    @include desktop {
      grid-template-columns: repeat(4, 1fr);
    }
    
    @include tablet {
      grid-template-columns: repeat(3, 1fr);
    }
    
    @include mobile {
      grid-template-columns: repeat(2, 1fr);
    }
  }
}

.grid-item {
  height: fit-content;
}

.grid-pagination {
  display: flex;
  justify-content: center;
  margin-top: var(--spacing-xxl);
  
  :deep(.el-pagination) {
    @include mobile {
      .el-pagination__sizes,
      .el-pagination__jump {
        display: none;
      }
    }
  }
}

.grid-load-more {
  display: flex;
  justify-content: center;
  margin-top: var(--spacing-xl);
  
  .load-more-btn {
    min-width: 120px;
  }
}

// 动画效果
.grid-item {
  animation: fadeInUp 0.3s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// 响应式断点
@include mobile {
  .navigation-grid {
    .grid-container {
      gap: var(--spacing-md);
    }
    
    .grid-pagination {
      margin-top: var(--spacing-xl);
    }
    
    .grid-load-more {
      margin-top: var(--spacing-lg);
    }
  }
}
</style> 
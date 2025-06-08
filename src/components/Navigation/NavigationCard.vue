<template>
  <div 
    class="navigation-card" 
    :class="{ 
      'navigation-card--featured': navigation.featured,
      'navigation-card--inactive': !navigation.isActive 
    }"
    @click="handleClick"
  >
    <!-- 卡片头部 -->
    <div class="card-header">
      <div class="site-info">
        <div class="site-icon">
          <img 
            v-if="navigation.icon" 
            :src="navigation.icon" 
            :alt="navigation.title"
            @error="handleIconError"
            class="icon-img"
          />
          <el-icon v-else class="icon-placeholder">
            <Link />
          </el-icon>
        </div>
        <div class="site-details">
          <h3 class="site-title">{{ navigation.title }}</h3>
          <p class="site-url">{{ formatUrl(navigation.url) }}</p>
        </div>
      </div>
      
      <!-- 操作按钮 -->
      <div class="card-actions">
        <el-button
          v-if="showFavorite"
          type="text"
          :icon="isFavorited ? StarFilled : Star"
          :class="{ 'favorited': isFavorited }"
          @click.stop="toggleFavorite"
          class="action-btn favorite-btn"
        />
        <el-dropdown @command="handleCommand" trigger="click">
          <el-button type="text" :icon="MoreFilled" class="action-btn" @click.stop />
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="visit" :icon="View">访问网站</el-dropdown-item>
              <el-dropdown-item command="copy" :icon="CopyDocument">复制链接</el-dropdown-item>
              <el-dropdown-item command="share" :icon="Share">分享</el-dropdown-item>
              <el-dropdown-item v-if="showEdit" command="edit" :icon="Edit" divided>编辑</el-dropdown-item>
              <el-dropdown-item v-if="showEdit" command="delete" :icon="Delete">删除</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
    
    <!-- 卡片内容 -->
    <div class="card-content">
      <p class="site-description">{{ navigation.description }}</p>
      
      <!-- 标签 -->
      <div v-if="navigation.tags.length > 0" class="tags-container">
        <el-tag
          v-for="tag in displayTags"
          :key="tag"
          size="small"
          class="tag-item"
          @click.stop="handleTagClick(tag)"
        >
          {{ tag }}
        </el-tag>
        <el-tag
          v-if="navigation.tags.length > maxTags"
          size="small"
          type="info"
          class="tag-more"
        >
          +{{ navigation.tags.length - maxTags }}
        </el-tag>
      </div>
    </div>
    
    <!-- 卡片底部 -->
    <div class="card-footer">
      <div class="stats">
        <div class="stat-item">
          <el-icon><View /></el-icon>
          <span>{{ formatNumber(navigation.visitCount) }}</span>
        </div>
        <div v-if="navigation.rating > 0" class="stat-item">
          <el-rate
            v-model="navigation.rating"
            disabled
            show-score
            text-color="#ff9900"
            score-template="{value}"
            size="small"
            class="rating"
          />
        </div>
      </div>
      
      <!-- 分类标签 -->
      <div class="category-tag">
        <el-tag 
          :color="categoryColor" 
          effect="light"
          size="small"
          @click.stop="handleCategoryClick"
        >
          {{ categoryName }}
        </el-tag>
      </div>
    </div>
    
    <!-- 推荐标识 -->
    <div v-if="navigation.featured" class="featured-badge">
      <el-icon><StarFilled /></el-icon>
      <span>推荐</span>
    </div>
    
    <!-- 新增标识 -->
    <div v-if="isNew" class="new-badge">
      <span>NEW</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { 
  Link, Star, StarFilled, MoreFilled, View, CopyDocument, 
  Share, Edit, Delete 
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { Navigation } from '@/types/navigation'
import { useCategoryStore } from '@/stores/category'

interface Props {
  navigation: Navigation
  showFavorite?: boolean
  showEdit?: boolean
  maxTags?: number
}

const props = withDefaults(defineProps<Props>(), {
  showFavorite: true,
  showEdit: false,
  maxTags: 3
})

const emit = defineEmits<{
  click: [navigation: Navigation]
  favorite: [navigation: Navigation, favorited: boolean]
  tagClick: [tag: string]
  categoryClick: [categoryId: string]
  edit: [navigation: Navigation]
  delete: [navigation: Navigation]
}>()

const categoryStore = useCategoryStore()

// 响应式数据
const isFavorited = ref(false)

// 计算属性
const displayTags = computed(() => {
  return props.navigation.tags.slice(0, props.maxTags)
})

const categoryName = computed(() => {
  const category = categoryStore.getCategoryById(props.navigation.categoryId)
  return category?.name || '未分类'
})

const categoryColor = computed(() => {
  const category = categoryStore.getCategoryById(props.navigation.categoryId)
  return category?.color || '#909399'
})

const isNew = computed(() => {
  const createTime = new Date(props.navigation.createTime)
  const now = new Date()
  const diffDays = (now.getTime() - createTime.getTime()) / (1000 * 60 * 60 * 24)
  return diffDays <= 7 // 7天内为新增
})

// 方法
const handleClick = () => {
  emit('click', props.navigation)
}

const handleIconError = (event: Event) => {
  const target = event.target as HTMLImageElement
  target.style.display = 'none'
}

const formatUrl = (url: string) => {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname
  } catch {
    return url
  }
}

const formatNumber = (num: number) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

const toggleFavorite = () => {
  isFavorited.value = !isFavorited.value
  emit('favorite', props.navigation, isFavorited.value)
}

const handleTagClick = (tag: string) => {
  emit('tagClick', tag)
}

const handleCategoryClick = () => {
  emit('categoryClick', props.navigation.categoryId)
}

const handleCommand = (command: string) => {
  switch (command) {
    case 'visit':
      window.open(props.navigation.url, '_blank')
      break
    case 'copy':
      copyToClipboard(props.navigation.url)
      break
    case 'share':
      shareNavigation()
      break
    case 'edit':
      emit('edit', props.navigation)
      break
    case 'delete':
      emit('delete', props.navigation)
      break
  }
}

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('链接已复制到剪贴板')
  } catch {
    ElMessage.error('复制失败')
  }
}

const shareNavigation = async () => {
  if (navigator.share) {
    try {
      await navigator.share({
        title: props.navigation.title,
        text: props.navigation.description,
        url: props.navigation.url
      })
    } catch {
      // 用户取消分享
    }
  } else {
    // 降级到复制链接
    copyToClipboard(props.navigation.url)
  }
}

// 初始化收藏状态
onMounted(() => {
  // TODO: 从本地存储或API获取收藏状态
  const favorites = JSON.parse(localStorage.getItem('favorites') || '[]')
  isFavorited.value = favorites.includes(props.navigation.id)
})
</script>

<style lang="scss" scoped>
.navigation-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-secondary);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-lg);
  cursor: pointer;
  transition: all var(--transition-normal);
  position: relative;
  overflow: hidden;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
    border-color: var(--primary-color-light);
  }
  
  &--featured {
    border-color: var(--warning-color);
    
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, var(--warning-color), var(--warning-color-light));
    }
  }
  
  &--inactive {
    opacity: 0.6;
    
    &:hover {
      opacity: 0.8;
    }
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-md);
}

.site-info {
  display: flex;
  gap: var(--spacing-md);
  flex: 1;
  min-width: 0;
}

.site-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--border-radius-md);
  overflow: hidden;
  background: var(--bg-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  
  .icon-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .icon-placeholder {
    font-size: 24px;
    color: var(--text-tertiary);
  }
}

.site-details {
  flex: 1;
  min-width: 0;
}

.site-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 var(--spacing-xs) 0;
  line-height: 1.4;
  @include text-ellipsis;
}

.site-url {
  font-size: var(--font-size-sm);
  color: var(--text-tertiary);
  margin: 0;
  @include text-ellipsis;
}

.card-actions {
  display: flex;
  gap: var(--spacing-xs);
  flex-shrink: 0;
}

.action-btn {
  width: 32px;
  height: 32px;
  padding: 0;
  
  &.favorite-btn.favorited {
    color: var(--warning-color);
  }
}

.card-content {
  margin-bottom: var(--spacing-lg);
}

.site-description {
  font-size: var(--font-size-md);
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0 0 var(--spacing-md) 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
}

.tag-item {
  cursor: pointer;
  transition: all var(--transition-fast);
  
  &:hover {
    transform: scale(1.05);
  }
}

.tag-more {
  cursor: default;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stats {
  display: flex;
  gap: var(--spacing-lg);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-sm);
  color: var(--text-tertiary);
  
  .el-icon {
    font-size: var(--font-size-sm);
  }
}

.rating {
  :deep(.el-rate__text) {
    font-size: var(--font-size-xs);
    margin-left: var(--spacing-xs);
  }
}

.category-tag {
  .el-tag {
    cursor: pointer;
    transition: all var(--transition-fast);
    
    &:hover {
      transform: scale(1.05);
    }
  }
}

.featured-badge {
  position: absolute;
  top: var(--spacing-md);
  right: var(--spacing-md);
  background: var(--warning-color);
  color: white;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-xs);
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 2px;
  
  .el-icon {
    font-size: var(--font-size-xs);
  }
}

.new-badge {
  position: absolute;
  top: 0;
  right: 0;
  background: var(--success-color);
  color: white;
  padding: 2px 8px;
  font-size: var(--font-size-xs);
  font-weight: 600;
  border-radius: 0 var(--border-radius-lg) 0 var(--border-radius-sm);
}

@include mobile {
  .navigation-card {
    padding: var(--spacing-md);
  }
  
  .site-info {
    gap: var(--spacing-sm);
  }
  
  .site-icon {
    width: 40px;
    height: 40px;
  }
  
  .site-title {
    font-size: var(--font-size-md);
  }
  
  .card-actions {
    gap: 2px;
  }
  
  .action-btn {
    width: 28px;
    height: 28px;
  }
  
  .stats {
    gap: var(--spacing-md);
  }
}
</style> 
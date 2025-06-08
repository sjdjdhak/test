<template>
  <div class="navigation-list">
    <!-- 列表头部 -->
    <div v-if="showHeader" class="list-header">
      <div class="header-info">
        <h3 class="list-title">{{ title }}</h3>
        <span class="list-count">{{ totalCount }} 个导航</span>
      </div>
      
      <div class="header-actions">
        <el-select
          v-model="sortBy"
          placeholder="排序方式"
          style="width: 120px"
          @change="handleSortChange"
        >
          <el-option label="默认" value="default" />
          <el-option label="名称" value="title" />
          <el-option label="时间" value="time" />
          <el-option label="热度" value="popularity" />
          <el-option label="评分" value="rating" />
        </el-select>
        
        <el-button-group>
          <el-button
            :type="viewMode === 'compact' ? 'primary' : 'default'"
            size="small"
            @click="viewMode = 'compact'"
          >
            紧凑
          </el-button>
          <el-button
            :type="viewMode === 'comfortable' ? 'primary' : 'default'"
            size="small"
            @click="viewMode = 'comfortable'"
          >
            舒适
          </el-button>
        </el-button-group>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="list-loading">
      <Loading type="skeleton" :count="5" />
    </div>

    <!-- 导航列表 -->
    <div v-else-if="sortedNavigations.length > 0" class="list-content">
      <div
        v-for="(navigation, index) in paginatedNavigations"
        :key="navigation.id"
        class="list-item"
        :class="{
          'compact': viewMode === 'compact',
          'comfortable': viewMode === 'comfortable',
          'featured': navigation.featured
        }"
        @click="handleItemClick(navigation)"
      >
        <!-- 序号 -->
        <div v-if="showIndex" class="item-index">
          {{ (currentPage - 1) * pageSize + index + 1 }}
        </div>

        <!-- 图标 -->
        <div class="item-icon">
          <img
            v-if="navigation.icon"
            :src="navigation.icon"
            :alt="navigation.title"
            @error="handleIconError"
          />
          <el-icon v-else size="24">
            <Link />
          </el-icon>
        </div>

        <!-- 内容 -->
        <div class="item-content">
          <div class="item-header">
            <h4 class="item-title">
              {{ navigation.title }}
              <el-tag v-if="navigation.featured" type="warning" size="small">
                推荐
              </el-tag>
            </h4>
            
            <div class="item-meta">
              <el-tag
                v-if="navigation.category"
                :color="navigation.category.color"
                size="small"
                effect="light"
              >
                {{ navigation.category.name }}
              </el-tag>
              
              <span v-if="navigation.rating" class="item-rating">
                <el-icon><Star /></el-icon>
                {{ navigation.rating }}
              </span>
              
              <span v-if="navigation.visitCount" class="item-visits">
                <el-icon><View /></el-icon>
                {{ formatNumber(navigation.visitCount) }}
              </span>
            </div>
          </div>

          <div v-if="viewMode === 'comfortable'" class="item-description">
            {{ navigation.description }}
          </div>

          <div class="item-footer">
            <div class="item-url">
              <el-icon><Link /></el-icon>
              {{ navigation.url }}
            </div>
            
            <div v-if="navigation.tags && navigation.tags.length > 0" class="item-tags">
              <el-tag
                v-for="tag in navigation.tags.slice(0, maxTags)"
                :key="tag"
                size="small"
                type="info"
                effect="plain"
              >
                {{ tag }}
              </el-tag>
              <span v-if="navigation.tags.length > maxTags" class="more-tags">
                +{{ navigation.tags.length - maxTags }}
              </span>
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="item-actions">
          <el-button
            size="small"
            type="primary"
            @click.stop="handleVisit(navigation)"
          >
            访问
          </el-button>
          
          <el-button
            size="small"
            :icon="isFavorite(navigation.id) ? StarFilled : Star"
            @click.stop="toggleFavorite(navigation)"
          />
          
          <el-dropdown
            v-if="showMoreActions"
            @command="handleCommand"
            @click.stop
          >
            <el-button size="small" :icon="MoreFilled" />
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item :command="`copy-${navigation.id}`">
                  复制链接
                </el-dropdown-item>
                <el-dropdown-item :command="`share-${navigation.id}`">
                  分享
                </el-dropdown-item>
                <el-dropdown-item :command="`report-${navigation.id}`">
                  举报
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="list-empty">
      <Empty
        type="folder"
        title="暂无导航"
        description="当前分类下还没有导航项目"
      >
        <template #actions>
          <el-button type="primary" @click="handleAddNavigation">
            添加导航
          </el-button>
        </template>
      </Empty>
    </div>

    <!-- 分页 -->
    <div v-if="showPagination && totalCount > pageSize" class="list-pagination">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="totalCount"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Link, Star, StarFilled, View, MoreFilled
} from '@element-plus/icons-vue'
import Loading from '@/components/Common/Loading.vue'
import Empty from '@/components/Common/Empty.vue'
import { useNavigationStore } from '@/stores/navigation'
import { useCategoryStore } from '@/stores/category'
import { userPreferences } from '@/utils/storage'
import { numberUtils } from '@/utils/helpers'
import type { Navigation } from '@/types/navigation'
import type { Category } from '@/types/category'

interface NavigationWithCategory extends Navigation {
  category?: Category
}

// Props
interface Props {
  navigations?: Navigation[]
  title?: string
  loading?: boolean
  showHeader?: boolean
  showIndex?: boolean
  showPagination?: boolean
  showMoreActions?: boolean
  pageSize?: number
  maxTags?: number
  categoryId?: string
}

const props = withDefaults(defineProps<Props>(), {
  navigations: () => [],
  title: '导航列表',
  loading: false,
  showHeader: true,
  showIndex: true,
  showPagination: true,
  showMoreActions: true,
  pageSize: 20,
  maxTags: 3,
  categoryId: ''
})

// Emits
const emit = defineEmits<{
  'item-click': [navigation: Navigation]
  'add-navigation': []
}>()

const router = useRouter()
const navigationStore = useNavigationStore()
const categoryStore = useCategoryStore()

// 响应式数据
const currentPage = ref(1)
const sortBy = ref('default')
const viewMode = ref<'compact' | 'comfortable'>('comfortable')

// 计算属性
const categories = computed(() => categoryStore.flatCategories)

const navigationsWithCategory = computed((): NavigationWithCategory[] => {
  const navs = props.navigations.length > 0 
    ? props.navigations 
    : props.categoryId 
      ? navigationStore.getNavigationsByCategory(props.categoryId)
      : navigationStore.navigations

  return navs.map(nav => ({
    ...nav,
    category: categories.value.find(cat => cat.id === nav.categoryId)
  }))
})

const sortedNavigations = computed(() => {
  const navs = [...navigationsWithCategory.value]
  
  switch (sortBy.value) {
    case 'title':
      return navs.sort((a, b) => a.title.localeCompare(b.title))
    case 'time':
      return navs.sort((a, b) => 
        new Date(b.updateTime).getTime() - new Date(a.updateTime).getTime()
      )
    case 'popularity':
      return navs.sort((a, b) => (b.visitCount || 0) - (a.visitCount || 0))
    case 'rating':
      return navs.sort((a, b) => (b.rating || 0) - (a.rating || 0))
    default:
      // 默认排序：推荐在前，然后按创建时间
      return navs.sort((a, b) => {
        if (a.featured && !b.featured) return -1
        if (!a.featured && b.featured) return 1
        return new Date(b.createTime).getTime() - new Date(a.createTime).getTime()
      })
  }
})

const totalCount = computed(() => sortedNavigations.value.length)

const paginatedNavigations = computed(() => {
  if (!props.showPagination) return sortedNavigations.value
  
  const start = (currentPage.value - 1) * props.pageSize
  const end = start + props.pageSize
  return sortedNavigations.value.slice(start, end)
})

// 方法
const formatNumber = (num: number): string => {
  return numberUtils.format(num)
}

const handleSortChange = () => {
  currentPage.value = 1
}

const handlePageChange = (page: number) => {
  currentPage.value = page
}

const handleSizeChange = (size: number) => {
  currentPage.value = 1
  // 这里可以通过emit通知父组件更新pageSize
}

const handleItemClick = (navigation: Navigation) => {
  emit('item-click', navigation)
  navigationStore.incrementVisitCount(navigation.id)
}

const handleVisit = (navigation: Navigation) => {
  window.open(navigation.url, '_blank')
  navigationStore.incrementVisitCount(navigation.id)
}

const handleIconError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.style.display = 'none'
}

const isFavorite = (id: string): boolean => {
  return userPreferences.isFavorite(id)
}

const toggleFavorite = (navigation: Navigation) => {
  if (isFavorite(navigation.id)) {
    userPreferences.removeFavorite(navigation.id)
    ElMessage.success('已取消收藏')
  } else {
    userPreferences.addFavorite(navigation.id)
    ElMessage.success('已添加到收藏')
  }
}

const handleCommand = (command: string) => {
  const [action, id] = command.split('-')
  const navigation = navigationsWithCategory.value.find(nav => nav.id === id)
  
  if (!navigation) return
  
  switch (action) {
    case 'copy':
      navigator.clipboard.writeText(navigation.url)
      ElMessage.success('链接已复制到剪贴板')
      break
    case 'share':
      if (navigator.share) {
        navigator.share({
          title: navigation.title,
          text: navigation.description,
          url: navigation.url
        })
      } else {
        // 降级处理：复制链接
        navigator.clipboard.writeText(navigation.url)
        ElMessage.success('链接已复制到剪贴板')
      }
      break
    case 'report':
      ElMessage.info('举报功能开发中...')
      break
  }
}

const handleAddNavigation = () => {
  emit('add-navigation')
}

// 生命周期
onMounted(() => {
  // 恢复用户偏好的视图模式
  const savedViewMode = userPreferences.get('listViewMode', 'comfortable')
  viewMode.value = savedViewMode as 'compact' | 'comfortable'
})

// 监听视图模式变化并保存
watch(viewMode, (newMode) => {
  userPreferences.set('listViewMode', newMode)
})
</script>

<style lang="scss" scoped>
.navigation-list {
  .list-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1.5rem;
    
    .header-info {
      .list-title {
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--el-text-color-primary);
        margin: 0 0 0.25rem 0;
      }
      
      .list-count {
        font-size: 0.875rem;
        color: var(--el-text-color-regular);
      }
    }
    
    .header-actions {
      display: flex;
      gap: 1rem;
      align-items: center;
    }
  }
  
  .list-loading {
    margin: 2rem 0;
  }
  
  .list-content {
    .list-item {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      padding: 1.5rem;
      background: var(--el-bg-color);
      border-radius: 8px;
      border: 1px solid var(--el-border-color-light);
      margin-bottom: 1rem;
      cursor: pointer;
      transition: all 0.2s;
      
      &:hover {
        border-color: var(--el-color-primary);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }
      
      &.featured {
        border-color: var(--el-color-warning);
        background: var(--el-color-warning-light-9);
      }
      
      &.compact {
        padding: 1rem;
        
        .item-content {
          .item-description {
            display: none;
          }
          
          .item-footer {
            margin-top: 0.5rem;
          }
        }
      }
      
      .item-index {
        flex-shrink: 0;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--el-bg-color-page);
        border-radius: 50%;
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--el-text-color-regular);
      }
      
      .item-icon {
        flex-shrink: 0;
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--el-bg-color-page);
        border-radius: 8px;
        
        img {
          width: 32px;
          height: 32px;
          border-radius: 4px;
        }
      }
      
      .item-content {
        flex: 1;
        min-width: 0;
        
        .item-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 0.5rem;
          
          .item-title {
            font-size: 1.125rem;
            font-weight: 600;
            color: var(--el-text-color-primary);
            margin: 0;
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }
          
          .item-meta {
            display: flex;
            gap: 0.75rem;
            align-items: center;
            flex-shrink: 0;
            
            .item-rating,
            .item-visits {
              display: flex;
              align-items: center;
              gap: 0.25rem;
              font-size: 0.875rem;
              color: var(--el-text-color-regular);
            }
            
            .item-rating {
              color: var(--el-color-warning);
            }
          }
        }
        
        .item-description {
          color: var(--el-text-color-regular);
          margin-bottom: 1rem;
          line-height: 1.5;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .item-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 1rem;
          
          .item-url {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.875rem;
            color: var(--el-text-color-placeholder);
            text-overflow: ellipsis;
            overflow: hidden;
            white-space: nowrap;
            max-width: 400px;
          }
          
          .item-tags {
            display: flex;
            gap: 0.5rem;
            align-items: center;
            flex-shrink: 0;
            
            .more-tags {
              font-size: 0.75rem;
              color: var(--el-text-color-placeholder);
            }
          }
        }
      }
      
      .item-actions {
        flex-shrink: 0;
        display: flex;
        gap: 0.5rem;
        align-items: center;
      }
    }
  }
  
  .list-empty {
    margin: 3rem 0;
    text-align: center;
  }
  
  .list-pagination {
    display: flex;
    justify-content: center;
    margin: 2rem 0;
  }
}

// 响应式设计
@media (max-width: 1024px) {
  .navigation-list {
    .list-header {
      flex-direction: column;
      gap: 1rem;
      
      .header-actions {
        align-self: stretch;
        justify-content: space-between;
      }
    }
    
    .list-content .list-item {
      .item-content .item-footer {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }
    }
  }
}

@media (max-width: 768px) {
  .navigation-list {
    .list-content .list-item {
      flex-direction: column;
      
      .item-index {
        align-self: flex-start;
      }
      
      .item-content .item-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }
      
      .item-actions {
        align-self: stretch;
        justify-content: space-between;
      }
    }
  }
}
</style> 
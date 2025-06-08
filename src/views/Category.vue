<template>
  <div class="category-page">
    <!-- 分类头部 -->
    <div class="category-header">
      <div class="container">
        <!-- 面包屑导航 -->
        <el-breadcrumb separator="/" class="breadcrumb">
          <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
          <el-breadcrumb-item 
            v-for="parent in categoryPath" 
            :key="parent.id"
            :to="{ name: 'Category', params: { id: parent.id } }"
          >
            {{ parent.name }}
          </el-breadcrumb-item>
          <el-breadcrumb-item>{{ currentCategory?.name }}</el-breadcrumb-item>
        </el-breadcrumb>

        <!-- 分类信息 -->
        <div v-if="currentCategory" class="category-info">
          <div class="category-main">
            <div class="category-icon">
              <el-icon :size="48" :color="currentCategory.color">
                <component :is="currentCategory.icon" />
              </el-icon>
            </div>
            
            <div class="category-details">
              <h1 class="category-title">{{ currentCategory.name }}</h1>
              <p v-if="currentCategory.description" class="category-description">
                {{ currentCategory.description }}
              </p>
              
              <div class="category-stats">
                <div class="stat-item">
                  <span class="stat-value">{{ navigationCount }}</span>
                  <span class="stat-label">个工具</span>
                </div>
                <div v-if="subcategoriesCount > 0" class="stat-item">
                  <span class="stat-value">{{ subcategoriesCount }}</span>
                  <span class="stat-label">个子分类</span>
                </div>
                <div class="stat-item">
                  <span class="stat-value">{{ totalVisits }}</span>
                  <span class="stat-label">次访问</span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="category-actions">
            <el-button 
              type="primary" 
              :icon="Star"
              @click="toggleCategoryFollow"
            >
              {{ isFollowing ? '已关注' : '关注分类' }}
            </el-button>
            <el-button :icon="Share" @click="shareCategory">
              分享
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 子分类 -->
    <div v-if="subcategories.length > 0" class="subcategories-section">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">子分类</h2>
          <span class="section-count">{{ subcategories.length }} 个</span>
        </div>
        
        <div class="subcategories-grid">
          <div
            v-for="subcategory in subcategories"
            :key="subcategory.id"
            class="subcategory-card"
            @click="navigateToCategory(subcategory.id)"
          >
            <div class="subcategory-icon">
              <el-icon :size="32" :color="subcategory.color">
                <component :is="subcategory.icon" />
              </el-icon>
            </div>
            
            <div class="subcategory-info">
              <h3 class="subcategory-name">{{ subcategory.name }}</h3>
              <p class="subcategory-description">{{ subcategory.description }}</p>
              <div class="subcategory-count">
                {{ getNavigationCountByCategory(subcategory.id) }} 个工具
              </div>
            </div>
            
            <el-icon class="subcategory-arrow">
              <ArrowRight />
            </el-icon>
          </div>
        </div>
      </div>
    </div>

    <!-- 工具列表 -->
    <div class="tools-section">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">
            {{ currentCategory?.name }}工具
          </h2>
          <div class="section-controls">
            <span class="section-count">{{ filteredNavigations.length }} 个工具</span>
            
            <div class="view-controls">
              <el-select
                v-model="sortBy"
                size="small"
                style="width: 120px"
                @change="handleSortChange"
              >
                <el-option label="推荐排序" value="featured" />
                <el-option label="最新添加" value="createTime" />
                <el-option label="访问量" value="visitCount" />
                <el-option label="评分" value="rating" />
                <el-option label="名称" value="title" />
              </el-select>
              
              <el-radio-group v-model="viewMode" size="small">
                <el-radio-button label="grid">
                  <el-icon><Grid /></el-icon>
                </el-radio-button>
                <el-radio-button label="list">
                  <el-icon><List /></el-icon>
                </el-radio-button>
              </el-radio-group>
            </div>
          </div>
        </div>

        <!-- 筛选标签 -->
        <div v-if="categoryTags.length > 0" class="tags-filter">
          <div class="tags-header">
            <span class="tags-label">热门标签：</span>
          </div>
          <div class="tags-list">
            <el-tag
              v-for="tag in categoryTags"
              :key="tag.name"
              :type="selectedTags.includes(tag.name) ? 'primary' : 'info'"
              class="tag-filter"
              @click="toggleTag(tag.name)"
            >
              {{ tag.name }} ({{ tag.count }})
            </el-tag>
          </div>
        </div>

        <!-- 导航网格/列表 -->
        <div class="tools-container">
          <Loading v-if="loading" type="skeleton" :count="8" />
          
          <template v-else-if="filteredNavigations.length > 0">
            <!-- 网格视图 -->
            <NavigationGrid
              v-if="viewMode === 'grid'"
              :items="paginatedNavigations"
              :loading="loading"
              @item-click="handleItemClick"
            />
            
            <!-- 列表视图 -->
            <div v-else class="tools-list">
              <NavigationCard
                v-for="item in paginatedNavigations"
                :key="item.id"
                :navigation="item"
                layout="horizontal"
                @click="handleItemClick"
              />
            </div>
          </template>
          
          <!-- 空状态 -->
          <div v-else class="empty-tools">
            <el-empty description="该分类下暂无工具">
              <template #image>
                <el-icon size="64"><Box /></el-icon>
              </template>
              <div class="empty-actions">
                <p>该分类下还没有添加任何工具</p>
                <el-button type="primary" @click="$router.push('/')">
                  浏览其他分类
                </el-button>
              </div>
            </el-empty>
          </div>
        </div>

        <!-- 分页 -->
        <div v-if="totalPages > 1" class="pagination-container">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :total="filteredNavigations.length"
            :page-sizes="[12, 24, 48, 96]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handlePageChange"
          />
        </div>
      </div>
    </div>

    <!-- 相关推荐 -->
    <div v-if="relatedCategories.length > 0" class="related-section">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">相关分类</h2>
        </div>
        
        <div class="related-grid">
          <div
            v-for="category in relatedCategories"
            :key="category.id"
            class="related-card"
            @click="navigateToCategory(category.id)"
          >
            <div class="related-icon">
              <el-icon :size="24" :color="category.color">
                <component :is="category.icon" />
              </el-icon>
            </div>
            <div class="related-info">
              <h4 class="related-name">{{ category.name }}</h4>
              <span class="related-count">
                {{ getNavigationCountByCategory(category.id) }} 个工具
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { 
  Star, Share, ArrowRight, Grid, List, Box 
} from '@element-plus/icons-vue'
import NavigationGrid from '@/components/Navigation/NavigationGrid.vue'
import NavigationCard from '@/components/Navigation/NavigationCard.vue'
import Loading from '@/components/Common/Loading.vue'
import { useNavigationStore } from '@/stores/navigation'
import { useCategoryStore } from '@/stores/category'
import type { Navigation, Category } from '@/types/common'

const route = useRoute()
const router = useRouter()
const navigationStore = useNavigationStore()
const categoryStore = useCategoryStore()

// 响应式数据
const loading = ref(false)
const viewMode = ref<'grid' | 'list'>('grid')
const sortBy = ref('featured')
const selectedTags = ref<string[]>([])
const currentPage = ref(1)
const pageSize = ref(24)
const isFollowing = ref(false)

// 计算属性
const currentCategory = computed(() => {
  const categoryId = route.params.id as string
  return categoryStore.getCategoryById(categoryId)
})

const categoryPath = computed(() => {
  if (!currentCategory.value) return []
  return categoryStore.getCategoryPath(currentCategory.value.id).slice(0, -1)
})

const subcategories = computed(() => {
  if (!currentCategory.value) return []
  return categoryStore.getSubcategories(currentCategory.value.id)
})

const subcategoriesCount = computed(() => subcategories.value.length)

const categoryNavigations = computed(() => {
  if (!currentCategory.value) return []
  return navigationStore.getNavigationsByCategory(currentCategory.value.id)
})

const navigationCount = computed(() => categoryNavigations.value.length)

const totalVisits = computed(() => {
  return categoryNavigations.value.reduce((sum, nav) => sum + nav.visitCount, 0)
})

const categoryTags = computed(() => {
  const tagCounts = new Map<string, number>()
  
  categoryNavigations.value.forEach(nav => {
    nav.tags.forEach(tag => {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
    })
  })
  
  return Array.from(tagCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
})

const filteredNavigations = computed(() => {
  let items = [...categoryNavigations.value]
  
  // 标签筛选
  if (selectedTags.value.length > 0) {
    items = items.filter(item => 
      selectedTags.value.some(tag => item.tags.includes(tag))
    )
  }
  
  // 排序
  items.sort((a, b) => {
    switch (sortBy.value) {
      case 'featured':
        if (a.featured !== b.featured) {
          return b.featured ? 1 : -1
        }
        return b.rating - a.rating
      case 'createTime':
        return new Date(b.createTime).getTime() - new Date(a.createTime).getTime()
      case 'visitCount':
        return b.visitCount - a.visitCount
      case 'rating':
        return b.rating - a.rating
      case 'title':
        return a.title.localeCompare(b.title)
      default:
        return 0
    }
  })
  
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

const relatedCategories = computed(() => {
  if (!currentCategory.value) return []
  
  // 获取同级分类
  const siblings = categoryStore.getSiblingCategories(currentCategory.value.id)
  return siblings.slice(0, 6)
})

// 方法
const navigateToCategory = (categoryId: string) => {
  router.push({ name: 'Category', params: { id: categoryId } })
}

const handleItemClick = (item: Navigation) => {
  navigationStore.recordVisit(item.id)
  window.open(item.url, '_blank')
}

const handleSortChange = () => {
  currentPage.value = 1
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  // 滚动到顶部
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
}

const toggleTag = (tag: string) => {
  const index = selectedTags.value.indexOf(tag)
  if (index > -1) {
    selectedTags.value.splice(index, 1)
  } else {
    selectedTags.value.push(tag)
  }
  currentPage.value = 1
}

const toggleCategoryFollow = () => {
  isFollowing.value = !isFollowing.value
  ElMessage.success(isFollowing.value ? '已关注该分类' : '已取消关注')
}

const shareCategory = () => {
  const url = window.location.href
  if (navigator.share) {
    navigator.share({
      title: `${currentCategory.value?.name} - AI导航`,
      text: currentCategory.value?.description,
      url: url
    })
  } else {
    // 复制到剪贴板
    navigator.clipboard.writeText(url).then(() => {
      ElMessage.success('链接已复制到剪贴板')
    })
  }
}

const getNavigationCountByCategory = (categoryId: string) => {
  return navigationStore.getNavigationsByCategory(categoryId).length
}

// 生命周期
onMounted(async () => {
  loading.value = true
  
  try {
    await Promise.all([
      categoryStore.fetchCategories(),
      navigationStore.fetchNavigations()
    ])
  } catch (error) {
    ElMessage.error('加载数据失败')
    console.error('Load data error:', error)
  } finally {
    loading.value = false
  }
})

// 监听路由变化
watch(() => route.params.id, () => {
  currentPage.value = 1
  selectedTags.value = []
})
</script>

<style lang="scss" scoped>
.category-page {
  min-height: 100vh;
  background: var(--el-bg-color-page);
}

.category-header {
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-light);
  padding: 2rem 0;
  
  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
  }
  
  .breadcrumb {
    margin-bottom: 1.5rem;
  }
  
  .category-info {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 2rem;
    
    .category-main {
      display: flex;
      align-items: flex-start;
      gap: 1.5rem;
      flex: 1;
      
      .category-icon {
        flex-shrink: 0;
        width: 64px;
        height: 64px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--el-bg-color-page);
        border-radius: 12px;
      }
      
      .category-details {
        flex: 1;
        
        .category-title {
          font-size: 2rem;
          font-weight: 600;
          color: var(--el-text-color-primary);
          margin: 0 0 0.5rem 0;
        }
        
        .category-description {
          color: var(--el-text-color-regular);
          font-size: 1rem;
          line-height: 1.6;
          margin: 0 0 1rem 0;
        }
        
        .category-stats {
          display: flex;
          gap: 2rem;
          
          .stat-item {
            text-align: center;
            
            .stat-value {
              display: block;
              font-size: 1.5rem;
              font-weight: 600;
              color: var(--el-color-primary);
            }
            
            .stat-label {
              font-size: 0.875rem;
              color: var(--el-text-color-regular);
            }
          }
        }
      }
    }
    
    .category-actions {
      display: flex;
      gap: 0.5rem;
      flex-shrink: 0;
    }
  }
}

.subcategories-section,
.tools-section,
.related-section {
  padding: 2rem 0;
  
  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
  }
  
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    
    .section-title {
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--el-text-color-primary);
      margin: 0;
    }
    
    .section-count {
      color: var(--el-text-color-regular);
      font-size: 0.875rem;
    }
    
    .section-controls {
      display: flex;
      align-items: center;
      gap: 1rem;
      
      .view-controls {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
    }
  }
}

.subcategories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
  
  .subcategory-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.5rem;
    background: var(--el-bg-color);
    border-radius: 8px;
    border: 1px solid var(--el-border-color-light);
    cursor: pointer;
    transition: all 0.2s;
    
    &:hover {
      border-color: var(--el-color-primary);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    
    .subcategory-icon {
      flex-shrink: 0;
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--el-bg-color-page);
      border-radius: 8px;
    }
    
    .subcategory-info {
      flex: 1;
      min-width: 0;
      
      .subcategory-name {
        font-size: 1.125rem;
        font-weight: 600;
        color: var(--el-text-color-primary);
        margin: 0 0 0.25rem 0;
      }
      
      .subcategory-description {
        color: var(--el-text-color-regular);
        font-size: 0.875rem;
        margin: 0 0 0.5rem 0;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      
      .subcategory-count {
        color: var(--el-color-primary);
        font-size: 0.875rem;
        font-weight: 500;
      }
    }
    
    .subcategory-arrow {
      flex-shrink: 0;
      color: var(--el-text-color-placeholder);
    }
  }
}

.tags-filter {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: var(--el-bg-color);
  border-radius: 8px;
  border: 1px solid var(--el-border-color-light);
  
  .tags-header {
    margin-bottom: 0.75rem;
    
    .tags-label {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--el-text-color-regular);
    }
  }
  
  .tags-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    
    .tag-filter {
      cursor: pointer;
      transition: all 0.2s;
      
      &:hover {
        opacity: 0.8;
      }
    }
  }
}

.tools-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.empty-tools {
  text-align: center;
  padding: 3rem 0;
  
  .empty-actions {
    margin-top: 1rem;
    
    p {
      color: var(--el-text-color-regular);
      margin-bottom: 1rem;
    }
  }
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid var(--el-border-color-light);
}

.related-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  
  .related-card {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    background: var(--el-bg-color);
    border-radius: 6px;
    border: 1px solid var(--el-border-color-light);
    cursor: pointer;
    transition: all 0.2s;
    
    &:hover {
      border-color: var(--el-color-primary);
    }
    
    .related-icon {
      flex-shrink: 0;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--el-bg-color-page);
      border-radius: 6px;
    }
    
    .related-info {
      flex: 1;
      min-width: 0;
      
      .related-name {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--el-text-color-primary);
        margin: 0 0 0.25rem 0;
      }
      
      .related-count {
        font-size: 0.75rem;
        color: var(--el-text-color-regular);
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .category-header {
    padding: 1rem 0;
    
    .category-info {
      flex-direction: column;
      gap: 1rem;
      
      .category-main {
        flex-direction: column;
        text-align: center;
        
        .category-stats {
          justify-content: center;
        }
      }
      
      .category-actions {
        align-self: stretch;
        
        .el-button {
          flex: 1;
        }
      }
    }
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
    
    .section-controls {
      align-self: stretch;
      justify-content: space-between;
    }
  }
  
  .subcategories-grid {
    grid-template-columns: 1fr;
  }
  
  .tags-filter {
    .tags-list {
      justify-content: center;
    }
  }
  
  .related-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
}
</style> 
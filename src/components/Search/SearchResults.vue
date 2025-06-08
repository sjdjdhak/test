<template>
  <div class="search-results">
    <!-- 搜索结果头部 -->
    <div class="results-header">
      <div class="results-info">
        <h3 class="results-title">
          搜索结果
          <span v-if="keyword" class="keyword">
            "{{ keyword }}"
          </span>
        </h3>
        <div class="results-meta">
          <span class="results-count">
            找到 {{ totalResults }} 个结果
          </span>
          <span v-if="searchTime" class="search-time">
            (用时 {{ searchTime }}ms)
          </span>
        </div>
      </div>
      
      <div class="results-actions">
        <el-select
          v-model="sortBy"
          placeholder="排序方式"
          style="width: 120px"
          @change="handleSortChange"
        >
          <el-option label="相关度" value="relevance" />
          <el-option label="时间" value="time" />
          <el-option label="热度" value="popularity" />
          <el-option label="评分" value="rating" />
        </el-select>
        
        <el-button-group>
          <el-button
            :type="viewMode === 'grid' ? 'primary' : 'default'"
            :icon="Grid"
            @click="viewMode = 'grid'"
          />
          <el-button
            :type="viewMode === 'list' ? 'primary' : 'default'"
            :icon="List"
            @click="viewMode = 'list'"
          />
        </el-button-group>
      </div>
    </div>

    <!-- 搜索筛选器 -->
    <div v-if="showFilters" class="results-filters">
      <SearchFilters
        :filters="filters"
        :categories="categories"
        @update:filters="handleFiltersUpdate"
      />
    </div>

    <!-- 搜索建议 -->
    <div v-if="suggestions.length > 0" class="search-suggestions">
      <div class="suggestions-title">您是否要找：</div>
      <div class="suggestions-list">
        <el-tag
          v-for="suggestion in suggestions"
          :key="suggestion"
          class="suggestion-tag"
          @click="handleSuggestionClick(suggestion)"
        >
          {{ suggestion }}
        </el-tag>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="results-loading">
      <Loading type="skeleton" :count="6" />
    </div>

    <!-- 搜索结果内容 -->
    <div v-else-if="results.length > 0" class="results-content">
      <!-- 网格视图 -->
      <div v-if="viewMode === 'grid'" class="results-grid">
        <NavigationCard
          v-for="item in results"
          :key="item.id"
          :navigation="item"
          :keyword="keyword"
          @click="handleItemClick(item)"
        />
      </div>
      
      <!-- 列表视图 -->
      <div v-else class="results-list">
        <div
          v-for="item in results"
          :key="item.id"
          class="result-item"
          @click="handleItemClick(item)"
        >
          <div class="item-icon">
            <img
              v-if="item.icon"
              :src="item.icon"
              :alt="item.title"
              @error="handleIconError"
            />
            <el-icon v-else size="24">
              <Link />
            </el-icon>
          </div>
          
          <div class="item-content">
            <div class="item-header">
              <h4 class="item-title" v-html="highlightKeyword(item.title, keyword)" />
              <div class="item-meta">
                <el-tag
                  v-if="item.category"
                  :color="item.category.color"
                  size="small"
                  effect="light"
                >
                  {{ item.category.name }}
                </el-tag>
                <span v-if="item.rating" class="item-rating">
                  <el-icon><Star /></el-icon>
                  {{ item.rating }}
                </span>
              </div>
            </div>
            
            <div class="item-description" v-html="highlightKeyword(item.description, keyword)" />
            
            <div class="item-footer">
              <div class="item-url">{{ item.url }}</div>
              <div class="item-tags">
                <el-tag
                  v-for="tag in item.tags?.slice(0, 3)"
                  :key="tag"
                  size="small"
                  type="info"
                  effect="plain"
                >
                  {{ tag }}
                </el-tag>
                <span v-if="item.tags && item.tags.length > 3" class="more-tags">
                  +{{ item.tags.length - 3 }}
                </span>
              </div>
            </div>
          </div>
          
          <div class="item-actions">
            <el-button
              size="small"
              type="primary"
              @click.stop="handleVisit(item)"
            >
              访问
            </el-button>
            <el-button
              size="small"
              :icon="isFavorite(item.id) ? StarFilled : Star"
              @click.stop="toggleFavorite(item)"
            />
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div v-if="totalResults > pageSize" class="results-pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="totalResults"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="results-empty">
      <Empty
        type="search"
        :title="keyword ? '未找到相关结果' : '请输入搜索关键词'"
        :description="keyword ? `没有找到与 '${keyword}' 相关的内容` : '在上方搜索框中输入关键词开始搜索'"
      >
        <template #actions>
          <el-button @click="handleClearSearch">清空搜索</el-button>
          <el-button type="primary" @click="handleShowAll">
            浏览全部
          </el-button>
        </template>
      </Empty>
    </div>

    <!-- 相关推荐 -->
    <div v-if="recommendations.length > 0" class="results-recommendations">
      <h4 class="recommendations-title">相关推荐</h4>
      <div class="recommendations-grid">
        <NavigationCard
          v-for="item in recommendations"
          :key="item.id"
          :navigation="item"
          size="small"
          @click="handleItemClick(item)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Grid, List, Link, Star, StarFilled } from '@element-plus/icons-vue'
import NavigationCard from '@/components/Navigation/NavigationCard.vue'
import SearchFilters from '@/components/Search/SearchFilters.vue'
import Loading from '@/components/Common/Loading.vue'
import Empty from '@/components/Common/Empty.vue'
import { useNavigationStore } from '@/stores/navigation'
import { useCategoryStore } from '@/stores/category'
import { userPreferences } from '@/utils/storage'
import { textUtils } from '@/utils/helpers'
import type { Navigation } from '@/types/navigation'
import type { Category } from '@/types/category'

interface SearchResult extends Navigation {
  category?: Category
  relevanceScore?: number
}

interface SearchFilters {
  categories: string[]
  tags: string[]
  rating: number
  featured: boolean
}

// Props
interface Props {
  keyword?: string
  filters?: SearchFilters
  showFilters?: boolean
  autoSearch?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  keyword: '',
  filters: () => ({
    categories: [],
    tags: [],
    rating: 0,
    featured: false
  }),
  showFilters: true,
  autoSearch: true
})

// Emits
const emit = defineEmits<{
  'update:keyword': [keyword: string]
  'update:filters': [filters: SearchFilters]
  'item-click': [item: SearchResult]
  'clear-search': []
}>()

const router = useRouter()
const navigationStore = useNavigationStore()
const categoryStore = useCategoryStore()

// 响应式数据
const loading = ref(false)
const results = ref<SearchResult[]>([])
const totalResults = ref(0)
const searchTime = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const sortBy = ref('relevance')
const viewMode = ref<'grid' | 'list'>('grid')
const suggestions = ref<string[]>([])
const recommendations = ref<SearchResult[]>([])

// 计算属性
const categories = computed(() => categoryStore.flatCategories)

const filters = computed({
  get: () => props.filters,
  set: (value) => emit('update:filters', value)
})

// 方法
const performSearch = async () => {
  if (!props.keyword.trim()) {
    results.value = []
    totalResults.value = 0
    return
  }

  loading.value = true
  const startTime = Date.now()

  try {
    // 模拟搜索API调用
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // 获取所有导航数据
    const allNavigations = navigationStore.navigations
    
    // 执行搜索逻辑
    const searchResults = searchNavigations(allNavigations, props.keyword, filters.value)
    
    // 排序结果
    const sortedResults = sortResults(searchResults, sortBy.value)
    
    // 分页
    const startIndex = (currentPage.value - 1) * pageSize.value
    const endIndex = startIndex + pageSize.value
    
    results.value = sortedResults.slice(startIndex, endIndex)
    totalResults.value = sortedResults.length
    searchTime.value = Date.now() - startTime
    
    // 生成搜索建议
    generateSuggestions(props.keyword, allNavigations)
    
    // 获取相关推荐
    getRecommendations(searchResults)
    
    // 记录搜索历史
    userPreferences.addSearchHistory(props.keyword)
    
  } catch (error) {
    console.error('Search error:', error)
    ElMessage.error('搜索失败，请重试')
  } finally {
    loading.value = false
  }
}

const searchNavigations = (navigations: Navigation[], keyword: string, filters: SearchFilters): SearchResult[] => {
  const results: SearchResult[] = []
  
  navigations.forEach(nav => {
    const category = categories.value.find(cat => cat.id === nav.categoryId)
    const result: SearchResult = { ...nav, category }
    
    // 计算相关度分数
    let relevanceScore = 0
    
    // 标题匹配（权重最高）
    if (nav.title.toLowerCase().includes(keyword.toLowerCase())) {
      relevanceScore += 10
    }
    
    // 描述匹配
    if (nav.description?.toLowerCase().includes(keyword.toLowerCase())) {
      relevanceScore += 5
    }
    
    // 标签匹配
    if (nav.tags?.some(tag => tag.toLowerCase().includes(keyword.toLowerCase()))) {
      relevanceScore += 3
    }
    
    // 分类匹配
    if (category?.name.toLowerCase().includes(keyword.toLowerCase())) {
      relevanceScore += 2
    }
    
    // 应用筛选器
    if (filters.categories.length > 0 && !filters.categories.includes(nav.categoryId)) {
      return
    }
    
    if (filters.tags.length > 0 && !filters.tags.some(tag => nav.tags?.includes(tag))) {
      return
    }
    
    if (filters.rating > 0 && (nav.rating || 0) < filters.rating) {
      return
    }
    
    if (filters.featured && !nav.featured) {
      return
    }
    
    if (relevanceScore > 0) {
      result.relevanceScore = relevanceScore
      results.push(result)
    }
  })
  
  return results
}

const sortResults = (results: SearchResult[], sortType: string): SearchResult[] => {
  return [...results].sort((a, b) => {
    switch (sortType) {
      case 'relevance':
        return (b.relevanceScore || 0) - (a.relevanceScore || 0)
      case 'time':
        return new Date(b.updateTime).getTime() - new Date(a.updateTime).getTime()
      case 'popularity':
        return (b.visitCount || 0) - (a.visitCount || 0)
      case 'rating':
        return (b.rating || 0) - (a.rating || 0)
      default:
        return 0
    }
  })
}

const generateSuggestions = (keyword: string, navigations: Navigation[]) => {
  const suggestionSet = new Set<string>()
  
  navigations.forEach(nav => {
    // 从标题中提取相似词汇
    const titleWords = nav.title.toLowerCase().split(/\s+/)
    titleWords.forEach(word => {
      if (word.includes(keyword.toLowerCase()) && word !== keyword.toLowerCase()) {
        suggestionSet.add(word)
      }
    })
    
    // 从标签中提取相似词汇
    nav.tags?.forEach(tag => {
      if (tag.toLowerCase().includes(keyword.toLowerCase()) && tag !== keyword) {
        suggestionSet.add(tag)
      }
    })
  })
  
  suggestions.value = Array.from(suggestionSet).slice(0, 5)
}

const getRecommendations = (searchResults: SearchResult[]) => {
  // 基于搜索结果获取相关推荐
  const categoryIds = [...new Set(searchResults.map(item => item.categoryId))]
  const allNavigations = navigationStore.navigations
  
  const recommended = allNavigations
    .filter(nav => 
      categoryIds.includes(nav.categoryId) && 
      !searchResults.some(result => result.id === nav.id)
    )
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 6)
    .map(nav => ({
      ...nav,
      category: categories.value.find(cat => cat.id === nav.categoryId)
    }))
  
  recommendations.value = recommended
}

const highlightKeyword = (text: string, keyword: string): string => {
  if (!keyword || !text) return text
  return textUtils.highlight(text, keyword, 'search-highlight')
}

const handleSortChange = () => {
  performSearch()
}

const handleFiltersUpdate = (newFilters: SearchFilters) => {
  emit('update:filters', newFilters)
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  performSearch()
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
  performSearch()
}

const handleSuggestionClick = (suggestion: string) => {
  emit('update:keyword', suggestion)
}

const handleItemClick = (item: SearchResult) => {
  emit('item-click', item)
  // 记录点击统计
  navigationStore.incrementVisitCount(item.id)
}

const handleVisit = (item: SearchResult) => {
  window.open(item.url, '_blank')
  navigationStore.incrementVisitCount(item.id)
}

const handleIconError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.style.display = 'none'
}

const isFavorite = (id: string): boolean => {
  return userPreferences.isFavorite(id)
}

const toggleFavorite = (item: SearchResult) => {
  if (isFavorite(item.id)) {
    userPreferences.removeFavorite(item.id)
    ElMessage.success('已取消收藏')
  } else {
    userPreferences.addFavorite(item.id)
    ElMessage.success('已添加到收藏')
  }
}

const handleClearSearch = () => {
  emit('clear-search')
}

const handleShowAll = () => {
  router.push('/')
}

// 监听器
watch(() => props.keyword, () => {
  if (props.autoSearch) {
    currentPage.value = 1
    performSearch()
  }
}, { immediate: true })

watch(() => props.filters, () => {
  if (props.autoSearch) {
    currentPage.value = 1
    performSearch()
  }
}, { deep: true })

// 生命周期
onMounted(() => {
  // 恢复用户偏好的视图模式
  viewMode.value = userPreferences.getViewMode() as 'grid' | 'list'
})

// 监听视图模式变化并保存
watch(viewMode, (newMode) => {
  userPreferences.setViewMode(newMode)
})
</script>

<style lang="scss" scoped>
.search-results {
  .results-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1.5rem;
    
    .results-info {
      .results-title {
        font-size: 1.5rem;
        font-weight: 600;
        color: var(--el-text-color-primary);
        margin: 0 0 0.5rem 0;
        
        .keyword {
          color: var(--el-color-primary);
        }
      }
      
      .results-meta {
        display: flex;
        gap: 1rem;
        font-size: 0.875rem;
        color: var(--el-text-color-regular);
        
        .search-time {
          color: var(--el-text-color-placeholder);
        }
      }
    }
    
    .results-actions {
      display: flex;
      gap: 1rem;
      align-items: center;
    }
  }
  
  .results-filters {
    margin-bottom: 1.5rem;
    padding: 1rem;
    background: var(--el-bg-color-page);
    border-radius: 8px;
    border: 1px solid var(--el-border-color-light);
  }
  
  .search-suggestions {
    margin-bottom: 1.5rem;
    
    .suggestions-title {
      font-size: 0.875rem;
      color: var(--el-text-color-regular);
      margin-bottom: 0.5rem;
    }
    
    .suggestions-list {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      
      .suggestion-tag {
        cursor: pointer;
        transition: all 0.2s;
        
        &:hover {
          background: var(--el-color-primary);
          color: white;
        }
      }
    }
  }
  
  .results-loading {
    margin: 2rem 0;
  }
  
  .results-content {
    .results-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    
    .results-list {
      .result-item {
        display: flex;
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
              
              :deep(.search-highlight) {
                background: var(--el-color-warning-light-7);
                color: var(--el-color-warning);
                padding: 0 2px;
                border-radius: 2px;
              }
            }
            
            .item-meta {
              display: flex;
              gap: 0.5rem;
              align-items: center;
              
              .item-rating {
                display: flex;
                align-items: center;
                gap: 0.25rem;
                font-size: 0.875rem;
                color: var(--el-color-warning);
              }
            }
          }
          
          .item-description {
            color: var(--el-text-color-regular);
            margin-bottom: 1rem;
            line-height: 1.5;
            
            :deep(.search-highlight) {
              background: var(--el-color-warning-light-7);
              color: var(--el-color-warning);
              padding: 0 2px;
              border-radius: 2px;
            }
          }
          
          .item-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            
            .item-url {
              font-size: 0.875rem;
              color: var(--el-text-color-placeholder);
              text-overflow: ellipsis;
              overflow: hidden;
              white-space: nowrap;
              max-width: 300px;
            }
            
            .item-tags {
              display: flex;
              gap: 0.5rem;
              align-items: center;
              
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
          flex-direction: column;
          gap: 0.5rem;
        }
      }
    }
  }
  
  .results-pagination {
    display: flex;
    justify-content: center;
    margin: 2rem 0;
  }
  
  .results-empty {
    margin: 3rem 0;
    text-align: center;
  }
  
  .results-recommendations {
    margin-top: 3rem;
    padding-top: 2rem;
    border-top: 1px solid var(--el-border-color-lighter);
    
    .recommendations-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--el-text-color-primary);
      margin: 0 0 1.5rem 0;
    }
    
    .recommendations-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 1rem;
    }
  }
}

// 响应式设计
@media (max-width: 1024px) {
  .search-results {
    .results-header {
      flex-direction: column;
      gap: 1rem;
      
      .results-actions {
        align-self: stretch;
        justify-content: space-between;
      }
    }
    
    .results-content .results-grid {
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    }
  }
}

@media (max-width: 768px) {
  .search-results {
    .results-content {
      .results-grid {
        grid-template-columns: 1fr;
      }
      
      .results-list .result-item {
        flex-direction: column;
        
        .item-content .item-footer {
          flex-direction: column;
          align-items: flex-start;
          gap: 0.5rem;
        }
        
        .item-actions {
          flex-direction: row;
          align-self: stretch;
        }
      }
    }
    
    .results-recommendations .recommendations-grid {
      grid-template-columns: 1fr;
    }
  }
}
</style> 
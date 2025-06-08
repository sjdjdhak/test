<template>
  <div class="search-filters">
    <!-- 筛选器头部 -->
    <div class="filters-header">
      <div class="filters-title">
        <el-icon><Filter /></el-icon>
        <span>筛选器</span>
      </div>
      <div class="filters-actions">
        <el-button size="small" text @click="clearAllFilters">
          清除全部
        </el-button>
        <el-button 
          size="small" 
          text 
          :icon="collapsed ? ArrowDown : ArrowUp"
          @click="toggleCollapse"
        >
          {{ collapsed ? '展开' : '收起' }}
        </el-button>
      </div>
    </div>

    <!-- 筛选器内容 -->
    <el-collapse-transition>
      <div v-show="!collapsed" class="filters-content">
        <div class="filters-grid">
          <!-- 分类筛选 -->
          <div class="filter-group">
            <label class="filter-label">分类</label>
            <el-select
              v-model="localFilters.categoryId"
              placeholder="选择分类"
              clearable
              filterable
              @change="handleFilterChange"
            >
              <el-option
                v-for="category in categories"
                :key="category.id"
                :label="category.name"
                :value="category.id"
              >
                <div class="category-option">
                  <el-icon :color="category.color">
                    <component :is="category.icon" />
                  </el-icon>
                  <span>{{ category.name }}</span>
                  <span class="category-count">({{ getCategoryCount(category.id) }})</span>
                </div>
              </el-option>
            </el-select>
          </div>

          <!-- 标签筛选 -->
          <div class="filter-group">
            <label class="filter-label">标签</label>
            <el-select
              v-model="localFilters.tags"
              placeholder="选择标签"
              multiple
              clearable
              filterable
              collapse-tags
              collapse-tags-tooltip
              :max-collapse-tags="2"
              @change="handleFilterChange"
            >
              <el-option
                v-for="tag in popularTags"
                :key="tag.name"
                :label="`${tag.name} (${tag.count})`"
                :value="tag.name"
              />
            </el-select>
          </div>

          <!-- 评分筛选 -->
          <div class="filter-group">
            <label class="filter-label">评分</label>
            <el-select
              v-model="localFilters.rating"
              placeholder="选择评分"
              clearable
              @change="handleFilterChange"
            >
              <el-option label="全部评分" value="" />
              <el-option label="5星" value="5">
                <div class="rating-option">
                  <el-rate :model-value="5" disabled show-score />
                </div>
              </el-option>
              <el-option label="4星以上" value="4">
                <div class="rating-option">
                  <el-rate :model-value="4" disabled show-score />
                  <span>以上</span>
                </div>
              </el-option>
              <el-option label="3星以上" value="3">
                <div class="rating-option">
                  <el-rate :model-value="3" disabled show-score />
                  <span>以上</span>
                </div>
              </el-option>
            </el-select>
          </div>

          <!-- 排序方式 -->
          <div class="filter-group">
            <label class="filter-label">排序</label>
            <el-select
              v-model="localFilters.sortBy"
              @change="handleFilterChange"
            >
              <el-option label="相关度" value="relevance" />
              <el-option label="最新添加" value="createTime" />
              <el-option label="访问量" value="visitCount" />
              <el-option label="评分" value="rating" />
              <el-option label="名称" value="title" />
            </el-select>
          </div>

          <!-- 时间范围 -->
          <div class="filter-group">
            <label class="filter-label">添加时间</label>
            <el-select
              v-model="localFilters.timeRange"
              placeholder="选择时间范围"
              clearable
              @change="handleFilterChange"
            >
              <el-option label="全部时间" value="" />
              <el-option label="最近一周" value="week" />
              <el-option label="最近一月" value="month" />
              <el-option label="最近三月" value="quarter" />
              <el-option label="最近一年" value="year" />
            </el-select>
          </div>

          <!-- 访问量范围 -->
          <div class="filter-group">
            <label class="filter-label">访问量</label>
            <el-select
              v-model="localFilters.visitRange"
              placeholder="选择访问量范围"
              clearable
              @change="handleFilterChange"
            >
              <el-option label="全部" value="" />
              <el-option label="1000+ 次" value="1000+" />
              <el-option label="500-1000 次" value="500-1000" />
              <el-option label="100-500 次" value="100-500" />
              <el-option label="100 次以下" value="0-100" />
            </el-select>
          </div>
        </div>

        <!-- 高级选项 -->
        <div class="advanced-options">
          <div class="options-title">
            <span>高级选项</span>
          </div>
          <div class="options-content">
            <el-checkbox-group v-model="localFilters.options" @change="handleFilterChange">
              <el-checkbox label="featured">仅显示推荐项目</el-checkbox>
              <el-checkbox label="active">仅显示启用项目</el-checkbox>
              <el-checkbox label="hasIcon">有图标的项目</el-checkbox>
              <el-checkbox label="hasDescription">有描述的项目</el-checkbox>
            </el-checkbox-group>
          </div>
        </div>

        <!-- 快速筛选标签 -->
        <div v-if="quickFilters.length > 0" class="quick-filters">
          <div class="quick-title">快速筛选</div>
          <div class="quick-tags">
            <el-tag
              v-for="filter in quickFilters"
              :key="filter.key"
              :type="isQuickFilterActive(filter) ? 'primary' : 'info'"
              class="quick-tag"
              @click="toggleQuickFilter(filter)"
            >
              {{ filter.label }}
            </el-tag>
          </div>
        </div>

        <!-- 应用按钮 -->
        <div class="filters-footer">
          <div class="active-filters">
            <span v-if="activeFiltersCount > 0" class="filters-count">
              已应用 {{ activeFiltersCount }} 个筛选条件
            </span>
          </div>
          <div class="footer-actions">
            <el-button @click="resetFilters">重置</el-button>
            <el-button type="primary" @click="applyFilters">
              应用筛选 ({{ filteredCount }})
            </el-button>
          </div>
        </div>
      </div>
    </el-collapse-transition>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { Filter, ArrowDown, ArrowUp } from '@element-plus/icons-vue'
import type { SearchFilters } from '@/types/navigation'
import type { Category } from '@/types/category'

interface Props {
  // 筛选器值
  filters: SearchFilters
  // 分类列表
  categories: Category[]
  // 热门标签
  popularTags: Array<{ name: string; count: number }>
  // 筛选结果数量
  filteredCount: number
  // 是否默认收起
  defaultCollapsed?: boolean
}

interface QuickFilter {
  key: string
  label: string
  value: any
  field: keyof SearchFilters
}

const props = withDefaults(defineProps<Props>(), {
  defaultCollapsed: false
})

const emit = defineEmits<{
  change: [filters: SearchFilters]
  apply: [filters: SearchFilters]
  clear: []
}>()

// 响应式数据
const collapsed = ref(props.defaultCollapsed)
const localFilters = reactive<SearchFilters>({ ...props.filters })

// 快速筛选选项
const quickFilters: QuickFilter[] = [
  { key: 'featured', label: '推荐项目', value: ['featured'], field: 'options' },
  { key: 'highRating', label: '高评分', value: '4', field: 'rating' },
  { key: 'recent', label: '最近添加', value: 'week', field: 'timeRange' },
  { key: 'popular', label: '热门访问', value: '1000+', field: 'visitRange' }
]

// 计算属性
const activeFiltersCount = computed(() => {
  let count = 0
  if (localFilters.categoryId) count++
  if (localFilters.tags?.length) count++
  if (localFilters.rating) count++
  if (localFilters.timeRange) count++
  if (localFilters.visitRange) count++
  if (localFilters.options?.length) count++
  return count
})

// 方法
const getCategoryCount = (categoryId: string) => {
  // 这里应该从store获取分类下的导航数量
  return Math.floor(Math.random() * 50) + 1
}

const handleFilterChange = () => {
  emit('change', { ...localFilters })
}

const toggleCollapse = () => {
  collapsed.value = !collapsed.value
}

const clearAllFilters = () => {
  Object.assign(localFilters, {
    categoryId: '',
    tags: [],
    rating: '',
    sortBy: 'relevance',
    timeRange: '',
    visitRange: '',
    options: []
  })
  handleFilterChange()
  emit('clear')
}

const resetFilters = () => {
  Object.assign(localFilters, props.filters)
  handleFilterChange()
}

const applyFilters = () => {
  emit('apply', { ...localFilters })
}

const isQuickFilterActive = (filter: QuickFilter) => {
  const currentValue = localFilters[filter.field]
  if (Array.isArray(filter.value)) {
    return Array.isArray(currentValue) && 
           filter.value.every(v => currentValue.includes(v))
  }
  return currentValue === filter.value
}

const toggleQuickFilter = (filter: QuickFilter) => {
  if (isQuickFilterActive(filter)) {
    // 取消筛选
    if (Array.isArray(filter.value)) {
      const currentValue = localFilters[filter.field] as string[]
      localFilters[filter.field] = currentValue.filter(v => !filter.value.includes(v)) as any
    } else {
      localFilters[filter.field] = '' as any
    }
  } else {
    // 应用筛选
    if (Array.isArray(filter.value)) {
      const currentValue = localFilters[filter.field] as string[] || []
      localFilters[filter.field] = [...new Set([...currentValue, ...filter.value])] as any
    } else {
      localFilters[filter.field] = filter.value
    }
  }
  handleFilterChange()
}

// 监听外部筛选器变化
watch(() => props.filters, (newFilters) => {
  Object.assign(localFilters, newFilters)
}, { deep: true })
</script>

<style lang="scss" scoped>
.search-filters {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  overflow: hidden;
}

.filters-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color-page);
  
  .filters-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 500;
    color: var(--el-text-color-primary);
  }
  
  .filters-actions {
    display: flex;
    gap: 0.5rem;
  }
}

.filters-content {
  padding: 1.5rem;
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
  
  .filter-group {
    .filter-label {
      display: block;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--el-text-color-regular);
      margin-bottom: 0.5rem;
    }
    
    .el-select {
      width: 100%;
    }
  }
}

.category-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  .category-count {
    margin-left: auto;
    font-size: 0.75rem;
    color: var(--el-text-color-placeholder);
  }
}

.rating-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  .el-rate {
    --el-rate-height: 16px;
  }
}

.advanced-options {
  margin-bottom: 1.5rem;
  
  .options-title {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--el-text-color-regular);
    margin-bottom: 0.75rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }
  
  .options-content {
    .el-checkbox-group {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 0.5rem;
    }
  }
}

.quick-filters {
  margin-bottom: 1.5rem;
  
  .quick-title {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--el-text-color-regular);
    margin-bottom: 0.75rem;
  }
  
  .quick-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    
    .quick-tag {
      cursor: pointer;
      transition: all 0.2s;
      
      &:hover {
        opacity: 0.8;
      }
    }
  }
}

.filters-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px solid var(--el-border-color-lighter);
  
  .active-filters {
    .filters-count {
      font-size: 0.875rem;
      color: var(--el-color-primary);
    }
  }
  
  .footer-actions {
    display: flex;
    gap: 0.5rem;
  }
}

// 响应式设计
@media (max-width: 1024px) {
  .filters-grid {
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  }
}

@media (max-width: 768px) {
  .filters-content {
    padding: 1rem;
  }
  
  .filters-grid {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
  
  .filters-header {
    padding: 0.75rem 1rem;
    
    .filters-title {
      font-size: 0.875rem;
    }
  }
  
  .filters-footer {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
    
    .footer-actions {
      justify-content: center;
      
      .el-button {
        flex: 1;
      }
    }
  }
  
  .advanced-options .options-content .el-checkbox-group {
    grid-template-columns: 1fr;
  }
}
</style> 
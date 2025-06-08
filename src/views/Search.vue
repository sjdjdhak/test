<template>
  <div class="search-page">
    <!-- 搜索头部 -->
    <div class="search-header">
      <div class="search-container">
        <SearchBox
          v-model="searchKeyword"
          :auto-focus="true"
          :show-suggestions="true"
          @search="handleSearch"
        />
      </div>
    </div>

    <!-- 搜索内容 -->
    <div class="search-content">
      <div class="container">
        <!-- 搜索结果 -->
        <SearchResults
          :keyword="searchKeyword"
          :filters="searchFilters"
          :show-filters="true"
          @update:keyword="handleKeywordUpdate"
          @update:filters="handleFiltersUpdate"
          @item-click="handleItemClick"
          @clear-search="handleClearSearch"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SearchBox from '@/components/Search/SearchBox.vue'
import SearchResults from '@/components/Search/SearchResults.vue'
import { useSearchStore } from '@/stores/search'
import type { Navigation } from '@/types/navigation'

const route = useRoute()
const router = useRouter()
const searchStore = useSearchStore()

// 响应式数据
const searchKeyword = ref('')
const searchFilters = ref({
  categories: [],
  tags: [],
  rating: 0,
  featured: false
})

// 方法
const handleSearch = (keyword: string) => {
  searchKeyword.value = keyword
  performSearch()
}

const handleKeywordUpdate = (keyword: string) => {
  searchKeyword.value = keyword
  updateURL()
}

const handleFiltersUpdate = (filters: any) => {
  searchFilters.value = filters
  performSearch()
}

const handleItemClick = (item: Navigation) => {
  // 记录点击事件
  console.log('Item clicked:', item)
}

const handleClearSearch = () => {
  searchKeyword.value = ''
  searchFilters.value = {
    categories: [],
    tags: [],
    rating: 0,
    featured: false
  }
  router.push('/search')
}

const performSearch = () => {
  if (searchKeyword.value.trim()) {
    searchStore.search(searchKeyword.value, searchFilters.value)
    updateURL()
  }
}

const updateURL = () => {
  const query: any = {}
  
  if (searchKeyword.value) {
    query.q = searchKeyword.value
  }
  
  if (searchFilters.value.categories.length > 0) {
    query.categories = searchFilters.value.categories.join(',')
  }
  
  if (searchFilters.value.tags.length > 0) {
    query.tags = searchFilters.value.tags.join(',')
  }
  
  if (searchFilters.value.rating > 0) {
    query.rating = searchFilters.value.rating
  }
  
  if (searchFilters.value.featured) {
    query.featured = '1'
  }
  
  router.replace({ query })
}

const loadFromURL = () => {
  const query = route.query
  
  if (query.q) {
    searchKeyword.value = query.q as string
  }
  
  if (query.categories) {
    searchFilters.value.categories = (query.categories as string).split(',')
  }
  
  if (query.tags) {
    searchFilters.value.tags = (query.tags as string).split(',')
  }
  
  if (query.rating) {
    searchFilters.value.rating = Number(query.rating)
  }
  
  if (query.featured) {
    searchFilters.value.featured = query.featured === '1'
  }
}

// 生命周期
onMounted(() => {
  // 从URL加载搜索参数
  loadFromURL()
  
  // 如果有搜索关键词，执行搜索
  if (searchKeyword.value) {
    performSearch()
  }
  
  // 初始化搜索store
  searchStore.initializeStore()
})

// 监听路由变化
watch(() => route.query, () => {
  loadFromURL()
  if (searchKeyword.value) {
    performSearch()
  }
}, { deep: true })
</script>

<style lang="scss" scoped>
.search-page {
  min-height: 100vh;
  background: var(--el-bg-color-page);
}

.search-header {
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-light);
  padding: 2rem 0;
  
  .search-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 0 1rem;
  }
}

.search-content {
  padding: 2rem 0;
  
  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .search-header {
    padding: 1rem 0;
  }
  
  .search-content {
    padding: 1rem 0;
  }
}
</style> 
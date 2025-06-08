<template>
  <div class="home-page">
    <!-- 搜索区域 -->
    <div class="search-section">
      <div class="search-container">
        <h1 class="page-title">AI导航</h1>
        <p class="page-subtitle">发现最优质的AI工具和资源</p>
        <SearchBox 
          v-model="searchQuery"
          @search="handleSearch"
          placeholder="搜索AI工具、分类或标签..."
          class="main-search"
        />
      </div>
    </div>

    <!-- 推荐导航 -->
    <div class="featured-section" v-if="featuredNavigations.length > 0">
      <div class="section-header">
        <h2 class="section-title">
          <el-icon><Star /></el-icon>
          推荐导航
        </h2>
        <el-button type="text" @click="viewAllFeatured">查看全部</el-button>
      </div>
      <NavigationGrid 
        :navigations="featuredNavigations"
        :loading="loading"
        @click="handleNavigationClick"
      />
    </div>

    <!-- 热门导航 -->
    <div class="popular-section" v-if="popularNavigations.length > 0">
      <div class="section-header">
        <h2 class="section-title">
          <el-icon><TrendCharts /></el-icon>
          热门导航
        </h2>
        <el-button type="text" @click="viewAllPopular">查看全部</el-button>
      </div>
      <NavigationGrid 
        :navigations="popularNavigations"
        :loading="loading"
        @click="handleNavigationClick"
      />
    </div>

    <!-- 最新导航 -->
    <div class="recent-section">
      <div class="section-header">
        <h2 class="section-title">
          <el-icon><Clock /></el-icon>
          最新导航
        </h2>
        <el-button type="text" @click="viewAllRecent">查看全部</el-button>
      </div>
      <NavigationGrid 
        :navigations="recentNavigations"
        :loading="loading"
        @click="handleNavigationClick"
      />
    </div>

    <!-- 统计信息 -->
    <div class="stats-section">
      <div class="stats-container">
        <div class="stat-card">
          <div class="stat-number">{{ totalNavigations }}</div>
          <div class="stat-label">导航总数</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ totalCategories }}</div>
          <div class="stat-label">分类总数</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ totalVisits }}</div>
          <div class="stat-label">总访问量</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ todayVisits }}</div>
          <div class="stat-label">今日访问</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Star, TrendCharts, Clock } from '@element-plus/icons-vue'
import SearchBox from '@/components/Search/SearchBox.vue'
import NavigationGrid from '@/components/Navigation/NavigationGrid.vue'
import { useNavigationStore } from '@/stores/navigation'
import { useCategoryStore } from '@/stores/category'
import type { Navigation } from '@/types/navigation'

const router = useRouter()
const navigationStore = useNavigationStore()
const categoryStore = useCategoryStore()

const searchQuery = ref('')
const loading = ref(false)

// 计算属性
const featuredNavigations = computed(() => navigationStore.featuredNavigations)
const popularNavigations = computed(() => navigationStore.popularNavigations)
const recentNavigations = computed(() => {
  return [...navigationStore.navigations]
    .sort((a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime())
    .slice(0, 8)
})

const totalNavigations = computed(() => navigationStore.totalCount)
const totalCategories = computed(() => categoryStore.totalCount)
const totalVisits = computed(() => {
  return navigationStore.navigations.reduce((sum, nav) => sum + nav.visitCount, 0)
})
const todayVisits = ref(0) // TODO: 实现今日访问统计

// 方法
const handleSearch = (query: string) => {
  if (query.trim()) {
    router.push({
      name: 'Search',
      query: { q: query }
    })
  }
}

const handleNavigationClick = (navigation: Navigation) => {
  // 增加访问次数
  navigationStore.incrementVisitCount(navigation.id)
  
  // 打开链接
  window.open(navigation.url, '_blank')
}

const viewAllFeatured = () => {
  router.push({ name: 'Category', query: { featured: 'true' } })
}

const viewAllPopular = () => {
  router.push({ name: 'Category', query: { sort: 'popular' } })
}

const viewAllRecent = () => {
  router.push({ name: 'Category', query: { sort: 'recent' } })
}

// 初始化数据
onMounted(async () => {
  loading.value = true
  try {
    await Promise.all([
      navigationStore.fetchNavigations(),
      categoryStore.fetchCategories()
    ])
  } catch (error) {
    console.error('Failed to load data:', error)
  } finally {
    loading.value = false
  }
})
</script>

<style lang="scss" scoped>
.home-page {
  min-height: 100vh;
}

.search-section {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-color-light) 100%);
  padding: var(--spacing-xxl) 0;
  text-align: center;
  color: white;
  
  .search-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 0 var(--spacing-lg);
  }
  
  .page-title {
    font-size: 3rem;
    font-weight: 700;
    margin-bottom: var(--spacing-md);
    
    @include mobile {
      font-size: 2rem;
    }
  }
  
  .page-subtitle {
    font-size: var(--font-size-lg);
    margin-bottom: var(--spacing-xl);
    opacity: 0.9;
  }
  
  .main-search {
    max-width: 600px;
    margin: 0 auto;
  }
}

.featured-section,
.popular-section,
.recent-section {
  padding: var(--spacing-xxl) var(--spacing-lg);
  max-width: 1200px;
  margin: 0 auto;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xl);
  
  .section-title {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    font-size: var(--font-size-xl);
    font-weight: 600;
    color: var(--text-primary);
    margin: 0;
  }
}

.stats-section {
  background: var(--bg-secondary);
  padding: var(--spacing-xxl) var(--spacing-lg);
  margin-top: var(--spacing-xxl);
  
  .stats-container {
    max-width: 1200px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--spacing-lg);
  }
  
  .stat-card {
    background: var(--bg-primary);
    padding: var(--spacing-xl);
    border-radius: var(--border-radius-lg);
    text-align: center;
    box-shadow: var(--shadow-sm);
    
    .stat-number {
      font-size: 2.5rem;
      font-weight: 700;
      color: var(--primary-color);
      margin-bottom: var(--spacing-sm);
    }
    
    .stat-label {
      font-size: var(--font-size-md);
      color: var(--text-secondary);
    }
  }
}

@include mobile {
  .search-section {
    padding: var(--spacing-xl) 0;
  }
  
  .featured-section,
  .popular-section,
  .recent-section {
    padding: var(--spacing-xl) var(--spacing-md);
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-md);
  }
  
  .stats-section {
    padding: var(--spacing-xl) var(--spacing-md);
    
    .stats-container {
      grid-template-columns: repeat(2, 1fr);
      gap: var(--spacing-md);
    }
    
    .stat-card {
      padding: var(--spacing-lg);
      
      .stat-number {
        font-size: 2rem;
      }
    }
  }
}
</style> 
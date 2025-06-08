import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useNavigationStore } from './navigation'
import { useCategoryStore } from './category'
import { userPreferences } from '@/utils/storage'
import { textUtils } from '@/utils/helpers'
import type { Navigation } from '@/types/navigation'
import type { Category } from '@/types/category'

export interface SearchResult extends Navigation {
  category?: Category
  relevanceScore?: number
  highlightTitle?: string
  highlightDescription?: string
}

export interface SearchFilters {
  categories: string[]
  tags: string[]
  rating: number
  featured: boolean
  dateRange?: [string, string]
}

export interface SearchSuggestion {
  text: string
  type: 'keyword' | 'category' | 'tag'
  count: number
}

export interface SearchHistory {
  keyword: string
  timestamp: number
  resultCount: number
}

export const useSearchStore = defineStore('search', () => {
  // 状态
  const currentKeyword = ref('')
  const searchResults = ref<SearchResult[]>([])
  const searchHistory = ref<SearchHistory[]>([])
  const hotSearches = ref<string[]>([])
  const suggestions = ref<SearchSuggestion[]>([])
  const isSearching = ref(false)
  const searchTime = ref(0)
  const totalResults = ref(0)
  const currentFilters = ref<SearchFilters>({
    categories: [],
    tags: [],
    rating: 0,
    featured: false
  })

  // 依赖的其他store
  const navigationStore = useNavigationStore()
  const categoryStore = useCategoryStore()

  // 计算属性
  const hasResults = computed(() => searchResults.value.length > 0)
  
  const recentSearches = computed(() => {
    return searchHistory.value
      .slice(0, 10)
      .map(item => item.keyword)
  })

  const popularTags = computed(() => {
    const tagCount = new Map<string, number>()
    
    navigationStore.navigations.forEach(nav => {
      nav.tags?.forEach(tag => {
        tagCount.set(tag, (tagCount.get(tag) || 0) + 1)
      })
    })
    
    return Array.from(tagCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([tag]) => tag)
  })

  const searchStats = computed(() => {
    const stats = {
      totalSearches: searchHistory.value.length,
      uniqueKeywords: new Set(searchHistory.value.map(h => h.keyword)).size,
      averageResults: 0,
      mostSearched: ''
    }

    if (searchHistory.value.length > 0) {
      stats.averageResults = searchHistory.value.reduce((sum, h) => sum + h.resultCount, 0) / searchHistory.value.length
      
      const keywordCount = new Map<string, number>()
      searchHistory.value.forEach(h => {
        keywordCount.set(h.keyword, (keywordCount.get(h.keyword) || 0) + 1)
      })
      
      const mostSearchedEntry = Array.from(keywordCount.entries())
        .sort((a, b) => b[1] - a[1])[0]
      
      if (mostSearchedEntry) {
        stats.mostSearched = mostSearchedEntry[0]
      }
    }

    return stats
  })

  // 方法
  const search = async (keyword: string, filters?: Partial<SearchFilters>): Promise<SearchResult[]> => {
    if (!keyword.trim()) {
      clearResults()
      return []
    }

    isSearching.value = true
    currentKeyword.value = keyword.trim()
    
    if (filters) {
      currentFilters.value = { ...currentFilters.value, ...filters }
    }

    const startTime = Date.now()

    try {
      // 获取所有导航数据
      const allNavigations = navigationStore.navigations
      const categories = categoryStore.flatCategories

      // 执行搜索
      const results = performSearch(allNavigations, categories, keyword, currentFilters.value)
      
      // 计算搜索时间
      searchTime.value = Date.now() - startTime
      
      // 更新结果
      searchResults.value = results
      totalResults.value = results.length
      
      // 记录搜索历史
      addToHistory(keyword, results.length)
      
      // 生成搜索建议
      generateSuggestions(keyword, allNavigations, categories)
      
      return results
    } catch (error) {
      console.error('Search error:', error)
      throw error
    } finally {
      isSearching.value = false
    }
  }

  const performSearch = (
    navigations: Navigation[],
    categories: Category[],
    keyword: string,
    filters: SearchFilters
  ): SearchResult[] => {
    const results: SearchResult[] = []
    const lowerKeyword = keyword.toLowerCase()

    navigations.forEach(nav => {
      const category = categories.find(cat => cat.id === nav.categoryId)
      
      // 计算相关度分数
      let relevanceScore = 0
      let highlightTitle = nav.title
      let highlightDescription = nav.description || ''

      // 标题匹配（权重最高）
      if (nav.title.toLowerCase().includes(lowerKeyword)) {
        relevanceScore += 10
        highlightTitle = textUtils.highlight(nav.title, keyword, 'search-highlight')
      }

      // 精确标题匹配
      if (nav.title.toLowerCase() === lowerKeyword) {
        relevanceScore += 20
      }

      // 标题开头匹配
      if (nav.title.toLowerCase().startsWith(lowerKeyword)) {
        relevanceScore += 15
      }

      // 描述匹配
      if (nav.description?.toLowerCase().includes(lowerKeyword)) {
        relevanceScore += 5
        highlightDescription = textUtils.highlight(nav.description, keyword, 'search-highlight')
      }

      // 标签匹配
      const matchingTags = nav.tags?.filter(tag => 
        tag.toLowerCase().includes(lowerKeyword)
      ) || []
      
      if (matchingTags.length > 0) {
        relevanceScore += matchingTags.length * 3
        // 精确标签匹配
        if (matchingTags.some(tag => tag.toLowerCase() === lowerKeyword)) {
          relevanceScore += 10
        }
      }

      // 分类匹配
      if (category?.name.toLowerCase().includes(lowerKeyword)) {
        relevanceScore += 2
      }

      // URL匹配
      if (nav.url.toLowerCase().includes(lowerKeyword)) {
        relevanceScore += 1
      }

      // 应用筛选器
      if (!passesFilters(nav, category, filters)) {
        return
      }

      // 只有相关度大于0的结果才加入
      if (relevanceScore > 0) {
        results.push({
          ...nav,
          category,
          relevanceScore,
          highlightTitle,
          highlightDescription
        })
      }
    })

    // 按相关度排序
    return results.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
  }

  const passesFilters = (nav: Navigation, category: Category | undefined, filters: SearchFilters): boolean => {
    // 分类筛选
    if (filters.categories.length > 0 && !filters.categories.includes(nav.categoryId)) {
      return false
    }

    // 标签筛选
    if (filters.tags.length > 0) {
      const hasMatchingTag = filters.tags.some(tag => nav.tags?.includes(tag))
      if (!hasMatchingTag) {
        return false
      }
    }

    // 评分筛选
    if (filters.rating > 0 && (nav.rating || 0) < filters.rating) {
      return false
    }

    // 推荐筛选
    if (filters.featured && !nav.featured) {
      return false
    }

    // 日期范围筛选
    if (filters.dateRange) {
      const [startDate, endDate] = filters.dateRange
      const navDate = new Date(nav.createTime)
      const start = new Date(startDate)
      const end = new Date(endDate)
      
      if (navDate < start || navDate > end) {
        return false
      }
    }

    return true
  }

  const generateSuggestions = (
    keyword: string,
    navigations: Navigation[],
    categories: Category[]
  ) => {
    const suggestionMap = new Map<string, SearchSuggestion>()
    const lowerKeyword = keyword.toLowerCase()

    // 从导航标题中提取建议
    navigations.forEach(nav => {
      const words = nav.title.toLowerCase().split(/\s+/)
      words.forEach(word => {
        if (word.includes(lowerKeyword) && word !== lowerKeyword && word.length > 2) {
          const existing = suggestionMap.get(word)
          if (existing) {
            existing.count++
          } else {
            suggestionMap.set(word, {
              text: word,
              type: 'keyword',
              count: 1
            })
          }
        }
      })
    })

    // 从标签中提取建议
    navigations.forEach(nav => {
      nav.tags?.forEach(tag => {
        if (tag.toLowerCase().includes(lowerKeyword) && tag.toLowerCase() !== lowerKeyword) {
          const existing = suggestionMap.get(tag)
          if (existing) {
            existing.count++
          } else {
            suggestionMap.set(tag, {
              text: tag,
              type: 'tag',
              count: 1
            })
          }
        }
      })
    })

    // 从分类中提取建议
    categories.forEach(category => {
      if (category.name.toLowerCase().includes(lowerKeyword) && 
          category.name.toLowerCase() !== lowerKeyword) {
        suggestionMap.set(category.name, {
          text: category.name,
          type: 'category',
          count: 1
        })
      }
    })

    // 排序并限制数量
    suggestions.value = Array.from(suggestionMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
  }

  const addToHistory = (keyword: string, resultCount: number) => {
    const historyItem: SearchHistory = {
      keyword,
      timestamp: Date.now(),
      resultCount
    }

    // 移除重复的关键词
    searchHistory.value = searchHistory.value.filter(item => item.keyword !== keyword)
    
    // 添加到开头
    searchHistory.value.unshift(historyItem)
    
    // 限制历史记录数量
    if (searchHistory.value.length > 100) {
      searchHistory.value = searchHistory.value.slice(0, 100)
    }

    // 保存到本地存储
    userPreferences.setSearchHistory(searchHistory.value)
  }

  const clearHistory = () => {
    searchHistory.value = []
    userPreferences.clearSearchHistory()
  }

  const removeFromHistory = (keyword: string) => {
    searchHistory.value = searchHistory.value.filter(item => item.keyword !== keyword)
    userPreferences.setSearchHistory(searchHistory.value)
  }

  const clearResults = () => {
    searchResults.value = []
    totalResults.value = 0
    currentKeyword.value = ''
    searchTime.value = 0
  }

  const updateFilters = (filters: Partial<SearchFilters>) => {
    currentFilters.value = { ...currentFilters.value, ...filters }
    
    // 如果有当前搜索关键词，重新搜索
    if (currentKeyword.value) {
      search(currentKeyword.value)
    }
  }

  const resetFilters = () => {
    currentFilters.value = {
      categories: [],
      tags: [],
      rating: 0,
      featured: false
    }
  }

  const getSearchSuggestions = (input: string): SearchSuggestion[] => {
    if (!input.trim()) return []

    const lowerInput = input.toLowerCase()
    const allSuggestions: SearchSuggestion[] = []

    // 从历史搜索中获取建议
    searchHistory.value.forEach(item => {
      if (item.keyword.toLowerCase().includes(lowerInput)) {
        allSuggestions.push({
          text: item.keyword,
          type: 'keyword',
          count: 1
        })
      }
    })

    // 从热门搜索中获取建议
    hotSearches.value.forEach(keyword => {
      if (keyword.toLowerCase().includes(lowerInput)) {
        allSuggestions.push({
          text: keyword,
          type: 'keyword',
          count: 1
        })
      }
    })

    // 从分类中获取建议
    categoryStore.flatCategories.forEach(category => {
      if (category.name.toLowerCase().includes(lowerInput)) {
        allSuggestions.push({
          text: category.name,
          type: 'category',
          count: 1
        })
      }
    })

    // 从标签中获取建议
    popularTags.value.forEach(tag => {
      if (tag.toLowerCase().includes(lowerInput)) {
        allSuggestions.push({
          text: tag,
          type: 'tag',
          count: 1
        })
      }
    })

    // 去重并排序
    const uniqueSuggestions = new Map<string, SearchSuggestion>()
    allSuggestions.forEach(suggestion => {
      if (!uniqueSuggestions.has(suggestion.text)) {
        uniqueSuggestions.set(suggestion.text, suggestion)
      }
    })

    return Array.from(uniqueSuggestions.values()).slice(0, 10)
  }

  const loadHotSearches = async () => {
    try {
      // 这里可以从API获取热门搜索
      // 暂时使用模拟数据
      hotSearches.value = [
        'ChatGPT',
        'AI绘画',
        '代码生成',
        '文本转语音',
        '图像识别',
        '机器学习',
        '自然语言处理',
        '计算机视觉'
      ]
    } catch (error) {
      console.error('Load hot searches error:', error)
    }
  }

  const initializeStore = () => {
    // 从本地存储加载搜索历史
    const savedHistory = userPreferences.getSearchHistory()
    if (savedHistory) {
      searchHistory.value = savedHistory
    }

    // 加载热门搜索
    loadHotSearches()
  }

  // 高级搜索功能
  const advancedSearch = async (params: {
    keyword?: string
    categories?: string[]
    tags?: string[]
    rating?: number
    featured?: boolean
    dateRange?: [string, string]
    sortBy?: 'relevance' | 'time' | 'popularity' | 'rating'
  }) => {
    const { keyword = '', sortBy = 'relevance', ...filters } = params
    
    // 更新筛选器
    updateFilters(filters)
    
    // 执行搜索
    const results = await search(keyword)
    
    // 应用排序
    if (sortBy !== 'relevance') {
      searchResults.value = sortResults(results, sortBy)
    }
    
    return searchResults.value
  }

  const sortResults = (results: SearchResult[], sortBy: string): SearchResult[] => {
    return [...results].sort((a, b) => {
      switch (sortBy) {
        case 'time':
          return new Date(b.updateTime).getTime() - new Date(a.updateTime).getTime()
        case 'popularity':
          return (b.visitCount || 0) - (a.visitCount || 0)
        case 'rating':
          return (b.rating || 0) - (a.rating || 0)
        default:
          return (b.relevanceScore || 0) - (a.relevanceScore || 0)
      }
    })
  }

  // 搜索分析
  const getSearchAnalytics = () => {
    const analytics = {
      totalSearches: searchHistory.value.length,
      uniqueKeywords: new Set(searchHistory.value.map(h => h.keyword)).size,
      averageResults: 0,
      topKeywords: [] as { keyword: string; count: number }[],
      searchTrends: [] as { date: string; count: number }[],
      noResultsKeywords: [] as string[]
    }

    if (searchHistory.value.length > 0) {
      // 计算平均结果数
      analytics.averageResults = searchHistory.value.reduce((sum, h) => sum + h.resultCount, 0) / searchHistory.value.length

      // 统计热门关键词
      const keywordCount = new Map<string, number>()
      searchHistory.value.forEach(h => {
        keywordCount.set(h.keyword, (keywordCount.get(h.keyword) || 0) + 1)
      })
      
      analytics.topKeywords = Array.from(keywordCount.entries())
        .map(([keyword, count]) => ({ keyword, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)

      // 统计无结果的关键词
      analytics.noResultsKeywords = searchHistory.value
        .filter(h => h.resultCount === 0)
        .map(h => h.keyword)
        .slice(0, 10)

      // 搜索趋势（按天统计）
      const trendMap = new Map<string, number>()
      searchHistory.value.forEach(h => {
        const date = new Date(h.timestamp).toISOString().split('T')[0]
        trendMap.set(date, (trendMap.get(date) || 0) + 1)
      })
      
      analytics.searchTrends = Array.from(trendMap.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-30) // 最近30天
    }

    return analytics
  }

  return {
    // 状态
    currentKeyword,
    searchResults,
    searchHistory,
    hotSearches,
    suggestions,
    isSearching,
    searchTime,
    totalResults,
    currentFilters,

    // 计算属性
    hasResults,
    recentSearches,
    popularTags,
    searchStats,

    // 方法
    search,
    clearHistory,
    removeFromHistory,
    clearResults,
    updateFilters,
    resetFilters,
    getSearchSuggestions,
    loadHotSearches,
    initializeStore,
    advancedSearch,
    getSearchAnalytics
  }
}) 
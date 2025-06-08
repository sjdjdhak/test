import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { userPreferences } from '@/utils/storage'
import type { Navigation } from '@/types/navigation'

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto'
  language: 'zh-CN' | 'en-US'
  viewMode: 'grid' | 'list'
  itemsPerPage: number
  enableAnimations: boolean
  enableNotifications: boolean
  autoSave: boolean
  compactMode: boolean
  showTips: boolean
  defaultCategory: string
  sortBy: 'default' | 'title' | 'time' | 'popularity' | 'rating'
}

export interface UserStats {
  totalVisits: number
  totalSearches: number
  favoriteCount: number
  lastVisit: string
  joinDate: string
  activeTime: number // 活跃时间（分钟）
}

export interface UserActivity {
  id: string
  type: 'visit' | 'search' | 'favorite' | 'share'
  target: string
  targetTitle?: string
  timestamp: number
  metadata?: Record<string, any>
}

export const useUserStore = defineStore('user', () => {
  // 状态
  const preferences = ref<UserPreferences>({
    theme: 'light',
    language: 'zh-CN',
    viewMode: 'grid',
    itemsPerPage: 20,
    enableAnimations: true,
    enableNotifications: true,
    autoSave: true,
    compactMode: false,
    showTips: true,
    defaultCategory: '',
    sortBy: 'default'
  })

  const stats = ref<UserStats>({
    totalVisits: 0,
    totalSearches: 0,
    favoriteCount: 0,
    lastVisit: new Date().toISOString(),
    joinDate: new Date().toISOString(),
    activeTime: 0
  })

  const favorites = ref<string[]>([])
  const recentVisits = ref<Navigation[]>([])
  const activities = ref<UserActivity[]>([])
  const isFirstVisit = ref(true)
  const sessionStartTime = ref(Date.now())

  // 计算属性
  const isDarkMode = computed(() => {
    if (preferences.value.theme === 'auto') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return preferences.value.theme === 'dark'
  })

  const favoriteNavigations = computed(() => {
    // 这里需要从导航store获取收藏的导航项
    // 暂时返回空数组，实际使用时需要注入navigationStore
    return []
  })

  const recentActivities = computed(() => {
    return activities.value
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 20)
  })

  const todayStats = computed(() => {
    const today = new Date().toDateString()
    const todayActivities = activities.value.filter(activity => 
      new Date(activity.timestamp).toDateString() === today
    )

    return {
      visits: todayActivities.filter(a => a.type === 'visit').length,
      searches: todayActivities.filter(a => a.type === 'search').length,
      favorites: todayActivities.filter(a => a.type === 'favorite').length,
      shares: todayActivities.filter(a => a.type === 'share').length
    }
  })

  const weeklyStats = computed(() => {
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    const weekActivities = activities.value.filter(activity => 
      activity.timestamp > oneWeekAgo
    )

    const dailyStats = new Map<string, { visits: number; searches: number }>()
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      const dateStr = date.toDateString()
      dailyStats.set(dateStr, { visits: 0, searches: 0 })
    }

    weekActivities.forEach(activity => {
      const dateStr = new Date(activity.timestamp).toDateString()
      const dayStats = dailyStats.get(dateStr)
      if (dayStats) {
        if (activity.type === 'visit') dayStats.visits++
        if (activity.type === 'search') dayStats.searches++
      }
    })

    return Array.from(dailyStats.entries()).map(([date, stats]) => ({
      date,
      ...stats
    }))
  })

  // 方法
  const updatePreferences = (newPreferences: Partial<UserPreferences>) => {
    preferences.value = { ...preferences.value, ...newPreferences }
    savePreferences()
  }

  const savePreferences = () => {
    userPreferences.setUserPreferences(preferences.value)
  }

  const loadPreferences = () => {
    const saved = userPreferences.getUserPreferences()
    if (saved) {
      preferences.value = { ...preferences.value, ...saved }
    }
  }

  const addToFavorites = (navigationId: string) => {
    if (!favorites.value.includes(navigationId)) {
      favorites.value.push(navigationId)
      stats.value.favoriteCount++
      
      addActivity({
        type: 'favorite',
        target: navigationId
      })
      
      saveFavorites()
      saveStats()
    }
  }

  const removeFromFavorites = (navigationId: string) => {
    const index = favorites.value.indexOf(navigationId)
    if (index > -1) {
      favorites.value.splice(index, 1)
      stats.value.favoriteCount--
      saveFavorites()
      saveStats()
    }
  }

  const isFavorite = (navigationId: string): boolean => {
    return favorites.value.includes(navigationId)
  }

  const toggleFavorite = (navigationId: string) => {
    if (isFavorite(navigationId)) {
      removeFromFavorites(navigationId)
    } else {
      addToFavorites(navigationId)
    }
  }

  const addToRecentVisits = (navigation: Navigation) => {
    // 移除重复项
    recentVisits.value = recentVisits.value.filter(item => item.id !== navigation.id)
    
    // 添加到开头
    recentVisits.value.unshift(navigation)
    
    // 限制数量
    if (recentVisits.value.length > 50) {
      recentVisits.value = recentVisits.value.slice(0, 50)
    }

    stats.value.totalVisits++
    
    addActivity({
      type: 'visit',
      target: navigation.id,
      targetTitle: navigation.title
    })

    saveRecentVisits()
    saveStats()
  }

  const addActivity = (activity: Omit<UserActivity, 'id' | 'timestamp'>) => {
    const newActivity: UserActivity = {
      ...activity,
      id: generateActivityId(),
      timestamp: Date.now()
    }

    activities.value.unshift(newActivity)
    
    // 限制活动记录数量
    if (activities.value.length > 1000) {
      activities.value = activities.value.slice(0, 1000)
    }

    saveActivities()
  }

  const generateActivityId = (): string => {
    return `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  const recordSearch = (keyword: string, resultCount: number) => {
    stats.value.totalSearches++
    
    addActivity({
      type: 'search',
      target: keyword,
      metadata: { resultCount }
    })

    saveStats()
  }

  const recordShare = (navigationId: string, platform?: string) => {
    addActivity({
      type: 'share',
      target: navigationId,
      metadata: { platform }
    })
  }

  const clearRecentVisits = () => {
    recentVisits.value = []
    saveRecentVisits()
  }

  const clearActivities = () => {
    activities.value = []
    saveActivities()
  }

  const resetStats = () => {
    stats.value = {
      totalVisits: 0,
      totalSearches: 0,
      favoriteCount: favorites.value.length,
      lastVisit: new Date().toISOString(),
      joinDate: stats.value.joinDate,
      activeTime: 0
    }
    saveStats()
  }

  const updateActiveTime = () => {
    const currentTime = Date.now()
    const sessionTime = Math.floor((currentTime - sessionStartTime.value) / 60000) // 转换为分钟
    stats.value.activeTime += sessionTime
    sessionStartTime.value = currentTime
    saveStats()
  }

  const setTheme = (theme: 'light' | 'dark' | 'auto') => {
    updatePreferences({ theme })
    applyTheme()
  }

  const applyTheme = () => {
    const html = document.documentElement
    
    if (isDarkMode.value) {
      html.classList.add('dark')
    } else {
      html.classList.remove('dark')
    }
  }

  const setLanguage = (language: 'zh-CN' | 'en-US') => {
    updatePreferences({ language })
    // 这里可以添加国际化逻辑
  }

  const exportUserData = () => {
    return {
      preferences: preferences.value,
      stats: stats.value,
      favorites: favorites.value,
      recentVisits: recentVisits.value,
      activities: activities.value,
      exportTime: new Date().toISOString()
    }
  }

  const importUserData = (data: any) => {
    try {
      if (data.preferences) {
        preferences.value = { ...preferences.value, ...data.preferences }
        savePreferences()
      }
      
      if (data.stats) {
        stats.value = { ...stats.value, ...data.stats }
        saveStats()
      }
      
      if (data.favorites) {
        favorites.value = data.favorites
        saveFavorites()
      }
      
      if (data.recentVisits) {
        recentVisits.value = data.recentVisits
        saveRecentVisits()
      }
      
      if (data.activities) {
        activities.value = data.activities
        saveActivities()
      }
      
      return true
    } catch (error) {
      console.error('Import user data error:', error)
      return false
    }
  }

  const clearAllData = () => {
    preferences.value = {
      theme: 'light',
      language: 'zh-CN',
      viewMode: 'grid',
      itemsPerPage: 20,
      enableAnimations: true,
      enableNotifications: true,
      autoSave: true,
      compactMode: false,
      showTips: true,
      defaultCategory: '',
      sortBy: 'default'
    }
    
    stats.value = {
      totalVisits: 0,
      totalSearches: 0,
      favoriteCount: 0,
      lastVisit: new Date().toISOString(),
      joinDate: new Date().toISOString(),
      activeTime: 0
    }
    
    favorites.value = []
    recentVisits.value = []
    activities.value = []
    
    saveAllData()
  }

  // 存储方法
  const saveFavorites = () => {
    userPreferences.setFavorites(favorites.value)
  }

  const saveStats = () => {
    userPreferences.setUserStats(stats.value)
  }

  const saveRecentVisits = () => {
    userPreferences.setRecentVisits(recentVisits.value)
  }

  const saveActivities = () => {
    userPreferences.setUserActivities(activities.value)
  }

  const saveAllData = () => {
    savePreferences()
    saveStats()
    saveFavorites()
    saveRecentVisits()
    saveActivities()
  }

  // 加载方法
  const loadFavorites = () => {
    const saved = userPreferences.getFavorites()
    if (saved) {
      favorites.value = saved
    }
  }

  const loadStats = () => {
    const saved = userPreferences.getUserStats()
    if (saved) {
      stats.value = { ...stats.value, ...saved }
    }
  }

  const loadRecentVisits = () => {
    const saved = userPreferences.getRecentVisits()
    if (saved) {
      recentVisits.value = saved
    }
  }

  const loadActivities = () => {
    const saved = userPreferences.getUserActivities()
    if (saved) {
      activities.value = saved
    }
  }

  const loadAllData = () => {
    loadPreferences()
    loadStats()
    loadFavorites()
    loadRecentVisits()
    loadActivities()
    
    // 检查是否是首次访问
    const hasVisited = userPreferences.get('hasVisited', false)
    if (!hasVisited) {
      isFirstVisit.value = true
      userPreferences.set('hasVisited', true)
      stats.value.joinDate = new Date().toISOString()
      saveStats()
    } else {
      isFirstVisit.value = false
    }
    
    // 更新最后访问时间
    stats.value.lastVisit = new Date().toISOString()
    saveStats()
  }

  const initializeStore = () => {
    loadAllData()
    applyTheme()
    
    // 监听系统主题变化
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      mediaQuery.addEventListener('change', () => {
        if (preferences.value.theme === 'auto') {
          applyTheme()
        }
      })
    }
    
    // 定期更新活跃时间
    setInterval(updateActiveTime, 60000) // 每分钟更新一次
    
    // 页面卸载时保存数据
    window.addEventListener('beforeunload', () => {
      updateActiveTime()
      saveAllData()
    })
  }

  // 监听偏好设置变化
  watch(() => preferences.value.theme, applyTheme)

  return {
    // 状态
    preferences,
    stats,
    favorites,
    recentVisits,
    activities,
    isFirstVisit,

    // 计算属性
    isDarkMode,
    favoriteNavigations,
    recentActivities,
    todayStats,
    weeklyStats,

    // 方法
    updatePreferences,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    toggleFavorite,
    addToRecentVisits,
    recordSearch,
    recordShare,
    clearRecentVisits,
    clearActivities,
    resetStats,
    setTheme,
    setLanguage,
    exportUserData,
    importUserData,
    clearAllData,
    initializeStore
  }
}) 
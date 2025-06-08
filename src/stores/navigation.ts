import { defineStore } from 'pinia'
import type { Navigation, NavigationFile, SearchFilters } from '@/types/navigation'
import { navigationService } from '@/services/navigation'

interface NavigationState {
  navigations: Navigation[]
  loading: boolean
  error: string | null
  currentPage: number
  pageSize: number
  total: number
  searchQuery: string
  selectedCategoryId: string | null
  filters: SearchFilters
}

export const useNavigationStore = defineStore('navigation', {
  state: (): NavigationState => ({
    navigations: [],
    loading: false,
    error: null,
    currentPage: 1,
    pageSize: 20,
    total: 0,
    searchQuery: '',
    selectedCategoryId: null,
    filters: {
      featured: false,
      tags: [],
      rating: null
    }
  }),

  getters: {
    // 获取当前页的导航项
    currentNavigations(): Navigation[] {
      const start = (this.currentPage - 1) * this.pageSize
      const end = start + this.pageSize
      return this.filteredNavigations.slice(start, end)
    },

    // 获取过滤后的导航项
    filteredNavigations(): Navigation[] {
      let result = [...this.navigations]

      // 按分类过滤
      if (this.selectedCategoryId) {
        result = result.filter(nav => nav.categoryId === this.selectedCategoryId)
      }

      // 按搜索关键词过滤
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase()
        result = result.filter(nav => 
          nav.title.toLowerCase().includes(query) ||
          nav.description.toLowerCase().includes(query) ||
          nav.tags.some(tag => tag.toLowerCase().includes(query))
        )
      }

      // 按推荐状态过滤
      if (this.filters.featured) {
        result = result.filter(nav => nav.featured)
      }

      // 按标签过滤
      if (this.filters.tags.length > 0) {
        result = result.filter(nav => 
          this.filters.tags.some(tag => nav.tags.includes(tag))
        )
      }

      // 按评分过滤
      if (this.filters.rating) {
        result = result.filter(nav => nav.rating >= this.filters.rating!)
      }

      return result
    },

    // 获取总数量
    totalCount(): number {
      return this.navigations.length
    },

    // 获取总页数
    totalPages(): number {
      return Math.ceil(this.filteredNavigations.length / this.pageSize)
    },

    // 根据ID获取导航项
    getNavigationById(): (id: string) => Navigation | undefined {
      return (id: string) => {
        return this.navigations.find(nav => nav.id === id)
      }
    },

    // 获取推荐导航
    featuredNavigations(): Navigation[] {
      return this.navigations.filter(nav => nav.featured).slice(0, 10)
    },

    // 获取热门导航
    popularNavigations(): Navigation[] {
      return [...this.navigations]
        .sort((a, b) => b.visitCount - a.visitCount)
        .slice(0, 10)
    },

    // 获取所有标签
    allTags(): string[] {
      const tags = new Set<string>()
      this.navigations.forEach(nav => {
        nav.tags.forEach(tag => tags.add(tag))
      })
      return Array.from(tags).sort()
    }
  },

  actions: {
    // 获取导航列表
    async fetchNavigations(params?: any) {
      this.loading = true
      this.error = null
      
      try {
        const data = await navigationService.getNavigations(params)
        this.navigations = data.items
        this.total = data.total
      } catch (error) {
        this.error = error instanceof Error ? error.message : '获取导航失败'
        console.error('Failed to fetch navigations:', error)
      } finally {
        this.loading = false
      }
    },

    // 搜索导航
    async searchNavigations(query: string, filters?: SearchFilters) {
      this.searchQuery = query
      if (filters) {
        this.filters = { ...this.filters, ...filters }
      }
      this.currentPage = 1
      
      // 如果需要服务端搜索，可以调用API
      // const results = await navigationService.search(query, filters)
    },

    // 设置分类过滤
    setCategoryFilter(categoryId: string | null) {
      this.selectedCategoryId = categoryId
      this.currentPage = 1
    },

    // 设置页码
    setCurrentPage(page: number) {
      this.currentPage = page
    },

    // 设置页面大小
    setPageSize(size: number) {
      this.pageSize = size
      this.currentPage = 1
    },

    // 清除搜索
    clearSearch() {
      this.searchQuery = ''
      this.filters = {
        featured: false,
        tags: [],
        rating: null
      }
      this.currentPage = 1
    },

    // 创建导航
    async createNavigation(navigationData: any) {
      try {
        const newNavigation = await navigationService.createNavigation(navigationData)
        this.navigations.unshift(newNavigation)
        this.total += 1
        return newNavigation
      } catch (error) {
        this.error = error instanceof Error ? error.message : '创建导航失败'
        throw error
      }
    },

    // 更新导航
    async updateNavigation(id: string, navigationData: any) {
      try {
        const updatedNavigation = await navigationService.updateNavigation(id, navigationData)
        const index = this.navigations.findIndex(nav => nav.id === id)
        if (index !== -1) {
          this.navigations[index] = updatedNavigation
        }
        return updatedNavigation
      } catch (error) {
        this.error = error instanceof Error ? error.message : '更新导航失败'
        throw error
      }
    },

    // 删除导航
    async deleteNavigation(id: string) {
      try {
        await navigationService.deleteNavigation(id)
        this.navigations = this.navigations.filter(nav => nav.id !== id)
        this.total -= 1
      } catch (error) {
        this.error = error instanceof Error ? error.message : '删除导航失败'
        throw error
      }
    },

    // 批量导入
    async batchImport(data: any[]) {
      try {
        const result = await navigationService.batchImport(data)
        await this.fetchNavigations()
        return result
      } catch (error) {
        this.error = error instanceof Error ? error.message : '批量导入失败'
        throw error
      }
    },

    // 增加访问次数
    incrementVisitCount(id: string) {
      const navigation = this.navigations.find(nav => nav.id === id)
      if (navigation) {
        navigation.visitCount += 1
      }
    },

    // 清除错误
    clearError() {
      this.error = null
    }
  }
}) 
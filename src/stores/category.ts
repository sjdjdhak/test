import { defineStore } from 'pinia'
import type { Category, CategoryTreeNode } from '@/types/category'
import { categoryService } from '@/services/category'

interface CategoryState {
  categories: Category[]
  loading: boolean
  error: string | null
  selectedCategoryId: string | null
}

export const useCategoryStore = defineStore('category', {
  state: (): CategoryState => ({
    categories: [],
    loading: false,
    error: null,
    selectedCategoryId: null
  }),

  getters: {
    // 获取树形结构的分类
    categoryTree(): CategoryTreeNode[] {
      return this.buildCategoryTree(this.categories)
    },

    // 获取扁平化的分类列表
    flatCategories(): Category[] {
      return this.flattenCategories(this.categories)
    },

    // 获取总分类数量
    totalCount(): number {
      return this.flatCategories.length
    },

    // 获取根分类
    rootCategories(): Category[] {
      return this.categories.filter(cat => !cat.parentId)
    },

    // 根据ID获取分类
    getCategoryById(): (id: string) => Category | undefined {
      return (id: string) => {
        return this.flatCategories.find(cat => cat.id === id)
      }
    },

    // 获取分类的子分类
    getChildCategories(): (parentId: string) => Category[] {
      return (parentId: string) => {
        return this.categories.filter(cat => cat.parentId === parentId)
      }
    },

    // 获取分类路径
    getCategoryPath(): (id: string) => Category[] {
      return (id: string) => {
        const path: Category[] = []
        let current = this.getCategoryById(id)
        
        while (current) {
          path.unshift(current)
          current = current.parentId ? this.getCategoryById(current.parentId) : undefined
        }
        
        return path
      }
    }
  },

  actions: {
    // 获取分类列表
    async fetchCategories() {
      this.loading = true
      this.error = null
      
      try {
        const data = await categoryService.getCategories()
        this.categories = data.categories
      } catch (error) {
        this.error = error instanceof Error ? error.message : '获取分类失败'
        console.error('Failed to fetch categories:', error)
      } finally {
        this.loading = false
      }
    },

    // 创建分类
    async createCategory(categoryData: any) {
      try {
        const newCategory = await categoryService.createCategory(categoryData)
        this.categories.push(newCategory)
        return newCategory
      } catch (error) {
        this.error = error instanceof Error ? error.message : '创建分类失败'
        throw error
      }
    },

    // 更新分类
    async updateCategory(id: string, categoryData: any) {
      try {
        const updatedCategory = await categoryService.updateCategory(id, categoryData)
        const index = this.categories.findIndex(cat => cat.id === id)
        if (index !== -1) {
          this.categories[index] = updatedCategory
        }
        return updatedCategory
      } catch (error) {
        this.error = error instanceof Error ? error.message : '更新分类失败'
        throw error
      }
    },

    // 删除分类
    async deleteCategory(id: string) {
      try {
        await categoryService.deleteCategory(id)
        this.categories = this.categories.filter(cat => cat.id !== id)
      } catch (error) {
        this.error = error instanceof Error ? error.message : '删除分类失败'
        throw error
      }
    },

    // 设置选中的分类
    setSelectedCategory(id: string | null) {
      this.selectedCategoryId = id
    },

    // 构建分类树
    buildCategoryTree(categories: Category[], parentId: string | null = null): CategoryTreeNode[] {
      return categories
        .filter(cat => cat.parentId === parentId)
        .sort((a, b) => a.order - b.order)
        .map(cat => ({
          ...cat,
          children: this.buildCategoryTree(categories, cat.id),
          expanded: false,
          selected: cat.id === this.selectedCategoryId,
          disabled: !cat.isActive
        }))
    },

    // 扁平化分类
    flattenCategories(categories: Category[]): Category[] {
      const result: Category[] = []
      
      const flatten = (cats: Category[]) => {
        cats.forEach(cat => {
          result.push(cat)
          if (cat.children && cat.children.length > 0) {
            flatten(cat.children)
          }
        })
      }
      
      flatten(categories)
      return result
    },

    // 清除错误
    clearError() {
      this.error = null
    }
  }
}) 
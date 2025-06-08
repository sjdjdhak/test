import type { Category, CreateCategoryDto, UpdateCategoryDto, CategoryDataFile } from '@/types/category'
import { request } from '@/utils/request'

class CategoryService {
  // 获取分类列表
  async getCategories(): Promise<CategoryDataFile> {
    try {
      // 从本地JSON文件获取分类数据
      const response = await fetch('/data/categories.json')
      if (!response.ok) {
        throw new Error('Failed to fetch categories')
      }
      return await response.json()
    } catch (error) {
      console.error('Error fetching categories:', error)
      throw error
    }
  }

  // 创建分类
  async createCategory(categoryData: CreateCategoryDto): Promise<Category> {
    // TODO: 实现通过Gitee API创建分类
    const newCategory: Category = {
      id: `cat_${Date.now()}`,
      name: categoryData.name,
      description: categoryData.description || '',
      icon: categoryData.icon || '',
      color: categoryData.color || '#1890ff',
      order: categoryData.order || 1,
      parentId: categoryData.parentId || null,
      level: 0, // 需要根据父级计算
      isActive: true,
      createTime: new Date().toISOString(),
      updateTime: new Date().toISOString(),
      children: []
    }
    
    return newCategory
  }

  // 更新分类
  async updateCategory(id: string, categoryData: UpdateCategoryDto): Promise<Category> {
    // TODO: 实现通过Gitee API更新分类
    const updatedCategory: Category = {
      id,
      name: categoryData.name || '',
      description: categoryData.description || '',
      icon: categoryData.icon || '',
      color: categoryData.color || '#1890ff',
      order: categoryData.order || 1,
      parentId: categoryData.parentId || null,
      level: 0,
      isActive: categoryData.isActive !== undefined ? categoryData.isActive : true,
      createTime: new Date().toISOString(),
      updateTime: new Date().toISOString(),
      children: []
    }
    
    return updatedCategory
  }

  // 删除分类
  async deleteCategory(id: string): Promise<void> {
    // TODO: 实现通过Gitee API删除分类
    console.log('Deleting category:', id)
  }

  // 重新排序分类
  async reorderCategories(orders: Array<{ id: string; order: number }>): Promise<void> {
    // TODO: 实现分类排序
    console.log('Reordering categories:', orders)
  }
}

export const categoryService = new CategoryService() 
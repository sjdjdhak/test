// 分类接口
export interface Category {
  id: string
  name: string
  description?: string
  icon?: string
  color?: string
  order: number
  parentId: string | null
  level: number
  isActive: boolean
  createTime: string
  updateTime: string
  children?: Category[]
}

// 创建分类DTO
export interface CreateCategoryDto {
  name: string
  description?: string
  icon?: string
  color?: string
  parentId?: string | null
  order?: number
}

// 更新分类DTO
export interface UpdateCategoryDto {
  name?: string
  description?: string
  icon?: string
  color?: string
  parentId?: string | null
  order?: number
  isActive?: boolean
}

// 分类排序
export interface CategoryOrder {
  id: string
  order: number
  parentId?: string | null
}

// 分类树节点
export interface CategoryTreeNode extends Category {
  children: CategoryTreeNode[]
  expanded?: boolean
  selected?: boolean
  disabled?: boolean
}

// 分类统计
export interface CategoryStats {
  id: string
  name: string
  navigationCount: number
  childrenCount: number
  level: number
}

// 分类数据文件结构
export interface CategoryDataFile {
  version: string
  lastUpdate: string
  categories: Category[]
} 
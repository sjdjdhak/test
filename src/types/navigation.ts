// 导航项接口
export interface Navigation {
  id: string
  title: string
  description: string
  url: string
  icon?: string
  categoryId: string
  tags: string[]
  featured: boolean
  isActive: boolean
  visitCount: number
  rating: number
  createTime: string
  updateTime: string
}

export interface NavigationFile {
  version: string
  fileIndex: number
  totalFiles: number
  lastUpdate: string
  items: Navigation[]
  meta: {
    totalItems: number
    activeItems: number
    categories: string[]
    checksum: string
  }
}

export interface SearchFilters {
  featured: boolean
  tags: string[]
  rating: number | null
}

export interface CreateNavigationDto {
  title: string
  description: string
  url: string
  icon?: string
  categoryId: string
  tags?: string[]
  featured?: boolean
}

export interface UpdateNavigationDto {
  title?: string
  description?: string
  url?: string
  icon?: string
  categoryId?: string
  tags?: string[]
  featured?: boolean
  isActive?: boolean
}

// 创建导航DTO
export interface CreateNavigationDto {
  title: string
  description: string
  url: string
  icon?: string
  categoryId: string
  tags?: string[]
  featured?: boolean
}

// 更新导航DTO
export interface UpdateNavigationDto {
  title?: string
  description?: string
  url?: string
  icon?: string
  categoryId?: string
  tags?: string[]
  featured?: boolean
  isActive?: boolean
}

// 导航查询参数
export interface GetNavigationParams {
  categoryId?: string
  featured?: boolean
  isActive?: boolean
  keyword?: string
  tags?: string[]
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// 导航响应
export interface NavigationResponse {
  items: Navigation[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// 导航数据文件结构
export interface NavigationDataFile {
  version: string
  fileIndex: number
  totalFiles: number
  lastUpdate: string
  items: Navigation[]
  meta: {
    totalItems: number
    activeItems: number
    categories: string[]
    checksum: string
  }
}

// 导航卡片显示数据
export interface NavigationCard extends Navigation {
  categoryName?: string
  categoryColor?: string
}

// 批量导入数据
export interface ImportData {
  title: string
  description: string
  url: string
  categoryName: string
  tags?: string
  icon?: string
}

// 导入结果
export interface ImportResult {
  success: number
  failed: number
  total: number
  errors: Array<{
    row: number
    error: string
    data: ImportData
  }>
}

// 搜索结果
export interface SearchResult {
  items: NavigationCard[]
  total: number
  keyword: string
  categories: Array<{
    id: string
    name: string
    count: number
  }>
  tags: Array<{
    name: string
    count: number
  }>
}

// URL验证结果
export interface UrlValidationResult {
  url: string
  valid: boolean
  status?: number
  title?: string
  icon?: string
  error?: string
} 
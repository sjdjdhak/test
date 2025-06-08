// 通用响应类型
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
  success: boolean
}

// 分页参数
export interface PaginationParams {
  page: number
  pageSize: number
  total?: number
}

// 分页响应
export interface PaginationResponse<T = any> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// 搜索参数
export interface SearchParams {
  keyword: string
  categoryId?: string
  tags?: string[]
  featured?: boolean
}

// 排序参数
export interface SortParams {
  field: string
  order: 'asc' | 'desc'
}

// 文件信息
export interface FileInfo {
  name: string
  path: string
  size: number
  sha: string
  content?: string
  encoding?: string
}

// 操作结果
export interface OperationResult {
  success: boolean
  message: string
  data?: any
}

// 主题类型
export type ThemeType = 'light' | 'dark' | 'auto'

// 语言类型
export type LanguageType = 'zh-CN' | 'en-US'

// 加载状态
export interface LoadingState {
  loading: boolean
  error: string | null
  data: any
} 
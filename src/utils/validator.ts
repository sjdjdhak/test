/**
 * 数据验证工具
 * 提供分类和导航数据的验证功能
 */

import type { Category, CategoryDataFile } from '@/types/category'
import type { Navigation, NavigationFile } from '@/types/navigation'

// 验证结果接口
export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

export interface ValidationError {
  type: 'error'
  field: string
  message: string
  value?: any
}

export interface ValidationWarning {
  type: 'warning'
  field: string
  message: string
  value?: any
}

// 验证规则配置
export interface ValidationConfig {
  strict?: boolean // 严格模式
  allowEmpty?: boolean // 允许空值
  maxLength?: Record<string, number> // 字段最大长度
  required?: string[] // 必填字段
}

/**
 * 基础验证器类
 */
class BaseValidator {
  protected config: ValidationConfig
  protected errors: ValidationError[] = []
  protected warnings: ValidationWarning[] = []

  constructor(config: ValidationConfig = {}) {
    this.config = {
      strict: false,
      allowEmpty: false,
      maxLength: {},
      required: [],
      ...config
    }
  }

  protected addError(field: string, message: string, value?: any) {
    this.errors.push({ type: 'error', field, message, value })
  }

  protected addWarning(field: string, message: string, value?: any) {
    this.warnings.push({ type: 'warning', field, message, value })
  }

  protected validateRequired(obj: any, field: string): boolean {
    if (this.config.required?.includes(field)) {
      if (obj[field] === undefined || obj[field] === null || obj[field] === '') {
        this.addError(field, `${field} 是必填字段`)
        return false
      }
    }
    return true
  }

  protected validateString(value: any, field: string, maxLength?: number): boolean {
    if (value !== undefined && value !== null) {
      if (typeof value !== 'string') {
        this.addError(field, `${field} 必须是字符串类型`)
        return false
      }
      
      if (maxLength && value.length > maxLength) {
        this.addError(field, `${field} 长度不能超过 ${maxLength} 个字符`)
        return false
      }
      
      if (!this.config.allowEmpty && value.trim() === '') {
        this.addError(field, `${field} 不能为空`)
        return false
      }
    }
    return true
  }

  protected validateNumber(value: any, field: string, min?: number, max?: number): boolean {
    if (value !== undefined && value !== null) {
      if (typeof value !== 'number' || isNaN(value)) {
        this.addError(field, `${field} 必须是有效的数字`)
        return false
      }
      
      if (min !== undefined && value < min) {
        this.addError(field, `${field} 不能小于 ${min}`)
        return false
      }
      
      if (max !== undefined && value > max) {
        this.addError(field, `${field} 不能大于 ${max}`)
        return false
      }
    }
    return true
  }

  protected validateBoolean(value: any, field: string): boolean {
    if (value !== undefined && value !== null) {
      if (typeof value !== 'boolean') {
        this.addError(field, `${field} 必须是布尔类型`)
        return false
      }
    }
    return true
  }

  protected validateArray(value: any, field: string, itemValidator?: (item: any, index: number) => boolean): boolean {
    if (value !== undefined && value !== null) {
      if (!Array.isArray(value)) {
        this.addError(field, `${field} 必须是数组类型`)
        return false
      }
      
      if (itemValidator) {
        value.forEach((item, index) => {
          itemValidator(item, index)
        })
      }
    }
    return true
  }

  protected validateUrl(value: any, field: string): boolean {
    if (value !== undefined && value !== null && value !== '') {
      try {
        new URL(value)
      } catch {
        this.addError(field, `${field} 必须是有效的URL格式`)
        return false
      }
    }
    return true
  }

  protected validateEmail(value: any, field: string): boolean {
    if (value !== undefined && value !== null && value !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(value)) {
        this.addError(field, `${field} 必须是有效的邮箱格式`)
        return false
      }
    }
    return true
  }

  protected validateDate(value: any, field: string): boolean {
    if (value !== undefined && value !== null && value !== '') {
      const date = new Date(value)
      if (isNaN(date.getTime())) {
        this.addError(field, `${field} 必须是有效的日期格式`)
        return false
      }
    }
    return true
  }

  protected validateColor(value: any, field: string): boolean {
    if (value !== undefined && value !== null && value !== '') {
      const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
      if (!colorRegex.test(value)) {
        this.addError(field, `${field} 必须是有效的颜色格式 (如: #ffffff)`)
        return false
      }
    }
    return true
  }

  protected reset() {
    this.errors = []
    this.warnings = []
  }

  protected getResult(): ValidationResult {
    return {
      isValid: this.errors.length === 0,
      errors: [...this.errors],
      warnings: [...this.warnings]
    }
  }
}

/**
 * 分类数据验证器
 */
export class CategoryValidator extends BaseValidator {
  constructor(config: ValidationConfig = {}) {
    super({
      required: ['id', 'name'],
      maxLength: {
        name: 50,
        description: 200,
        icon: 50
      },
      ...config
    })
  }

  /**
   * 验证单个分类
   */
  validateCategory(category: Partial<Category>): ValidationResult {
    this.reset()

    // 验证必填字段
    this.validateRequired(category, 'id')
    this.validateRequired(category, 'name')

    // 验证字段类型和格式
    this.validateString(category.id, 'id', 50)
    this.validateString(category.name, 'name', this.config.maxLength?.name)
    this.validateString(category.description, 'description', this.config.maxLength?.description)
    this.validateString(category.icon, 'icon', this.config.maxLength?.icon)
    this.validateString(category.parentId, 'parentId', 50)
    this.validateColor(category.color, 'color')
    this.validateNumber(category.order, 'order', 0, 999)
    this.validateNumber(category.level, 'level', 0, 10)
    this.validateBoolean(category.isActive, 'isActive')
    this.validateDate(category.createTime, 'createTime')
    this.validateDate(category.updateTime, 'updateTime')

    // 验证子分类
    if (category.children) {
      this.validateArray(category.children, 'children', (child, index) => {
        const childResult = this.validateCategory(child)
        childResult.errors.forEach(error => {
          this.addError(`children[${index}].${error.field}`, error.message, error.value)
        })
        childResult.warnings.forEach(warning => {
          this.addWarning(`children[${index}].${warning.field}`, warning.message, warning.value)
        })
        return childResult.isValid
      })
    }

    // 业务逻辑验证
    this.validateCategoryBusinessRules(category)

    return this.getResult()
  }

  /**
   * 验证分类数据文件
   */
  validateCategoryFile(file: Partial<CategoryDataFile>): ValidationResult {
    this.reset()

    // 验证文件结构
    this.validateRequired(file, 'version')
    this.validateRequired(file, 'lastUpdate')
    this.validateRequired(file, 'categories')

    this.validateString(file.version, 'version', 20)
    this.validateDate(file.lastUpdate, 'lastUpdate')

    // 验证分类数组
    if (file.categories) {
      this.validateArray(file.categories, 'categories', (category, index) => {
        const categoryResult = this.validateCategory(category)
        categoryResult.errors.forEach(error => {
          this.addError(`categories[${index}].${error.field}`, error.message, error.value)
        })
        categoryResult.warnings.forEach(warning => {
          this.addWarning(`categories[${index}].${warning.field}`, warning.message, warning.value)
        })
        return categoryResult.isValid
      })
    }

    return this.getResult()
  }

  /**
   * 验证分类业务规则
   */
  private validateCategoryBusinessRules(category: Partial<Category>) {
    // 检查ID格式
    if (category.id && !/^cat_\d+$/.test(category.id)) {
      this.addWarning('id', 'ID建议使用 cat_xxx 格式')
    }

    // 检查层级关系
    if (category.parentId && category.level !== undefined) {
      if (category.level === 0 && category.parentId) {
        this.addError('level', '顶级分类的level应该为0，且不应该有parentId')
      }
      if (category.level > 0 && !category.parentId) {
        this.addError('parentId', '子分类必须有parentId')
      }
    }

    // 检查颜色值
    if (category.color && category.color === '#000000') {
      this.addWarning('color', '不建议使用纯黑色作为分类颜色')
    }

    // 检查排序值
    if (category.order !== undefined && category.order === 0) {
      this.addWarning('order', '排序值为0可能导致显示顺序不明确')
    }
  }
}

/**
 * 导航数据验证器
 */
export class NavigationValidator extends BaseValidator {
  constructor(config: ValidationConfig = {}) {
    super({
      required: ['id', 'title', 'url', 'categoryId'],
      maxLength: {
        title: 100,
        description: 500,
        url: 2000,
        icon: 500
      },
      ...config
    })
  }

  /**
   * 验证单个导航
   */
  validateNavigation(navigation: Partial<Navigation>): ValidationResult {
    this.reset()

    // 验证必填字段
    this.validateRequired(navigation, 'id')
    this.validateRequired(navigation, 'title')
    this.validateRequired(navigation, 'url')
    this.validateRequired(navigation, 'categoryId')

    // 验证字段类型和格式
    this.validateString(navigation.id, 'id', 50)
    this.validateString(navigation.title, 'title', this.config.maxLength?.title)
    this.validateString(navigation.description, 'description', this.config.maxLength?.description)
    this.validateUrl(navigation.url, 'url')
    this.validateUrl(navigation.icon, 'icon')
    this.validateString(navigation.categoryId, 'categoryId', 50)
    this.validateBoolean(navigation.featured, 'featured')
    this.validateBoolean(navigation.isActive, 'isActive')
    this.validateNumber(navigation.visitCount, 'visitCount', 0)
    this.validateNumber(navigation.rating, 'rating', 0, 5)
    this.validateDate(navigation.createTime, 'createTime')
    this.validateDate(navigation.updateTime, 'updateTime')

    // 验证标签数组
    if (navigation.tags) {
      this.validateArray(navigation.tags, 'tags', (tag, index) => {
        if (typeof tag !== 'string') {
          this.addError(`tags[${index}]`, '标签必须是字符串类型')
          return false
        }
        if (tag.length > 20) {
          this.addError(`tags[${index}]`, '标签长度不能超过20个字符')
          return false
        }
        return true
      })
    }

    // 业务逻辑验证
    this.validateNavigationBusinessRules(navigation)

    return this.getResult()
  }

  /**
   * 验证导航数据文件
   */
  validateNavigationFile(file: Partial<NavigationFile>): ValidationResult {
    this.reset()

    // 验证文件结构
    this.validateRequired(file, 'version')
    this.validateRequired(file, 'fileIndex')
    this.validateRequired(file, 'totalFiles')
    this.validateRequired(file, 'lastUpdate')
    this.validateRequired(file, 'items')

    this.validateString(file.version, 'version', 20)
    this.validateNumber(file.fileIndex, 'fileIndex', 1)
    this.validateNumber(file.totalFiles, 'totalFiles', 1)
    this.validateDate(file.lastUpdate, 'lastUpdate')

    // 验证导航数组
    if (file.items) {
      this.validateArray(file.items, 'items', (navigation, index) => {
        const navResult = this.validateNavigation(navigation)
        navResult.errors.forEach(error => {
          this.addError(`items[${index}].${error.field}`, error.message, error.value)
        })
        navResult.warnings.forEach(warning => {
          this.addWarning(`items[${index}].${warning.field}`, warning.message, warning.value)
        })
        return navResult.isValid
      })
    }

    // 验证元数据
    if (file.meta) {
      this.validateNumber(file.meta.totalItems, 'meta.totalItems', 0)
      this.validateNumber(file.meta.activeItems, 'meta.activeItems', 0)
      this.validateArray(file.meta.categories, 'meta.categories')
      this.validateString(file.meta.checksum, 'meta.checksum')
    }

    return this.getResult()
  }

  /**
   * 验证导航业务规则
   */
  private validateNavigationBusinessRules(navigation: Partial<Navigation>) {
    // 检查ID格式
    if (navigation.id && !/^nav_\d+$/.test(navigation.id)) {
      this.addWarning('id', 'ID建议使用 nav_xxx 格式')
    }

    // 检查URL协议
    if (navigation.url) {
      if (!navigation.url.startsWith('http://') && !navigation.url.startsWith('https://')) {
        this.addWarning('url', '建议使用 https:// 协议')
      }
    }

    // 检查评分范围
    if (navigation.rating !== undefined) {
      if (navigation.rating < 0 || navigation.rating > 5) {
        this.addError('rating', '评分必须在0-5之间')
      }
    }

    // 检查访问次数
    if (navigation.visitCount !== undefined && navigation.visitCount < 0) {
      this.addError('visitCount', '访问次数不能为负数')
    }

    // 检查标签数量
    if (navigation.tags && navigation.tags.length > 10) {
      this.addWarning('tags', '标签数量过多，建议不超过10个')
    }

    // 检查描述长度
    if (navigation.description && navigation.description.length < 10) {
      this.addWarning('description', '描述过短，建议至少10个字符')
    }
  }
}

/**
 * 数据完整性验证器
 */
export class DataIntegrityValidator {
  private categoryValidator = new CategoryValidator()
  private navigationValidator = new NavigationValidator()

  /**
   * 验证数据完整性
   */
  validateDataIntegrity(categories: Category[], navigations: Navigation[]): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    // 验证分类引用完整性
    const categoryIds = new Set(this.getAllCategoryIds(categories))
    
    navigations.forEach((nav, index) => {
      if (!categoryIds.has(nav.categoryId)) {
        errors.push({
          type: 'error',
          field: `navigations[${index}].categoryId`,
          message: `引用的分类ID "${nav.categoryId}" 不存在`,
          value: nav.categoryId
        })
      }
    })

    // 验证分类层级关系
    categories.forEach((category, index) => {
      if (category.parentId && !categoryIds.has(category.parentId)) {
        errors.push({
          type: 'error',
          field: `categories[${index}].parentId`,
          message: `引用的父分类ID "${category.parentId}" 不存在`,
          value: category.parentId
        })
      }
    })

    // 检查重复ID
    this.checkDuplicateIds(categories, 'categories', errors)
    this.checkDuplicateIds(navigations, 'navigations', errors)

    // 检查循环引用
    this.checkCircularReferences(categories, errors)

    // 检查孤儿分类
    this.checkOrphanCategories(categories, navigations, warnings)

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  private getAllCategoryIds(categories: Category[]): string[] {
    const ids: string[] = []
    
    const collectIds = (cats: Category[]) => {
      cats.forEach(cat => {
        ids.push(cat.id)
        if (cat.children) {
          collectIds(cat.children)
        }
      })
    }
    
    collectIds(categories)
    return ids
  }

  private checkDuplicateIds(items: { id: string }[], type: string, errors: ValidationError[]) {
    const idCounts = new Map<string, number>()
    
    items.forEach(item => {
      const count = idCounts.get(item.id) || 0
      idCounts.set(item.id, count + 1)
    })
    
    idCounts.forEach((count, id) => {
      if (count > 1) {
        errors.push({
          type: 'error',
          field: `${type}.id`,
          message: `发现重复的ID "${id}"，出现 ${count} 次`,
          value: id
        })
      }
    })
  }

  private checkCircularReferences(categories: Category[], errors: ValidationError[]) {
    const visited = new Set<string>()
    const recursionStack = new Set<string>()
    
    const dfs = (categoryId: string, path: string[]): boolean => {
      if (recursionStack.has(categoryId)) {
        errors.push({
          type: 'error',
          field: 'categories.parentId',
          message: `检测到循环引用: ${path.join(' -> ')} -> ${categoryId}`,
          value: categoryId
        })
        return true
      }
      
      if (visited.has(categoryId)) {
        return false
      }
      
      visited.add(categoryId)
      recursionStack.add(categoryId)
      
      const category = categories.find(cat => cat.id === categoryId)
      if (category?.parentId) {
        if (dfs(category.parentId, [...path, categoryId])) {
          return true
        }
      }
      
      recursionStack.delete(categoryId)
      return false
    }
    
    categories.forEach(category => {
      if (!visited.has(category.id)) {
        dfs(category.id, [])
      }
    })
  }

  private checkOrphanCategories(categories: Category[], navigations: Navigation[], warnings: ValidationWarning[]) {
    const categoryIds = this.getAllCategoryIds(categories)
    const usedCategoryIds = new Set(navigations.map(nav => nav.categoryId))
    
    categoryIds.forEach(categoryId => {
      if (!usedCategoryIds.has(categoryId)) {
        const category = categories.find(cat => cat.id === categoryId)
        if (category && (!category.children || category.children.length === 0)) {
          warnings.push({
            type: 'warning',
            field: 'categories',
            message: `分类 "${category.name}" (${categoryId}) 没有关联的导航项目`,
            value: categoryId
          })
        }
      }
    })
  }
}

// 导出验证器实例
export const categoryValidator = new CategoryValidator()
export const navigationValidator = new NavigationValidator()
export const dataIntegrityValidator = new DataIntegrityValidator()

// 工具函数
export const validatorUtils = {
  /**
   * 批量验证分类
   */
  validateCategories(categories: Category[]): ValidationResult {
    const allErrors: ValidationError[] = []
    const allWarnings: ValidationWarning[] = []
    
    categories.forEach((category, index) => {
      const result = categoryValidator.validateCategory(category)
      result.errors.forEach(error => {
        allErrors.push({
          ...error,
          field: `categories[${index}].${error.field}`
        })
      })
      result.warnings.forEach(warning => {
        allWarnings.push({
          ...warning,
          field: `categories[${index}].${warning.field}`
        })
      })
    })
    
    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings
    }
  },

  /**
   * 批量验证导航
   */
  validateNavigations(navigations: Navigation[]): ValidationResult {
    const allErrors: ValidationError[] = []
    const allWarnings: ValidationWarning[] = []
    
    navigations.forEach((navigation, index) => {
      const result = navigationValidator.validateNavigation(navigation)
      result.errors.forEach(error => {
        allErrors.push({
          ...error,
          field: `navigations[${index}].${error.field}`
        })
      })
      result.warnings.forEach(warning => {
        allWarnings.push({
          ...warning,
          field: `navigations[${index}].${warning.field}`
        })
      })
    })
    
    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings
    }
  },

  /**
   * 格式化验证结果
   */
  formatValidationResult(result: ValidationResult): string {
    const lines: string[] = []
    
    if (result.isValid) {
      lines.push('✅ 验证通过')
    } else {
      lines.push('❌ 验证失败')
    }
    
    if (result.errors.length > 0) {
      lines.push('\n错误:')
      result.errors.forEach(error => {
        lines.push(`  • ${error.field}: ${error.message}`)
      })
    }
    
    if (result.warnings.length > 0) {
      lines.push('\n警告:')
      result.warnings.forEach(warning => {
        lines.push(`  • ${warning.field}: ${warning.message}`)
      })
    }
    
    return lines.join('\n')
  }
} 
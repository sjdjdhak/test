/**
 * 通用帮助工具函数
 * 提供日期格式化、文本处理、URL处理等常用功能
 */

/**
 * 日期时间工具
 */
export const dateUtils = {
  /**
   * 格式化日期
   */
  format(date: Date | string | number, format = 'YYYY-MM-DD HH:mm:ss'): string {
    const d = new Date(date)
    if (isNaN(d.getTime())) {
      return '无效日期'
    }

    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    const seconds = String(d.getSeconds()).padStart(2, '0')

    return format
      .replace('YYYY', String(year))
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds)
  },

  /**
   * 相对时间
   */
  relative(date: Date | string | number): string {
    const d = new Date(date)
    const now = new Date()
    const diff = now.getTime() - d.getTime()

    const minute = 60 * 1000
    const hour = 60 * minute
    const day = 24 * hour
    const week = 7 * day
    const month = 30 * day
    const year = 365 * day

    if (diff < minute) {
      return '刚刚'
    } else if (diff < hour) {
      return `${Math.floor(diff / minute)}分钟前`
    } else if (diff < day) {
      return `${Math.floor(diff / hour)}小时前`
    } else if (diff < week) {
      return `${Math.floor(diff / day)}天前`
    } else if (diff < month) {
      return `${Math.floor(diff / week)}周前`
    } else if (diff < year) {
      return `${Math.floor(diff / month)}个月前`
    } else {
      return `${Math.floor(diff / year)}年前`
    }
  },

  /**
   * 获取今天的开始和结束时间
   */
  getToday(): { start: Date; end: Date } {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
    return { start, end }
  },

  /**
   * 获取本周的开始和结束时间
   */
  getThisWeek(): { start: Date; end: Date } {
    const now = new Date()
    const day = now.getDay()
    const diff = now.getDate() - day + (day === 0 ? -6 : 1) // 周一为第一天
    const start = new Date(now.setDate(diff))
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    end.setHours(23, 59, 59, 999)
    return { start, end }
  },

  /**
   * 获取本月的开始和结束时间
   */
  getThisMonth(): { start: Date; end: Date } {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
    return { start, end }
  }
}

/**
 * 文本处理工具
 */
export const textUtils = {
  /**
   * 截断文本
   */
  truncate(text: string, length: number, suffix = '...'): string {
    if (text.length <= length) {
      return text
    }
    return text.slice(0, length - suffix.length) + suffix
  },

  /**
   * 首字母大写
   */
  capitalize(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
  },

  /**
   * 驼峰转换
   */
  camelCase(text: string): string {
    return text
      .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
        return index === 0 ? word.toLowerCase() : word.toUpperCase()
      })
      .replace(/\s+/g, '')
  },

  /**
   * 短横线转换
   */
  kebabCase(text: string): string {
    return text
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/\s+/g, '-')
      .toLowerCase()
  },

  /**
   * 移除HTML标签
   */
  stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '')
  },

  /**
   * 高亮搜索关键词
   */
  highlight(text: string, keyword: string, className = 'highlight'): string {
    if (!keyword) return text
    const regex = new RegExp(`(${keyword})`, 'gi')
    return text.replace(regex, `<span class="${className}">$1</span>`)
  },

  /**
   * 生成随机字符串
   */
  randomString(length = 8): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  },

  /**
   * 生成唯一ID
   */
  generateId(prefix = ''): string {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substr(2, 5)
    return `${prefix}${timestamp}${random}`
  },

  /**
   * 计算文本相似度
   */
  similarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2
    const shorter = str1.length > str2.length ? str2 : str1
    
    if (longer.length === 0) {
      return 1.0
    }
    
    const editDistance = this.levenshteinDistance(longer, shorter)
    return (longer.length - editDistance) / longer.length
  },

  /**
   * 计算编辑距离
   */
  levenshteinDistance(str1: string, str2: string): number {
    const matrix = []
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i]
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          )
        }
      }
    }
    
    return matrix[str2.length][str1.length]
  }
}

/**
 * URL处理工具
 */
export const urlUtils = {
  /**
   * 解析URL
   */
  parse(url: string): URL | null {
    try {
      return new URL(url)
    } catch {
      return null
    }
  },

  /**
   * 获取域名
   */
  getDomain(url: string): string {
    const parsed = this.parse(url)
    return parsed ? parsed.hostname : ''
  },

  /**
   * 获取网站图标URL
   */
  getFaviconUrl(url: string): string {
    const domain = this.getDomain(url)
    return domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=32` : ''
  },

  /**
   * 验证URL格式
   */
  isValid(url: string): boolean {
    return this.parse(url) !== null
  },

  /**
   * 添加协议
   */
  addProtocol(url: string, protocol = 'https'): string {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url
    }
    return `${protocol}://${url}`
  },

  /**
   * 移除协议
   */
  removeProtocol(url: string): string {
    return url.replace(/^https?:\/\//, '')
  },

  /**
   * 获取查询参数
   */
  getQueryParams(url: string): Record<string, string> {
    const parsed = this.parse(url)
    if (!parsed) return {}
    
    const params: Record<string, string> = {}
    parsed.searchParams.forEach((value, key) => {
      params[key] = value
    })
    return params
  },

  /**
   * 构建查询字符串
   */
  buildQueryString(params: Record<string, any>): string {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value))
      }
    })
    return searchParams.toString()
  }
}

/**
 * 数组处理工具
 */
export const arrayUtils = {
  /**
   * 数组去重
   */
  unique<T>(array: T[]): T[] {
    return [...new Set(array)]
  },

  /**
   * 根据属性去重
   */
  uniqueBy<T>(array: T[], key: keyof T): T[] {
    const seen = new Set()
    return array.filter(item => {
      const value = item[key]
      if (seen.has(value)) {
        return false
      }
      seen.add(value)
      return true
    })
  },

  /**
   * 数组分组
   */
  groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
    return array.reduce((groups, item) => {
      const group = String(item[key])
      if (!groups[group]) {
        groups[group] = []
      }
      groups[group].push(item)
      return groups
    }, {} as Record<string, T[]>)
  },

  /**
   * 数组分块
   */
  chunk<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size))
    }
    return chunks
  },

  /**
   * 数组随机排序
   */
  shuffle<T>(array: T[]): T[] {
    const result = [...array]
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[result[i], result[j]] = [result[j], result[i]]
    }
    return result
  },

  /**
   * 数组求交集
   */
  intersection<T>(array1: T[], array2: T[]): T[] {
    return array1.filter(item => array2.includes(item))
  },

  /**
   * 数组求差集
   */
  difference<T>(array1: T[], array2: T[]): T[] {
    return array1.filter(item => !array2.includes(item))
  }
}

/**
 * 对象处理工具
 */
export const objectUtils = {
  /**
   * 深拷贝
   */
  deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
      return obj
    }
    
    if (obj instanceof Date) {
      return new Date(obj.getTime()) as unknown as T
    }
    
    if (obj instanceof Array) {
      return obj.map(item => this.deepClone(item)) as unknown as T
    }
    
    if (typeof obj === 'object') {
      const cloned = {} as T
      Object.keys(obj).forEach(key => {
        cloned[key as keyof T] = this.deepClone((obj as any)[key])
      })
      return cloned
    }
    
    return obj
  },

  /**
   * 深度合并
   */
  deepMerge<T>(target: T, ...sources: Partial<T>[]): T {
    if (!sources.length) return target
    const source = sources.shift()
    
    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach(key => {
        if (this.isObject(source[key])) {
          if (!target[key as keyof T]) {
            Object.assign(target, { [key]: {} })
          }
          this.deepMerge(target[key as keyof T], source[key])
        } else {
          Object.assign(target, { [key]: source[key] })
        }
      })
    }
    
    return this.deepMerge(target, ...sources)
  },

  /**
   * 判断是否为对象
   */
  isObject(item: any): boolean {
    return item && typeof item === 'object' && !Array.isArray(item)
  },

  /**
   * 获取嵌套属性值
   */
  get(obj: any, path: string, defaultValue?: any): any {
    const keys = path.split('.')
    let result = obj
    
    for (const key of keys) {
      if (result === null || result === undefined) {
        return defaultValue
      }
      result = result[key]
    }
    
    return result !== undefined ? result : defaultValue
  },

  /**
   * 设置嵌套属性值
   */
  set(obj: any, path: string, value: any): void {
    const keys = path.split('.')
    const lastKey = keys.pop()!
    let current = obj
    
    for (const key of keys) {
      if (!(key in current) || !this.isObject(current[key])) {
        current[key] = {}
      }
      current = current[key]
    }
    
    current[lastKey] = value
  },

  /**
   * 删除空属性
   */
  removeEmpty(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map(item => this.removeEmpty(item)).filter(item => item !== null && item !== undefined)
    }
    
    if (this.isObject(obj)) {
      const cleaned: any = {}
      Object.keys(obj).forEach(key => {
        const value = this.removeEmpty(obj[key])
        if (value !== null && value !== undefined && value !== '' && 
            !(Array.isArray(value) && value.length === 0) &&
            !(this.isObject(value) && Object.keys(value).length === 0)) {
          cleaned[key] = value
        }
      })
      return cleaned
    }
    
    return obj
  }
}

/**
 * 数字处理工具
 */
export const numberUtils = {
  /**
   * 格式化数字
   */
  format(num: number, decimals = 0): string {
    return num.toLocaleString('zh-CN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    })
  },

  /**
   * 格式化文件大小
   */
  formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    let size = bytes
    let unitIndex = 0
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }
    
    return `${size.toFixed(2)} ${units[unitIndex]}`
  },

  /**
   * 生成随机数
   */
  random(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min
  },

  /**
   * 限制数字范围
   */
  clamp(num: number, min: number, max: number): number {
    return Math.min(Math.max(num, min), max)
  },

  /**
   * 四舍五入到指定小数位
   */
  round(num: number, decimals = 0): number {
    const factor = Math.pow(10, decimals)
    return Math.round(num * factor) / factor
  }
}

/**
 * 颜色处理工具
 */
export const colorUtils = {
  /**
   * 十六进制转RGB
   */
  hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null
  },

  /**
   * RGB转十六进制
   */
  rgbToHex(r: number, g: number, b: number): string {
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
  },

  /**
   * 生成随机颜色
   */
  random(): string {
    return `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`
  },

  /**
   * 计算颜色亮度
   */
  getBrightness(hex: string): number {
    const rgb = this.hexToRgb(hex)
    if (!rgb) return 0
    return (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000
  },

  /**
   * 判断是否为深色
   */
  isDark(hex: string): boolean {
    return this.getBrightness(hex) < 128
  }
}

/**
 * 防抖和节流工具
 */
export const throttleUtils = {
  /**
   * 防抖
   */
  debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number,
    immediate = false
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null
    
    return function executedFunction(...args: Parameters<T>) {
      const later = () => {
        timeout = null
        if (!immediate) func(...args)
      }
      
      const callNow = immediate && !timeout
      
      if (timeout) clearTimeout(timeout)
      timeout = setTimeout(later, wait)
      
      if (callNow) func(...args)
    }
  },

  /**
   * 节流
   */
  throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean
    
    return function executedFunction(...args: Parameters<T>) {
      if (!inThrottle) {
        func(...args)
        inThrottle = true
        setTimeout(() => inThrottle = false, limit)
      }
    }
  }
}

/**
 * 浏览器检测工具
 */
export const browserUtils = {
  /**
   * 获取浏览器信息
   */
  getBrowserInfo(): { name: string; version: string } {
    const ua = navigator.userAgent
    let name = 'Unknown'
    let version = 'Unknown'
    
    if (ua.includes('Chrome')) {
      name = 'Chrome'
      version = ua.match(/Chrome\/(\d+)/)?.[1] || 'Unknown'
    } else if (ua.includes('Firefox')) {
      name = 'Firefox'
      version = ua.match(/Firefox\/(\d+)/)?.[1] || 'Unknown'
    } else if (ua.includes('Safari')) {
      name = 'Safari'
      version = ua.match(/Version\/(\d+)/)?.[1] || 'Unknown'
    } else if (ua.includes('Edge')) {
      name = 'Edge'
      version = ua.match(/Edge\/(\d+)/)?.[1] || 'Unknown'
    }
    
    return { name, version }
  },

  /**
   * 检查是否为移动设备
   */
  isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  },

  /**
   * 检查是否支持某个特性
   */
  supports(feature: string): boolean {
    switch (feature) {
      case 'localStorage':
        try {
          localStorage.setItem('test', 'test')
          localStorage.removeItem('test')
          return true
        } catch {
          return false
        }
      case 'sessionStorage':
        try {
          sessionStorage.setItem('test', 'test')
          sessionStorage.removeItem('test')
          return true
        } catch {
          return false
        }
      case 'webp':
        return new Promise<boolean>(resolve => {
          const webP = new Image()
          webP.onload = webP.onerror = () => resolve(webP.height === 2)
          webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA'
        })
      default:
        return false
    }
  }
}

// 导出所有工具
export default {
  dateUtils,
  textUtils,
  urlUtils,
  arrayUtils,
  objectUtils,
  numberUtils,
  colorUtils,
  throttleUtils,
  browserUtils
} 
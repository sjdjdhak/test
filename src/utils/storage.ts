/**
 * 本地存储工具类
 * 提供统一的本地存储管理，支持过期时间、数据压缩等功能
 */

interface StorageItem<T = any> {
  value: T
  timestamp: number
  expires?: number
}

interface StorageOptions {
  expires?: number // 过期时间（毫秒）
  compress?: boolean // 是否压缩
  encrypt?: boolean // 是否加密
}

class StorageManager {
  private prefix: string
  private storage: Storage

  constructor(prefix = 'ai_nav_', useSessionStorage = false) {
    this.prefix = prefix
    this.storage = useSessionStorage ? window.sessionStorage : window.localStorage
  }

  /**
   * 设置存储项
   */
  set<T>(key: string, value: T, options: StorageOptions = {}): boolean {
    try {
      const item: StorageItem<T> = {
        value,
        timestamp: Date.now(),
        expires: options.expires ? Date.now() + options.expires : undefined
      }

      let serializedValue = JSON.stringify(item)

      // 数据压缩（简单实现）
      if (options.compress) {
        serializedValue = this.compress(serializedValue)
      }

      // 数据加密（简单实现）
      if (options.encrypt) {
        serializedValue = this.encrypt(serializedValue)
      }

      this.storage.setItem(this.getKey(key), serializedValue)
      return true
    } catch (error) {
      console.error('Storage set error:', error)
      return false
    }
  }

  /**
   * 获取存储项
   */
  get<T>(key: string, defaultValue?: T): T | undefined {
    try {
      const rawValue = this.storage.getItem(this.getKey(key))
      if (!rawValue) {
        return defaultValue
      }

      let serializedValue = rawValue

      // 尝试解密
      if (this.isEncrypted(serializedValue)) {
        serializedValue = this.decrypt(serializedValue)
      }

      // 尝试解压缩
      if (this.isCompressed(serializedValue)) {
        serializedValue = this.decompress(serializedValue)
      }

      const item: StorageItem<T> = JSON.parse(serializedValue)

      // 检查是否过期
      if (item.expires && Date.now() > item.expires) {
        this.remove(key)
        return defaultValue
      }

      return item.value
    } catch (error) {
      console.error('Storage get error:', error)
      return defaultValue
    }
  }

  /**
   * 删除存储项
   */
  remove(key: string): boolean {
    try {
      this.storage.removeItem(this.getKey(key))
      return true
    } catch (error) {
      console.error('Storage remove error:', error)
      return false
    }
  }

  /**
   * 清空所有存储项
   */
  clear(): boolean {
    try {
      const keys = this.getKeys()
      keys.forEach(key => {
        this.storage.removeItem(key)
      })
      return true
    } catch (error) {
      console.error('Storage clear error:', error)
      return false
    }
  }

  /**
   * 检查存储项是否存在
   */
  has(key: string): boolean {
    return this.storage.getItem(this.getKey(key)) !== null
  }

  /**
   * 获取所有键
   */
  getKeys(): string[] {
    const keys: string[] = []
    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i)
      if (key && key.startsWith(this.prefix)) {
        keys.push(key)
      }
    }
    return keys
  }

  /**
   * 获取存储大小
   */
  getSize(): number {
    let size = 0
    const keys = this.getKeys()
    keys.forEach(key => {
      const value = this.storage.getItem(key)
      if (value) {
        size += value.length
      }
    })
    return size
  }

  /**
   * 获取存储使用情况
   */
  getUsage(): { used: number; total: number; percentage: number } {
    const used = this.getSize()
    const total = this.getStorageLimit()
    const percentage = Math.round((used / total) * 100)
    
    return { used, total, percentage }
  }

  /**
   * 清理过期项
   */
  cleanup(): number {
    let cleanedCount = 0
    const keys = this.getKeys()
    
    keys.forEach(key => {
      try {
        const rawValue = this.storage.getItem(key)
        if (rawValue) {
          const item: StorageItem = JSON.parse(rawValue)
          if (item.expires && Date.now() > item.expires) {
            this.storage.removeItem(key)
            cleanedCount++
          }
        }
      } catch (error) {
        // 如果解析失败，也删除这个项
        this.storage.removeItem(key)
        cleanedCount++
      }
    })
    
    return cleanedCount
  }

  /**
   * 导出数据
   */
  export(): Record<string, any> {
    const data: Record<string, any> = {}
    const keys = this.getKeys()
    
    keys.forEach(key => {
      const originalKey = key.replace(this.prefix, '')
      const value = this.get(originalKey)
      if (value !== undefined) {
        data[originalKey] = value
      }
    })
    
    return data
  }

  /**
   * 导入数据
   */
  import(data: Record<string, any>, options: StorageOptions = {}): boolean {
    try {
      Object.entries(data).forEach(([key, value]) => {
        this.set(key, value, options)
      })
      return true
    } catch (error) {
      console.error('Storage import error:', error)
      return false
    }
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`
  }

  private getStorageLimit(): number {
    // 估算localStorage的限制（通常为5-10MB）
    return 5 * 1024 * 1024 // 5MB
  }

  private compress(data: string): string {
    // 简单的压缩实现（实际项目中可以使用更好的压缩算法）
    return `__COMPRESSED__${btoa(data)}`
  }

  private decompress(data: string): string {
    if (this.isCompressed(data)) {
      return atob(data.replace('__COMPRESSED__', ''))
    }
    return data
  }

  private isCompressed(data: string): boolean {
    return data.startsWith('__COMPRESSED__')
  }

  private encrypt(data: string): string {
    // 简单的加密实现（实际项目中应使用更安全的加密算法）
    return `__ENCRYPTED__${btoa(data)}`
  }

  private decrypt(data: string): string {
    if (this.isEncrypted(data)) {
      return atob(data.replace('__ENCRYPTED__', ''))
    }
    return data
  }

  private isEncrypted(data: string): boolean {
    return data.startsWith('__ENCRYPTED__')
  }
}

// 创建默认实例
export const storage = new StorageManager()
export const sessionStorage = new StorageManager('ai_nav_session_', true)

// 特定功能的存储管理器
export class UserPreferencesStorage {
  public storage = new StorageManager('ai_nav_prefs_')

  setTheme(theme: string) {
    this.storage.set('theme', theme)
  }

  getTheme(): string {
    return this.storage.get('theme', 'light') || 'light'
  }

  setLanguage(language: string) {
    this.storage.set('language', language)
  }

  getLanguage(): string {
    return this.storage.get('language', 'zh-CN') || 'zh-CN'
  }

  setViewMode(mode: string) {
    this.storage.set('viewMode', mode)
  }

  getViewMode(): string {
    return this.storage.get('viewMode', 'grid') || 'grid'
  }

  setSearchHistory(history: string[]) {
    this.storage.set('searchHistory', history, { expires: 7 * 24 * 60 * 60 * 1000 }) // 7天过期
  }

  getSearchHistory(): string[] {
    return this.storage.get('searchHistory', []) || []
  }

  addSearchHistory(query: string) {
    const history = this.getSearchHistory()
    const newHistory = [query, ...history.filter(item => item !== query)].slice(0, 10)
    this.setSearchHistory(newHistory)
  }

  clearSearchHistory() {
    this.storage.remove('searchHistory')
  }

  setFavorites(favorites: string[]) {
    this.storage.set('favorites', favorites)
  }

  getFavorites(): string[] {
    return this.storage.get<string[]>('favorites', []) || []
  }

  addFavorite(id: string) {
    const favorites = this.getFavorites()
    if (!favorites.includes(id)) {
      this.setFavorites([...favorites, id])
    }
  }

  removeFavorite(id: string) {
    const favorites = this.getFavorites()
    this.setFavorites(favorites.filter(item => item !== id))
  }

  isFavorite(id: string): boolean {
    return this.getFavorites().includes(id)
  }
}

export class CacheStorage {
  public storage = new StorageManager('ai_nav_cache_')
  private defaultTTL = 5 * 60 * 1000 // 5分钟

  set(key: string, data: any, ttl?: number) {
    this.storage.set(key, data, { expires: ttl || this.defaultTTL })
  }

  get<T>(key: string): T | undefined {
    return this.storage.get<T>(key)
  }

  remove(key: string) {
    this.storage.remove(key)
  }

  clear() {
    this.storage.clear()
  }

  cleanup() {
    return this.storage.cleanup()
  }
}

// 导出实例
export const userPreferences = new UserPreferencesStorage()
export const cache = new CacheStorage()

// 工具函数
export const storageUtils = {
  /**
   * 检查浏览器是否支持localStorage
   */
  isSupported(): boolean {
    try {
      const test = '__storage_test__'
      localStorage.setItem(test, test)
      localStorage.removeItem(test)
      return true
    } catch {
      return false
    }
  },

  /**
   * 获取存储配额信息
   */
  async getQuota(): Promise<{ usage: number; quota: number } | null> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate()
        return {
          usage: estimate.usage || 0,
          quota: estimate.quota || 0
        }
      } catch {
        return null
      }
    }
    return null
  },

  /**
   * 格式化存储大小
   */
  formatSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB']
    let size = bytes
    let unitIndex = 0

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`
  },

  /**
   * 清理所有应用相关的存储
   */
  clearAll(): void {
    storage.clear()
    sessionStorage.clear()
    userPreferences.storage.clear()
    cache.clear()
  },

  /**
   * 获取所有存储的使用情况
   */
  getAllUsage(): Record<string, any> {
    return {
      localStorage: storage.getUsage(),
      sessionStorage: sessionStorage.getUsage(),
      preferences: userPreferences.storage.getUsage(),
      cache: cache.storage.getUsage()
    }
  }
}

export default storage 
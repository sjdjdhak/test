import axios, { AxiosInstance, AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'

// Gitee API 配置
export interface GiteeConfig {
  token: string
  owner: string
  repo: string
  branch: string
  baseURL: string
}

// 文件内容接口
export interface GiteeFileContent {
  type: 'file' | 'dir'
  encoding: 'base64'
  size: number
  name: string
  path: string
  content: string
  sha: string
  url: string
  git_url: string
  html_url: string
  download_url: string
}

// 文件操作接口
export interface GiteeFileOperation {
  path: string
  content: string
  message: string
  sha?: string
  branch?: string
}

// 提交信息接口
export interface GiteeCommit {
  sha: string
  commit: {
    author: {
      name: string
      email: string
      date: string
    }
    committer: {
      name: string
      email: string
      date: string
    }
    message: string
  }
  author: {
    login: string
    avatar_url: string
  }
  committer: {
    login: string
    avatar_url: string
  }
}

// 仓库信息接口
export interface GiteeRepository {
  id: number
  name: string
  full_name: string
  description: string
  private: boolean
  fork: boolean
  html_url: string
  clone_url: string
  ssh_url: string
  default_branch: string
  created_at: string
  updated_at: string
  pushed_at: string
  size: number
  stargazers_count: number
  watchers_count: number
  forks_count: number
}

class GiteeService {
  private client: AxiosInstance
  private config: GiteeConfig

  constructor(config: GiteeConfig) {
    this.config = config
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: 30000,
      headers: {
        'Authorization': `token ${config.token}`,
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
      },
      withCredentials: false
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // 请求拦截器
    this.client.interceptors.request.use(
      (config) => {
        console.log(`[Gitee API] ${config.method?.toUpperCase()} ${config.url}`)
        return config
      },
      (error) => {
        console.error('[Gitee API] Request error:', error)
        return Promise.reject(error)
      }
    )

    // 响应拦截器
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        console.log(`[Gitee API] Response:`, response.status, response.statusText)
        return response
      },
      (error) => {
        console.error('[Gitee API] Response error:', error)
        
        if (error.response) {
          const { status, data } = error.response
          let message = '请求失败'
          
          switch (status) {
            case 401:
              message = 'API令牌无效或已过期'
              break
            case 403:
              message = 'API访问被拒绝，请检查权限'
              break
            case 404:
              message = '文件或仓库不存在'
              break
            case 422:
              message = data.message || '请求参数错误'
              break
            case 429:
              message = 'API调用频率超限，请稍后重试'
              break
            default:
              message = data.message || `请求失败 (${status})`
          }
          
          ElMessage.error(message)
        } else if (error.request) {
          ElMessage.error('网络连接失败，请检查网络')
        } else {
          ElMessage.error('请求配置错误')
        }
        
        return Promise.reject(error)
      }
    )
  }

  // 获取仓库信息
  async getRepository(): Promise<GiteeRepository> {
    const response = await this.client.get(`/repos/${this.config.owner}/${this.config.repo}`)
    return response.data
  }

  // 获取文件内容
  async getFileContent(path: string, ref?: string): Promise<GiteeFileContent> {
    const params = ref ? { ref } : { ref: this.config.branch }
    const response = await this.client.get(
      `/repos/${this.config.owner}/${this.config.repo}/contents/${path}`,
      { params }
    )
    return response.data
  }

  // 获取目录内容
  async getDirectoryContent(path: string = '', ref?: string): Promise<GiteeFileContent[]> {
    const params = ref ? { ref } : { ref: this.config.branch }
    const response = await this.client.get(
      `/repos/${this.config.owner}/${this.config.repo}/contents/${path}`,
      { params }
    )
    return response.data
  }

  // 创建文件
  async createFile(operation: GiteeFileOperation): Promise<GiteeFileContent> {
    const data = {
      content: this.encodeContent(operation.content),
      message: operation.message,
      branch: operation.branch || this.config.branch
    }

    const response = await this.client.post(
      `/repos/${this.config.owner}/${this.config.repo}/contents/${operation.path}`,
      data
    )
    return response.data.content
  }

  // 更新文件
  async updateFile(operation: GiteeFileOperation): Promise<GiteeFileContent> {
    if (!operation.sha) {
      throw new Error('更新文件需要提供 SHA 值')
    }

    const data = {
      content: this.encodeContent(operation.content),
      message: operation.message,
      sha: operation.sha,
      branch: operation.branch || this.config.branch
    }

    const response = await this.client.put(
      `/repos/${this.config.owner}/${this.config.repo}/contents/${operation.path}`,
      data
    )
    return response.data.content
  }

  // 删除文件
  async deleteFile(path: string, sha: string, message: string): Promise<void> {
    const data = {
      message,
      sha,
      branch: this.config.branch
    }

    await this.client.delete(
      `/repos/${this.config.owner}/${this.config.repo}/contents/${path}`,
      { data }
    )
  }

  // 创建或更新文件（自动判断）
  async createOrUpdateFile(operation: GiteeFileOperation): Promise<GiteeFileContent> {
    try {
      // 尝试获取文件信息
      const existingFile = await this.getFileContent(operation.path)
      
      // 文件存在，执行更新
      return await this.updateFile({
        ...operation,
        sha: existingFile.sha
      })
    } catch (error: any) {
      if (error.response?.status === 404) {
        // 文件不存在，创建新文件
        return await this.createFile(operation)
      }
      throw error
    }
  }

  // 批量操作文件
  async batchOperations(operations: GiteeFileOperation[]): Promise<GiteeFileContent[]> {
    const results: GiteeFileContent[] = []
    
    for (const operation of operations) {
      try {
        const result = await this.createOrUpdateFile(operation)
        results.push(result)
        
        // 添加延迟以避免API频率限制
        await this.delay(200)
      } catch (error) {
        console.error(`批量操作失败: ${operation.path}`, error)
        throw error
      }
    }
    
    return results
  }

  // 获取提交历史
  async getCommits(path?: string, limit: number = 20): Promise<GiteeCommit[]> {
    const params: any = {
      sha: this.config.branch,
      per_page: limit
    }
    
    if (path) {
      params.path = path
    }

    const response = await this.client.get(
      `/repos/${this.config.owner}/${this.config.repo}/commits`,
      { params }
    )
    return response.data
  }

  // 获取特定提交信息
  async getCommit(sha: string): Promise<GiteeCommit> {
    const response = await this.client.get(
      `/repos/${this.config.owner}/${this.config.repo}/commits/${sha}`
    )
    return response.data
  }

  // 检查文件是否存在
  async fileExists(path: string): Promise<boolean> {
    try {
      await this.getFileContent(path)
      return true
    } catch (error: any) {
      if (error.response?.status === 404) {
        return false
      }
      throw error
    }
  }

  // 获取文件的原始内容（解码后的）
  async getFileRawContent(path: string): Promise<string> {
    const fileContent = await this.getFileContent(path)
    return this.decodeContent(fileContent.content)
  }

  // 获取JSON文件内容
  async getJsonFile<T = any>(path: string): Promise<T> {
    const content = await this.getFileRawContent(path)
    return JSON.parse(content)
  }

  // 保存JSON文件
  async saveJsonFile<T = any>(path: string, data: T, message: string): Promise<GiteeFileContent> {
    const content = JSON.stringify(data, null, 2)
    return await this.createOrUpdateFile({
      path,
      content,
      message
    })
  }

  // 备份文件
  async backupFile(path: string, backupPath?: string): Promise<GiteeFileContent> {
    const content = await this.getFileRawContent(path)
    const finalBackupPath = backupPath || `${path}.backup.${Date.now()}`
    
    return await this.createFile({
      path: finalBackupPath,
      content,
      message: `备份文件: ${path}`
    })
  }

  // 恢复文件
  async restoreFile(backupPath: string, targetPath: string): Promise<GiteeFileContent> {
    const content = await this.getFileRawContent(backupPath)
    
    return await this.createOrUpdateFile({
      path: targetPath,
      content,
      message: `从备份恢复文件: ${backupPath}`
    })
  }

  // 同步本地数据到远程
  async syncToRemote(localData: Record<string, any>, basePath: string = 'data'): Promise<void> {
    const operations: GiteeFileOperation[] = []
    
    for (const [filename, data] of Object.entries(localData)) {
      const path = `${basePath}/${filename}`
      const content = JSON.stringify(data, null, 2)
      
      operations.push({
        path,
        content,
        message: `同步数据: ${filename}`
      })
    }
    
    await this.batchOperations(operations)
  }

  // 从远程同步数据到本地
  async syncFromRemote(basePath: string = 'data'): Promise<Record<string, any>> {
    const files = await this.getDirectoryContent(basePath)
    const data: Record<string, any> = {}
    
    for (const file of files) {
      if (file.type === 'file' && file.name.endsWith('.json')) {
        try {
          const content = await this.getJsonFile(file.path)
          data[file.name] = content
        } catch (error) {
          console.error(`同步文件失败: ${file.path}`, error)
        }
      }
    }
    
    return data
  }

  // 验证API配置
  async validateConfig(): Promise<boolean> {
    try {
      await this.getRepository()
      return true
    } catch (error) {
      return false
    }
  }

  // 获取API使用情况
  async getApiUsage(): Promise<{ remaining: number; limit: number; reset: number }> {
    try {
      const response = await this.client.get('/user')
      const headers = response.headers
      
      return {
        remaining: parseInt(headers['x-ratelimit-remaining'] || '0'),
        limit: parseInt(headers['x-ratelimit-limit'] || '0'),
        reset: parseInt(headers['x-ratelimit-reset'] || '0')
      }
    } catch (error) {
      return { remaining: 0, limit: 0, reset: 0 }
    }
  }

  // 工具方法
  private encodeContent(content: string): string {
    return btoa(unescape(encodeURIComponent(content)))
  }

  private decodeContent(content: string): string {
    return decodeURIComponent(escape(atob(content)))
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // 更新配置
  updateConfig(newConfig: Partial<GiteeConfig>) {
    this.config = { ...this.config, ...newConfig }
    
    // 更新请求头
    this.client.defaults.headers['Authorization'] = `token ${this.config.token}`
  }

  // 获取当前配置
  getConfig(): GiteeConfig {
    return { ...this.config }
  }
}

// 创建默认实例
let giteeService: GiteeService | null = null

export const createGiteeService = (config: GiteeConfig): GiteeService => {
  giteeService = new GiteeService(config)
  return giteeService
}

export const getGiteeService = (): GiteeService => {
  if (!giteeService) {
    throw new Error('Gitee service not initialized. Call createGiteeService first.')
  }
  return giteeService
}

// 默认配置
export const defaultGiteeConfig: GiteeConfig = {
  token: import.meta.env.VITE_GITEE_TOKEN || 'd8eed2a4b74a64d442d858ac30b8d494',
  owner: import.meta.env.VITE_GITEE_OWNER || 'your-username',
  repo: import.meta.env.VITE_GITEE_REPO || 'ai-navigation',
  branch: import.meta.env.VITE_GITEE_BRANCH || 'main',
  baseURL: 'https://gitee.com/api/v5'
}

// 初始化默认服务
if (defaultGiteeConfig.token && defaultGiteeConfig.owner && defaultGiteeConfig.repo) {
  createGiteeService(defaultGiteeConfig)
}

export default GiteeService 
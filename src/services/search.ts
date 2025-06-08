import { textUtils } from '@/utils/helpers'
import type { Navigation } from '@/types/navigation'
import type { Category } from '@/types/category'

// 搜索结果接口
export interface SearchResult extends Navigation {
  category?: Category
  relevanceScore: number
  highlightTitle?: string
  highlightDescription?: string
  matchedFields: string[]
}

// 搜索选项接口
export interface SearchOptions {
  keyword: string
  categories?: string[]
  tags?: string[]
  rating?: number
  featured?: boolean
  dateRange?: [string, string]
  sortBy?: 'relevance' | 'time' | 'popularity' | 'rating'
  limit?: number
  offset?: number
  fuzzy?: boolean
  exact?: boolean
}

// 搜索统计接口
export interface SearchStats {
  totalResults: number
  searchTime: number
  categoryDistribution: Record<string, number>
  tagDistribution: Record<string, number>
  ratingDistribution: Record<string, number>
}

// 搜索建议接口
export interface SearchSuggestion {
  text: string
  type: 'keyword' | 'category' | 'tag' | 'title'
  score: number
  count?: number
}

class SearchService {
  private stopWords = new Set([
    '的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个',
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'
  ])

  private synonyms = new Map([
    ['AI', ['人工智能', 'artificial intelligence', 'machine learning', 'ML']],
    ['人工智能', ['AI', 'artificial intelligence', 'machine learning']],
    ['机器学习', ['ML', 'machine learning', 'AI', '人工智能']],
    ['深度学习', ['deep learning', 'DL', 'neural network']],
    ['神经网络', ['neural network', 'NN', 'deep learning']],
    ['自然语言处理', ['NLP', 'natural language processing', '文本处理']],
    ['计算机视觉', ['computer vision', 'CV', '图像识别', 'image recognition']],
    ['图像识别', ['image recognition', 'computer vision', '计算机视觉']],
    ['语音识别', ['speech recognition', 'voice recognition', 'ASR']],
    ['文本生成', ['text generation', 'text synthesis', '内容生成']],
    ['代码生成', ['code generation', 'code synthesis', '编程助手']],
    ['聊天机器人', ['chatbot', 'chat bot', '对话系统', 'conversational AI']],
    ['翻译', ['translation', 'translate', '机器翻译', 'machine translation']]
  ])

  // 执行搜索
  search(
    navigations: Navigation[],
    categories: Category[],
    options: SearchOptions
  ): { results: SearchResult[]; stats: SearchStats } {
    const startTime = Date.now()
    
    // 预处理关键词
    const processedKeyword = this.preprocessKeyword(options.keyword)
    const keywords = this.extractKeywords(processedKeyword)
    const expandedKeywords = this.expandKeywords(keywords)
    
    // 执行搜索
    const results = this.performSearch(navigations, categories, expandedKeywords, options)
    
    // 排序结果
    const sortedResults = this.sortResults(results, options.sortBy || 'relevance')
    
    // 应用分页
    const paginatedResults = this.applyPagination(sortedResults, options.limit, options.offset)
    
    // 生成统计信息
    const stats = this.generateStats(results, Date.now() - startTime)
    
    return {
      results: paginatedResults,
      stats
    }
  }

  // 预处理关键词
  private preprocessKeyword(keyword: string): string {
    return keyword
      .trim()
      .toLowerCase()
      .replace(/[^\w\s\u4e00-\u9fff]/g, ' ') // 保留中文、英文、数字
      .replace(/\s+/g, ' ')
  }

  // 提取关键词
  private extractKeywords(keyword: string): string[] {
    const words = keyword.split(' ').filter(word => 
      word.length > 1 && !this.stopWords.has(word)
    )
    
    return [...new Set(words)] // 去重
  }

  // 扩展关键词（同义词）
  private expandKeywords(keywords: string[]): string[] {
    const expanded = new Set(keywords)
    
    keywords.forEach(keyword => {
      const synonymList = this.synonyms.get(keyword)
      if (synonymList) {
        synonymList.forEach(synonym => expanded.add(synonym.toLowerCase()))
      }
      
      // 查找包含该关键词的同义词组
      this.synonyms.forEach((synonymList, key) => {
        if (synonymList.some(syn => syn.toLowerCase().includes(keyword))) {
          expanded.add(key.toLowerCase())
          synonymList.forEach(syn => expanded.add(syn.toLowerCase()))
        }
      })
    })
    
    return Array.from(expanded)
  }

  // 执行搜索
  private performSearch(
    navigations: Navigation[],
    categories: Category[],
    keywords: string[],
    options: SearchOptions
  ): SearchResult[] {
    const results: SearchResult[] = []
    
    navigations.forEach(nav => {
      const category = categories.find(cat => cat.id === nav.categoryId)
      
      // 应用基础筛选器
      if (!this.passesBasicFilters(nav, category, options)) {
        return
      }
      
      // 计算相关度分数
      const scoreResult = this.calculateRelevanceScore(nav, category, keywords, options)
      
      if (scoreResult.score > 0) {
        results.push({
          ...nav,
          category,
          relevanceScore: scoreResult.score,
          highlightTitle: scoreResult.highlightTitle,
          highlightDescription: scoreResult.highlightDescription,
          matchedFields: scoreResult.matchedFields
        })
      }
    })
    
    return results
  }

  // 基础筛选器
  private passesBasicFilters(
    nav: Navigation,
    category: Category | undefined,
    options: SearchOptions
  ): boolean {
    // 分类筛选
    if (options.categories && options.categories.length > 0) {
      if (!options.categories.includes(nav.categoryId)) {
        return false
      }
    }
    
    // 标签筛选
    if (options.tags && options.tags.length > 0) {
      const hasMatchingTag = options.tags.some(tag => nav.tags?.includes(tag))
      if (!hasMatchingTag) {
        return false
      }
    }
    
    // 评分筛选
    if (options.rating && options.rating > 0) {
      if ((nav.rating || 0) < options.rating) {
        return false
      }
    }
    
    // 推荐筛选
    if (options.featured !== undefined) {
      if (nav.featured !== options.featured) {
        return false
      }
    }
    
    // 日期范围筛选
    if (options.dateRange) {
      const [startDate, endDate] = options.dateRange
      const navDate = new Date(nav.createTime)
      const start = new Date(startDate)
      const end = new Date(endDate)
      
      if (navDate < start || navDate > end) {
        return false
      }
    }
    
    return true
  }

  // 计算相关度分数
  private calculateRelevanceScore(
    nav: Navigation,
    category: Category | undefined,
    keywords: string[],
    options: SearchOptions
  ): {
    score: number
    highlightTitle?: string
    highlightDescription?: string
    matchedFields: string[]
  } {
    let totalScore = 0
    let highlightTitle = nav.title
    let highlightDescription = nav.description || ''
    const matchedFields: string[] = []
    
    const originalKeyword = options.keyword.trim()
    
    // 标题匹配（权重最高）
    const titleScore = this.calculateFieldScore(nav.title, keywords, originalKeyword, {
      exactMatch: 20,
      startsWith: 15,
      contains: 10,
      fuzzy: 5
    })
    
    if (titleScore > 0) {
      totalScore += titleScore
      matchedFields.push('title')
      highlightTitle = this.highlightText(nav.title, originalKeyword)
    }
    
    // 描述匹配
    if (nav.description) {
      const descScore = this.calculateFieldScore(nav.description, keywords, originalKeyword, {
        exactMatch: 8,
        startsWith: 6,
        contains: 5,
        fuzzy: 2
      })
      
      if (descScore > 0) {
        totalScore += descScore
        matchedFields.push('description')
        highlightDescription = this.highlightText(nav.description, originalKeyword)
      }
    }
    
    // 标签匹配
    if (nav.tags && nav.tags.length > 0) {
      const tagScore = this.calculateTagsScore(nav.tags, keywords, originalKeyword)
      if (tagScore > 0) {
        totalScore += tagScore
        matchedFields.push('tags')
      }
    }
    
    // 分类匹配
    if (category) {
      const categoryScore = this.calculateFieldScore(category.name, keywords, originalKeyword, {
        exactMatch: 5,
        startsWith: 4,
        contains: 2,
        fuzzy: 1
      })
      
      if (categoryScore > 0) {
        totalScore += categoryScore
        matchedFields.push('category')
      }
    }
    
    // URL匹配（权重较低）
    const urlScore = this.calculateFieldScore(nav.url, keywords, originalKeyword, {
      exactMatch: 2,
      startsWith: 1,
      contains: 1,
      fuzzy: 0.5
    })
    
    if (urlScore > 0) {
      totalScore += urlScore
      matchedFields.push('url')
    }
    
    // 质量加权
    totalScore = this.applyQualityWeight(totalScore, nav)
    
    return {
      score: totalScore,
      highlightTitle,
      highlightDescription,
      matchedFields
    }
  }

  // 计算字段分数
  private calculateFieldScore(
    field: string,
    keywords: string[],
    originalKeyword: string,
    weights: { exactMatch: number; startsWith: number; contains: number; fuzzy: number }
  ): number {
    const lowerField = field.toLowerCase()
    const lowerOriginal = originalKeyword.toLowerCase()
    
    // 精确匹配
    if (lowerField === lowerOriginal) {
      return weights.exactMatch
    }
    
    // 开头匹配
    if (lowerField.startsWith(lowerOriginal)) {
      return weights.startsWith
    }
    
    // 包含匹配
    if (lowerField.includes(lowerOriginal)) {
      return weights.contains
    }
    
    // 关键词匹配
    let keywordScore = 0
    keywords.forEach(keyword => {
      if (lowerField.includes(keyword)) {
        keywordScore += weights.contains * 0.8
      }
    })
    
    if (keywordScore > 0) {
      return keywordScore
    }
    
    // 模糊匹配
    const fuzzyScore = this.calculateFuzzyScore(lowerField, lowerOriginal)
    if (fuzzyScore > 0.7) {
      return weights.fuzzy * fuzzyScore
    }
    
    return 0
  }

  // 计算标签分数
  private calculateTagsScore(tags: string[], keywords: string[], originalKeyword: string): number {
    let totalScore = 0
    
    tags.forEach(tag => {
      const tagScore = this.calculateFieldScore(tag, keywords, originalKeyword, {
        exactMatch: 10,
        startsWith: 8,
        contains: 6,
        fuzzy: 3
      })
      totalScore += tagScore
    })
    
    return totalScore
  }

  // 计算模糊匹配分数
  private calculateFuzzyScore(text: string, pattern: string): number {
    if (text.length === 0 || pattern.length === 0) return 0
    
    const matrix: number[][] = []
    
    // 初始化矩阵
    for (let i = 0; i <= text.length; i++) {
      matrix[i] = []
      for (let j = 0; j <= pattern.length; j++) {
        if (i === 0) {
          matrix[i][j] = j
        } else if (j === 0) {
          matrix[i][j] = i
        } else {
          matrix[i][j] = 0
        }
      }
    }
    
    // 计算编辑距离
    for (let i = 1; i <= text.length; i++) {
      for (let j = 1; j <= pattern.length; j++) {
        if (text[i - 1] === pattern[j - 1]) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j] + 1,     // 删除
            matrix[i][j - 1] + 1,     // 插入
            matrix[i - 1][j - 1] + 1  // 替换
          )
        }
      }
    }
    
    const distance = matrix[text.length][pattern.length]
    const maxLength = Math.max(text.length, pattern.length)
    
    return 1 - (distance / maxLength)
  }

  // 应用质量权重
  private applyQualityWeight(score: number, nav: Navigation): number {
    let weight = 1
    
    // 推荐项目加权
    if (nav.featured) {
      weight += 0.2
    }
    
    // 评分加权
    if (nav.rating) {
      weight += (nav.rating - 3) * 0.1 // 3分以上加权，以下减权
    }
    
    // 访问量加权
    if (nav.visitCount && nav.visitCount > 100) {
      weight += Math.min(Math.log10(nav.visitCount / 100) * 0.1, 0.3)
    }
    
    return score * weight
  }

  // 高亮文本
  private highlightText(text: string, keyword: string): string {
    if (!keyword.trim()) return text
    
    return textUtils.highlight(text, keyword, 'search-highlight')
  }

  // 排序结果
  private sortResults(results: SearchResult[], sortBy: string): SearchResult[] {
    return [...results].sort((a, b) => {
      switch (sortBy) {
        case 'time':
          return new Date(b.updateTime).getTime() - new Date(a.updateTime).getTime()
        case 'popularity':
          return (b.visitCount || 0) - (a.visitCount || 0)
        case 'rating':
          return (b.rating || 0) - (a.rating || 0)
        case 'relevance':
        default:
          return b.relevanceScore - a.relevanceScore
      }
    })
  }

  // 应用分页
  private applyPagination(
    results: SearchResult[],
    limit?: number,
    offset?: number
  ): SearchResult[] {
    if (!limit) return results
    
    const start = offset || 0
    const end = start + limit
    
    return results.slice(start, end)
  }

  // 生成统计信息
  private generateStats(results: SearchResult[], searchTime: number): SearchStats {
    const categoryDistribution: Record<string, number> = {}
    const tagDistribution: Record<string, number> = {}
    const ratingDistribution: Record<string, number> = {}
    
    results.forEach(result => {
      // 分类分布
      if (result.category) {
        categoryDistribution[result.category.name] = 
          (categoryDistribution[result.category.name] || 0) + 1
      }
      
      // 标签分布
      result.tags?.forEach(tag => {
        tagDistribution[tag] = (tagDistribution[tag] || 0) + 1
      })
      
      // 评分分布
      const rating = Math.floor(result.rating || 0)
      const ratingKey = `${rating}-${rating + 1}`
      ratingDistribution[ratingKey] = (ratingDistribution[ratingKey] || 0) + 1
    })
    
    return {
      totalResults: results.length,
      searchTime,
      categoryDistribution,
      tagDistribution,
      ratingDistribution
    }
  }

  // 生成搜索建议
  generateSuggestions(
    navigations: Navigation[],
    categories: Category[],
    keyword: string,
    limit: number = 10
  ): SearchSuggestion[] {
    const suggestions: SearchSuggestion[] = []
    const lowerKeyword = keyword.toLowerCase()
    const suggestionMap = new Map<string, SearchSuggestion>()
    
    // 从导航标题生成建议
    navigations.forEach(nav => {
      if (nav.title.toLowerCase().includes(lowerKeyword)) {
        const words = nav.title.split(/\s+/)
        words.forEach(word => {
          if (word.length > 2 && word.toLowerCase().includes(lowerKeyword)) {
            const key = word.toLowerCase()
            if (!suggestionMap.has(key)) {
              suggestionMap.set(key, {
                text: word,
                type: 'title',
                score: this.calculateSuggestionScore(word, keyword),
                count: 1
              })
            } else {
              suggestionMap.get(key)!.count!++
            }
          }
        })
      }
    })
    
    // 从标签生成建议
    navigations.forEach(nav => {
      nav.tags?.forEach(tag => {
        if (tag.toLowerCase().includes(lowerKeyword)) {
          const key = tag.toLowerCase()
          if (!suggestionMap.has(key)) {
            suggestionMap.set(key, {
              text: tag,
              type: 'tag',
              score: this.calculateSuggestionScore(tag, keyword),
              count: 1
            })
          } else {
            suggestionMap.get(key)!.count!++
          }
        }
      })
    })
    
    // 从分类生成建议
    categories.forEach(category => {
      if (category.name.toLowerCase().includes(lowerKeyword)) {
        const key = category.name.toLowerCase()
        if (!suggestionMap.has(key)) {
          suggestionMap.set(key, {
            text: category.name,
            type: 'category',
            score: this.calculateSuggestionScore(category.name, keyword),
            count: 1
          })
        }
      }
    })
    
    // 排序并返回
    return Array.from(suggestionMap.values())
      .sort((a, b) => {
        // 先按分数排序，再按出现次数排序
        if (b.score !== a.score) {
          return b.score - a.score
        }
        return (b.count || 0) - (a.count || 0)
      })
      .slice(0, limit)
  }

  // 计算建议分数
  private calculateSuggestionScore(suggestion: string, keyword: string): number {
    const lowerSuggestion = suggestion.toLowerCase()
    const lowerKeyword = keyword.toLowerCase()
    
    if (lowerSuggestion === lowerKeyword) return 0 // 完全相同不作为建议
    if (lowerSuggestion.startsWith(lowerKeyword)) return 10
    if (lowerSuggestion.includes(lowerKeyword)) return 5
    
    return this.calculateFuzzyScore(lowerSuggestion, lowerKeyword) * 3
  }

  // 获取热门搜索词
  getHotKeywords(searchHistory: Array<{ keyword: string; timestamp: number }>): string[] {
    const keywordCount = new Map<string, number>()
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    
    // 统计最近一周的搜索
    searchHistory
      .filter(item => item.timestamp > oneWeekAgo)
      .forEach(item => {
        const count = keywordCount.get(item.keyword) || 0
        keywordCount.set(item.keyword, count + 1)
      })
    
    // 排序并返回前10个
    return Array.from(keywordCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([keyword]) => keyword)
  }

  // 搜索性能分析
  analyzeSearchPerformance(
    navigations: Navigation[],
    searchQueries: Array<{ keyword: string; resultCount: number; searchTime: number }>
  ) {
    const analysis = {
      averageSearchTime: 0,
      averageResultCount: 0,
      slowQueries: [] as Array<{ keyword: string; searchTime: number }>,
      noResultQueries: [] as string[],
      popularKeywords: [] as Array<{ keyword: string; frequency: number }>,
      searchEfficiency: 0
    }
    
    if (searchQueries.length === 0) return analysis
    
    // 计算平均值
    const totalTime = searchQueries.reduce((sum, q) => sum + q.searchTime, 0)
    const totalResults = searchQueries.reduce((sum, q) => sum + q.resultCount, 0)
    
    analysis.averageSearchTime = totalTime / searchQueries.length
    analysis.averageResultCount = totalResults / searchQueries.length
    
    // 找出慢查询（超过平均时间2倍）
    const slowThreshold = analysis.averageSearchTime * 2
    analysis.slowQueries = searchQueries
      .filter(q => q.searchTime > slowThreshold)
      .map(q => ({ keyword: q.keyword, searchTime: q.searchTime }))
      .sort((a, b) => b.searchTime - a.searchTime)
      .slice(0, 10)
    
    // 找出无结果查询
    analysis.noResultQueries = searchQueries
      .filter(q => q.resultCount === 0)
      .map(q => q.keyword)
      .slice(0, 20)
    
    // 统计热门关键词
    const keywordFreq = new Map<string, number>()
    searchQueries.forEach(q => {
      keywordFreq.set(q.keyword, (keywordFreq.get(q.keyword) || 0) + 1)
    })
    
    analysis.popularKeywords = Array.from(keywordFreq.entries())
      .map(([keyword, frequency]) => ({ keyword, frequency }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 20)
    
    // 计算搜索效率（有结果的查询比例）
    const successfulQueries = searchQueries.filter(q => q.resultCount > 0).length
    analysis.searchEfficiency = successfulQueries / searchQueries.length
    
    return analysis
  }
}

export const searchService = new SearchService()
export default searchService 
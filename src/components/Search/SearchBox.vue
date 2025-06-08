<template>
  <div class="search-box" :class="{ 'search-box--focused': isFocused }">
    <el-input
      v-model="searchQuery"
      :placeholder="placeholder"
      :size="size"
      clearable
      @input="handleInput"
      @focus="handleFocus"
      @blur="handleBlur"
      @keyup.enter="handleSearch"
      @clear="handleClear"
      class="search-input"
    >
      <template #prefix>
        <el-icon class="search-icon">
          <Search />
        </el-icon>
      </template>
      <template #suffix>
        <el-button
          v-if="searchQuery"
          type="primary"
          :icon="Search"
          @click="handleSearch"
          class="search-btn"
        />
      </template>
    </el-input>
    
    <!-- 搜索建议 -->
    <div v-if="showSuggestions && suggestions.length > 0" class="search-suggestions">
      <div class="suggestions-header">
        <span class="suggestions-title">搜索建议</span>
        <el-button type="text" @click="clearHistory" class="clear-btn">清除历史</el-button>
      </div>
      <ul class="suggestions-list">
        <li
          v-for="(suggestion, index) in suggestions"
          :key="index"
          :class="['suggestion-item', { 'suggestion-item--active': index === activeSuggestionIndex }]"
          @click="selectSuggestion(suggestion)"
          @mouseenter="activeSuggestionIndex = index"
        >
          <el-icon class="suggestion-icon">
            <component :is="suggestion.type === 'history' ? Clock : Search" />
          </el-icon>
          <span class="suggestion-text">{{ suggestion.text }}</span>
          <span v-if="suggestion.count" class="suggestion-count">{{ suggestion.count }}</span>
        </li>
      </ul>
    </div>
    
    <!-- 热门搜索 -->
    <div v-if="showHotSearches && hotSearches.length > 0" class="hot-searches">
      <div class="hot-searches-header">
        <el-icon><TrendCharts /></el-icon>
        <span>热门搜索</span>
      </div>
      <div class="hot-searches-tags">
        <el-tag
          v-for="(tag, index) in hotSearches"
          :key="index"
          :type="index < 3 ? 'danger' : 'info'"
          @click="selectHotSearch(tag)"
          class="hot-search-tag"
        >
          {{ tag }}
        </el-tag>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Search, Clock, TrendCharts } from '@element-plus/icons-vue'

interface SearchSuggestion {
  text: string
  type: 'history' | 'suggestion'
  count?: number
}

interface Props {
  modelValue?: string
  placeholder?: string
  size?: 'large' | 'default' | 'small'
  showSuggestions?: boolean
  showHotSearches?: boolean
  maxSuggestions?: number
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: '搜索导航...',
  size: 'default',
  showSuggestions: true,
  showHotSearches: true,
  maxSuggestions: 8
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  search: [query: string]
  focus: []
  blur: []
}>()

const searchQuery = ref(props.modelValue)
const isFocused = ref(false)
const activeSuggestionIndex = ref(-1)
const suggestions = ref<SearchSuggestion[]>([])

// 搜索历史（从本地存储获取）
const searchHistory = ref<string[]>([])

// 热门搜索
const hotSearches = ref([
  'ChatGPT', 'Midjourney', 'Stable Diffusion', 'Claude', 'Copilot',
  '文本生成', '图像生成', '代码助手', '翻译工具', '语音识别'
])

// 计算属性
const showSuggestions = computed(() => {
  return props.showSuggestions && isFocused.value && searchQuery.value.length > 0
})

// 监听输入值变化
watch(() => props.modelValue, (newValue) => {
  searchQuery.value = newValue
})

watch(searchQuery, (newValue) => {
  emit('update:modelValue', newValue)
})

// 方法
const handleInput = (value: string) => {
  searchQuery.value = value
  generateSuggestions(value)
}

const handleFocus = () => {
  isFocused.value = true
  emit('focus')
  loadSearchHistory()
  if (searchQuery.value) {
    generateSuggestions(searchQuery.value)
  }
}

const handleBlur = () => {
  // 延迟隐藏建议，以便点击建议项
  setTimeout(() => {
    isFocused.value = false
    activeSuggestionIndex.value = -1
  }, 200)
  emit('blur')
}

const handleSearch = () => {
  if (searchQuery.value.trim()) {
    saveToHistory(searchQuery.value.trim())
    emit('search', searchQuery.value.trim())
    isFocused.value = false
  }
}

const handleClear = () => {
  searchQuery.value = ''
  suggestions.value = []
  activeSuggestionIndex.value = -1
}

const selectSuggestion = (suggestion: SearchSuggestion) => {
  searchQuery.value = suggestion.text
  handleSearch()
}

const selectHotSearch = (tag: string) => {
  searchQuery.value = tag
  handleSearch()
}

const generateSuggestions = (query: string) => {
  if (!query.trim()) {
    suggestions.value = []
    return
  }

  const historySuggestions = searchHistory.value
    .filter(item => item.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 4)
    .map(text => ({ text, type: 'history' as const }))

  const hotSuggestions = hotSearches.value
    .filter(item => item.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 4)
    .map(text => ({ text, type: 'suggestion' as const }))

  suggestions.value = [...historySuggestions, ...hotSuggestions]
    .slice(0, props.maxSuggestions)
}

const loadSearchHistory = () => {
  try {
    const history = localStorage.getItem('search-history')
    if (history) {
      searchHistory.value = JSON.parse(history)
    }
  } catch (error) {
    console.error('Failed to load search history:', error)
  }
}

const saveToHistory = (query: string) => {
  try {
    const history = [...searchHistory.value]
    const index = history.indexOf(query)
    
    if (index > -1) {
      history.splice(index, 1)
    }
    
    history.unshift(query)
    history.splice(10) // 只保留最近10条
    
    searchHistory.value = history
    localStorage.setItem('search-history', JSON.stringify(history))
  } catch (error) {
    console.error('Failed to save search history:', error)
  }
}

const clearHistory = () => {
  searchHistory.value = []
  localStorage.removeItem('search-history')
  suggestions.value = []
}

// 键盘导航
const handleKeydown = (event: KeyboardEvent) => {
  if (!showSuggestions.value) return

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      activeSuggestionIndex.value = Math.min(
        activeSuggestionIndex.value + 1,
        suggestions.value.length - 1
      )
      break
    case 'ArrowUp':
      event.preventDefault()
      activeSuggestionIndex.value = Math.max(activeSuggestionIndex.value - 1, -1)
      break
    case 'Enter':
      event.preventDefault()
      if (activeSuggestionIndex.value >= 0) {
        selectSuggestion(suggestions.value[activeSuggestionIndex.value])
      } else {
        handleSearch()
      }
      break
    case 'Escape':
      isFocused.value = false
      activeSuggestionIndex.value = -1
      break
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  loadSearchHistory()
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style lang="scss" scoped>
.search-box {
  position: relative;
  width: 100%;
  
  &--focused {
    .search-input {
      :deep(.el-input__wrapper) {
        box-shadow: 0 0 0 2px var(--primary-color-light);
      }
    }
  }
}

.search-input {
  :deep(.el-input__wrapper) {
    border-radius: var(--border-radius-lg);
    transition: all var(--transition-normal);
    
    &:hover {
      box-shadow: var(--shadow-md);
    }
  }
  
  :deep(.el-input__inner) {
    font-size: var(--font-size-md);
    padding-left: var(--spacing-lg);
  }
}

.search-icon {
  color: var(--text-tertiary);
}

.search-btn {
  border-radius: var(--border-radius-md);
  margin-right: var(--spacing-xs);
}

.search-suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--bg-primary);
  border: 1px solid var(--border-secondary);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-lg);
  z-index: var(--z-dropdown);
  margin-top: var(--spacing-xs);
  max-height: 300px;
  overflow-y: auto;
  
  @include scrollbar(4px);
}

.suggestions-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm) var(--spacing-md);
  border-bottom: 1px solid var(--border-tertiary);
  
  .suggestions-title {
    font-size: var(--font-size-xs);
    color: var(--text-tertiary);
    font-weight: 500;
  }
  
  .clear-btn {
    font-size: var(--font-size-xs);
    padding: 0;
    height: auto;
  }
}

.suggestions-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.suggestion-item {
  display: flex;
  align-items: center;
  padding: var(--spacing-sm) var(--spacing-md);
  cursor: pointer;
  transition: background-color var(--transition-fast);
  
  &:hover,
  &--active {
    background-color: var(--bg-secondary);
  }
  
  .suggestion-icon {
    color: var(--text-tertiary);
    margin-right: var(--spacing-sm);
    font-size: var(--font-size-sm);
  }
  
  .suggestion-text {
    flex: 1;
    font-size: var(--font-size-sm);
    color: var(--text-primary);
  }
  
  .suggestion-count {
    font-size: var(--font-size-xs);
    color: var(--text-tertiary);
    background: var(--bg-tertiary);
    padding: 2px 6px;
    border-radius: var(--border-radius-sm);
  }
}

.hot-searches {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--bg-primary);
  border: 1px solid var(--border-secondary);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-lg);
  z-index: var(--z-dropdown);
  margin-top: var(--spacing-xs);
  padding: var(--spacing-md);
  
  .hot-searches-header {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    margin-bottom: var(--spacing-sm);
    font-size: var(--font-size-xs);
    color: var(--text-tertiary);
    font-weight: 500;
  }
  
  .hot-searches-tags {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-xs);
  }
  
  .hot-search-tag {
    cursor: pointer;
    transition: all var(--transition-fast);
    
    &:hover {
      transform: translateY(-1px);
      box-shadow: var(--shadow-sm);
    }
  }
}

@include mobile {
  .search-suggestions,
  .hot-searches {
    left: -var(--spacing-md);
    right: -var(--spacing-md);
  }
}
</style> 
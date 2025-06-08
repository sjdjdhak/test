<template>
  <div class="error-boundary">
    <div v-if="hasError" class="error-container">
      <div class="error-content">
        <!-- 错误图标 -->
        <div class="error-icon">
          <el-icon size="64" color="#f56c6c">
            <WarningFilled />
          </el-icon>
        </div>
        
        <!-- 错误标题 -->
        <h2 class="error-title">{{ errorTitle }}</h2>
        
        <!-- 错误描述 -->
        <p class="error-description">{{ errorMessage }}</p>
        
        <!-- 错误详情（开发模式） -->
        <div v-if="showDetails && isDev" class="error-details">
          <el-collapse>
            <el-collapse-item title="错误详情" name="details">
              <div class="error-stack">
                <pre>{{ errorInfo }}</pre>
              </div>
            </el-collapse-item>
          </el-collapse>
        </div>
        
        <!-- 操作按钮 -->
        <div class="error-actions">
          <el-button type="primary" @click="handleRetry">
            重试
          </el-button>
          <el-button @click="handleReload">
            刷新页面
          </el-button>
          <el-button v-if="showReport" @click="handleReport">
            报告问题
          </el-button>
        </div>
        
        <!-- 建议操作 -->
        <div class="error-suggestions">
          <h4>您可以尝试：</h4>
          <ul>
            <li>检查网络连接是否正常</li>
            <li>刷新页面重新加载</li>
            <li>清除浏览器缓存</li>
            <li>如果问题持续存在，请联系技术支持</li>
          </ul>
        </div>
      </div>
    </div>
    
    <!-- 正常内容 -->
    <div v-else>
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onErrorCaptured, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { WarningFilled } from '@element-plus/icons-vue'

interface Props {
  // 错误标题
  title?: string
  // 错误消息
  message?: string
  // 是否显示错误详情
  showDetails?: boolean
  // 是否显示报告按钮
  showReport?: boolean
  // 自定义重试函数
  onRetry?: () => void | Promise<void>
  // 自定义报告函数
  onReport?: (error: Error, errorInfo: string) => void
}

const props = withDefaults(defineProps<Props>(), {
  title: '页面出现错误',
  message: '抱歉，页面遇到了一些问题。请尝试刷新页面或稍后再试。',
  showDetails: false,
  showReport: true
})

const emit = defineEmits<{
  error: [error: Error, errorInfo: string]
  retry: []
}>()

// 响应式数据
const hasError = ref(false)
const errorInfo = ref('')
const currentError = ref<Error | null>(null)

// 计算属性
const isDev = import.meta.env.DEV

const errorTitle = computed(() => {
  if (currentError.value) {
    // 根据错误类型返回不同标题
    if (currentError.value.name === 'ChunkLoadError') {
      return '资源加载失败'
    }
    if (currentError.value.message.includes('Network')) {
      return '网络连接错误'
    }
    if (currentError.value.message.includes('timeout')) {
      return '请求超时'
    }
  }
  return props.title
})

const errorMessage = computed(() => {
  if (currentError.value) {
    // 根据错误类型返回不同消息
    if (currentError.value.name === 'ChunkLoadError') {
      return '页面资源加载失败，请刷新页面重试。'
    }
    if (currentError.value.message.includes('Network')) {
      return '网络连接出现问题，请检查网络设置后重试。'
    }
    if (currentError.value.message.includes('timeout')) {
      return '请求超时，请检查网络连接或稍后重试。'
    }
  }
  return props.message
})

// 错误捕获
onErrorCaptured((error: Error, instance, info: string) => {
  console.error('ErrorBoundary caught an error:', error)
  console.error('Error info:', info)
  
  hasError.value = true
  currentError.value = error
  errorInfo.value = `${error.stack}\n\nComponent Info:\n${info}`
  
  // 发送错误事件
  emit('error', error, info)
  
  // 自动报告错误（如果配置了）
  if (props.onReport) {
    props.onReport(error, info)
  } else {
    // 默认错误报告
    reportError(error, info)
  }
  
  // 阻止错误继续传播
  return false
})

// 全局错误处理
onMounted(() => {
  // 捕获未处理的Promise错误
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason)
    
    const error = new Error(event.reason?.message || 'Unhandled Promise Rejection')
    error.stack = event.reason?.stack
    
    hasError.value = true
    currentError.value = error
    errorInfo.value = `Unhandled Promise Rejection:\n${event.reason?.stack || event.reason}`
    
    emit('error', error, 'Unhandled Promise Rejection')
    reportError(error, 'Unhandled Promise Rejection')
  })
  
  // 捕获资源加载错误
  window.addEventListener('error', (event) => {
    if (event.target !== window) {
      console.error('Resource loading error:', event)
      
      const error = new Error(`Resource loading failed: ${event.target?.src || event.target?.href}`)
      
      hasError.value = true
      currentError.value = error
      errorInfo.value = `Resource Error:\nSource: ${event.target?.src || event.target?.href}\nType: ${event.target?.tagName}`
      
      emit('error', error, 'Resource Loading Error')
      reportError(error, 'Resource Loading Error')
    }
  }, true)
})

// 方法
const handleRetry = async () => {
  try {
    if (props.onRetry) {
      await props.onRetry()
    }
    
    // 重置错误状态
    hasError.value = false
    currentError.value = null
    errorInfo.value = ''
    
    emit('retry')
    ElMessage.success('重试成功')
  } catch (error) {
    console.error('Retry failed:', error)
    ElMessage.error('重试失败，请刷新页面')
  }
}

const handleReload = () => {
  window.location.reload()
}

const handleReport = () => {
  if (props.onReport && currentError.value) {
    props.onReport(currentError.value, errorInfo.value)
  } else {
    // 默认报告行为
    const subject = encodeURIComponent(`错误报告: ${currentError.value?.message}`)
    const body = encodeURIComponent(`
错误详情:
${errorInfo.value}

浏览器信息:
${navigator.userAgent}

页面URL:
${window.location.href}

时间:
${new Date().toISOString()}
    `)
    
    window.open(`mailto:support@example.com?subject=${subject}&body=${body}`)
  }
}

const reportError = (error: Error, info: string) => {
  // 这里可以集成错误监控服务，如 Sentry、Bugsnag 等
  if (isDev) {
    console.group('🚨 Error Report')
    console.error('Error:', error)
    console.error('Info:', info)
    console.error('Stack:', error.stack)
    console.groupEnd()
  }
  
  // 发送到错误监控服务
  // 例如：Sentry.captureException(error, { extra: { info } })
}

// 暴露方法给父组件
defineExpose({
  reset: () => {
    hasError.value = false
    currentError.value = null
    errorInfo.value = ''
  },
  hasError: () => hasError.value
})
</script>

<style lang="scss" scoped>
.error-boundary {
  width: 100%;
  height: 100%;
}

.error-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 2rem;
  background: var(--el-bg-color-page);
}

.error-content {
  text-align: center;
  max-width: 600px;
  
  .error-icon {
    margin-bottom: 1.5rem;
    opacity: 0.8;
  }
  
  .error-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin: 0 0 1rem 0;
  }
  
  .error-description {
    font-size: 1rem;
    color: var(--el-text-color-regular);
    line-height: 1.6;
    margin: 0 0 2rem 0;
  }
  
  .error-details {
    margin-bottom: 2rem;
    text-align: left;
    
    .error-stack {
      background: var(--el-bg-color);
      border: 1px solid var(--el-border-color-light);
      border-radius: 4px;
      padding: 1rem;
      max-height: 300px;
      overflow: auto;
      
      pre {
        margin: 0;
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        font-size: 0.875rem;
        line-height: 1.4;
        color: var(--el-text-color-regular);
        white-space: pre-wrap;
        word-break: break-all;
      }
    }
  }
  
  .error-actions {
    display: flex;
    justify-content: center;
    gap: 1rem;
    margin-bottom: 2rem;
    flex-wrap: wrap;
  }
  
  .error-suggestions {
    text-align: left;
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-light);
    border-radius: 8px;
    padding: 1.5rem;
    
    h4 {
      font-size: 1rem;
      font-weight: 600;
      color: var(--el-text-color-primary);
      margin: 0 0 1rem 0;
    }
    
    ul {
      margin: 0;
      padding-left: 1.5rem;
      
      li {
        color: var(--el-text-color-regular);
        line-height: 1.6;
        margin-bottom: 0.5rem;
        
        &:last-child {
          margin-bottom: 0;
        }
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .error-container {
    padding: 1rem;
    min-height: 300px;
  }
  
  .error-content {
    .error-title {
      font-size: 1.25rem;
    }
    
    .error-description {
      font-size: 0.875rem;
    }
    
    .error-actions {
      flex-direction: column;
      align-items: center;
      
      .el-button {
        width: 100%;
        max-width: 200px;
      }
    }
    
    .error-suggestions {
      padding: 1rem;
      
      h4 {
        font-size: 0.875rem;
      }
      
      ul {
        padding-left: 1rem;
        
        li {
          font-size: 0.875rem;
        }
      }
    }
  }
}

// 暗色主题适配
@media (prefers-color-scheme: dark) {
  .error-suggestions {
    background: var(--el-bg-color-overlay);
  }
}
</style> 